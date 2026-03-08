import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ScrapedCounts {
  active?: number;
  pending?: number;
  medianPrice?: number;
  daysOnMarket?: number;
  source: string;
}

// Build Zillow URL slug from location
const toZillowSlug = (location: string): string => {
  return location
    .trim()
    .toLowerCase()
    .replace(/,\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

// Build Redfin URL slug from location
const toRedfinSlug = (location: string): string => {
  // Redfin uses format like /city/1826/MA/Boston - we'll use search instead
  return location.trim();
};

// Scrape a URL and extract listing count from markdown
const scrapeAndExtract = async (
  apiKey: string,
  url: string,
  label: string
): Promise<string> => {
  try {
    console.log(`Scraping [${label}]: ${url}`);
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || !data?.success) {
      console.log(`Scrape failed [${label}]:`, data?.error || resp.status);
      return '';
    }

    const md = data.data?.markdown || '';
    console.log(`Scrape [${label}]: ${md.length} chars`);
    return md;
  } catch (e) {
    console.error(`Scrape error [${label}]:`, e);
    return '';
  }
};

// Extract numbers using AI
const extractWithAI = async (
  texts: Record<string, string>,
  location: string
): Promise<ScrapedCounts> => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return { source: 'none' };
  }

  // Build a structured prompt with labeled sections
  const sections = Object.entries(texts)
    .filter(([, text]) => text.length > 0)
    .map(([label, text]) => `=== ${label} ===\n${text.slice(0, 5000)}`)
    .join('\n\n');

  if (!sections) return { source: 'none' };

  const prompt = `You are a real estate data extraction expert. Extract listing statistics for "${location}" from these scraped web pages.

IMPORTANT RULES:
1. Look for the TOTAL result count on each page. Zillow shows "X results" or "X homes" at the top.
2. The "all listings" page includes BOTH active AND pending. The "pending" page shows ONLY pending/under-contract.
3. To get active-only count: active = total_all_listings - pending_count
4. If you see a Redfin page, look for "X homes for sale" or "X results".
5. For median price, look for "median listing home price" or similar statistics.
6. For days on market, look for "median days on market" or "average DOM".

Return ONLY valid JSON:
{
  "totalListings": <number from the all-listings page, or null>,
  "pendingListings": <number from the pending-only page, or null>,
  "activeListings": <if you can calculate total - pending, put it here, or null>,
  "medianPrice": <median/average price as a number without $ or commas, or null>,
  "daysOnMarket": <average/median days on market, or null>,
  "source": "<which site(s) the data came from: zillow, redfin, or both>"
}

Scraped pages:
${sections}

JSON:`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('AI extraction failed:', response.status);
      return { source: 'none' };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.log('No JSON in AI response:', content.slice(0, 300));
      return { source: 'none' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('AI extracted:', parsed);

    const toNum = (v: unknown): number | undefined => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
      if (typeof v === 'string') {
        const n = Number(v.replace(/[^0-9.]/g, ''));
        return Number.isFinite(n) && n > 0 ? n : undefined;
      }
      return undefined;
    };

    // Calculate active from total - pending if needed
    let active = toNum(parsed.activeListings);
    const pending = toNum(parsed.pendingListings);
    const total = toNum(parsed.totalListings);

    if (!active && total && pending) {
      active = total - pending;
    }

    return {
      active,
      pending,
      medianPrice: toNum(parsed.medianPrice),
      daysOnMarket: toNum(parsed.daysOnMarket),
      source: parsed.source || 'web',
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    return { source: 'none' };
  }
};

// Search-based fallback for market stats (price, DOM)
const searchMarketStats = async (
  apiKey: string,
  location: string
): Promise<string> => {
  try {
    const resp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${location}" housing market median home price days on market statistics 2025 2026`,
        limit: 3,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || !data?.success) return '';

    const items: any[] = data.data || [];
    return items.map((item: any) => item?.markdown?.slice(0, 2000) || item?.description || '').join('\n');
  } catch (e) {
    console.error('Stats search error:', e);
    return '';
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();

    if (!location || typeof location !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Location is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const loc = location.trim();
    const locationKey = loc.toLowerCase().replace(/\s+/g, ' ');
    console.log(`=== Market data request for: ${loc} ===`);

    // Check cache
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: cached } = await sb
      .from('market_data_cache')
      .select('*')
      .eq('location_key', locationKey)
      .single();

    if (cached && (Date.now() - new Date(cached.created_at).getTime()) < CACHE_TTL_MS) {
      console.log('Cache hit for', locationKey);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            location: cached.location,
            activeListings: cached.active_listings,
            pendingListings: cached.pending_listings,
            par: Number(cached.par),
            averageDaysOnMarket: cached.average_days_on_market,
            medianPrice: Number(cached.median_price),
            priceChange: Number(cached.price_change),
            sources: [...(cached.sources || []), 'Cached'],
            lastUpdated: cached.created_at,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const slug = toZillowSlug(loc);
    
    // Phase 1: Scrape Zillow (all listings + pending page) in parallel with stats search
    const [zillowAll, zillowPending, statsText] = await Promise.all([
      scrapeAndExtract(firecrawlKey, `https://www.zillow.com/${slug}/`, 'zillow-all'),
      scrapeAndExtract(firecrawlKey, `https://www.zillow.com/${slug}/pending/`, 'zillow-pending'),
      searchMarketStats(firecrawlKey, loc),
    ]);

    const hasZillowData = zillowAll.length > 200 || zillowPending.length > 200;

    // Phase 2: If Zillow failed, try Redfin
    let redfinAll = '';
    let redfinPending = '';
    if (!hasZillowData) {
      console.log('Zillow scrape insufficient, trying Redfin...');
      const redfinSearch = loc.replace(/,\s*/g, '-').replace(/\s+/g, '-');
      [redfinAll, redfinPending] = await Promise.all([
        scrapeAndExtract(firecrawlKey, `https://www.redfin.com/search#query=${encodeURIComponent(loc)}`, 'redfin-all'),
        scrapeAndExtract(firecrawlKey, `https://www.redfin.com/search#query=${encodeURIComponent(loc)}&status=pending`, 'redfin-pending'),
      ]);
    }

    // Combine texts for AI extraction
    const textsForAI: Record<string, string> = {};
    if (zillowAll) textsForAI['Zillow All Listings'] = zillowAll;
    if (zillowPending) textsForAI['Zillow Pending Only'] = zillowPending;
    if (redfinAll) textsForAI['Redfin All Listings'] = redfinAll;
    if (redfinPending) textsForAI['Redfin Pending'] = redfinPending;
    if (statsText) textsForAI['Market Statistics Search'] = statsText;

    if (Object.keys(textsForAI).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not retrieve listing data. Please try a different location format (e.g., "Boston, MA").',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract with AI
    const extracted = await extractWithAI(textsForAI, loc);

    let activeListings = extracted.active || 0;
    let pendingListings = extracted.pending || 0;
    let averageDaysOnMarket = extracted.daysOnMarket || 30;
    let medianPrice = extracted.medianPrice || 0;

    const sources: string[] = [];
    if (hasZillowData) sources.push('Zillow');
    if (redfinAll || redfinPending) sources.push('Redfin');
    if (statsText) sources.push('Web Search');

    // Only estimate as absolute last resort
    if (activeListings > 0 && pendingListings === 0) {
      pendingListings = Math.max(1, Math.round(activeListings * 0.25));
      sources.push('Estimated (pending)');
    }
    if (pendingListings > 0 && activeListings === 0) {
      activeListings = Math.max(50, Math.round(pendingListings * 4));
      sources.push('Estimated (active)');
    }

    const par = activeListings > 0 ? pendingListings / activeListings : 0;

    const responseData = {
      success: true,
      data: {
        location: loc,
        activeListings,
        pendingListings,
        par,
        averageDaysOnMarket,
        medianPrice: medianPrice || 450000,
        priceChange: 0.02,
        sources,
        lastUpdated: new Date().toISOString(),
      },
    };

    console.log('Final result:', JSON.stringify(responseData));

    // Write to cache
    await sb.from('market_data_cache').upsert({
      location_key: locationKey,
      location: loc,
      active_listings: activeListings,
      pending_listings: pendingListings,
      par,
      average_days_on_market: averageDaysOnMarket,
      median_price: medianPrice || 450000,
      price_change: 0.02,
      sources,
      created_at: new Date().toISOString(),
    }, { onConflict: 'location_key' });

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch market data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

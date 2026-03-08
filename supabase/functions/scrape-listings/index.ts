import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface ExtractedData {
  activeListings?: number;
  pendingListings?: number;
  medianPrice?: number;
  daysOnMarket?: number;
  sources: string[];
}

// Firecrawl search with optional content scraping
const firecrawlSearch = async (
  apiKey: string,
  query: string,
  limit = 5,
  scrapeContent = false
): Promise<string> => {
  try {
    const body: any = { query, limit };
    if (scrapeContent) {
      body.scrapeOptions = { formats: ['markdown'] };
    }

    const resp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok || !data?.success) {
      console.log(`Search failed for "${query}":`, data?.error || resp.status);
      return '';
    }

    const items: any[] = data.data || [];
    const texts: string[] = [];
    for (const item of items) {
      if (item?.markdown) texts.push(item.markdown.slice(0, 4000));
      else if (item?.description) texts.push(item.description);
      if (item?.title) texts.push(item.title);
    }
    return texts.join('\n---\n');
  } catch (e) {
    console.error(`Search error for "${query}":`, e);
    return '';
  }
};

// Firecrawl extract structured data from a URL
const firecrawlExtract = async (
  apiKey: string,
  url: string,
  prompt: string
): Promise<string> => {
  try {
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: [{ type: 'json', prompt }],
        waitFor: 10000,
        timeout: 30000,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || !data?.success) {
      console.log(`Extract failed for "${url}":`, data?.error || resp.status);
      return '';
    }

    const json = data.data?.json || data.json || '';
    return typeof json === 'string' ? json : JSON.stringify(json);
  } catch (e) {
    console.error(`Extract error for "${url}":`, e);
    return '';
  }
};

// Extract data using AI
const extractWithAI = async (
  texts: Record<string, string>,
  location: string
): Promise<ExtractedData> => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return { sources: [] };

  const sections = Object.entries(texts)
    .filter(([, text]) => text.length > 0)
    .map(([label, text]) => `=== ${label} ===\n${text.slice(0, 8000)}`)
    .join('\n\n');

  if (!sections) return { sources: [] };

  const prompt = `You are a real estate data extraction expert. Extract listing statistics for "${location}" from these web search results.

CRITICAL DEFINITIONS:
- On Zillow, the DEFAULT search page shows ONLY non-pending listings (homes actively for sale, NOT under contract)
- The "all listings" or unfiltered view on Zillow shows TOTAL = non-pending + pending combined
- ACTIVE (non-pending) = homes for sale that are NOT pending/under contract
- PENDING = homes under contract / contingent / pending
- TOTAL = active + pending combined
- PAR = pending / total (NOT pending / active)

EXTRACTION RULES:
1. Look for result counts like "X results", "X homes for sale", "Showing 1-40 of X", "X listings"
2. If you find a Zillow default page count, that is the NON-PENDING (active) count
3. If you find a Zillow "all listings" count or total count, that includes both active and pending
4. PENDING = total - active (non-pending)
5. Redfin typically shows active-only counts
6. If you see both a smaller number and a larger number from the same source, the smaller is likely active-only and the larger is total
7. Market stats pages show median price, days on market
8. Ignore agent counts

Return ONLY valid JSON:
{
  "activeListings": <non-pending count (homes for sale, not under contract), null if unknown>,
  "pendingListings": <pending/under-contract count, null if unknown>,
  "totalListings": <total including pending, null if unknown>,
  "medianPrice": <median price as number, null if unknown>,
  "daysOnMarket": <median/avg DOM as number, null if unknown>,
  "dataSources": ["source1", "source2"]
}

Data:
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

    if (!response.ok) return { sources: [] };

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return { sources: [] };

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

    let active = toNum(parsed.activeListings);
    let pending = toNum(parsed.pendingListings);
    const total = toNum(parsed.totalListings);

    if (total) {
      if (active && !pending) pending = total - active;
      if (pending && !active) active = total - pending;
    }

    return {
      activeListings: active,
      pendingListings: pending,
      medianPrice: toNum(parsed.medianPrice),
      daysOnMarket: toNum(parsed.daysOnMarket),
      sources: ((parsed.dataSources || []) as string[]).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    return { sources: [] };
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

    // Run optimized parallel searches (3 instead of 5, no content scraping)
    const [listingsSearch, pendingSearch, statsSearch] = await Promise.all([
      // Zillow listings count (default = non-pending)
      firecrawlSearch(firecrawlKey, `site:zillow.com "${loc}" homes for sale results`, 3, false),
      // Pending + total count
      firecrawlSearch(firecrawlKey, `"${loc}" pending under contract homes listings 2025 2026 how many total`, 3, false),
      // Market stats (price, DOM)
      firecrawlSearch(firecrawlKey, `"${loc}" housing market median home price days on market 2025 2026`, 3, false),
    ]);

    const textsForAI: Record<string, string> = {};
    if (listingsSearch) textsForAI['Zillow Active (Non-Pending) Listings Search'] = listingsSearch;
    if (pendingSearch) textsForAI['Pending/Under Contract & Total Search'] = pendingSearch;
    if (statsSearch) textsForAI['Market Statistics'] = statsSearch;

    console.log(`Data sources: listings=${listingsSearch.length}, pending=${pendingSearch.length}, stats=${statsSearch.length}`);

    if (Object.keys(textsForAI).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not retrieve listing data. Try a different format (e.g., "Boston, MA").',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extracted = await extractWithAI(textsForAI, loc);

    let activeListings = extracted.activeListings || 0;
    let pendingListings = extracted.pendingListings || 0;
    let averageDaysOnMarket = extracted.daysOnMarket || 30;
    let medianPrice = extracted.medianPrice || 0;

    const sources: string[] = extracted.sources.length > 0 ? extracted.sources : ['Web Search'];

    // Estimate only as last resort
    if (activeListings > 0 && pendingListings === 0) {
      pendingListings = Math.max(1, Math.round(activeListings * 0.25));
      sources.push('Estimated (pending)');
    }
    if (pendingListings > 0 && activeListings === 0) {
      activeListings = Math.max(50, Math.round(pendingListings * 4));
      sources.push('Estimated (active)');
    }

    const totalListings = activeListings + pendingListings;
    const par = totalListings > 0 ? pendingListings / totalListings : 0;

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

    // Cache
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

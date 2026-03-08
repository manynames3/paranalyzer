import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface MarketNumbers {
  activeListings?: number;
  pendingListings?: number;
  averageDaysOnMarket?: number;
  medianPrice?: number;
}

// Use Firecrawl search API to find market data quickly
const firecrawlSearch = async (
  apiKey: string,
  query: string,
  limit = 5
): Promise<string> => {
  try {
    const resp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || !data?.success) {
      console.log(`Search failed for "${query}":`, data?.error || resp.status);
      return '';
    }

    const items: any[] = data.data || [];
    const texts: string[] = [];
    for (const item of items) {
      if (item?.markdown) texts.push(item.markdown.slice(0, 3000));
      if (item?.description) texts.push(String(item.description));
      if (item?.title) texts.push(String(item.title));
    }
    return texts.join('\n---\n');
  } catch (e) {
    console.error(`Search error for "${query}":`, e);
    return '';
  }
};

// Scrape a specific URL for pending count
const scrapePendingCount = async (
  apiKey: string,
  location: string
): Promise<number | null> => {
  try {
    const slug = location.toLowerCase().replace(/[,\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
    const url = `https://www.realtor.com/realestateandhomes-search/${slug}/show-recently-sold-pending`;
    console.log('Scraping pending page:', url);

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
    if (!resp.ok || !data?.success) return null;

    const md = data.data?.markdown || '';
    // Look for "X results" or "X homes" pattern
    const match = md.match(/(?:showing|of|found)\s+([0-9,]+)\s*(?:results|homes|properties|listings)/i)
      || md.match(/([0-9,]+)\s*(?:results|homes\s+(?:with|recently)|pending)/i);

    if (match) {
      const n = Number(match[1].replace(/,/g, ''));
      if (Number.isFinite(n) && n > 0) {
        console.log(`Scraped pending count: ${n}`);
        return n;
      }
    }
    return null;
  } catch (e) {
    console.error('Pending scrape error:', e);
    return null;
  }
};

// Use AI to extract numbers from combined search results
const extractWithAI = async (text: string, location: string): Promise<MarketNumbers> => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return {};
  }

  // Trim text to relevant portions
  const snippet = text.slice(0, 12000);

  const prompt = `You are a real estate data extraction assistant. Extract listing statistics for "${location}" from the following web search results.

Return ONLY a JSON object with these fields (use null if you truly cannot find the data):
{
  "activeListings": <number of homes currently for sale / active listings>,
  "pendingListings": <number of pending / under contract listings>,
  "averageDaysOnMarket": <average or median days on market>,
  "medianPrice": <median or average home sale price in dollars, as a number without $ or commas>
}

Look for patterns like:
- "X homes for sale", "X results", "Showing 1-25 of X homes", "X listings"
- "X pending", "X under contract", "X contingent"
- "median sale price $X", "average price $X", "median list price"
- "X days on market", "X median DOM"

IMPORTANT: Extract actual numbers you find. Do not make up data. If a snippet says "292 homes for sale" then activeListings = 292.

Web search results:
${snippet}

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
      return {};
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.log('No JSON in AI response:', content.slice(0, 200));
      return {};
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

    return {
      activeListings: toNum(parsed.activeListings),
      pendingListings: toNum(parsed.pendingListings),
      averageDaysOnMarket: toNum(parsed.averageDaysOnMarket),
      medianPrice: toNum(parsed.medianPrice),
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    return {};
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

    // Check cache first
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

    // Run searches + pending scrape in parallel
    const [listingsText, pendingText, statsText, scrapedPending] = await Promise.all([
      firecrawlSearch(firecrawlKey, `"${loc}" homes for sale active listings`, 5),
      firecrawlSearch(firecrawlKey, `"${loc}" pending homes under contract contingent real estate`, 5),
      firecrawlSearch(firecrawlKey, `"${loc}" housing market median home price days on market statistics`, 5),
      scrapePendingCount(firecrawlKey, loc),
    ]);

    const combinedText = [listingsText, pendingText, statsText].filter(Boolean).join('\n===\n');

    if (!combinedText) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not retrieve listing data. Please try a different location format (e.g., "Boston, MA").',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Combined search text: ${combinedText.length} chars, scraped pending: ${scrapedPending}`);

    // Extract data with AI
    const extracted = await extractWithAI(combinedText, loc);

    let activeListings = extracted.activeListings || 0;
    let pendingListings = extracted.pendingListings || scrapedPending || 0;
    let averageDaysOnMarket = extracted.averageDaysOnMarket || 30;
    let medianPrice = extracted.medianPrice || 0;

    // Use scraped pending if AI missed it
    if (scrapedPending && scrapedPending > pendingListings) {
      pendingListings = scrapedPending;
    }

    const sources: string[] = ['Web Search'];

    // Only estimate as last resort, using more reasonable ratios
    if (activeListings > 0 && pendingListings === 0) {
      // Typical US market PAR is 20-40%, use 25% as a reasonable middle
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

    // Write to cache (upsert)
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

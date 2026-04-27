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
  population?: number;
  averageIncome?: number;
  averageHousingPrice?: number;
  redfinCompeteScore?: number;
  redfinCompeteLabel?: string;
  zillowHeatScore?: number;
  zillowHeatLabel?: string;
  sources: string[];
}

const calculatePendingMetrics = (activeListings: number | null, pendingListings: number | null) => {
  const hasCompleteCounts = activeListings !== null && pendingListings !== null;
  const totalListings = hasCompleteCounts ? activeListings + pendingListings : null;
  const pendingToActiveRatio =
    hasCompleteCounts && activeListings > 0 ? pendingListings / activeListings : null;
  const pendingShare =
    totalListings !== null && totalListings > 0 ? pendingListings / totalListings : null;

  return {
    totalListings,
    pendingToActiveRatio,
    pendingShare,
  };
};

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

DEMOGRAPHIC DATA:
- Extract population of the city/area if mentioned
- Extract average/median household income if mentioned
- Extract average/median home value or housing price if mentioned (this is the overall average, NOT just current listings)

ZILLOW MARKET HEAT INDEX:
- Zillow's Market Heat Index is a score from 0-10 measuring market competitiveness
- Look for phrases like "market heat index", "market temperature", "hot market", "cold market"
- Labels include: "Very Cold" (0-2), "Cold" (2-4), "Neutral" (4-6), "Hot" (6-8), "Very Hot" (8-10)

Return ONLY valid JSON:
{
  "activeListings": <non-pending count (homes for sale, not under contract), null if unknown>,
  "pendingListings": <pending/under-contract count, null if unknown>,
  "totalListings": <total including pending, null if unknown>,
  "medianPrice": <median price as number, null if unknown>,
  "daysOnMarket": <median/avg DOM as number, null if unknown>,
  "population": <city/area population as number, null if unknown>,
  "averageIncome": <median/average household income as number, null if unknown>,
  "averageHousingPrice": <average/median home value as number, null if unknown>,
  "redfinCompeteScore": <Redfin compete score (0-100), null if unknown>,
  "redfinCompeteLabel": <Redfin compete label (e.g., "Very Competitive"), null if unknown>,
  "zillowHeatScore": <Zillow market heat index (0-10), null if unknown>,
  "zillowHeatLabel": <Zillow heat label (e.g., "Very Hot", "Hot", "Neutral", "Cold"), null if unknown>,
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
      population: toNum(parsed.population),
      averageIncome: toNum(parsed.averageIncome),
      averageHousingPrice: toNum(parsed.averageHousingPrice),
      redfinCompeteScore: toNum(parsed.redfinCompeteScore),
      redfinCompeteLabel: parsed.redfinCompeteLabel,
      zillowHeatScore: toNum(parsed.zillowHeatScore),
      zillowHeatLabel: parsed.zillowHeatLabel,
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
      const activeListings = cached.active_listings;
      const pendingListings = cached.pending_listings;
      const { pendingToActiveRatio, pendingShare } = calculatePendingMetrics(activeListings, pendingListings);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            location: cached.location,
            activeListings,
            pendingListings,
            pendingToActiveRatio,
            pendingShare,
            averageDaysOnMarket: cached.average_days_on_market,
            medianPrice: Number(cached.median_price),
            priceChange: Number(cached.price_change),
            population: cached.population || null,
            averageIncome: cached.average_income || null,
            averageHousingPrice: cached.average_housing_price || null,
            redfinCompeteScore: cached.redfin_compete_score || null,
            redfinCompeteLabel: cached.redfin_compete_label || null,
            zillowHeatScore: cached.zillow_heat_score || null,
            zillowHeatLabel: cached.zillow_heat_label || null,
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

    // Format location for Zillow URL (e.g., "Duluth, GA" -> "duluth-ga")
    const zillowSlug = loc.toLowerCase().replace(/,?\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Run optimized parallel searches (6 queries)
    const [listingsSearch, pendingSearch, statsSearch, demographicsSearch, redfinSearch, zillowHeatSearch] = await Promise.all([
      // Zillow listings count (default = non-pending)
      firecrawlSearch(firecrawlKey, `site:zillow.com "${loc}" homes for sale results`, 3, false),
      // Pending + total count
      firecrawlSearch(firecrawlKey, `"${loc}" pending under contract homes listings 2025 2026 how many total`, 3, false),
      // Market stats (price, DOM)
      firecrawlSearch(firecrawlKey, `"${loc}" housing market median home price days on market 2025 2026`, 3, false),
      // Demographics (population, income, housing price)
      firecrawlSearch(firecrawlKey, `"${loc}" population median household income median home value 2024 2025`, 3, false),
      // Redfin compete score
      firecrawlSearch(firecrawlKey, `site:redfin.com "${loc}" compete score competitive`, 3, false),
      // Zillow housing market overview page - try direct scrape
      firecrawlExtract(firecrawlKey, `https://www.zillow.com/${zillowSlug}/home-values/`, 
        'Extract the Market Heat Index or market temperature score (0-10 scale or descriptive like Hot, Cold, Very Hot). Also extract any market overview statistics.'),
    ]);

    const textsForAI: Record<string, string> = {};
    if (listingsSearch) textsForAI['Zillow Active (Non-Pending) Listings Search'] = listingsSearch;
    if (pendingSearch) textsForAI['Pending/Under Contract & Total Search'] = pendingSearch;
    if (statsSearch) textsForAI['Market Statistics'] = statsSearch;
    if (demographicsSearch) textsForAI['Demographics & Census Data'] = demographicsSearch;
    if (redfinSearch) textsForAI['Redfin Compete Score'] = redfinSearch;
    if (zillowHeatSearch) textsForAI['Zillow Market Heat Index'] = zillowHeatSearch;

    console.log(`Data sources: listings=${listingsSearch.length}, pending=${pendingSearch.length}, stats=${statsSearch.length}, demographics=${demographicsSearch.length}, redfin=${redfinSearch.length}, zillowHeat=${zillowHeatSearch.length}`);

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

    let activeListings = extracted.activeListings ?? null;
    let pendingListings = extracted.pendingListings ?? null;
    let averageDaysOnMarket = extracted.daysOnMarket || 30;
    let medianPrice = extracted.medianPrice || 0;

    const sources: string[] = extracted.sources.length > 0 ? extracted.sources : ['Web Search'];

    const { pendingToActiveRatio, pendingShare } = calculatePendingMetrics(activeListings, pendingListings);

    const responseData = {
      success: true,
      data: {
        location: loc,
        activeListings,
        pendingListings,
        pendingToActiveRatio,
        pendingShare,
        averageDaysOnMarket,
        medianPrice: medianPrice || 450000,
        priceChange: 0.02,
        population: extracted.population || null,
        averageIncome: extracted.averageIncome || null,
        averageHousingPrice: extracted.averageHousingPrice || null,
        redfinCompeteScore: extracted.redfinCompeteScore || null,
        redfinCompeteLabel: extracted.redfinCompeteLabel || null,
        zillowHeatScore: extracted.zillowHeatScore || null,
        zillowHeatLabel: extracted.zillowHeatLabel || null,
        sources,
        lastUpdated: new Date().toISOString(),
      },
    };

    console.log('Final result:', JSON.stringify(responseData));

    if (activeListings !== null && pendingListings !== null) {
      await sb.from('market_data_cache').upsert({
        location_key: locationKey,
        location: loc,
        active_listings: activeListings,
        pending_listings: pendingListings,
        par: pendingToActiveRatio ?? 0,
        average_days_on_market: averageDaysOnMarket,
        median_price: medianPrice || 450000,
        price_change: 0.02,
        population: extracted.population || null,
        average_income: extracted.averageIncome || null,
        average_housing_price: extracted.averageHousingPrice || null,
        redfin_compete_score: extracted.redfinCompeteScore || null,
        redfin_compete_label: extracted.redfinCompeteLabel || null,
        zillow_heat_score: extracted.zillowHeatScore || null,
        zillow_heat_label: extracted.zillowHeatLabel || null,
        sources,
        created_at: new Date().toISOString(),
      }, { onConflict: 'location_key' });
    }

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

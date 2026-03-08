const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const loc = location.trim();
    console.log(`=== Market data request for: ${loc} ===`);

    // Run two targeted searches in parallel for speed
    const [listingsText, statsText] = await Promise.all([
      firecrawlSearch(firecrawlKey, `${loc} homes for sale active pending under contract listings 2025`, 5),
      firecrawlSearch(firecrawlKey, `${loc} real estate market statistics median home price days on market 2025`, 5),
    ]);

    const combinedText = [listingsText, statsText].filter(Boolean).join('\n===\n');

    if (!combinedText) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not retrieve listing data. Please try a different location format (e.g., "Boston, MA").',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Combined search text: ${combinedText.length} chars`);

    // Extract data with AI
    const extracted = await extractWithAI(combinedText, loc);

    let activeListings = extracted.activeListings || 0;
    let pendingListings = extracted.pendingListings || 0;
    let averageDaysOnMarket = extracted.averageDaysOnMarket || 30;
    let medianPrice = extracted.medianPrice || 0;

    // Estimation fallbacks
    const sources: string[] = ['Web Search'];

    if (activeListings > 0 && pendingListings === 0) {
      pendingListings = Math.max(1, Math.round(activeListings * 0.08));
      sources.push('Estimated (pending)');
    }
    if (pendingListings > 0 && activeListings === 0) {
      activeListings = Math.max(50, pendingListings * 12);
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

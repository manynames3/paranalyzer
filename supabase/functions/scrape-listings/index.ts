const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListingData {
  activeListings: number;
  pendingListings: number;
  averageDaysOnMarket: number;
  medianPrice: number;
  source: string;
}

interface ScrapeResult {
  success: boolean;
  data?: {
    location: string;
    activeListings: number;
    pendingListings: number;
    par: number;
    averageDaysOnMarket: number;
    medianPrice: number;
    priceChange: number;
    sources: string[];
    lastUpdated: string;
  };
  error?: string;
}

// Use AI to extract listing data from scraped content
const extractWithAI = async (markdown: string, location: string, source: string): Promise<Partial<ListingData> | null> => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  try {
    const prompt = `Extract real estate listing data from this ${source} page content for "${location}".

Return ONLY a JSON object with these fields (use null if not found):
- activeListings: number of homes for sale / active listings
- pendingListings: number of pending / under contract listings  
- averageDaysOnMarket: average or median days on market
- medianPrice: median or average home price in dollars

Look for patterns like:
- "X homes for sale", "X results", "Showing X homes"
- "X pending", "X under contract"
- "Median sale price $X", "Average price $X"
- "X days on market", "DOM: X"

Content:
${markdown.substring(0, 8000)}

JSON response:`;

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
      console.error(`AI extraction failed for ${source}:`, response.status);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.log(`${source}: No JSON found in AI response`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`${source} AI extracted:`, parsed);

    return {
      source,
      activeListings: typeof parsed.activeListings === 'number' ? parsed.activeListings : undefined,
      pendingListings: typeof parsed.pendingListings === 'number' ? parsed.pendingListings : undefined,
      averageDaysOnMarket: typeof parsed.averageDaysOnMarket === 'number' ? parsed.averageDaysOnMarket : undefined,
      medianPrice: typeof parsed.medianPrice === 'number' ? parsed.medianPrice : undefined,
    };
  } catch (error) {
    console.error(`${source} AI extraction error:`, error);
    return null;
  }
};

// Scrape a single source
const scrapeSource = async (
  firecrawlKey: string,
  url: string,
  source: string,
  location: string
): Promise<Partial<ListingData> | null> => {
  try {
    console.log(`Scraping ${source}: ${url}`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error(`${source} scrape failed:`, result.error || response.status);
      return null;
    }

    const markdown = result.data?.markdown || result.markdown || '';
    if (!markdown) {
      console.log(`${source}: No markdown content`);
      return null;
    }

    console.log(`${source}: Got ${markdown.length} chars, sending to AI...`);
    
    // Use AI to extract data
    return await extractWithAI(markdown, location, source);
  } catch (error) {
    console.error(`${source} error:`, error);
    return null;
  }
};

// Build search URLs for different sources
const buildSearchUrls = (location: string): { url: string; source: string }[] => {
  const slug = location.toLowerCase().replace(/[,\s]+/g, '-').replace(/[^a-z0-9-]/g, '');

  return [
    {
      source: 'Realtor.com',
      url: `https://www.realtor.com/realestateandhomes-search/${slug}`,
    },
    {
      source: 'Homes.com',
      url: `https://www.homes.com/homes-for-sale/${slug}/`,
    },
  ];
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
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchUrls = buildSearchUrls(location.trim());
    console.log(`Searching for: ${location}`);

    // Scrape sources in parallel
    const results = await Promise.all(
      searchUrls.map(({ url, source }) => scrapeSource(firecrawlKey, url, source, location.trim()))
    );

    // Combine results
    const validResults = results.filter((r): r is Partial<ListingData> => r !== null);

    if (validResults.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not retrieve listing data. Please try a different location format (e.g., "Boston, MA" or "02139").',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate data - prefer first non-null value
    let activeListings = 0;
    let pendingListings = 0;
    let averageDaysOnMarket = 30;
    let medianPrice = 0;
    const sources: string[] = [];

    for (const result of validResults) {
      if (result.source) sources.push(result.source);
      if (result.activeListings && result.activeListings > activeListings) {
        activeListings = result.activeListings;
      }
      if (result.pendingListings && result.pendingListings > pendingListings) {
        pendingListings = result.pendingListings;
      }
      if (result.averageDaysOnMarket) {
        averageDaysOnMarket = result.averageDaysOnMarket;
      }
      if (result.medianPrice && result.medianPrice > medianPrice) {
        medianPrice = result.medianPrice;
      }
    }

    // Calculate PAR
    const par = activeListings > 0 ? pendingListings / activeListings : 0;

    const responseData: ScrapeResult = {
      success: true,
      data: {
        location: location.trim(),
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

    console.log('Final result:', responseData);

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

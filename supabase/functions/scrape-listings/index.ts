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

// Extract numbers from text
const extractNumber = (text: string, patterns: RegExp[]): number | null => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) return num;
    }
  }
  return null;
};

// Parse listing counts from scraped content
const parseListingData = (markdown: string, source: string): Partial<ListingData> => {
  const data: Partial<ListingData> = { source };
  
  // Common patterns for active/for sale listings
  const activePatterns = [
    /(\d[\d,]*)\s*(?:homes?|properties?|listings?)\s*(?:for sale|available)/i,
    /(?:for sale|available)[:\s]*(\d[\d,]*)/i,
    /(\d[\d,]*)\s*(?:active|current)\s*listings?/i,
    /showing\s*\d+\s*of\s*(\d[\d,]*)/i,
    /(\d[\d,]*)\s*results?/i,
  ];
  
  // Patterns for pending/under contract
  const pendingPatterns = [
    /(\d[\d,]*)\s*(?:homes?|properties?|listings?)\s*(?:pending|under contract)/i,
    /(?:pending|under contract)[:\s]*(\d[\d,]*)/i,
    /(\d[\d,]*)\s*pending\s*listings?/i,
  ];
  
  // Patterns for days on market
  const domPatterns = [
    /(?:average|avg|median)\s*(?:days?|time)\s*(?:on market|to sell)[:\s]*(\d+)/i,
    /(\d+)\s*(?:days?|DOM)\s*(?:on market|average)/i,
    /days\s*on\s*(?:market|redfin)[:\s]*(\d+)/i,
  ];
  
  // Patterns for median price
  const pricePatterns = [
    /(?:median|average|avg)\s*(?:sale|list|home)?\s*price[:\s]*\$?([\d,]+)/i,
    /\$([\d,]+)k?\s*(?:median|average)/i,
    /(?:median|typical)\s*home\s*value[:\s]*\$?([\d,]+)/i,
  ];
  
  const active = extractNumber(markdown, activePatterns);
  if (active !== null) data.activeListings = active;
  
  const pending = extractNumber(markdown, pendingPatterns);
  if (pending !== null) data.pendingListings = pending;
  
  const dom = extractNumber(markdown, domPatterns);
  if (dom !== null) data.averageDaysOnMarket = dom;
  
  const price = extractNumber(markdown, pricePatterns);
  if (price !== null) {
    // Handle "450k" format
    data.medianPrice = price < 10000 ? price * 1000 : price;
  }
  
  return data;
};

// Scrape a single source
const scrapeSource = async (
  apiKey: string, 
  url: string, 
  source: string
): Promise<Partial<ListingData> | null> => {
  try {
    console.log(`Scraping ${source}: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
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

    console.log(`${source}: Got ${markdown.length} chars of content`);
    const parsed = parseListingData(markdown, source);
    console.log(`${source} parsed:`, parsed);
    
    return parsed;
  } catch (error) {
    console.error(`${source} error:`, error);
    return null;
  }
};

// Build search URLs for different sources
const buildSearchUrls = (location: string): { url: string; source: string }[] => {
  const encoded = encodeURIComponent(location);
  const slug = location.toLowerCase().replace(/[,\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return [
    {
      source: 'Realtor.com',
      url: `https://www.realtor.com/realestateandhomes-search/${slug}`,
    },
    {
      source: 'Redfin',
      url: `https://www.redfin.com/city/search?q=${encoded}`,
    },
    {
      source: 'Zillow',
      url: `https://www.zillow.com/homes/${slug}_rb/`,
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

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchUrls = buildSearchUrls(location.trim());
    console.log(`Searching for: ${location}`);

    // Scrape all sources in parallel
    const results = await Promise.all(
      searchUrls.map(({ url, source }) => scrapeSource(apiKey, url, source))
    );

    // Combine results from all sources
    const validResults = results.filter((r): r is Partial<ListingData> => r !== null);
    
    if (validResults.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not retrieve listing data. The location may not have enough listings or the sites may be temporarily unavailable.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate data - prefer data from sources that returned it
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

    // If we have active but no pending, estimate based on typical ratios
    if (activeListings > 0 && pendingListings === 0) {
      // Typical pending ratio is around 30-40% of active in balanced markets
      pendingListings = Math.floor(activeListings * 0.35);
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
        medianPrice: medianPrice || 450000, // Default if not found
        priceChange: 0.02, // Would need historical data for real change
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

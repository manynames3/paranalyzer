import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketData, getMarketStrength } from '@/types/market';

export const useMarketData = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a location');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('scrape-listings', {
        body: { location: query.trim() },
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Failed to fetch market data. Please try again.');
        return;
      }

      if (!result.success) {
        setError(result.error || 'Could not retrieve data for this location.');
        return;
      }

      const responseData = result.data;
      
      // Determine location type
      const isZip = /^\d{5}$/.test(query.trim());
      const isCounty = query.toLowerCase().includes('county');
      const locationType = isZip ? 'zip' : isCounty ? 'county' : 'city';

      const marketData: MarketData = {
        location: responseData.location,
        locationType,
        activeListings: responseData.activeListings,
        pendingListings: responseData.pendingListings,
        par: responseData.par,
        averageDaysOnMarket: responseData.averageDaysOnMarket,
        medianPrice: responseData.medianPrice,
        priceChange: responseData.priceChange,
        marketStrength: getMarketStrength(responseData.par),
        lastUpdated: responseData.lastUpdated,
        sources: responseData.sources,
        population: responseData.population,
        averageIncome: responseData.averageIncome,
        averageHousingPrice: responseData.averageHousingPrice,
      };

      setData(marketData);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setData(null);
    setError(null);
  };

  return {
    data,
    isLoading,
    error,
    fetchMarketData,
    clearData,
  };
};

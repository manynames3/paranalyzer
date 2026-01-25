import { useState } from 'react';
import { MarketData, getMarketStrength } from '@/types/market';

// Demo data generator - in production, this would fetch from Firecrawl/APIs
const generateDemoData = (query: string): MarketData => {
  // Simulate different market conditions based on input
  const hash = query.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const activeListings = Math.abs(hash % 500) + 100;
  const pendingRatio = (Math.abs(hash % 60) + 20) / 100;
  const pendingListings = Math.floor(activeListings * pendingRatio);
  const par = pendingListings / activeListings;
  const avgDays = Math.abs(hash % 45) + 15;
  const medianPrice = Math.abs(hash % 500000) + 250000;
  const priceChange = ((hash % 20) - 5) / 100;

  // Determine location type
  const isZip = /^\d{5}$/.test(query.trim());
  const isCounty = query.toLowerCase().includes('county');
  const locationType = isZip ? 'zip' : isCounty ? 'county' : 'city';

  return {
    location: query,
    locationType,
    activeListings,
    pendingListings,
    par,
    averageDaysOnMarket: avgDays,
    medianPrice,
    priceChange,
    marketStrength: getMarketStrength(par),
    lastUpdated: new Date().toISOString(),
  };
};

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const marketData = generateDemoData(query);
      setData(marketData);
    } catch (err) {
      setError('Failed to fetch market data. Please try again.');
      console.error('Error fetching market data:', err);
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

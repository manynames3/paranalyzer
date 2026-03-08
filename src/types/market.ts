export interface MarketData {
  location: string;
  locationType: 'city' | 'county' | 'zip';
  activeListings: number;
  pendingListings: number;
  par: number;
  averageDaysOnMarket: number;
  medianPrice: number;
  priceChange: number;
  marketStrength: 'buyers' | 'balanced' | 'sellers';
  lastUpdated: string;
  sources?: string[];
  population?: number;
  averageIncome?: number;
  averageHousingPrice?: number;
}

export interface SearchParams {
  query: string;
  type: 'city' | 'county' | 'zip';
}

export type MarketStrength = 'buyers' | 'balanced' | 'sellers';

export const getMarketStrength = (par: number): MarketStrength => {
  if (par < 0.3) return 'buyers';
  if (par < 0.5) return 'balanced';
  return 'sellers';
};

export const getMarketStrengthLabel = (strength: MarketStrength): string => {
  switch (strength) {
    case 'buyers':
      return "Buyer's Market";
    case 'balanced':
      return "Balanced Market";
    case 'sellers':
      return "Seller's Market";
  }
};

export const getMarketStrengthDescription = (strength: MarketStrength): string => {
  switch (strength) {
    case 'buyers':
      return "More homes available than buyers. Good negotiating power for buyers.";
    case 'balanced':
      return "Supply and demand are relatively equal. Fair conditions for both parties.";
    case 'sellers':
      return "More buyers than available homes. Sellers have the advantage.";
  }
};

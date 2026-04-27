export interface MarketData {
  location: string;
  locationType: 'city' | 'county' | 'zip';
  activeListings: number | null;
  pendingListings: number | null;
  pendingToActiveRatio: number | null;
  pendingShare: number | null;
  averageDaysOnMarket: number;
  medianPrice: number;
  priceChange: number;
  marketStrength: 'buyers' | 'balanced' | 'sellers' | 'unknown';
  lastUpdated: string;
  sources?: string[];
  population?: number;
  averageIncome?: number;
  averageHousingPrice?: number;
  redfinCompeteScore?: number;
  redfinCompeteLabel?: string;
  zillowHeatScore?: number;
  zillowHeatLabel?: string;
}

export interface SearchParams {
  query: string;
  type: 'city' | 'county' | 'zip';
}

export type MarketStrength = 'buyers' | 'balanced' | 'sellers' | 'unknown';

export const getMarketStrength = (pendingToActiveRatio: number | null): MarketStrength => {
  if (pendingToActiveRatio === null || !Number.isFinite(pendingToActiveRatio)) return 'unknown';

  // Convert ratio to pending share so the historical thresholds still map
  // to buyer/balanced/seller conditions.
  const pendingShare = pendingToActiveRatio / (1 + pendingToActiveRatio);

  if (pendingShare < 0.3) return 'buyers';
  if (pendingShare < 0.5) return 'balanced';
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
    case 'unknown':
      return 'Insufficient Data';
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
    case 'unknown':
      return 'Pending and active counts were incomplete, so the ratio was not calculated.';
  }
};

// === DealCheck AI Types ===

export interface PropertyInput {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  lot_size?: number;
  year_built?: number;
  asking_price: number;
  estimated_arv: number;
  estimated_monthly_rent: number;
  estimated_rehab_low: number;
  estimated_rehab_high: number;
  taxes_annual: number;
  insurance_annual: number;
  hoa_monthly: number;
  vacancy_percent: number;
  repairs_percent: number;
  capex_percent: number;
  property_management_percent: number;
  closing_cost_buy_percent: number;
  closing_cost_sell_percent: number;
  holding_months: number;
  down_payment_percent: number;
  interest_rate: number;
  loan_term_years: number;
  notes?: string;
}

export interface RentalAnalysis {
  monthlyGrossRent: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyVacancy: number;
  monthlyRepairs: number;
  monthlyCapex: number;
  monthlyManagement: number;
  monthlyOperatingExpenses: number;
  noi: number;
  capRate: number;
  loanAmount: number;
  monthlyMortgage: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  totalCashNeeded: number;
  cashOnCashReturn: number;
}

export interface FlipAnalysis {
  totalAcquisitionCostLow: number;
  totalAcquisitionCostHigh: number;
  sellingCosts: number;
  holdingCosts: number;
  flipProfitLow: number;
  flipProfitHigh: number;
  flipMarginLow: number;
  flipMarginHigh: number;
  mao: number;
}

export interface DealScores {
  buyHoldScore: number;
  flipScore: number;
  overallScore: number;
  recommendedStrategy: 'Rental' | 'Flip' | 'BRRRR' | 'Pass';
}

export interface DealAnalysisResult {
  rental: RentalAnalysis;
  flip: FlipAnalysis;
  scores: DealScores;
}

export type ScoreLabel = 'Exceptional' | 'Strong' | 'Good' | 'Marginal' | 'Risky';

export const getScoreLabel = (score: number): ScoreLabel => {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Marginal';
  return 'Risky';
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-success/15 border-success/30';
  if (score >= 60) return 'bg-warning/15 border-warning/30';
  return 'bg-destructive/15 border-destructive/30';
};

export interface PresetDefaults {
  vacancy_percent: number;
  repairs_percent: number;
  capex_percent: number;
  property_management_percent: number;
  closing_cost_buy_percent: number;
  closing_cost_sell_percent: number;
}

export const PRESETS: Record<string, PresetDefaults> = {
  conservative: {
    vacancy_percent: 10,
    repairs_percent: 8,
    capex_percent: 8,
    property_management_percent: 12,
    closing_cost_buy_percent: 4,
    closing_cost_sell_percent: 8,
  },
  standard: {
    vacancy_percent: 8,
    repairs_percent: 5,
    capex_percent: 5,
    property_management_percent: 10,
    closing_cost_buy_percent: 3,
    closing_cost_sell_percent: 6,
  },
  aggressive: {
    vacancy_percent: 5,
    repairs_percent: 3,
    capex_percent: 3,
    property_management_percent: 8,
    closing_cost_buy_percent: 2,
    closing_cost_sell_percent: 5,
  },
};

export const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'condo', label: 'Condo / Townhouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'fourplex', label: 'Fourplex' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
];

export const SAMPLE_DEALS: PropertyInput[] = [
  {
    address: '1234 Oak Street',
    city: 'Austin',
    state: 'TX',
    zip_code: '78745',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1400,
    year_built: 1985,
    asking_price: 285000,
    estimated_arv: 350000,
    estimated_monthly_rent: 2100,
    estimated_rehab_low: 20000,
    estimated_rehab_high: 35000,
    taxes_annual: 5200,
    insurance_annual: 1800,
    hoa_monthly: 0,
    vacancy_percent: 8,
    repairs_percent: 5,
    capex_percent: 5,
    property_management_percent: 10,
    closing_cost_buy_percent: 3,
    closing_cost_sell_percent: 6,
    holding_months: 6,
    down_payment_percent: 20,
    interest_rate: 7.0,
    loan_term_years: 30,
    notes: 'Needs new kitchen and bathroom updates',
  },
  {
    address: '567 Maple Avenue',
    city: 'Cleveland',
    state: 'OH',
    zip_code: '44113',
    property_type: 'duplex',
    bedrooms: 4,
    bathrooms: 2,
    square_feet: 2200,
    year_built: 1960,
    asking_price: 145000,
    estimated_arv: 210000,
    estimated_monthly_rent: 2400,
    estimated_rehab_low: 30000,
    estimated_rehab_high: 50000,
    taxes_annual: 3200,
    insurance_annual: 1400,
    hoa_monthly: 0,
    vacancy_percent: 8,
    repairs_percent: 5,
    capex_percent: 5,
    property_management_percent: 10,
    closing_cost_buy_percent: 3,
    closing_cost_sell_percent: 6,
    holding_months: 4,
    down_payment_percent: 25,
    interest_rate: 7.25,
    loan_term_years: 30,
    notes: 'Duplex with strong rental demand',
  },
  {
    address: '890 Palm Drive',
    city: 'Tampa',
    state: 'FL',
    zip_code: '33609',
    property_type: 'single_family',
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2000,
    year_built: 2002,
    asking_price: 420000,
    estimated_arv: 490000,
    estimated_monthly_rent: 2800,
    estimated_rehab_low: 10000,
    estimated_rehab_high: 20000,
    taxes_annual: 7500,
    insurance_annual: 3200,
    hoa_monthly: 150,
    vacancy_percent: 8,
    repairs_percent: 5,
    capex_percent: 5,
    property_management_percent: 10,
    closing_cost_buy_percent: 3,
    closing_cost_sell_percent: 6,
    holding_months: 5,
    down_payment_percent: 20,
    interest_rate: 6.75,
    loan_term_years: 30,
    notes: 'Move-in ready, minimal rehab needed',
  },
];

/**
 * DealCheck AI — Deterministic Financial Calculations
 *
 * All core math is rules-based. AI is only used for narrative summaries.
 * Formulas are documented inline so they are easy to audit and revise.
 */

import {
  PropertyInput,
  RentalAnalysis,
  FlipAnalysis,
  DealScores,
  DealAnalysisResult,
} from '@/types/dealcheck';

export type { DealAnalysisResult };

// ── Helpers ──────────────────────────────────────────────────────────

/** Monthly mortgage payment using standard amortization formula */
export const calculateMortgagePayment = (
  principal: number,
  annualRate: number,
  termYears: number
): number => {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);
  const r = annualRate / 100 / 12; // monthly rate
  const n = termYears * 12;        // total payments
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

// ── Rental Analysis ──────────────────────────────────────────────────

export const calculateRentalAnalysis = (p: PropertyInput): RentalAnalysis => {
  const monthlyGrossRent = p.estimated_monthly_rent;

  // Operating expenses (monthly)
  const monthlyTaxes = p.taxes_annual / 12;
  const monthlyInsurance = p.insurance_annual / 12;
  const monthlyHOA = p.hoa_monthly;
  const monthlyVacancy = monthlyGrossRent * (p.vacancy_percent / 100);
  const monthlyRepairs = monthlyGrossRent * (p.repairs_percent / 100);
  const monthlyCapex = monthlyGrossRent * (p.capex_percent / 100);
  const monthlyManagement = monthlyGrossRent * (p.property_management_percent / 100);

  const monthlyOperatingExpenses =
    monthlyTaxes +
    monthlyInsurance +
    monthlyHOA +
    monthlyVacancy +
    monthlyRepairs +
    monthlyCapex +
    monthlyManagement;

  // NOI = Annual rent − Annual operating expenses (excludes debt service)
  const noi = monthlyGrossRent * 12 - monthlyOperatingExpenses * 12;

  // Acquisition cost for cap rate denominator
  const closingCostsBuy = p.asking_price * (p.closing_cost_buy_percent / 100);
  const rehabMid = (p.estimated_rehab_low + p.estimated_rehab_high) / 2;
  const totalAcquisitionCost = p.asking_price + closingCostsBuy + rehabMid;

  // Cap rate = NOI / Total acquisition cost
  const capRate = totalAcquisitionCost > 0 ? (noi / totalAcquisitionCost) * 100 : 0;

  // Mortgage
  const downPayment = p.asking_price * (p.down_payment_percent / 100);
  const loanAmount = p.asking_price - downPayment;
  const monthlyMortgage = calculateMortgagePayment(
    loanAmount,
    p.interest_rate,
    p.loan_term_years
  );

  // Cash flow
  const monthlyCashFlow = monthlyGrossRent - monthlyOperatingExpenses - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  // Total cash needed = down payment + closing costs + rehab (mid)
  const totalCashNeeded = downPayment + closingCostsBuy + rehabMid;

  // Cash on cash return = Annual cash flow / Total cash invested
  const cashOnCashReturn =
    totalCashNeeded > 0 ? (annualCashFlow / totalCashNeeded) * 100 : 0;

  return {
    monthlyGrossRent,
    monthlyTaxes,
    monthlyInsurance,
    monthlyHOA,
    monthlyVacancy,
    monthlyRepairs,
    monthlyCapex,
    monthlyManagement,
    monthlyOperatingExpenses,
    noi,
    capRate,
    loanAmount,
    monthlyMortgage,
    monthlyCashFlow,
    annualCashFlow,
    totalCashNeeded,
    cashOnCashReturn,
  };
};

// ── Flip Analysis ────────────────────────────────────────────────────

export const calculateFlipAnalysis = (
  p: PropertyInput,
  maoMultiplier = 0.7
): FlipAnalysis => {
  const closingCostsBuy = p.asking_price * (p.closing_cost_buy_percent / 100);

  // Total acquisition = purchase + buy closing + rehab
  const totalAcquisitionCostLow = p.asking_price + closingCostsBuy + p.estimated_rehab_low;
  const totalAcquisitionCostHigh = p.asking_price + closingCostsBuy + p.estimated_rehab_high;

  // Selling costs based on ARV
  const sellingCosts = p.estimated_arv * (p.closing_cost_sell_percent / 100);

  // Holding costs — simplified: monthly mortgage * holding months + taxes + insurance
  const downPayment = p.asking_price * (p.down_payment_percent / 100);
  const loanAmount = p.asking_price - downPayment;
  const monthlyMortgage = calculateMortgagePayment(
    loanAmount,
    p.interest_rate,
    p.loan_term_years
  );
  const holdingCosts =
    (monthlyMortgage + p.taxes_annual / 12 + p.insurance_annual / 12 + p.hoa_monthly) *
    p.holding_months;

  // Flip profit = ARV − selling costs − acquisition − holding
  const flipProfitLow = p.estimated_arv - sellingCosts - totalAcquisitionCostHigh - holdingCosts;
  const flipProfitHigh = p.estimated_arv - sellingCosts - totalAcquisitionCostLow - holdingCosts;

  // Margin %
  const flipMarginLow = p.estimated_arv > 0 ? (flipProfitLow / p.estimated_arv) * 100 : 0;
  const flipMarginHigh = p.estimated_arv > 0 ? (flipProfitHigh / p.estimated_arv) * 100 : 0;

  // MAO = (ARV × multiplier) − rehab (using mid-range)
  const rehabMid = (p.estimated_rehab_low + p.estimated_rehab_high) / 2;
  const mao = p.estimated_arv * maoMultiplier - rehabMid;

  return {
    totalAcquisitionCostLow,
    totalAcquisitionCostHigh,
    sellingCosts,
    holdingCosts,
    flipProfitLow,
    flipProfitHigh,
    flipMarginLow,
    flipMarginHigh,
    mao,
  };
};

// ── Scoring ──────────────────────────────────────────────────────────

/**
 * Buy & Hold Score (0-100)
 * Weighted factors:
 *   - Cash flow positivity     30%
 *   - Cash on cash return      25%
 *   - Cap rate                 20%
 *   - Total cash needed (inv)  15%
 *   - Vacancy sensitivity      10%
 */
export const calculateBuyHoldScore = (rental: RentalAnalysis): number => {
  // Cash flow: $0 = 0pts, $500+/mo = 100pts
  const cfScore = clamp((rental.monthlyCashFlow / 500) * 100, 0, 100);

  // CoC return: 0% = 0pts, 12%+ = 100pts
  const cocScore = clamp((rental.cashOnCashReturn / 12) * 100, 0, 100);

  // Cap rate: 0% = 0pts, 10%+ = 100pts
  const capScore = clamp((rental.capRate / 10) * 100, 0, 100);

  // Cash needed: $200k+ = 0pts, $0 = 100pts (inverse)
  const cashScore = clamp((1 - rental.totalCashNeeded / 200000) * 100, 0, 100);

  // Vacancy sensitivity: high gross rent vs expenses = more resilient
  const expRatio =
    rental.monthlyGrossRent > 0
      ? rental.monthlyOperatingExpenses / rental.monthlyGrossRent
      : 1;
  const vacScore = clamp((1 - expRatio) * 150, 0, 100);

  return Math.round(
    cfScore * 0.3 + cocScore * 0.25 + capScore * 0.2 + cashScore * 0.15 + vacScore * 0.1
  );
};

/**
 * Flip Score (0-100)
 * Weighted factors:
 *   - Projected profit (mid)   30%
 *   - Margin %                 25%
 *   - Rehab burden             15%
 *   - Holding timeline         15%
 *   - Spread: ask vs MAO       15%
 */
export const calculateFlipScore = (
  flip: FlipAnalysis,
  p: PropertyInput
): number => {
  const midProfit = (flip.flipProfitLow + flip.flipProfitHigh) / 2;
  const midMargin = (flip.flipMarginLow + flip.flipMarginHigh) / 2;

  // Profit: $0 = 0pts, $75k+ = 100pts
  const profitScore = clamp((midProfit / 75000) * 100, 0, 100);

  // Margin: 0% = 0pts, 20%+ = 100pts
  const marginScore = clamp((midMargin / 20) * 100, 0, 100);

  // Rehab burden: rehab/ARV ratio — lower is better
  const rehabMid = (p.estimated_rehab_low + p.estimated_rehab_high) / 2;
  const rehabRatio = p.estimated_arv > 0 ? rehabMid / p.estimated_arv : 1;
  const rehabScore = clamp((1 - rehabRatio * 3) * 100, 0, 100);

  // Holding: 1-3 months = 100, 12+ = 0
  const holdScore = clamp((1 - (p.holding_months - 1) / 11) * 100, 0, 100);

  // Spread: how far ask is below MAO (positive = good)
  const spread = flip.mao - p.asking_price;
  const spreadScore = clamp((spread / p.asking_price) * 500 + 50, 0, 100);

  return Math.round(
    profitScore * 0.3 +
      marginScore * 0.25 +
      rehabScore * 0.15 +
      holdScore * 0.15 +
      spreadScore * 0.15
  );
};

export const calculateDealScores = (
  rental: RentalAnalysis,
  flip: FlipAnalysis,
  p: PropertyInput
): DealScores => {
  const buyHoldScore = calculateBuyHoldScore(rental);
  const flipScore = calculateFlipScore(flip, p);

  // Overall: weighted blend favouring the stronger strategy
  const maxScore = Math.max(buyHoldScore, flipScore);
  const minScore = Math.min(buyHoldScore, flipScore);
  const overallScore = Math.round(maxScore * 0.7 + minScore * 0.3);

  let recommendedStrategy: DealScores['recommendedStrategy'];
  if (overallScore < 50) {
    recommendedStrategy = 'Pass';
  } else if (buyHoldScore >= flipScore + 10 && rental.cashOnCashReturn > 4) {
    // If buy-hold is strong AND there's good CoC + decent equity, BRRRR
    if (flip.mao > p.asking_price) {
      recommendedStrategy = 'BRRRR';
    } else {
      recommendedStrategy = 'Rental';
    }
  } else if (flipScore > buyHoldScore) {
    recommendedStrategy = 'Flip';
  } else {
    recommendedStrategy = 'Rental';
  }

  return { buyHoldScore, flipScore, overallScore, recommendedStrategy };
};

// ── Full Analysis ────────────────────────────────────────────────────

export const analyzeDeal = (
  p: PropertyInput,
  maoMultiplier = 0.7
): DealAnalysisResult => {
  const rental = calculateRentalAnalysis(p);
  const flip = calculateFlipAnalysis(p, maoMultiplier);
  const scores = calculateDealScores(rental, flip, p);
  return { rental, flip, scores };
};

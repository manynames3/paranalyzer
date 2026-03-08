import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, TrendingUp, DollarSign, Calculator, Shield } from 'lucide-react';
import { PropertyInput, PRESETS, getScoreLabel, getScoreColor } from '@/types/dealcheck';
import { analyzeDeal } from '@/utils/dealCalculations';
import { fmtCurrency, fmtPercent } from '@/utils/formatters';

const defaultQuick = {
  asking_price: 0,
  estimated_arv: 0,
  estimated_monthly_rent: 0,
  estimated_rehab_low: 0,
  estimated_rehab_high: 0,
  taxes_annual: 0,
  insurance_annual: 0,
};

const QuickAnalyzer = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState(defaultQuick);
  const [showResults, setShowResults] = useState(false);

  const update = (key: keyof typeof defaultQuick, value: string) => {
    const n = value === '' ? 0 : parseFloat(value);
    if (!isNaN(n)) {
      setFields((prev) => ({ ...prev, [key]: n }));
      setShowResults(false);
    }
  };

  const hasInput = fields.asking_price > 0 && fields.estimated_arv > 0 && fields.estimated_monthly_rent > 0;

  const buildFullProperty = (): PropertyInput => ({
    address: 'Quick Analysis',
    city: '',
    state: '',
    zip_code: '',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1500,
    ...fields,
    hoa_monthly: 0,
    ...PRESETS.standard,
    holding_months: 6,
    down_payment_percent: 20,
    interest_rate: 7.0,
    loan_term_years: 30,
  });

  const result = hasInput && showResults ? analyzeDeal(buildFullProperty()) : null;

  const handleAnalyze = () => {
    if (!hasInput) return;
    setShowResults(true);
  };

  const handleFullAnalysis = () => {
    const prop = buildFullProperty();
    sessionStorage.setItem('dealcheck_property', JSON.stringify(prop));
    navigate('/deal-results');
  };

  const inputField = (label: string, key: keyof typeof defaultQuick, prefix?: string) => (
    <div>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative mt-1">
        {prefix && (
          <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">{prefix}</span>
        )}
        <Input
          type="number"
          value={fields[key] === 0 ? '' : fields[key]}
          onChange={(e) => update(key, e.target.value)}
          placeholder="0"
          className={prefix ? 'pl-7' : ''}
        />
      </div>
    </div>
  );

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 border border-border/50 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Quick Deal Calculator</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {inputField('Asking Price', 'asking_price', '$')}
        {inputField('After Repair Value', 'estimated_arv', '$')}
        {inputField('Monthly Rent', 'estimated_monthly_rent', '$')}
        {inputField('Rehab (Low)', 'estimated_rehab_low', '$')}
        {inputField('Rehab (High)', 'estimated_rehab_high', '$')}
        {inputField('Annual Taxes', 'taxes_annual', '$')}
        {inputField('Annual Insurance', 'insurance_annual', '$')}
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!hasInput}
        className="w-full gap-2 mb-4"
        size="lg"
      >
        <Calculator className="w-4 h-4" /> Quick Analyze
      </Button>

      {result && (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Monthly Cash Flow', value: fmtCurrency(result.rental.monthlyCashFlow), icon: DollarSign },
              { label: 'Cap Rate', value: fmtPercent(result.rental.capRate), icon: TrendingUp },
              { label: 'Cash on Cash', value: fmtPercent(result.rental.cashOnCashReturn), icon: Calculator },
              { label: 'Overall Score', value: `${result.scores.overallScore}/100`, icon: Shield },
            ].map((m) => (
              <div key={m.label} className="rounded-xl p-4 border border-border/50 bg-muted/30 text-center">
                <m.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                <p className="text-lg font-bold">{m.value}</p>
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30">
            <div>
              <span className="text-sm text-muted-foreground">Strategy: </span>
              <span className="font-semibold">{result.scores.recommendedStrategy}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className={`font-semibold ${getScoreColor(result.scores.overallScore)}`}>
                {getScoreLabel(result.scores.overallScore)}
              </span>
            </div>
            <Button onClick={handleFullAnalysis} size="sm" className="gap-1">
              Full Analysis <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Uses standard assumptions (8% vacancy, 5% repairs, 5% capex, 10% mgmt, 20% down, 7% rate, 30yr).
            Click "Full Analysis" for detailed breakdown with editable assumptions.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickAnalyzer;

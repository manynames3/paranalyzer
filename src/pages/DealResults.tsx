import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  ArrowLeft,
  Home,
  DollarSign,
  TrendingUp,
  Calculator,
  Shield,
  Target,
  Clock,
  Save,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { PropertyInput, getScoreLabel, getScoreColor, getScoreBgColor } from '@/types/dealcheck';
import { analyzeDeal, DealAnalysisResult } from '@/utils/dealCalculations';
import { fmtCurrency, fmtPercent } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DealResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<PropertyInput | null>(null);
  const [result, setResult] = useState<DealAnalysisResult | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sensitivity overrides
  const [sensRent, setSensRent] = useState(0);
  const [sensRehab, setSensRehab] = useState(0);
  const [sensRate, setSensRate] = useState(0);
  const [sensArv, setSensArv] = useState(0);
  const [sensVacancy, setSensVacancy] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem('dealcheck_property');
    if (!raw) {
      navigate('/analyze');
      return;
    }
    const p: PropertyInput = JSON.parse(raw);
    setProperty(p);
    setResult(analyzeDeal(p));
    fetchAiSummary(p);
  }, []);

  // Recalculate with sensitivity
  useEffect(() => {
    if (!property) return;
    const adjusted: PropertyInput = {
      ...property,
      estimated_monthly_rent: property.estimated_monthly_rent * (1 + sensRent / 100),
      estimated_rehab_low: property.estimated_rehab_low * (1 + sensRehab / 100),
      estimated_rehab_high: property.estimated_rehab_high * (1 + sensRehab / 100),
      interest_rate: property.interest_rate + sensRate,
      estimated_arv: property.estimated_arv * (1 + sensArv / 100),
      vacancy_percent: property.vacancy_percent + sensVacancy,
    };
    setResult(analyzeDeal(adjusted));
  }, [sensRent, sensRehab, sensRate, sensArv, sensVacancy, property]);

  const fetchAiSummary = async (p: PropertyInput) => {
    setAiLoading(true);
    try {
      const analysis = analyzeDeal(p);
      const { data, error } = await supabase.functions.invoke('deal-ai-summary', {
        body: {
          property: p,
          rental: analysis.rental,
          flip: analysis.flip,
          scores: analysis.scores,
        },
      });
      if (error) throw error;
      setAiSummary(data.summary || 'Summary unavailable.');
    } catch {
      setAiSummary('AI summary is currently unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !property || !result) {
      toast({ title: 'Sign in required', description: 'Please sign in to save deals.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: propData, error: propErr } = await supabase
        .from('properties')
        .insert({ ...property, user_id: user.id } as any)
        .select('id')
        .single();
      if (propErr) throw propErr;

      const { data: analysisData, error: analysisErr } = await supabase
        .from('deal_analyses')
        .insert({
          property_id: propData.id,
          user_id: user.id,
          purchase_price: property.asking_price,
          down_payment_percent: property.down_payment_percent,
          interest_rate: property.interest_rate,
          loan_term_years: property.loan_term_years,
          monthly_payment: result.rental.monthlyMortgage,
          monthly_cash_flow: result.rental.monthlyCashFlow,
          annual_cash_flow: result.rental.annualCashFlow,
          cap_rate: result.rental.capRate,
          cash_on_cash_return: result.rental.cashOnCashReturn,
          total_cash_needed: result.rental.totalCashNeeded,
          rehab_total_low: property.estimated_rehab_low,
          rehab_total_high: property.estimated_rehab_high,
          flip_profit_low: result.flip.flipProfitLow,
          flip_profit_high: result.flip.flipProfitHigh,
          mao: result.flip.mao,
          buy_hold_score: result.scores.buyHoldScore,
          flip_score: result.scores.flipScore,
          overall_score: result.scores.overallScore,
          ai_summary: aiSummary || null,
        } as any)
        .select('id')
        .single();
      if (analysisErr) throw analysisErr;

      await supabase.from('saved_deals').insert({
        user_id: user.id,
        property_id: propData.id,
        analysis_id: analysisData.id,
        label: `${property.address}, ${property.city}`,
      } as any);

      toast({ title: 'Deal saved!', description: 'View it in your dashboard.' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!property || !result) return null;

  const { rental, flip, scores } = result;
  const strategyColors: Record<string, string> = {
    Rental: 'bg-primary/15 text-primary border-primary/30',
    Flip: 'bg-warning/15 text-warning border-warning/30',
    BRRRR: 'bg-success/15 text-success border-success/30',
    Pass: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />

      <header className="relative border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dealcheck" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold">DealCheck AI</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/analyze')} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Edit Deal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Deal'}
            </Button>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-8 max-w-6xl">
        {/* Property Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{property.address}</h1>
            <p className="text-muted-foreground">{property.city}, {property.state} {property.zip_code}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border text-lg font-bold ${getScoreBgColor(scores.overallScore)} ${getScoreColor(scores.overallScore)}`}>
              {scores.overallScore}/100
              <span className="text-xs ml-1 font-medium">{getScoreLabel(scores.overallScore)}</span>
            </div>
            <div className={`px-3 py-2 rounded-lg border text-sm font-semibold ${strategyColors[scores.recommendedStrategy]}`}>
              {scores.recommendedStrategy}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Asking Price', value: fmtCurrency(property.asking_price), icon: Home },
            { label: 'ARV', value: fmtCurrency(property.estimated_arv), icon: TrendingUp },
            { label: 'MAO', value: fmtCurrency(flip.mao), icon: Target },
            { label: 'Monthly Cash Flow', value: fmtCurrency(rental.monthlyCashFlow), icon: DollarSign, color: rental.monthlyCashFlow >= 0 ? 'text-success' : 'text-destructive' },
            { label: 'Cap Rate', value: fmtPercent(rental.capRate), icon: Calculator },
            { label: 'Cash on Cash', value: fmtPercent(rental.cashOnCashReturn), icon: Shield },
            { label: 'Rehab Range', value: `${fmtCurrency(property.estimated_rehab_low)} – ${fmtCurrency(property.estimated_rehab_high)}`, icon: Clock },
            { label: 'Est. Flip Profit', value: `${fmtCurrency(flip.flipProfitLow)} – ${fmtCurrency(flip.flipProfitHigh)}`, icon: TrendingUp, color: flip.flipProfitHigh >= 0 ? 'text-success' : 'text-destructive' },
          ].map((m) => (
            <div key={m.label} className="glass-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className={`text-lg font-bold ${m.color || ''}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="w-full flex">
            <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
            <TabsTrigger value="rental" className="flex-1">Rental</TabsTrigger>
            <TabsTrigger value="flip" className="flex-1">Flip</TabsTrigger>
            <TabsTrigger value="sensitivity" className="flex-1">Sensitivity</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="glass-card rounded-xl p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">AI Deal Summary</h2>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating analysis...</span>
                </div>
              ) : (
                <p className="text-foreground leading-relaxed">{aiSummary}</p>
              )}

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { label: 'Buy & Hold', score: scores.buyHoldScore },
                  { label: 'Flip', score: scores.flipScore },
                  { label: 'Overall', score: scores.overallScore },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <div className={`text-3xl font-bold ${getScoreColor(s.score)}`}>{s.score}</div>
                    <p className={`text-xs ${getScoreColor(s.score)}`}>{getScoreLabel(s.score)}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rental">
            <div className="glass-card rounded-xl p-6 border border-border/50 space-y-4">
              <h2 className="text-lg font-semibold">Rental Analysis</h2>
              <div className="grid gap-3">
                <Row label="Monthly Gross Rent" value={fmtCurrency(rental.monthlyGrossRent)} />
                <div className="border-t border-border/30 pt-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Monthly Operating Expenses</p>
                  <Row label="Taxes" value={`-${fmtCurrency(rental.monthlyTaxes)}`} sub />
                  <Row label="Insurance" value={`-${fmtCurrency(rental.monthlyInsurance)}`} sub />
                  <Row label="HOA" value={`-${fmtCurrency(rental.monthlyHOA)}`} sub />
                  <Row label="Vacancy" value={`-${fmtCurrency(rental.monthlyVacancy)}`} sub />
                  <Row label="Repairs" value={`-${fmtCurrency(rental.monthlyRepairs)}`} sub />
                  <Row label="CapEx" value={`-${fmtCurrency(rental.monthlyCapex)}`} sub />
                  <Row label="Management" value={`-${fmtCurrency(rental.monthlyManagement)}`} sub />
                  <Row label="Total OpEx" value={`-${fmtCurrency(rental.monthlyOperatingExpenses)}`} bold />
                </div>
                <div className="border-t border-border/30 pt-2">
                  <Row label="Net Operating Income (Annual)" value={fmtCurrency(rental.noi)} bold />
                  <Row label="Cap Rate" value={fmtPercent(rental.capRate)} />
                </div>
                <div className="border-t border-border/30 pt-2">
                  <Row label="Loan Amount" value={fmtCurrency(rental.loanAmount)} />
                  <Row label="Monthly Mortgage" value={`-${fmtCurrency(rental.monthlyMortgage)}`} />
                </div>
                <div className="border-t border-border/30 pt-2">
                  <Row label="Monthly Cash Flow" value={fmtCurrency(rental.monthlyCashFlow)} bold color={rental.monthlyCashFlow >= 0} />
                  <Row label="Annual Cash Flow" value={fmtCurrency(rental.annualCashFlow)} color={rental.annualCashFlow >= 0} />
                  <Row label="Total Cash Needed" value={fmtCurrency(rental.totalCashNeeded)} />
                  <Row label="Cash on Cash Return" value={fmtPercent(rental.cashOnCashReturn)} bold />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="flip">
            <div className="glass-card rounded-xl p-6 border border-border/50 space-y-4">
              <h2 className="text-lg font-semibold">Flip Analysis</h2>
              <div className="grid gap-3">
                <Row label="ARV" value={fmtCurrency(property.estimated_arv)} />
                <div className="border-t border-border/30 pt-2">
                  <Row label="Acquisition Cost (Low Rehab)" value={fmtCurrency(flip.totalAcquisitionCostLow)} />
                  <Row label="Acquisition Cost (High Rehab)" value={fmtCurrency(flip.totalAcquisitionCostHigh)} />
                </div>
                <Row label="Selling Costs" value={`-${fmtCurrency(flip.sellingCosts)}`} />
                <Row label="Holding Costs" value={`-${fmtCurrency(flip.holdingCosts)}`} />
                <div className="border-t border-border/30 pt-2">
                  <Row label="Flip Profit (Best Case)" value={fmtCurrency(flip.flipProfitHigh)} bold color={flip.flipProfitHigh >= 0} />
                  <Row label="Flip Profit (Worst Case)" value={fmtCurrency(flip.flipProfitLow)} color={flip.flipProfitLow >= 0} />
                  <Row label="Flip Margin" value={`${fmtPercent(flip.flipMarginLow)} – ${fmtPercent(flip.flipMarginHigh)}`} />
                </div>
                <div className="border-t border-border/30 pt-2">
                  <Row label="Maximum Allowable Offer (MAO)" value={fmtCurrency(flip.mao)} bold />
                  <Row label="Ask vs MAO Spread" value={fmtCurrency(flip.mao - property.asking_price)} color={flip.mao >= property.asking_price} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sensitivity">
            <div className="glass-card rounded-xl p-6 border border-border/50 space-y-6">
              <h2 className="text-lg font-semibold">Sensitivity Analysis</h2>
              <p className="text-sm text-muted-foreground">Drag sliders to see how changes affect the deal metrics above.</p>
              <SensSlider label="Monthly Rent" value={sensRent} onChange={setSensRent} unit="%" min={-30} max={30} />
              <SensSlider label="Rehab Cost" value={sensRehab} onChange={setSensRehab} unit="%" min={-50} max={100} />
              <SensSlider label="Interest Rate" value={sensRate} onChange={setSensRate} unit="pp" min={-3} max={3} step={0.25} />
              <SensSlider label="ARV" value={sensArv} onChange={setSensArv} unit="%" min={-20} max={20} />
              <SensSlider label="Vacancy" value={sensVacancy} onChange={setSensVacancy} unit="pp" min={-5} max={15} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSensRent(0); setSensRehab(0); setSensRate(0); setSensArv(0); setSensVacancy(0); }}
              >
                Reset All
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Row = ({ label, value, bold, sub, color }: { label: string; value: string; bold?: boolean; sub?: boolean; color?: boolean }) => (
  <div className={`flex justify-between items-center ${sub ? 'pl-4' : ''}`}>
    <span className={`text-sm ${bold ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
    <span className={`text-sm font-mono ${bold ? 'font-bold' : ''} ${color !== undefined ? (color ? 'text-success' : 'text-destructive') : ''}`}>
      {value}
    </span>
  </div>
);

const SensSlider = ({
  label, value, onChange, unit, min, max, step = 1,
}: {
  label: string; value: number; onChange: (v: number) => void; unit: string; min: number; max: number; step?: number;
}) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : ''}`}>
        {value > 0 ? '+' : ''}{value}{unit}
      </span>
    </div>
    <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step} />
  </div>
);

export default DealResults;

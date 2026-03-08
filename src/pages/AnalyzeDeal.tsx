import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PropertyInput,
  PROPERTY_TYPES,
  PRESETS,
  SAMPLE_DEALS,
} from '@/types/dealcheck';

const defaultProperty: PropertyInput = {
  address: '',
  city: '',
  state: '',
  zip_code: '',
  property_type: 'single_family',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1500,
  year_built: undefined as any,
  asking_price: 0,
  estimated_arv: 0,
  estimated_monthly_rent: 0,
  estimated_rehab_low: 0,
  estimated_rehab_high: 0,
  taxes_annual: 0,
  insurance_annual: 0,
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
  notes: '',
};

const AnalyzeDeal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<PropertyInput>(defaultProperty);
  const [preset, setPreset] = useState('standard');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const sampleIdx = searchParams.get('sample');
    if (sampleIdx !== null) {
      const idx = parseInt(sampleIdx);
      if (SAMPLE_DEALS[idx]) setForm(SAMPLE_DEALS[idx]);
    }
  }, [searchParams]);

  const update = (field: keyof PropertyInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const numField = (field: keyof PropertyInput, value: string) => {
    const n = value === '' ? 0 : parseFloat(value);
    if (!isNaN(n)) update(field, n);
  };

  const applyPreset = (name: string) => {
    setPreset(name);
    const p = PRESETS[name];
    if (p) {
      setForm((prev) => ({ ...prev, ...p }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.address.trim()) errs.address = 'Required';
    if (!form.city.trim()) errs.city = 'Required';
    if (!form.state.trim()) errs.state = 'Required';
    if (form.asking_price <= 0) errs.asking_price = 'Must be > 0';
    if (form.estimated_arv <= 0) errs.estimated_arv = 'Must be > 0';
    if (form.estimated_monthly_rent <= 0) errs.estimated_monthly_rent = 'Must be > 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Store form data in sessionStorage and navigate to results
    sessionStorage.setItem('dealcheck_property', JSON.stringify(form));
    navigate('/deal-results');
  };

  const loadSample = (idx: number) => {
    setForm(SAMPLE_DEALS[idx]);
  };

  const Field = ({
    label,
    field,
    type = 'text',
    prefix,
    suffix,
    placeholder,
    className,
  }: {
    label: string;
    field: keyof PropertyInput;
    type?: string;
    prefix?: string;
    suffix?: string;
    placeholder?: string;
    className?: string;
  }) => (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative mt-1">
        {prefix && (
          <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">{prefix}</span>
        )}
        <Input
          type={type}
          value={form[field] === 0 && type === 'number' ? '' : form[field]}
          onChange={(e) =>
            type === 'number' ? numField(field, e.target.value) : update(field, e.target.value)
          }
          placeholder={placeholder}
          className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''} ${errors[field] ? 'border-destructive' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
      {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dealcheck" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold">DealCheck AI</span>
          </Link>
          <Link to="/dealcheck">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Analyze a Deal</h1>
        <p className="text-muted-foreground mb-6">Enter property details below to get instant analysis.</p>

        {/* Sample deals */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-muted-foreground mr-2 self-center">Try a sample:</span>
          {SAMPLE_DEALS.map((s, i) => (
            <Button key={i} variant="outline" size="sm" onClick={() => loadSample(i)}>
              {s.address}, {s.city}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Info */}
          <section className="glass-card rounded-xl p-6 border border-border/50">
            <h2 className="text-lg font-semibold mb-4">Property Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Address" field="address" placeholder="123 Main St" className="sm:col-span-2" />
              <Field label="City" field="city" placeholder="Austin" />
              <div className="grid grid-cols-2 gap-2">
                <Field label="State" field="state" placeholder="TX" />
                <Field label="ZIP" field="zip_code" placeholder="78745" />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Property Type</Label>
                <Select value={form.property_type} onValueChange={(v) => update('property_type', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Bedrooms" field="bedrooms" type="number" />
              <Field label="Bathrooms" field="bathrooms" type="number" />
              <Field label="Square Feet" field="square_feet" type="number" />
              <Field label="Year Built" field="year_built" type="number" placeholder="1990" />
            </div>
          </section>

          {/* Financials */}
          <section className="glass-card rounded-xl p-6 border border-border/50">
            <h2 className="text-lg font-semibold mb-4">Financial Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Asking Price" field="asking_price" type="number" prefix="$" />
              <Field label="After Repair Value (ARV)" field="estimated_arv" type="number" prefix="$" />
              <Field label="Monthly Market Rent" field="estimated_monthly_rent" type="number" prefix="$" />
              <Field label="Rehab Estimate (Low)" field="estimated_rehab_low" type="number" prefix="$" />
              <Field label="Rehab Estimate (High)" field="estimated_rehab_high" type="number" prefix="$" />
              <Field label="Annual Taxes" field="taxes_annual" type="number" prefix="$" />
              <Field label="Annual Insurance" field="insurance_annual" type="number" prefix="$" />
              <Field label="Monthly HOA" field="hoa_monthly" type="number" prefix="$" />
            </div>
          </section>

          {/* Assumptions */}
          <section className="glass-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Assumptions</h2>
              <div className="flex gap-2">
                {Object.keys(PRESETS).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={preset === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyPreset(p)}
                    className="capitalize"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Vacancy" field="vacancy_percent" type="number" suffix="%" />
              <Field label="Repairs" field="repairs_percent" type="number" suffix="%" />
              <Field label="CapEx" field="capex_percent" type="number" suffix="%" />
              <Field label="Mgmt" field="property_management_percent" type="number" suffix="%" />
              <Field label="Down Payment" field="down_payment_percent" type="number" suffix="%" />
              <Field label="Interest Rate" field="interest_rate" type="number" suffix="%" />
              <Field label="Loan Term" field="loan_term_years" type="number" suffix="yrs" />
              <Field label="Closing (Buy)" field="closing_cost_buy_percent" type="number" suffix="%" />
              <Field label="Closing (Sell)" field="closing_cost_sell_percent" type="number" suffix="%" />
              <Field label="Holding Period" field="holding_months" type="number" suffix="mo" />
            </div>
          </section>

          {/* Notes */}
          <section className="glass-card rounded-xl p-6 border border-border/50">
            <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
            <Textarea
              className="mt-1"
              value={form.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any additional notes about this deal..."
              rows={3}
            />
          </section>

          <Button type="submit" size="lg" className="w-full gap-2 text-base">
            <Zap className="w-4 h-4" />
            Analyze This Deal
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AnalyzeDeal;

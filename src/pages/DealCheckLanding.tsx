import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Home,
  DollarSign,
  Calculator,
  Shield,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { fmtCurrency, fmtPercent } from '@/utils/formatters';
import { SAMPLE_DEALS } from '@/types/dealcheck';
import { analyzeDeal } from '@/utils/dealCalculations';
import { getScoreLabel, getScoreColor } from '@/types/dealcheck';
import QuickAnalyzer from '@/components/QuickAnalyzer';

const DealCheckLanding = () => {
  const sampleResult = analyzeDeal(SAMPLE_DEALS[0]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />

      {/* Nav */}
      <header className="relative border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dealcheck" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold">DealCheck AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">PAR Analyzer</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/analyze">
              <Button size="sm">Analyze a Deal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative container mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Deal Analysis
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
          Analyze Real Estate Deals{' '}
          <span className="gradient-text">in Seconds</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Instant investment analysis for investors, wholesalers, landlords, and agents.
          No paid APIs. No scraping. Just enter a property and get a clear buy/hold or flip decision.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/analyze">
            <Button size="lg" className="gap-2 text-base px-8">
              Analyze a Deal <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/analyze?sample=0">
            <Button variant="outline" size="lg" className="gap-2 text-base px-8">
              See Example
            </Button>
          </Link>
        </div>
      </section>

      {/* Quick Analyzer */}
      <section className="relative container mx-auto px-4 pb-20">
        <QuickAnalyzer />
      </section>
      {/* Sample Metrics */}
      <section className="relative container mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Monthly Cash Flow', value: fmtCurrency(sampleResult.rental.monthlyCashFlow), icon: DollarSign },
            { label: 'Cap Rate', value: fmtPercent(sampleResult.rental.capRate), icon: TrendingUp },
            { label: 'Cash on Cash', value: fmtPercent(sampleResult.rental.cashOnCashReturn), icon: Calculator },
            { label: 'Overall Score', value: `${sampleResult.scores.overallScore}/100`, icon: Shield },
          ].map((m) => (
            <div key={m.label} className="glass-card rounded-xl p-5 border border-border/50 text-center">
              <m.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Sample analysis: {SAMPLE_DEALS[0].address}, {SAMPLE_DEALS[0].city}, {SAMPLE_DEALS[0].state}
        </p>
      </section>

      {/* Use Cases */}
      <section className="relative container mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Built for Every Strategy</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'Buy & Hold',
              desc: 'Analyze monthly cash flow, cap rate, and cash-on-cash return instantly.',
              icon: Home,
            },
            {
              title: 'Fix & Flip',
              desc: 'Get flip profit projections with low and high rehab scenarios.',
              icon: TrendingUp,
            },
            {
              title: 'BRRRR',
              desc: 'See if the deal works for buy-rehab-rent-refinance-repeat.',
              icon: Calculator,
            },
          ].map((uc) => (
            <div key={uc.title} className="glass-card rounded-xl p-6 border border-border/50">
              <uc.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{uc.title}</h3>
              <p className="text-muted-foreground text-sm">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative container mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why DealCheck AI?</h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            'Instant calculations — no waiting',
            'AI-powered plain-English summaries',
            'Transparent, auditable formulas',
            'Conservative, standard, & aggressive presets',
            'Save and compare deals',
            'Sensitivity analysis with live sliders',
            'No paid APIs required',
            'Mobile-first responsive design',
          ].map((f) => (
            <div key={f} className="flex items-center gap-3 p-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative container mx-auto px-4 pb-20 text-center">
        <div className="glass-card rounded-2xl p-10 border border-border/50 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Ready to Analyze Your Next Deal?</h2>
          <p className="text-muted-foreground mb-6">
            Enter a property and get your investment analysis in under 30 seconds.
          </p>
          <Link to="/analyze">
            <Button size="lg" className="gap-2">
              Start Free Analysis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground space-y-2">
          <p>DealCheck AI is for estimation purposes only and does not constitute financial advice.</p>
          <p>Always consult a qualified professional before making investment decisions.</p>
        </div>
      </footer>
    </div>
  );
};

export default DealCheckLanding;

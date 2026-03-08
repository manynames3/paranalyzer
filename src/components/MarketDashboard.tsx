import { MarketData } from '@/types/market';
import { MetricCard } from './MetricCard';
import { PARGauge } from './PARGauge';
import { 
  Home, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Activity,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface MarketDashboardProps {
  data: MarketData;
}

export const MarketDashboard = ({ data }: MarketDashboardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const locationTypeLabel = {
    city: 'City',
    county: 'County',
    zip: 'ZIP Code',
  };

  const isEstimated = (keyword: string) =>
    data.sources?.some(s => s.toLowerCase().includes('estimated') && s.toLowerCase().includes(keyword)) ?? false;
  const anyEstimated = data.sources?.some(s => s.toLowerCase().includes('estimated')) ?? false;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Location Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{data.location}</h2>
          <p className="text-sm text-muted-foreground">
            {locationTypeLabel[data.locationType]} Analysis • Updated just now
          </p>
        </div>
      </div>

      {/* Main PAR Gauge */}
      <PARGauge par={data.par} marketStrength={data.marketStrength} />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Listings"
          value={formatNumber(data.activeListings)}
          subtitle="Currently on market"
          icon={<Home className="w-5 h-5 text-primary" />}
          estimated={isEstimated('active')}
          delay={200}
        />
        <MetricCard
          title="Pending Listings"
          value={formatNumber(data.pendingListings)}
          subtitle="Under contract"
          icon={<Activity className="w-5 h-5 text-success" />}
          variant="success"
          estimated={isEstimated('pending')}
          delay={300}
        />
        <MetricCard
          title="Avg. Days on Market"
          value={data.averageDaysOnMarket}
          subtitle="Time to sell"
          icon={<Clock className="w-5 h-5 text-warning" />}
          variant="warning"
          delay={400}
        />
        <MetricCard
          title="Median Price"
          value={formatCurrency(data.medianPrice)}
          icon={<DollarSign className="w-5 h-5 text-primary" />}
          trend={{
            value: data.priceChange * 100,
            label: 'vs last month'
          }}
          delay={500}
        />
      </div>

      {/* Insights Section */}
      <div className="glass-card rounded-xl p-6 border border-border/50 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Market Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightItem
            label="Absorption Rate"
            value={`${(data.pendingListings / data.activeListings * 100).toFixed(1)}%`}
            description="Rate at which homes are being sold"
          />
          <InsightItem
            label="Inventory Months"
            value={`${(data.activeListings / (data.pendingListings || 1)).toFixed(1)}`}
            description="Months of inventory remaining"
          />
          <InsightItem
            label="Market Velocity"
            value={data.averageDaysOnMarket < 30 ? 'High' : data.averageDaysOnMarket < 60 ? 'Moderate' : 'Low'}
            description="Speed of market transactions"
          />
        </div>
      </div>

      {/* Data Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground/80">
          <ExternalLink className="w-3 h-3" />
          <span>Data from: {data.sources.join(', ')}</span>
        </div>
      )}
    </div>
  );
};

const InsightItem = ({ 
  label, 
  value, 
  description 
}: { 
  label: string; 
  value: string; 
  description: string;
}) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground/80">{description}</p>
  </div>
);

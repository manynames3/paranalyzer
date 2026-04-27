import { cn } from '@/lib/utils';
import { MarketStrength, getMarketStrengthLabel, getMarketStrengthDescription } from '@/types/market';

interface PARGaugeProps {
  pendingToActiveRatio: number | null;
  pendingShare: number | null;
  marketStrength: MarketStrength;
}

export const PARGauge = ({ pendingToActiveRatio, pendingShare, marketStrength }: PARGaugeProps) => {
  const percentage = Math.min((pendingShare ?? 0) * 100, 100);
  
  const strengthColors = {
    buyers: 'from-success to-success/60',
    balanced: 'from-warning to-warning/60',
    sellers: 'from-destructive to-destructive/60',
    unknown: 'from-muted-foreground/40 to-muted-foreground/20',
  };

  const strengthBgColors = {
    buyers: 'bg-success/20',
    balanced: 'bg-warning/20',
    sellers: 'bg-destructive/20',
    unknown: 'bg-muted',
  };

  const strengthTextColors = {
    buyers: 'text-success',
    balanced: 'text-warning',
    sellers: 'text-destructive',
    unknown: 'text-muted-foreground',
  };

  const ratioLabel = pendingToActiveRatio === null ? 'N/A' : `${pendingToActiveRatio.toFixed(2)}x`;
  const shareLabel = pendingShare === null ? 'Unavailable' : `${(pendingShare * 100).toFixed(1)}% of tracked listings pending`;

  return (
    <div className="glass-card rounded-xl p-8 border border-border/50 animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Pending to Active Ratio
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight gradient-text">
              {ratioLabel}
            </span>
            <span className="text-xl text-muted-foreground">P/A</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{shareLabel}</p>
        </div>
        <div className={cn(
          'px-4 py-2 rounded-full text-sm font-semibold',
          strengthBgColors[marketStrength],
          strengthTextColors[marketStrength]
        )}>
          {getMarketStrengthLabel(marketStrength)}
        </div>
      </div>

      {/* Gauge visualization */}
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden mb-4">
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out',
            strengthColors[marketStrength]
          )}
          style={{ width: `${percentage}%` }}
        />
        {/* Markers */}
        <div className="absolute left-[30%] top-0 h-full w-px bg-muted-foreground/30" />
        <div className="absolute left-[50%] top-0 h-full w-px bg-muted-foreground/30" />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-6">
        <span>0%</span>
        <span className="text-success/80">30% Buyer's</span>
        <span className="text-warning/80">50% Balanced</span>
        <span className="text-destructive/80">Seller's</span>
        <span>100%</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {getMarketStrengthDescription(marketStrength)}
      </p>
    </div>
  );
};

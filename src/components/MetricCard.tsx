import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  estimated?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
  delay?: number;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  estimated,
  variant = 'default',
  className,
  delay = 0,
}: MetricCardProps) => {
  const variantStyles = {
    default: 'border-border/50',
    primary: 'border-primary/30 bg-primary/5',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    destructive: 'border-destructive/30 bg-destructive/5',
  };

  const trendColor = trend && trend.value >= 0 ? 'text-success' : 'text-destructive';

  return (
    <div
      className={cn(
        'glass-card rounded-xl p-6 border transition-all duration-300 hover:border-primary/30 animate-fade-in',
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-secondary/50">
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {estimated && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-warning/15 text-warning border border-warning/25" title="This value is estimated based on available data">
              Est.
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
            <span>{trend.value >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground font-normal">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

import { BarChart3, TrendingUp, Home } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="w-full max-w-2xl mx-auto text-center py-16 animate-fade-in">
      <div className="relative mb-8">
        {/* Animated icons */}
        <div className="flex items-center justify-center gap-6">
          <div className="p-4 rounded-2xl bg-secondary/50 animate-float" style={{ animationDelay: '0s' }}>
            <Home className="w-8 h-8 text-primary/60" />
          </div>
          <div className="p-5 rounded-2xl bg-primary/10 glow-primary animate-float" style={{ animationDelay: '0.5s' }}>
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <div className="p-4 rounded-2xl bg-secondary/50 animate-float" style={{ animationDelay: '1s' }}>
            <TrendingUp className="w-8 h-8 text-primary/60" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-3">
        Analyze Any Real Estate Market
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        Enter a city, county, or zip code above to see the Pending to Active Ratio, 
        market strength, and key metrics for that area.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
        <FeatureItem icon="📊" label="PAR Analysis" />
        <FeatureItem icon="📈" label="Market Strength" />
        <FeatureItem icon="⏱️" label="Days on Market" />
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, label }: { icon: string; label: string }) => (
  <div className="glass-card rounded-lg p-3 border border-border/30">
    <span className="text-lg mb-1 block">{icon}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

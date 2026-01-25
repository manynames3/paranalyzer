export const LoadingState = () => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Location Header Skeleton */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-secondary animate-pulse" />
        <div className="space-y-2">
          <div className="w-48 h-6 rounded bg-secondary animate-pulse" />
          <div className="w-32 h-4 rounded bg-secondary animate-pulse" />
        </div>
      </div>

      {/* Main Gauge Skeleton */}
      <div className="glass-card rounded-xl p-8 border border-border/50">
        <div className="flex justify-between mb-6">
          <div className="space-y-2">
            <div className="w-32 h-4 rounded bg-secondary animate-pulse" />
            <div className="w-40 h-12 rounded bg-secondary animate-pulse" />
          </div>
          <div className="w-32 h-10 rounded-full bg-secondary animate-pulse" />
        </div>
        <div className="h-4 rounded-full bg-secondary animate-pulse mb-4" />
        <div className="flex justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-12 h-3 rounded bg-secondary animate-pulse" />
          ))}
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-6 border border-border/50">
            <div className="flex justify-between mb-4">
              <div className="w-24 h-4 rounded bg-secondary animate-pulse" />
              <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="w-20 h-8 rounded bg-secondary animate-pulse" />
              <div className="w-28 h-4 rounded bg-secondary animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Insights Skeleton */}
      <div className="glass-card rounded-xl p-6 border border-border/50">
        <div className="w-40 h-6 rounded bg-secondary animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="w-24 h-4 rounded bg-secondary animate-pulse" />
              <div className="w-16 h-6 rounded bg-secondary animate-pulse" />
              <div className="w-32 h-3 rounded bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

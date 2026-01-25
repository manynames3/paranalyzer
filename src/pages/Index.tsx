import { SearchBar } from '@/components/SearchBar';
import { MarketDashboard } from '@/components/MarketDashboard';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { useMarketData } from '@/hooks/useMarketData';
import { Activity } from 'lucide-react';

const Index = () => {
  const { data, isLoading, error, fetchMarketData } = useMarketData();

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
      
      <div className="relative">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PAR Analyzer</h1>
                <p className="text-xs text-muted-foreground">Real Estate Market Intelligence</p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-12 pb-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Market Analysis</span>
              <br />
              <span className="text-foreground">in Seconds</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get instant insights on any real estate market's Pending to Active Ratio, 
              market strength, and key performance metrics.
            </p>
          </div>

          <SearchBar onSearch={fetchMarketData} isLoading={isLoading} />
        </section>

        {/* Results Section */}
        <section className="container mx-auto px-4 pb-16">
          {error && (
            <div className="text-center py-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {isLoading && <LoadingState />}
          
          {!isLoading && !error && data && <MarketDashboard data={data} />}
          
          {!isLoading && !error && !data && <EmptyState />}
        </section>
      </div>
    </div>
  );
};

export default Index;

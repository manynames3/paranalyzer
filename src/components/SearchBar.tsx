import { useState } from 'react';
import { Search, MapPin, Building2, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const examples = [
    { label: 'City, State', icon: Building2, example: 'Austin, TX' },
    { label: 'County, State', icon: MapPin, example: 'Los Angeles County, CA' },
    { label: 'Zip Code', icon: Hash, example: '90210' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center glass-card rounded-xl overflow-hidden">
            <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter city, county, or zip code..."
              className="flex-1 border-0 bg-transparent text-lg py-6 px-4 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="m-2 px-6 py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Analyzing</span>
                </div>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
        <span className="text-muted-foreground/60">Try:</span>
        {examples.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setQuery(item.example);
              onSearch(item.example);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary hover:text-foreground transition-all duration-200"
            disabled={isLoading}
          >
            <item.icon className="w-3.5 h-3.5" />
            <span>{item.example}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

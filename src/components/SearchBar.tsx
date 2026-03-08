import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Building2, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

interface Suggestion {
  label: string;
  type: 'city' | 'county' | 'zip';
}

// Common US locations for suggestions
const LOCATIONS: Suggestion[] = [
  // Major cities
  { label: 'New York, NY', type: 'city' },
  { label: 'Los Angeles, CA', type: 'city' },
  { label: 'Chicago, IL', type: 'city' },
  { label: 'Houston, TX', type: 'city' },
  { label: 'Phoenix, AZ', type: 'city' },
  { label: 'Philadelphia, PA', type: 'city' },
  { label: 'San Antonio, TX', type: 'city' },
  { label: 'San Diego, CA', type: 'city' },
  { label: 'Dallas, TX', type: 'city' },
  { label: 'Austin, TX', type: 'city' },
  { label: 'San Jose, CA', type: 'city' },
  { label: 'Jacksonville, FL', type: 'city' },
  { label: 'Fort Worth, TX', type: 'city' },
  { label: 'Columbus, OH', type: 'city' },
  { label: 'Charlotte, NC', type: 'city' },
  { label: 'Indianapolis, IN', type: 'city' },
  { label: 'San Francisco, CA', type: 'city' },
  { label: 'Seattle, WA', type: 'city' },
  { label: 'Denver, CO', type: 'city' },
  { label: 'Nashville, TN', type: 'city' },
  { label: 'Oklahoma City, OK', type: 'city' },
  { label: 'Washington, DC', type: 'city' },
  { label: 'Boston, MA', type: 'city' },
  { label: 'Portland, OR', type: 'city' },
  { label: 'Las Vegas, NV', type: 'city' },
  { label: 'Memphis, TN', type: 'city' },
  { label: 'Louisville, KY', type: 'city' },
  { label: 'Baltimore, MD', type: 'city' },
  { label: 'Milwaukee, WI', type: 'city' },
  { label: 'Albuquerque, NM', type: 'city' },
  { label: 'Tucson, AZ', type: 'city' },
  { label: 'Fresno, CA', type: 'city' },
  { label: 'Sacramento, CA', type: 'city' },
  { label: 'Mesa, AZ', type: 'city' },
  { label: 'Kansas City, MO', type: 'city' },
  { label: 'Atlanta, GA', type: 'city' },
  { label: 'Omaha, NE', type: 'city' },
  { label: 'Raleigh, NC', type: 'city' },
  { label: 'Miami, FL', type: 'city' },
  { label: 'Tampa, FL', type: 'city' },
  { label: 'Orlando, FL', type: 'city' },
  { label: 'Minneapolis, MN', type: 'city' },
  { label: 'Cleveland, OH', type: 'city' },
  { label: 'Pittsburgh, PA', type: 'city' },
  { label: 'St. Louis, MO', type: 'city' },
  { label: 'Cincinnati, OH', type: 'city' },
  { label: 'Salt Lake City, UT', type: 'city' },
  { label: 'Detroit, MI', type: 'city' },
  { label: 'Richmond, VA', type: 'city' },
  { label: 'Boise, ID', type: 'city' },
  { label: 'Malden, MA', type: 'city' },
  { label: 'Suwanee, GA', type: 'city' },
  { label: 'Savannah, GA', type: 'city' },
  { label: 'Charleston, SC', type: 'city' },
  { label: 'Chattanooga, TN', type: 'city' },
  { label: 'Scottsdale, AZ', type: 'city' },
  { label: 'Honolulu, HI', type: 'city' },
  { label: 'Anchorage, AK', type: 'city' },
  // Counties
  { label: 'Los Angeles County, CA', type: 'county' },
  { label: 'Cook County, IL', type: 'county' },
  { label: 'Harris County, TX', type: 'county' },
  { label: 'Maricopa County, AZ', type: 'county' },
  { label: 'San Diego County, CA', type: 'county' },
  { label: 'Orange County, CA', type: 'county' },
  { label: 'Miami-Dade County, FL', type: 'county' },
  { label: 'Dallas County, TX', type: 'county' },
  { label: 'King County, WA', type: 'county' },
  { label: 'Clark County, NV', type: 'county' },
  { label: 'Gwinnett County, GA', type: 'county' },
  { label: 'Fulton County, GA', type: 'county' },
  { label: 'Travis County, TX', type: 'county' },
  { label: 'Middlesex County, MA', type: 'county' },
  { label: 'Broward County, FL', type: 'county' },
  // Popular zip codes
  { label: '90210', type: 'zip' },
  { label: '10001', type: 'zip' },
  { label: '60601', type: 'zip' },
  { label: '77001', type: 'zip' },
  { label: '33101', type: 'zip' },
  { label: '30301', type: 'zip' },
  { label: '02101', type: 'zip' },
  { label: '98101', type: 'zip' },
  { label: '80202', type: 'zip' },
  { label: '85001', type: 'zip' },
];

const typeIcons = {
  city: Building2,
  county: MapPin,
  zip: Hash,
};

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length >= 2
    ? LOCATIONS.filter(l =>
        l.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query);
  };

  const selectSuggestion = useCallback((label: string) => {
    setQuery(label);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch(label);
  }, [onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(filtered[selectedIndex].label);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const examples = [
    { label: 'City, State', icon: Building2, example: 'Austin, TX' },
    { label: 'County, State', icon: MapPin, example: 'Los Angeles County, CA' },
    { label: 'Zip Code', icon: Hash, example: '90210' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative" ref={wrapperRef}>
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center glass-card rounded-xl overflow-visible">
            <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Enter city, county, or zip code..."
              className="flex-1 border-0 bg-transparent text-lg py-6 px-4 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
              autoComplete="off"
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

          {/* Suggestions dropdown */}
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in">
              {filtered.map((suggestion, index) => {
                const Icon = typeIcons[suggestion.type];
                return (
                  <button
                    key={suggestion.label}
                    type="button"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors
                      ${index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-foreground'}
                    `}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(suggestion.label);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{suggestion.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">{suggestion.type}</span>
                  </button>
                );
              })}
            </div>
          )}
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

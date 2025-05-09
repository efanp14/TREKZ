import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { User, Trip } from '@shared/schema';
import { useSearchTrips, useDebounce } from '@/hooks/use-search';
import TripCard from '@/components/TripCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const locations = [
  "Paris, France",
  "Rome, Italy",
  "Tokyo, Japan",
  "New York, USA",
  "Barcelona, Spain",
  "London, UK",
  "Amsterdam, Netherlands",
  "Sydney, Australia",
  "Bangkok, Thailand",
  "Cairo, Egypt",
  "Santorini, Greece",
  "Kyoto, Japan",
  "San Francisco, USA",
  "Prague, Czech Republic",
  "Bali, Indonesia",
  "Marrakech, Morocco"
];

const BrowserPage = ({ user }: { user?: User }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views'>('date');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();

  // Focus the search input on page load
  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // Filter suggestions as the user types
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    const filtered = locations.filter(loc => 
      loc.toLowerCase().includes(normalizedQuery)
    ).slice(0, 5);
    
    setSuggestions(filtered);
  }, [searchQuery]);

  // Use the search hook to fetch results
  const { data: searchResults, isLoading } = useSearchTrips(debouncedQuery, sortBy);

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value as 'date' | 'likes' | 'views');
  };

  // Handle trip card click
  const handleTripClick = (tripId: number) => {
    setLocation(`/trip/${tripId}`);
  };

  return (
    <div className="flex-grow overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-heading font-bold mb-6 text-center">
          Browse Trips
        </h1>
        
        <div className="max-w-3xl mx-auto mb-8 relative">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8">
              <Search className="text-yellow-mid h-5 w-5" />
            </div>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search destinations, activities, or keywords..."
              className="trekz-input pl-16 pr-4 py-3 rounded-full w-full text-lg focus:ring-2 focus:ring-yellow-gold focus:outline-none transition-shadow"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-yellow-light">
                <div className="p-2">
                  <div className="flex items-center px-3 py-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Popular locations</span>
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-cream cursor-pointer rounded-lg"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isLoading ? (
                'Searching...'
              ) : searchResults?.length === 0 ? (
                'No trips found'
              ) : searchResults ? (
                `Found ${searchResults.length} trips`
              ) : null}
            </div>
            
            <Tabs defaultValue="date" value={sortBy} onValueChange={handleSortChange} className="w-auto">
              <TabsList className="bg-cream">
                <TabsTrigger value="date" className="data-[state=active]:bg-yellow-light">
                  Most Relevant
                </TabsTrigger>
                <TabsTrigger value="likes" className="data-[state=active]:bg-yellow-light">
                  Most Liked ❤️
                </TabsTrigger>
                <TabsTrigger value="views" className="data-[state=active]:bg-yellow-light">
                  Most Viewed 👁️
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {searchQuery && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-cream text-foreground px-3 py-1">
              {searchQuery}
              <button
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            </Badge>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-cream animate-pulse rounded-xl"></div>
            ))}
          </div>
        )}
        
        {/* Results grid */}
        {!isLoading && searchResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((trip) => (
              <div key={trip.id} onClick={() => handleTripClick(trip.id)} className="cursor-pointer">
                <TripCard trip={trip} showDate="range" />
              </div>
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && searchResults?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-medium mb-2">No trips found</h3>
            <p className="text-gray-500 mb-6">Try a different search term or browse popular destinations</p>
            <Button onClick={() => setSearchQuery('')} variant="outline" className="border-yellow-mid text-yellow-gold hover:bg-yellow-light/30">
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserPage;
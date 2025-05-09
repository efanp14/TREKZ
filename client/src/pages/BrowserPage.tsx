import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { User, Trip } from '@shared/schema';
import { useSearchTrips, useDebounce, type PaginationInfo } from '@/hooks/use-search';
import TripCard from '@/components/TripCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
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

const TRIPS_PER_PAGE = 20;

const BrowserPage = ({ user }: { user?: User }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus the search input on page load
  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // Reset to page 1 when search query or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, sortBy]);

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

  // Use the search hook to fetch results with pagination
  const { data: searchData, isLoading } = useSearchTrips(
    debouncedQuery, 
    sortBy, 
    currentPage, 
    TRIPS_PER_PAGE
  );

  // Extract trips and pagination info
  const trips = searchData?.trips || [];
  const pagination = searchData?.pagination || {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: TRIPS_PER_PAGE,
    hasNextPage: false,
    hasPrevPage: false
  };

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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of results when page changes
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = (pagination: PaginationInfo) => {
    const { totalPages, currentPage } = pagination;
    
    // Logic to display at most 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return (
    <div className="flex-grow overflow-auto" ref={contentRef}>
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
              ) : pagination.totalItems === 0 ? (
                'No trips found'
              ) : (
                `Found ${pagination.totalItems} trips`
              )}
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
        {!isLoading && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} onClick={() => handleTripClick(trip.id)} className="cursor-pointer">
                <TripCard trip={trip} showDate="range" />
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination controls */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="h-9 w-9 p-0 border-yellow-mid text-yellow-gold"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {pagination.totalPages <= 7 ? (
              // Show all pages if there are 7 or fewer
              Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={`h-9 w-9 p-0 ${
                    page === currentPage 
                      ? "bg-yellow-gold hover:bg-yellow-gold/90" 
                      : "border-yellow-mid text-yellow-gold hover:bg-yellow-light/30"
                  }`}
                >
                  {page}
                </Button>
              ))
            ) : (
              // Show a subset of pages with ellipsis for many pages
              <>
                {currentPage > 3 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      className="h-9 w-9 p-0 border-yellow-mid text-yellow-gold"
                    >
                      1
                    </Button>
                    <span className="text-gray-500">...</span>
                  </>
                )}
                
                {getPageNumbers(pagination).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`h-9 w-9 p-0 ${
                      page === currentPage 
                        ? "bg-yellow-gold hover:bg-yellow-gold/90" 
                        : "border-yellow-mid text-yellow-gold hover:bg-yellow-light/30"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                
                {currentPage < pagination.totalPages - 2 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      className="h-9 w-9 p-0 border-yellow-mid text-yellow-gold"
                    >
                      {pagination.totalPages}
                    </Button>
                  </>
                )}
              </>
            )}
            
            <Button 
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="h-9 w-9 p-0 border-yellow-mid text-yellow-gold"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && trips.length === 0 && (
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
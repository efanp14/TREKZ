import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import TripCard from '@/components/TripCard';
import Layout from '@/components/Layout';
import { Search, Filter, X } from 'lucide-react';
import { Trip } from '@shared/schema';
import { getTrips } from '@/lib/api';

const BrowsePage = () => {
  const [location, setLocation] = useLocation();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['/api/trips'],
    queryFn: getTrips,
  });
  
  // Filter trips based on search query and selected categories
  const filteredTrips = trips.filter((trip: Trip) => {
    const matchesSearch = searchQuery 
      ? trip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        trip.summary.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesCategories = selectedCategories.length > 0 
      ? trip.categories && trip.categories.some(category => selectedCategories.includes(category))
      : true;
      
    return matchesSearch && matchesCategories;
  });
  
  // Get all unique categories from trips
  const allCategories = Array.from(
    new Set(
      trips
        .flatMap((trip: Trip) => trip.categories || [])
        .filter(Boolean)
    )
  );

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    setLocation(`/browse?${params.toString()}`);
  };
  
  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setLocation('/browse');
  };
  
  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    // We don't want to trigger a navigation here, just update the URL
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [searchQuery]);

  return (
    <Layout user={undefined}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold mb-4">Browse Trips</h1>
          
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-mid h-5 w-5" />
              <input
                type="text"
                placeholder="Search trips by title, description, or location..."
                className="trekz-input pl-12 pr-4 py-3 rounded-full w-full focus:ring-2 focus:ring-yellow-gold focus:outline-none transition-shadow text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-yellow-gold text-foreground px-4 py-1.5 rounded-full font-heading font-medium"
              >
                Search
              </button>
            </div>
          </form>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="flex items-center mr-2">
              <Filter className="h-5 w-5 mr-1 text-yellow-gold" />
              <span className="font-heading font-medium">Categories:</span>
            </div>
            
            {allCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedCategories.includes(category)
                    ? 'bg-yellow-gold text-white'
                    : 'bg-yellow-light text-foreground hover:bg-yellow-mid'
                }`}
              >
                {category}
              </button>
            ))}
            
            {(searchQuery || selectedCategories.length > 0) && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cream text-foreground hover:bg-yellow-light transition-all"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear filters
              </button>
            )}
          </div>
          
          {/* Filter results count */}
          <p className="text-foreground/70 mb-4">
            {filteredTrips.length === 0
              ? 'No trips found'
              : `Found ${filteredTrips.length} trip${filteredTrips.length === 1 ? '' : 's'}`}
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategories.length > 0 && ` with categories: ${selectedCategories.join(', ')}`}
          </p>
        </div>
        
        {/* Trip grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="trekz-card h-64 animate-pulse bg-gray-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrips.length > 0 ? (
              filteredTrips.map((trip: Trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <img 
                  src="https://illustrations.popsy.co/amber/digital-nomad.svg" 
                  alt="No trips found" 
                  className="w-64 mb-6 opacity-80" 
                />
                <h3 className="text-xl font-heading font-medium text-center mb-2">No trips match your filters</h3>
                <p className="text-foreground/70 text-center max-w-md">
                  Try adjusting your search terms or removing some filters to see more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-yellow-gold text-foreground rounded-lg font-heading font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BrowsePage;
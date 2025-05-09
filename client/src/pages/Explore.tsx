import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import TrendingTrips from "@/components/TrendingTrips";
import FeaturedTrip from "@/components/FeaturedTrip";
import RecentlyShared from "@/components/RecentlyShared";
import { Trip, Pin } from "@shared/schema";
import { getTripById, getPinsByTripId } from "@/lib/api";

const FEATURED_TRIP_ID = 66; // Italian Coast Discovery

const Explore = () => {
  // Fetch trending trips
  const { data: trendingTrips, isLoading: trendingLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trending'],
  });

  // Fetch recent trips
  const { data: recentTrips, isLoading: recentLoading } = useQuery<Trip[]>({
    queryKey: ['/api/recent'],
  });

  // Fetch the specific featured trip (Italian Coast Discovery)
  const { data: featuredTrip, isLoading: tripLoading } = useQuery<Trip>({
    queryKey: ['/api/trips', FEATURED_TRIP_ID],
    queryFn: () => getTripById(FEATURED_TRIP_ID),
  });
  
  // Fetch pins for the featured trip
  const { data: featuredTripPins, isLoading: pinsLoading } = useQuery<Pin[]>({
    queryKey: ['/api/trips', FEATURED_TRIP_ID, 'pins'],
    queryFn: () => getPinsByTripId(FEATURED_TRIP_ID),
    enabled: !!featuredTrip,
  });

  // Loading state for featured trip section
  const isFeaturedLoading = tripLoading || pinsLoading;

  return (
    <div className="flex-grow overflow-auto">
      <HeroSection />
      
      <TrendingTrips 
        trips={trendingTrips || []} 
        isLoading={trendingLoading} 
      />
      
      {featuredTrip && (
        <FeaturedTrip 
          trip={featuredTrip} 
          pins={featuredTripPins || []} 
          isLoading={isFeaturedLoading}
        />
      )}
      
      <RecentlyShared 
        trips={recentTrips || []} 
        isLoading={recentLoading} 
      />
    </div>
  );
};

export default Explore;

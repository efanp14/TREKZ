import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import TrendingTrips from "@/components/TrendingTrips";
import FeaturedTrip from "@/components/FeaturedTrip";
import RecentlyShared from "@/components/RecentlyShared";
import { Trip, Pin } from "@shared/schema";

const Explore = () => {
  // Fetch trending trips
  const { data: trendingTrips, isLoading: trendingLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trending'],
  });

  // Fetch recent trips
  const { data: recentTrips, isLoading: recentLoading } = useQuery<Trip[]>({
    queryKey: ['/api/recent'],
  });

  // Fetch all trips to find a featured one
  const { data: trips } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
  });

  // Find a suitable featured trip that has a good description and cover image
  const featuredTrip = trips?.find(trip => 
    trip.summary && 
    trip.summary.length > 50 && 
    trip.coverImage && 
    trip.coverImage.length > 0
  );
  
  // Fetch pins for the featured trip
  const { data: featuredTripPins, isLoading: pinsLoading } = useQuery<Pin[]>({
    queryKey: ['/api/trips', featuredTrip?.id, 'pins'],
    enabled: !!featuredTrip?.id,
  });

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
          isLoading={pinsLoading}
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

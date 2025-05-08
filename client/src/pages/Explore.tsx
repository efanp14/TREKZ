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

  // Fetch featured trip (Italian Coastal Dream) and its pins
  const { data: trips } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
  });

  const featuredTrip = trips?.find(trip => trip.title === "Italian Coastal Dream");
  
  const { data: featuredTripPins } = useQuery<Pin[]>({
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

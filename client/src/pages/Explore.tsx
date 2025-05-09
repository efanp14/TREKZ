import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import TrendingTrips from "@/components/TrendingTrips";
import FeaturedTrip from "@/components/FeaturedTrip";
import RecentlyShared from "@/components/RecentlyShared";
import { Trip, Pin } from "@shared/schema";
import { getPinsByTripId } from "@/lib/api";

const Explore = () => {
  // 1) load your trending trips
  const {
    data: trendingTrips,
    isLoading: trendingLoading,
    isError: trendingError,
  } = useQuery<Trip[]>({
    queryKey: ["/api/trending"],
    queryFn: () => fetch("/api/trending").then((res) => res.json()),
  });

  // 2) load your recent trips
  const {
    data: recentTrips,
    isLoading: recentLoading,
    isError: recentError,
  } = useQuery<Trip[]>({
    queryKey: ["/api/recent"],
    queryFn: () => fetch("/api/recent").then((res) => res.json()),
  });

  // 3) pick the very first trending trip as our featured trip
  const [featuredTrip, setFeaturedTrip] = useState<Trip | null>(null);
  useEffect(() => {
    if (trendingTrips && trendingTrips.length > 0) {
      setFeaturedTrip(trendingTrips[0]);
    }
  }, [trendingTrips]);

  // 4) once we have an ID, fetch its pins
  const featuredTripId = featuredTrip?.id;
  const {
    data: featuredTripPins,
    isLoading: pinsLoading,
    isError: pinsError,
  } = useQuery<Pin[]>({
    queryKey: ["/api/trips", featuredTripId, "pins"],
    queryFn: () => getPinsByTripId(featuredTripId!),
    enabled: Boolean(featuredTripId),
  });

  // 5) use this flag to drive your loading state
  const isFeaturedLoading = !featuredTrip || pinsLoading;

  return (
    <div className="flex-grow overflow-auto">
      <HeroSection />

      <TrendingTrips trips={trendingTrips || []} isLoading={trendingLoading} />

      {/* only render FeaturedTrip once we have something to show */}
      {featuredTrip && (
        <FeaturedTrip
          trip={featuredTrip}
          pins={featuredTripPins || []}
          isLoading={isFeaturedLoading}
        />
      )}

      <RecentlyShared trips={recentTrips || []} isLoading={recentLoading} />
    </div>
  );
};

export default Explore;

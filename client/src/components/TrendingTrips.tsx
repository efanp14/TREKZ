import { Link } from "wouter";
import TripCard from "./TripCard";
import { Trip } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingTripsProps {
  trips: Trip[];
  isLoading: boolean;
}

const TrendingTrips = ({ trips, isLoading }: TrendingTripsProps) => {
  return (
    <div className="px-4 md:px-8 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-neutral-800">Trending Trips</h2>
        <Link href="/browse">
          <span className="text-yellow-gold font-medium text-sm hover:underline cursor-pointer">
            View all
          </span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? 
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-4">
                <Skeleton className="w-full h-6 mb-2" />
                <Skeleton className="w-3/4 h-4 mb-3" />
                <Skeleton className="w-full h-4" />
              </div>
            </div>
          )) : 
          // Trip cards
          trips.slice(0, 3).map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))
        }
      </div>
    </div>
  );
};

export default TrendingTrips;

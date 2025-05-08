import { useUserTrips } from "@/hooks/use-trips";
import TripCard from "@/components/TripCard";
import { Link } from "wouter";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const MyTrips = () => {
  const { data: trips, isLoading, error } = useUserTrips();

  return (
    <div className="flex-grow overflow-auto px-4 py-6 md:px-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-neutral-800">
          My Trips
        </h1>
        
        <Link href="/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Trip
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-4">
                <Skeleton className="w-full h-6 mb-2" />
                <Skeleton className="w-3/4 h-4 mb-3" />
                <Skeleton className="w-full h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-neutral-600 mb-4">
            There was an error loading your trips. Please try again.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      ) : trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <div key={trip.id} className="relative group">
              <TripCard trip={trip} />
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-neutral-100 mb-4">
              <MapPin className="h-8 w-8 text-neutral-400" />
            </div>
            <h2 className="text-xl font-medium text-neutral-800 mb-2">No trips yet</h2>
            <p className="text-neutral-600 mb-6">
              Start documenting your travel adventures!
            </p>
          </div>
          
          <Link href="/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Trip
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

// Import at the top
import { MapPin } from "lucide-react";

export default MyTrips;

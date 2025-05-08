import { Link } from "wouter";
import { Trip, Pin, User } from "@shared/schema";
import { Heart, Share2, Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import TripTimeline from "./TripTimeline";
import { MapView } from "./MapView";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeaturedTripProps {
  trip: Trip;
  pins: Pin[];
  isLoading?: boolean;
}

const FeaturedTrip = ({ trip, pins, isLoading = false }: FeaturedTripProps) => {
  const { toast } = useToast();
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Handle liking a trip
  const handleLike = async () => {
    try {
      await apiRequest('POST', `/api/trips/${trip.id}/like`);
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({
        title: "Trip liked!",
        description: "You've successfully liked this trip."
      });
    } catch (error) {
      toast({
        title: "Error liking trip",
        description: "There was a problem liking this trip. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle sharing a trip
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: trip.title,
        text: trip.summary,
        url: window.location.origin + `/trip/${trip.id}`,
      })
      .catch((error) => {
        console.log('Error sharing', error);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      const url = window.location.origin + `/trip/${trip.id}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this trip with others."
      });
    }
  };

  // Format the date range for display
  const formattedDateRange = useMemo(() => {
    try {
      return `${format(new Date(trip.startDate), "MMMM d")} - ${format(new Date(trip.endDate), "MMMM d, yyyy")}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date range unavailable";
    }
  }, [trip.startDate, trip.endDate]);

  return (
    <div className="px-4 md:px-8 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-neutral-800">Featured Trip</h2>
      </div>
      
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 h-64 md:h-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-neutral-50">
                <Loader className="h-8 w-8 text-neutral-400 animate-spin" />
              </div>
            ) : pins.length > 0 ? (
              // Use the MapView component for a proper interactive map
              <div className="h-full relative rounded-tl-xl rounded-tr-xl md:rounded-tr-none md:rounded-bl-xl overflow-hidden">
                <MapView trip={trip} pins={pins} />
              </div>
            ) : (
              // Fallback to static image if no pins
              <div 
                className="h-full bg-cover bg-center" 
                style={{ 
                  backgroundImage: `url('${trip.coverImage || "https://via.placeholder.com/800x600?text=No+Map+Data"}')`
                }}
              ></div>
            )}
          </div>
          
          <div className="md:w-1/2 p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-medium text-sm">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-800">{user.name}</div>
                    <div className="text-xs text-neutral-500">Travel Enthusiast</div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-1">
                <button 
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600"
                  onClick={handleLike}
                >
                  <Heart className="h-5 w-5" />
                </button>
                <button 
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <h2 className="text-xl font-heading font-bold text-neutral-800 mb-2">{trip.title}</h2>
            <p className="text-sm text-neutral-600 mb-4">{trip.summary}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {trip.categories?.map((category, index) => (
                <span key={index} className="bg-neutral-100 text-neutral-700 text-xs px-3 py-1 rounded-full">
                  {category}
                </span>
              ))}
            </div>
            
            <div className="border-t border-neutral-200 pt-4 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="font-medium text-neutral-800">Trip Timeline</div>
                <div className="text-neutral-500">
                  {formattedDateRange}
                </div>
              </div>
              
              {pins.length > 0 ? (
                <TripTimeline pins={pins} />
              ) : (
                <div className="py-4 text-sm text-center text-neutral-500">
                  No locations have been added to this trip yet.
                </div>
              )}
            </div>
            
            <Link href={`/trip/${trip.id}`}>
              <span className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg font-medium transition-colors flex justify-center cursor-pointer">
                View Full Trip Details
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedTrip;

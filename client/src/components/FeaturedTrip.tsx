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
        <div className="flex items-center">
          <div className="h-10 w-2 bg-yellow-gold rounded-full mr-3"></div>
          <h2 className="text-xl trekz-logo text-foreground">Featured <span className="text-yellow-gold">Adventure</span></h2>
        </div>
      </div>
      
      <div className="trekz-card featured-bg bg-white-soft">
        <div className="diamond-overlay md:flex">
          <div className="md:w-1/2 h-72 md:h-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-cream">
                <Loader className="h-8 w-8 text-yellow-mid animate-spin" />
              </div>
            ) : pins.length > 0 ? (
              // Use the MapView component for a proper interactive map
              <div className="h-full relative rounded-t-xl md:rounded-tr-none md:rounded-l-xl overflow-hidden border-r border-yellow-light">
                <MapView trip={trip} pins={pins} />
              </div>
            ) : (
              // Fallback to static image if no pins
              <div 
                className="h-full bg-cover bg-center rounded-t-xl md:rounded-tr-none md:rounded-l-xl border-r border-yellow-light" 
                style={{ 
                  backgroundImage: `url('${trip.coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500"}')`
                }}
              ></div>
            )}
          </div>
          
          <div className="md:w-1/2 p-5 md:p-6 bg-white-soft">
            <div className="flex items-center justify-between mb-4">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-yellow-light border-2 border-yellow-mid flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-medium text-foreground">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{user.name}</div>
                    <div className="text-xs text-foreground/70">Travel Enthusiast</div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button 
                  className="p-2 rounded-full bg-yellow-light hover:bg-yellow-mid transition-colors"
                  onClick={handleLike}
                >
                  <Heart className="h-5 w-5 text-foreground" />
                </button>
                <button 
                  className="p-2 rounded-full bg-mint-light hover:bg-mint-mid transition-colors"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5 text-foreground" />
                </button>
              </div>
            </div>
            
            <h2 className="text-2xl trekz-logo text-foreground mb-3">{trip.title}</h2>
            <p className="text-sm text-foreground/80 mb-4">{trip.summary}</p>
            
            <div className="flex flex-wrap gap-2 mb-5">
              {trip.categories?.map((category, index) => (
                <span key={index} className="tag">
                  {category}
                </span>
              ))}
              {!trip.categories?.length && (
                <span className="tag">Adventure</span>
              )}
            </div>
            
            <div className="border-t border-yellow-light pt-4 mb-5">
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="font-medium text-foreground flex items-center">
                  <span className="inline-block w-2 h-2 bg-yellow-gold rounded-full mr-2"></span>
                  Adventure Timeline
                </div>
                <div className="text-foreground/70 bg-cream px-2 py-1 rounded-md text-xs">
                  {formattedDateRange}
                </div>
              </div>
              
              {pins.length > 0 ? (
                <TripTimeline pins={pins} />
              ) : (
                <div className="py-4 text-sm text-center text-foreground/70 bg-cream/50 rounded-lg">
                  No locations have been added to this trip yet.
                </div>
              )}
            </div>
            
            <Link href={`/trip/${trip.id}`}>
              <span className="w-full button-primary py-3 rounded-lg font-medium flex justify-center cursor-pointer">
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

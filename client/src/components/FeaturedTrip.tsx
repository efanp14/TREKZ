import { Link } from "wouter";
import { Trip, Pin, User } from "@shared/schema";
import { Heart, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import TripTimeline from "./TripTimeline";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeaturedTripProps {
  trip: Trip;
  pins: Pin[];
}

const FeaturedTrip = ({ trip, pins }: FeaturedTripProps) => {
  const { toast } = useToast();
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Group pins by location to create map markers
  const mapPins = useMemo(() => {
    return pins.map((pin, index) => ({
      id: pin.id,
      lat: parseFloat(pin.latitude),
      lng: parseFloat(pin.longitude),
      number: index + 1,
      title: pin.title
    }));
  }, [pins]);

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

  return (
    <div className="px-4 md:px-8 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-neutral-800">Featured Trip</h2>
      </div>
      
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <div className="h-64 md:h-full relative rounded-tl-xl rounded-tr-xl md:rounded-tr-none md:rounded-bl-xl overflow-hidden">
              {/* Map Background */}
              <div className="absolute inset-0 bg-cover bg-center" 
                style={{ 
                  backgroundImage: "url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/14.3757,40.6263,6/1200x600?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw')"
                }}>
              </div>
              
              {/* Map Pins */}
              {mapPins.map((pin) => (
                <div 
                  key={pin.id}
                  className="pin-container absolute animate-pulse-slow"
                  style={{ 
                    left: `${30 + (pin.number * 15)}%`, 
                    top: `${40 + (pin.number * 5)}%`, 
                    animationDelay: `${0.2 * pin.number}s` 
                  }}
                >
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                    <span className="text-white text-xs font-bold">{pin.number}</span>
                  </div>
                </div>
              ))}
            </div>
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
                  {format(new Date(trip.startDate), "MMMM d")} - {format(new Date(trip.endDate), "MMMM d, yyyy")}
                </div>
              </div>
              
              <TripTimeline pins={pins} />
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

import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trip, Pin, User } from "@shared/schema";
import { MapView } from "@/components/MapView";
import { 
  Calendar, 
  MapPin, 
  User as UserIcon, 
  Heart, 
  Share2, 
  ChevronLeft, 
  Eye 
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLikeTrip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const tripId = parseInt(id);
  
  // Fetch trip data
  const { 
    data: trip, 
    isLoading: tripLoading, 
    error: tripError 
  } = useQuery<Trip>({
    queryKey: ['/api/trips', tripId],
  });

  // Fetch pins for this trip
  const { 
    data: pins, 
    isLoading: pinsLoading 
  } = useQuery<Pin[]>({
    queryKey: ['/api/trips', tripId, 'pins'],
    // Removed the enabled condition to ensure pins are fetched regardless of trip status
  });

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Like trip mutation
  const likeTripMutation = useLikeTrip();

  const handleLike = () => {
    likeTripMutation.mutate(tripId, {
      onSuccess: () => {
        toast({
          title: "Trip liked!",
          description: "You've successfully liked this trip."
        });
      },
      onError: () => {
        toast({
          title: "Error liking trip",
          description: "There was a problem liking this trip. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  // Handle sharing
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: trip?.title || "TripTales Trip",
        text: trip?.summary || "",
        url: window.location.href,
      })
      .catch((error) => {
        console.log('Error sharing', error);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this trip with others."
      });
    }
  };

  // Navigate back
  const goBack = () => {
    navigate("/");
  };

  if (tripError) {
    return (
      <div className="flex-grow p-6 flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <h2 className="text-2xl font-heading font-bold text-neutral-800 mb-4">Trip Not Found</h2>
          <p className="text-neutral-600 mb-6">
            Sorry, the trip you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={goBack}>
            Go Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  if (tripLoading) {
    return (
      <div className="flex-grow p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
          </div>
          <div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-auto">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-neutral-800">
            {trip?.title}
          </h1>
        </div>
        
        {/* Map View */}
        {trip && pins && (
          <div className="mb-6 rounded-xl overflow-hidden h-[300px] md:h-[400px] shadow-sm">
            <MapView trip={trip} pins={pins} />
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          {/* Trip Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Calendar className="h-4 w-4 text-primary-500" />
                <span>
                  {format(new Date(trip?.startDate || new Date()), "MMM d")} - {format(new Date(trip?.endDate || new Date()), "MMM d, yyyy")}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <MapPin className="h-4 w-4 text-primary-500" />
                <span>{pins?.length || 0} locations</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <UserIcon className="h-4 w-4 text-primary-500" />
                <span>{user?.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Eye className="h-4 w-4 text-primary-500" />
                <span>{trip?.viewCount} views</span>
              </div>
            </div>
            
            <p className="text-neutral-700 mb-6">{trip?.summary}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {trip?.categories?.map((category, index) => (
                <span key={index} className="bg-neutral-100 text-neutral-700 text-xs px-3 py-1 rounded-full">
                  {category}
                </span>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleLike}
              >
                <Heart className="h-4 w-4" />
                <span>{trip?.likeCount || 0}</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
          
          {/* Location Photos Grid */}
          {pins && pins.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium text-neutral-800 mb-4">Trip Photos</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {pins.flatMap(pin => pin.photos || []).slice(0, 8).map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={photo} alt="Trip location" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Location Cards */}
          {pins && pins.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium text-neutral-800 mb-4">Trip Locations ({pins.length})</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pins.map((pin, index) => (
                  <div key={pin.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <h3 className="font-medium text-neutral-800">{pin.title}</h3>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{pin.description}</p>
                    <div className="text-xs text-neutral-500">
                      {format(new Date(pin.date), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetails;

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
  Eye,
  Tag,
  Camera,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLikeTrip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getTripById, getPinsByTripId } from "@/lib/api";

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Ensure we have a valid tripId
  const tripId = parseInt(id);
  const validTripId = !isNaN(tripId) ? tripId : 0;
  
  // Fetch trip data directly with queryFn
  const { 
    data: trip, 
    isLoading: tripLoading, 
    error: tripError 
  } = useQuery<Trip>({
    queryKey: ['/api/trips', validTripId],
    queryFn: () => getTripById(validTripId),
    enabled: validTripId > 0,
    staleTime: 10000, // Refresh every 10 seconds
  });

  // Fetch pins directly with queryFn
  const { 
    data: pins = [], // Default to empty array for safety
    isLoading: pinsLoading 
  } = useQuery<Pin[]>({
    queryKey: ['/api/trips', validTripId, 'pins'],
    queryFn: () => getPinsByTripId(validTripId),
    enabled: validTripId > 0,
    staleTime: 10000, // Refresh every 10 seconds
  });

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Like trip mutation
  const likeTripMutation = useLikeTrip();

  // Handle liking a trip
  const handleLike = () => {
    if (!trip) return;
    
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
    if (!trip) return;
    
    if (navigator.share) {
      navigator.share({
        title: trip.title,
        text: trip.summary,
        url: window.location.href,
      })
      .catch((error) => {
        console.error('Error sharing', error);
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

  // Format a date safely
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Date not available";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // If error loading trip
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

  // Loading skeleton
  if (tripLoading || !trip) {
    return (
      <div className="flex-grow p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[300px] w-full mb-6 rounded-xl" />
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-20 w-full mb-4" />
            <div className="flex gap-3 mb-4">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-auto bg-neutral-50">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Back button and title */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goBack}
            className="shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-neutral-800">
            {trip.title}
          </h1>
        </div>
        
        {/* Map View */}
        <div className="mb-6 rounded-xl overflow-hidden h-[300px] md:h-[400px] shadow-md">
          <MapView trip={trip} pins={pins} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Trip Info */}
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                {/* Trip Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm bg-neutral-100 px-3 py-1.5 rounded-full">
                    <Calendar className="h-4 w-4 text-primary-600" />
                    <span>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm bg-neutral-100 px-3 py-1.5 rounded-full">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    <span>{pins.length} locations</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm bg-neutral-100 px-3 py-1.5 rounded-full">
                    <Eye className="h-4 w-4 text-primary-600" />
                    <span>{trip.viewCount} views</span>
                  </div>
                </div>
                
                {/* Trip Author */}
                {user && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="font-medium">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-800">{user.name}</div>
                      <div className="text-xs text-neutral-500">Created {formatDate(trip.createdAt)}</div>
                    </div>
                  </div>
                )}
                
                {/* Trip Description */}
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-neutral-800 mb-2">About this trip</h2>
                  <p className="text-neutral-700">{trip.summary}</p>
                </div>
                
                {/* Trip Categories */}
                {trip.categories && trip.categories.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-neutral-600">
                      <Tag className="h-4 w-4" />
                      <span>Categories</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trip.categories.map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Trip Actions */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={handleLike}
                  >
                    <Heart className="h-4 w-4" />
                    <span>{trip.likeCount || 0} Likes</span>
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
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 ml-auto"
                    onClick={() => navigate(`/trip/${tripId}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit Trip</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location Cards */}
            {pins.length > 0 && (
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium text-neutral-800 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary-600" />
                    Trip Locations ({pins.length})
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pins.map((pin, index) => (
                      <div key={pin.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {index + 1}
                          </div>
                          <h3 className="font-medium text-neutral-800">{pin.title}</h3>
                        </div>
                        {pin.description && (
                          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{pin.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {pin.activities && pin.activities.map((activity, i) => (
                            <span key={i} className="bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-full">
                              {activity}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-neutral-500">
                            {formatDate(pin.date)}
                          </div>
                          {pin.photos && pin.photos.length > 0 && (
                            <div className="text-xs text-neutral-500 flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              <span>{pin.photos.length} photo{pin.photos.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Location Photos Grid */}
            {pins.length > 0 && pins.some(pin => pin.photos && pin.photos.length > 0) && (
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium text-neutral-800 mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary-600" />
                    Trip Photos
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {pins
                      .flatMap(pin => (pin.photos || []).map(photo => ({ photo, pinTitle: pin.title })))
                      .slice(0, 6)
                      .map((item, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                          <img 
                            src={item.photo} 
                            alt={`Photo from ${item.pinTitle}`} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <span className="text-white text-xs p-2">{item.pinTitle}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Trip Cover Image */}
            {trip.coverImage && (
              <Card className="shadow-sm border-0 overflow-hidden">
                <div className="aspect-video w-full">
                  <img 
                    src={trip.coverImage} 
                    alt={`Cover image for ${trip.title}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;

import { Link } from "wouter";
import { Trip, Pin } from "@shared/schema";
import { MapPin, Eye, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { getUserById, getPinsByTripId } from "@/lib/api";

interface TripCardProps {
  trip: Trip;
  showDate?: "relative" | "range" | "none";
}

const TripCard = ({ trip, showDate = "range" }: TripCardProps) => {
  // Get the trip creator's user data
  const { data: tripUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/users', trip.userId],
    queryFn: () => getUserById(trip.userId),
  });
  
  // Get the pins for this trip to count locations
  const { data: tripPins } = useQuery<Pin[]>({
    queryKey: ['/api/trips', trip.id, 'pins'],
    queryFn: () => getPinsByTripId(trip.id),
  });

  // Format dates based on the showDate prop
  const renderDate = () => {
    if (showDate === "none") return null;
    
    if (showDate === "relative") {
      return (
        <span>{formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}</span>
      );
    }
    
    return (
      <span>
        {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
      </span>
    );
  };

  return (
    <div className="trekz-card bg-white-soft transition-all duration-300">
      <Link href={`/trip/${trip.id}`}>
        <div className="relative">
          <img 
            src={trip.coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500"} 
            alt={trip.title} 
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-3 right-3 bg-yellow-light border border-yellow-mid backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
            <MapPin className="inline-block h-3 w-3 text-yellow-gold mr-1" />
            <span>
              {tripPins ? tripPins.length : '...'} locations
            </span>
          </div>
          <div className="absolute bottom-3 left-3">
            <h3 className="font-heading font-bold text-white text-lg">{trip.title}</h3>
          </div>
        </div>
        <div className="p-4">
          {tripUser ? (
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={tripUser.avatar || ''} 
                alt={`${tripUser.name}'s avatar`}
                className="w-6 h-6 rounded-full object-cover border border-yellow-light"
              />
              <span className="text-sm font-medium">{tripUser.name}</span>
            </div>
          ) : isUserLoading ? (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-cream animate-pulse"></div>
              <div className="w-24 h-4 bg-cream animate-pulse rounded"></div>
            </div>
          ) : null}
          <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{trip.summary}</p>
          
          <div className="flex items-center justify-between">
            <div className="text-xs bg-cream px-2 py-1 rounded-md text-foreground/70 font-medium">
              {renderDate()}
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center text-foreground/70">
                <Eye className="h-3 w-3 mr-1 text-yellow-gold" />
                {trip.viewCount > 1000 ? (trip.viewCount / 1000).toFixed(1) + "K" : trip.viewCount}
              </div>
              <div className="flex items-center text-foreground/70">
                <Heart className="h-3 w-3 mr-1 text-yellow-gold" />
                {trip.likeCount}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TripCard;

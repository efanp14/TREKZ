import { Link } from "wouter";
import { Trip } from "@shared/schema";
import { MapPin, Eye, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

interface TripCardProps {
  trip: Trip;
  showDate?: "relative" | "range" | "none";
}

const TripCard = ({ trip, showDate = "range" }: TripCardProps) => {
  // Get user data for the trip
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
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
              {Math.floor(Math.random() * 10) + 2} locations
            </span>
          </div>
          <div className="absolute bottom-3 left-3">
            <h3 className="font-heading font-bold text-white text-lg">{trip.title}</h3>
          </div>
        </div>
        <div className="p-4">
          {user && (
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={user.avatar || ''} 
                alt="User avatar" 
                className="w-6 h-6 rounded-full object-cover border border-yellow-light"
              />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          )}
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

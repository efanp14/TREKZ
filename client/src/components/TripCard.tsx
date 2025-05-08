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
    <Link href={`/trip/${trip.id}`}>
      <a className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer block">
        <div className="relative">
          <img 
            src={trip.coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500"} 
            alt={trip.title} 
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-neutral-800">
            <MapPin className="inline-block h-3 w-3 text-primary-500 mr-1" />
            <span>
              {Math.floor(Math.random() * 10) + 2} locations
            </span>
          </div>
        </div>
        <div className="p-4">
          {user && (
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={user.avatar} 
                alt="User avatar" 
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm text-neutral-600">{user.name}</span>
            </div>
          )}
          <h3 className="font-heading font-semibold text-neutral-800 mb-1">{trip.title}</h3>
          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{trip.summary}</p>
          <div className="flex items-center text-xs text-neutral-500">
            {renderDate()}
            <span className="mx-2">•</span>
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {trip.viewCount > 1000 ? (trip.viewCount / 1000).toFixed(1) + "K" : trip.viewCount}
            </div>
            <span className="mx-2">•</span>
            <div className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {trip.likeCount}
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default TripCard;

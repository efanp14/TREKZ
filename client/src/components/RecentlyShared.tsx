import { Link } from "wouter";
import { Trip } from "@shared/schema";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentlySharedProps {
  trips: Trip[];
  isLoading: boolean;
}

const RecentlyShared = ({ trips, isLoading }: RecentlySharedProps) => {
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  return (
    <div className="px-4 md:px-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-neutral-800">Recently Shared</h2>
        <Link href="/browse">
          <span className="text-yellow-gold font-medium text-sm hover:underline cursor-pointer">
            View all
          </span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? 
          // Loading skeletons
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="w-full h-40" />
              <div className="p-4">
                <Skeleton className="w-3/4 h-5 mb-2" />
                <Skeleton className="w-full h-4 mb-2" />
                <Skeleton className="w-1/2 h-4" />
              </div>
            </div>
          )) : 
          // Trip cards
          trips.slice(0, 4).map(trip => (
            <div key={trip.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer block">
              <Link href={`/trip/${trip.id}`}>
                <div className="relative">
                  <img 
                    src={trip.coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} 
                    alt={trip.title} 
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-neutral-800">
                    <MapPin className="inline-block h-3 w-3 text-primary-500 mr-1" />
                    <span>
                      {Math.floor(Math.random() * 8) + 2} locations
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-neutral-800 mb-1">{trip.title}</h3>
                  <div className="flex items-center text-xs text-neutral-500 mb-2">
                    <span>{formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}</span>
                    <span className="mx-1.5">•</span>
                    <span>{differenceInDays(new Date(trip.endDate), new Date(trip.startDate))} days</span>
                  </div>
                  {user && (
                    <div className="flex items-center gap-2">
                      <img 
                        src={user.avatar || ''} 
                        alt="User avatar" 
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs text-neutral-600">{user.name}</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default RecentlyShared;

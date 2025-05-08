import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTripById, getTrendingTrips, getRecentTrips, getUserTrips, likeTrip } from "@/lib/api";
import { Trip } from "@shared/schema";

// Hook for fetching a single trip
export function useTripDetails(id: number) {
  return useQuery<Trip>({
    queryKey: ['/api/trips', id],
    queryFn: () => getTripById(id),
  });
}

// Hook for fetching trending trips
export function useTrendingTrips(limit?: number) {
  return useQuery<Trip[]>({
    queryKey: ['/api/trending', limit],
    queryFn: () => getTrendingTrips(limit),
  });
}

// Hook for fetching recent trips
export function useRecentTrips(limit?: number) {
  return useQuery<Trip[]>({
    queryKey: ['/api/recent', limit],
    queryFn: () => getRecentTrips(limit),
  });
}

// Hook for fetching user's trips
export function useUserTrips() {
  return useQuery<Trip[]>({
    queryKey: ['/api/my-trips'],
    queryFn: getUserTrips,
  });
}

// Hook for liking a trip
export function useLikeTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tripId: number) => likeTrip(tripId),
    onSuccess: (data) => {
      // Update trip in cache
      queryClient.setQueryData(['/api/trips', data.id], data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-trips'] });
    },
  });
}

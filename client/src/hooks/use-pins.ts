import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPinsByTripId } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { Pin, InsertPin } from "@shared/schema";

// Hook for fetching pins for a trip
export function useTripPins(tripId: number | undefined) {
  return useQuery<Pin[]>({
    queryKey: ['/api/trips', tripId, 'pins'],
    queryFn: () => {
      if (!tripId) return Promise.resolve([]);
      return getPinsByTripId(tripId);
    },
    // Always enable the query, but it will return an empty array if no tripId
    enabled: true,
  });
}

// Hook for creating a new pin
export function useCreatePin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pin: InsertPin) => {
      const response = await apiRequest('POST', '/api/pins', pin);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate pins query for the associated trip
      queryClient.invalidateQueries({ queryKey: ['/api/trips', data.tripId, 'pins'] });
    },
  });
}

// Hook for updating a pin
export function useUpdatePin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, pin }: { id: number; pin: Partial<Pin> }) => {
      const response = await apiRequest('PATCH', `/api/pins/${id}`, pin);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate pins query for the associated trip
      queryClient.invalidateQueries({ queryKey: ['/api/trips', data.tripId, 'pins'] });
    },
  });
}

// Hook for deleting a pin
export function useDeletePin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, tripId }: { id: number; tripId: number }) => {
      await apiRequest('DELETE', `/api/pins/${id}`);
      return { id, tripId };
    },
    onSuccess: (data) => {
      // Invalidate pins query for the associated trip
      queryClient.invalidateQueries({ queryKey: ['/api/trips', data.tripId, 'pins'] });
    },
  });
}

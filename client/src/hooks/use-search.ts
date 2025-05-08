import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import type { Trip } from '@shared/schema';

export function useSearchTrips(queryText: string, sortBy: 'likes' | 'views' | 'date' = 'date') {
  return useQuery({
    queryKey: ['/api/search', queryText, sortBy],
    queryFn: getQueryFn<Trip[]>({ on401: 'returnNull' }),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
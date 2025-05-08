import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import type { Trip } from '@shared/schema';

// Custom debounce hook for search inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook to search trips with filtering and sorting
export function useSearchTrips(queryText: string, sortBy: 'likes' | 'views' | 'date' = 'date') {
  return useQuery({
    queryKey: ['/api/search', queryText, sortBy],
    queryFn: getQueryFn<Trip[]>({ on401: 'returnNull' }),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
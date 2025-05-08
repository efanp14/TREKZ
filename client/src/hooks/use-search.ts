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
    queryFn: async ({ queryKey }) => {
      const [_path, query, sort] = queryKey as [string, string, 'likes' | 'views' | 'date'];
      const url = `/api/search?q=${encodeURIComponent(query || '')}&sortBy=${sort}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to search trips');
      }
      
      return response.json() as Promise<Trip[]>;
    },
    enabled: true, 
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}
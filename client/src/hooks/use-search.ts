import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import type { Trip } from '@shared/schema';
import { searchTrips as apiSearchTrips, type PaginationInfo, type SearchResult } from '@/lib/api';

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

// Re-export the interfaces from api.ts
export type { PaginationInfo, SearchResult };

// Hook to search trips with filtering, sorting, and pagination
export function useSearchTrips(
  queryText: string, 
  sortBy: 'likes' | 'views' | 'date' = 'date',
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['/api/search', queryText, sortBy, page, limit],
    queryFn: async ({ queryKey }) => {
      const [_path, query, sort, pageNum, pageLimit] = queryKey as [
        string, string, 'likes' | 'views' | 'date', number, number
      ];
      
      return apiSearchTrips(query || '', sort, pageNum, pageLimit);
    },
    enabled: true, 
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}
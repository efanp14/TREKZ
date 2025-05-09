import { apiRequest } from "./queryClient";
import { Trip, Pin } from "@shared/schema";

// Fetch all trips
export async function getTrips(): Promise<Trip[]> {
  const response = await apiRequest('GET', '/api/trips');
  return response.json();
}

// Fetch a single trip by ID
export async function getTripById(id: number): Promise<Trip> {
  const response = await apiRequest('GET', `/api/trips/${id}`);
  return response.json();
}

// Fetch trending trips
export async function getTrendingTrips(limit?: number): Promise<Trip[]> {
  const url = limit ? `/api/trending?limit=${limit}` : '/api/trending';
  const response = await apiRequest('GET', url);
  return response.json();
}

// Fetch recent trips
export async function getRecentTrips(limit?: number): Promise<Trip[]> {
  const url = limit ? `/api/recent?limit=${limit}` : '/api/recent';
  const response = await apiRequest('GET', url);
  return response.json();
}

// Fetch user's trips
export async function getUserTrips(): Promise<Trip[]> {
  const response = await apiRequest('GET', '/api/my-trips');
  return response.json();
}

// Fetch pins for a trip
export async function getPinsByTripId(tripId: number): Promise<Pin[]> {
  const response = await apiRequest('GET', `/api/trips/${tripId}/pins`);
  return response.json();
}

// Like a trip
export async function likeTrip(tripId: number): Promise<Trip> {
  const response = await apiRequest('POST', `/api/trips/${tripId}/like`);
  return response.json();
}

export interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SearchResult {
  trips: Trip[];
  pagination: PaginationInfo;
}

// Search trips with optional filtering and pagination
export async function searchTrips(
  query: string, 
  sortBy: 'likes' | 'views' | 'date' = 'date',
  page: number = 1,
  limit: number = 20
): Promise<SearchResult> {
  const url = `/api/search?q=${encodeURIComponent(query)}&sortBy=${sortBy}&page=${page}&limit=${limit}`;
  const response = await apiRequest('GET', url);
  return response.json();
}

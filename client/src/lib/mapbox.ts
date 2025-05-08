import mapboxgl from 'mapbox-gl';

// Define interface for city suggestion response
export interface CitySearchResult {
  name: string;
  fullName: string;
  location: [number, number]; // [longitude, latitude]
  id: string;
}

// Disable telemetry/events calls to prevent pending network requests
// The correct way to disable Mapbox telemetry in newer versions
try {
  // @ts-ignore - Safely disable telemetry (undocumented property)
  mapboxgl.setRTLTextPlugin = () => {}; // Prevent RTL text plugin loading
  
  // For newer Mapbox versions that support this config 
  if (typeof mapboxgl.config !== 'undefined' && mapboxgl.config) {
    // @ts-ignore - This is an undocumented but working property
    mapboxgl.config.EVENTS_URL = ''; // Empty URL prevents telemetry calls
  }
} catch (e) {
  console.warn('Unable to disable Mapbox telemetry:', e);
}

// Define a global variable to track markers
let markers: mapboxgl.Marker[] = [];

// Initialize a map with default options
export function initMap(container: HTMLElement, options: Omit<mapboxgl.MapOptions, 'container'> = {}): mapboxgl.Map {
  // Use the Mapbox token from environment variables
  if (import.meta.env.VITE_MAPBOX_TOKEN) {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
  } else {
    console.error('VITE_MAPBOX_TOKEN environment variable is not set');
  }
  
  const defaultOptions: mapboxgl.MapOptions = {
    container,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-74.5, 40], // Default to New York area
    zoom: 2,
  };
  
  const map = new mapboxgl.Map({
    ...defaultOptions,
    ...options,
  });
  
  // Add navigation controls (zoom, rotation)
  map.addControl(new mapboxgl.NavigationControl());
  
  return map;
}

// Add a marker to the map
export function addMarker(map: mapboxgl.Map, lng: number, lat: number, index: number): mapboxgl.Marker {
  // Create a custom marker element
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.width = '30px';
  el.style.height = '30px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = '#3B82F6'; // primary-500
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = 'white';
  el.style.fontWeight = 'bold';
  el.style.fontSize = '14px';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  el.innerHTML = index.toString();
  
  // Create and add the marker
  const marker = new mapboxgl.Marker(el)
    .setLngLat([lng, lat])
    .addTo(map);
  
  // Add to our markers array for later reference
  markers.push(marker);
  
  return marker;
}

// Remove all markers from the map
export function clearMarkers(): void {
  markers.forEach(marker => marker.remove());
  markers = [];
}

// Create a line between markers
export function createRoute(map: mapboxgl.Map, coordinates: [number, number][]): void {
  // Check if the source already exists
  if (map.getSource('route')) {
    // Update the existing source
    (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates
      }
    });
  } else {
    // Add a new source and layer
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });
    
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3B82F6',
        'line-width': 3,
        'line-opacity': 0.7
      }
    });
  }
}

// FlyTo a specific location with smooth animation
export function flyToLocation(map: mapboxgl.Map, location: [number, number], zoom: number = 9, options?: any): void {
  map.flyTo({
    center: location,
    zoom,
    essential: true, // This animation is considered essential for the intended user experience
    duration: 2000, // Animation duration in milliseconds
    ...options
  });
}

// Pan to a pin location
export function panToPin(map: mapboxgl.Map, location: [number, number], zoom?: number): void {
  map.panTo(location);
  if (zoom) {
    map.setZoom(zoom);
  }
}

// Search for locations using Mapbox Geocoding API
export async function searchLocations(query: string, limit: number = 5): Promise<CitySearchResult[]> {
  if (!query.trim()) {
    return [];
  }
  
  try {
    // Set up Mapbox Geocoding API URL (place types: locality, place, region focus on cities and regions)
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const params = new URLSearchParams({
      access_token: mapboxgl.accessToken as string,
      types: 'place,locality,region', // Focus on cities and regions
      limit: limit.toString(),
      language: 'en', // Could be made dynamic for internationalization
    });
    
    const response = await fetch(`${endpoint}?${params}`);
    
    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }
    
    const data = await response.json();
    
    // Format the response data into our CitySearchResult format
    return data.features.map((feature: any) => ({
      id: feature.id,
      name: feature.text,
      fullName: feature.place_name,
      location: feature.center as [number, number],
    }));
  } catch (error) {
    console.error('Error searching for locations:', error);
    return [];
  }
}

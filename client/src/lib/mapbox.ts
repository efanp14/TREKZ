import mapboxgl from 'mapbox-gl';

// Define a global variable to track markers
let markers: mapboxgl.Marker[] = [];

// Initialize a map with default options
export function initMap(container: HTMLElement, options: Omit<mapboxgl.MapOptions, 'container'> = {}): mapboxgl.Map {
  // Use the Mapbox token from environment variables
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
  
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

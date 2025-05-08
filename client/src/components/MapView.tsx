import { useRef, useEffect } from "react";
import { Trip, Pin } from "@shared/schema";
import { initMap, addMarker, createRoute } from "@/lib/mapbox";
import mapboxgl from 'mapbox-gl';

interface MapViewProps {
  trip: Trip;
  pins: Pin[];
}

export const MapView = ({ trip, pins }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Default center point based on trip location or a fallback
    let defaultCenter: [number, number] = [-74.5, 40]; // Default to New York area
    let zoom = 2;
    
    let map: mapboxgl.Map | null = null;
    
    try {
      // Initialize map with container and options
      map = initMap(mapContainerRef.current, {
        center: defaultCenter,
        zoom
      });
      
      // Add error handling for map
      map.on('error', (e) => {
        console.error("Mapbox error:", e);
      });
      
      // If no pins, just return the map with default center
      if (!pins || pins.length === 0) {
        return () => {
          map?.remove();
        };
      }
      
      // Sort pins by order
      const sortedPins = [...pins].sort((a, b) => a.order - b.order);
      
      // Get coordinates for map bounds (with validation)
      const coordinates = sortedPins
        .map(pin => {
          const lng = parseFloat(pin.longitude);
          const lat = parseFloat(pin.latitude);
          
          // Skip invalid coordinates
          if (isNaN(lng) || isNaN(lat)) return null;
          return [lng, lat] as [number, number];
        })
        .filter(coord => coord !== null) as [number, number][];
      
      // If no valid coordinates, use default center
      if (coordinates.length === 0) return;
      
      // Calculate center point
      if (coordinates.length === 1) {
        // Set center to the single coordinate
        map.setCenter(coordinates[0]);
        map.setZoom(8);
      }
      
      // Add markers for all valid pins
      sortedPins.forEach((pin, index) => {
        if (!map) return;
        
        const lng = parseFloat(pin.longitude);
        const lat = parseFloat(pin.latitude);
        
        // Skip invalid coordinates
        if (isNaN(lng) || isNaN(lat)) return;
        
        try {
          addMarker(map, lng, lat, index + 1);
        } catch (error) {
          console.error("Error adding marker:", error);
        }
      });
      
      // If multiple pins, create a route line connecting them
      if (coordinates.length > 1 && map) {
        // Wait for map to load before adding route
        map.on('load', () => {
          if (!map) return;
          
          try {
            createRoute(map, coordinates);
            
            // Fit the map to show all markers
            try {
              const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
              }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
              
              map.fitBounds(bounds, {
                padding: 50,
                maxZoom: 10
              });
            } catch (error) {
              console.error("Error fitting bounds:", error);
            }
          } catch (error) {
            console.error("Error creating route:", error);
          }
        });
      }
    } catch (error) {
      console.error("Error rendering map:", error);
      
      // Display fallback content in the map container
      if (mapContainerRef.current) {
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'flex items-center justify-center w-full h-full bg-gray-100 text-gray-500';
        fallbackElement.innerHTML = '<p>Map temporarily unavailable</p>';
        mapContainerRef.current.appendChild(fallbackElement);
      }
    }
    
    return () => {
      try {
        map?.remove();
      } catch (err) {
        console.error("Error removing map:", err);
      }
    };
  }, [pins]);
  
  return (
    <div ref={mapContainerRef} className="w-full h-full"></div>
  );
};

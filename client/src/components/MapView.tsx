import { useRef, useEffect } from "react";
import { Trip, Pin } from "@shared/schema";
import { initMap, addMarker, createRoute } from "@/lib/mapbox";

interface MapViewProps {
  trip: Trip;
  pins: Pin[];
}

export const MapView = ({ trip, pins }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapContainerRef.current || pins.length === 0) return;
    
    // Sort pins by order
    const sortedPins = [...pins].sort((a, b) => a.order - b.order);
    
    // Get coordinates for map bounds
    const coordinates = sortedPins.map(pin => [
      parseFloat(pin.longitude), 
      parseFloat(pin.latitude)
    ] as [number, number]);
    
    // Calculate bounds or center point
    let center: [number, number];
    let zoom = 5;
    
    if (pins.length === 1) {
      center = coordinates[0];
      zoom = 8;
    } else {
      // Default to first pin
      center = coordinates[0];
    }
    
    // Initialize map
    const map = initMap(mapContainerRef.current, {
      center,
      zoom
    });
    
    // Add markers for all pins
    sortedPins.forEach((pin, index) => {
      addMarker(
        map, 
        parseFloat(pin.longitude), 
        parseFloat(pin.latitude), 
        index + 1
      );
    });
    
    // If multiple pins, create a route line connecting them
    if (coordinates.length > 1) {
      // Wait for map to load before adding route
      map.on('load', () => {
        createRoute(map, coordinates);
        
        // Fit the map to show all markers
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 10
        });
      });
    }
    
    return () => {
      map.remove();
    };
  }, [pins]);
  
  return (
    <div ref={mapContainerRef} className="w-full h-full"></div>
  );
};

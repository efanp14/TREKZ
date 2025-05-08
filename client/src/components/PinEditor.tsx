import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trip, Pin, InsertPin, pinFormSchema } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { initMap, addMarker, clearMarkers } from "@/lib/mapbox";
import { format } from "date-fns";
import { MapPin, Plus, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TripTimeline from "./TripTimeline";

interface PinEditorProps {
  trip: Trip;
  pins: (Pin | InsertPin)[];
  onAddPin: (pin: InsertPin) => void;
  onComplete: () => void;
}

interface Activity {
  value: string;
  label: string;
}

const ACTIVITIES: Activity[] = [
  { value: "Hiking", label: "Hiking" },
  { value: "Photography", label: "Photography" },
  { value: "Food", label: "Food" },
  { value: "Museums", label: "Museums" },
  { value: "Beaches", label: "Beaches" },
  { value: "Shopping", label: "Shopping" },
  { value: "Nightlife", label: "Nightlife" },
  { value: "Sightseeing", label: "Sightseeing" },
  { value: "Nature", label: "Nature" },
  { value: "Adventure", label: "Adventure" },
  { value: "Relaxation", label: "Relaxation" },
  { value: "Cultural", label: "Cultural" },
];

const PinEditor = ({ trip, pins, onAddPin, onComplete }: PinEditorProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number } | null>(null);
  
  const form = useForm<InsertPin>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      tripId: trip.id,
      title: "",
      description: "",
      longitude: "",
      latitude: "",
      date: new Date(trip.startDate),
      order: pins.length + 1,
      activities: [],
      photos: [],
    }
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // No public token available, so we'll use a placeholder
    const mapInstance = initMap(mapContainerRef.current, {
      center: [-74.5, 40],
      zoom: 2
    });
    
    setMap(mapInstance);
    
    // Add click listener to map
    mapInstance.on('click', (e) => {
      const lngLat = e.lngLat;
      setSelectedLocation({ lng: lngLat.lng, lat: lngLat.lat });
      
      form.setValue('longitude', lngLat.lng.toString());
      form.setValue('latitude', lngLat.lat.toString());
      
      // Clear existing markers and add a new one
      clearMarkers();
      addMarker(mapInstance, lngLat.lng, lngLat.lat, pins.length + 1);
    });
    
    // Add existing pins to map
    pins.forEach((pin, index) => {
      addMarker(
        mapInstance, 
        parseFloat(pin.longitude), 
        parseFloat(pin.latitude), 
        index + 1
      );
    });
    
    return () => {
      mapInstance.remove();
    };
  }, [pins]);

  const handleFormSubmit = (data: InsertPin) => {
    data.activities = selectedActivities;
    // Add a sample photo URL
    data.photos = [
      "https://images.unsplash.com/photo-1549144511-f099e773c147?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800"
    ];
    
    onAddPin(data);
    
    // Reset form and selections
    form.reset({
      tripId: trip.id,
      title: "",
      description: "",
      longitude: "",
      latitude: "",
      date: new Date(trip.startDate),
      order: pins.length + 2, // Increment for next pin
      activities: [],
      photos: [],
    });
    setSelectedActivities([]);
    setSelectedLocation(null);
    clearMarkers();
    
    // Re-add all pins to map
    const updatedPins = [...pins, data];
    updatedPins.forEach((pin, index) => {
      if (map) {
        addMarker(
          map, 
          parseFloat(pin.longitude), 
          parseFloat(pin.latitude), 
          index + 1
        );
      }
    });
  };

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        {/* Map Container */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div ref={mapContainerRef} className="w-full h-[400px]"></div>
        </div>
        
        {/* Add Pin Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-neutral-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary-500" />
              Add a New Location
            </h3>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Eiffel Tower"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you do here? What did you see?"
                      className="resize-none h-24"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-neutral-500 mr-2" />
                        <Input 
                          className="w-full" 
                          {...field} 
                          readOnly 
                          placeholder="Click on map"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-neutral-500 mr-2" />
                        <Input 
                          className="w-full" 
                          {...field} 
                          readOnly 
                          placeholder="Click on map"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Date</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                      <Input 
                        type="date" 
                        className="w-full"
                        {...field}
                        value={
                          field.value 
                            ? (field.value instanceof Date 
                                ? field.value.toISOString().split('T')[0] 
                                : new Date(field.value).toISOString().split('T')[0]) 
                            : new Date(trip.startDate).toISOString().split('T')[0]
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Activities</FormLabel>
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES.map((activity) => (
                  <span 
                    key={activity.value} 
                    onClick={() => toggleActivity(activity.value)}
                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${
                      selectedActivities.includes(activity.value) 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {activity.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={!selectedLocation}
                className="px-6"
              >
                Add Location
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <div>
        {/* Trip Timeline Preview */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Your Trip Timeline</h3>
            
            <div className="text-sm text-neutral-600 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{trip.title}</span>
              </div>
              <div>
                {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
              </div>
            </div>
            
            {pins.length > 0 ? (
              <TripTimeline pins={pins as Pin[]} />
            ) : (
              <div className="text-center py-6 text-neutral-500 text-sm">
                Click on the map to add locations to your trip
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                onClick={onComplete}
                className="w-full"
                disabled={pins.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PinEditor;

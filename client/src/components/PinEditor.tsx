import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trip, Pin, InsertPin, pinFormSchema } from "@shared/schema";
import imageCompression from "browser-image-compression";
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
import { 
  initMap, 
  addMarker, 
  clearMarkers, 
  searchLocations, 
  flyToLocation, 
  panToPin,
  type CitySearchResult 
} from "@/lib/mapbox";
import { format } from "date-fns";
import { 
  MapPin, Plus, Calendar, CheckCircle2, Camera, X, 
  Image as ImageIcon, Search, MapPinned
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TripTimeline from "./TripTimeline";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Store the last pin location to center on after adding a new pin
  const [lastPinLocation, setLastPinLocation] = useState<[number, number] | null>(null);
  
  // City search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [citySuggestions, setCitySuggestions] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Effect to fetch city suggestions when search query changes
  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (debouncedSearchQuery.trim().length < 2) {
        setCitySuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        const results = await searchLocations(debouncedSearchQuery);
        setCitySuggestions(results);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchCitySuggestions();
  }, [debouncedSearchQuery]);

  // Click outside handler for search suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && 
          !searchContainerRef.current.contains(event.target as Node) &&
          showSuggestions) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Function to handle selecting a city from suggestions
  const handleSelectCity = (city: CitySearchResult) => {
    if (map) {
      // Fly to the selected city with animation
      flyToLocation(map, city.location, 9);
      
      // Clear existing markers
      clearMarkers();
      
      // Set search query to selected city name and close suggestions
      setSearchQuery(city.fullName);
      setShowSuggestions(false);
      
      // We don't set a pin immediately - user should click on specific point
    }
  };

  // Check for Mapbox token existence
  useEffect(() => {
    // Check if the Mapbox access token is set
    if (!import.meta.env.VITE_MAPBOX_TOKEN) {
      console.warn('VITE_MAPBOX_TOKEN is not set. Map functionality will be limited.');
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize the map with last pin location as center if available
    const mapInstance = initMap(mapContainerRef.current, {
      center: lastPinLocation || [-74.5, 40],
      zoom: lastPinLocation ? 10 : 2
    });
    
    setMap(mapInstance);
    
    // Add click listener to map
    mapInstance.on('click', (e) => {
      const lngLat = e.lngLat;
      setSelectedLocation({ lng: lngLat.lng, lat: lngLat.lat });
      
      // Update form values
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
  }, [pins, lastPinLocation]);

  // Function to handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    
    // Compression options
    const compressionOptions = {
      maxSizeMB: 1, // Max size in MB
      maxWidthOrHeight: 1200, // Max width/height in pixels
      useWebWorker: true, // Use web workers for better performance
      fileType: 'image/jpeg', // Convert all images to JPEG for better compression
    };
    
    // Process each file
    const processFiles = async () => {
      const newImageUrls: string[] = [];
      
      // Process and compress each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Compress the image file
          const compressedFile = await imageCompression(file, compressionOptions);
          
          // Create a FileReader to read the compressed file content
          const reader = new FileReader();
          
          // Create a promise to handle the asynchronous file reading
          const readFilePromise = new Promise<string>((resolve) => {
            reader.onload = () => {
              // reader.result contains the data URL
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              }
            };
          });
          
          // Start reading the compressed file as a data URL
          reader.readAsDataURL(compressedFile);
          
          // Wait for the file to be read and add the result to our URLs array
          const dataUrl = await readFilePromise;
          newImageUrls.push(dataUrl);
          
        } catch (error) {
          console.error('Error compressing image:', error);
          // Skip this file if compression fails
          continue;
        }
      }
      
      // Add all new image URLs to our state
      setImageUrls(prev => [...prev, ...newImageUrls]);
      setUploadingImage(false);
    };
    
    // Start processing files
    processFiles();
  };
  
  // Function to remove an image
  const removeImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleFormSubmit = (data: InsertPin) => {
    data.activities = selectedActivities;
    data.photos = imageUrls;
    
    // Store the last pin location for future use
    // This is vital as it will be used when the component remounts
    const lastPinCoords: [number, number] = [
      parseFloat(data.longitude),
      parseFloat(data.latitude)
    ];
    setLastPinLocation(lastPinCoords);
    
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
    setImageUrls([]);
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
    
    // After adding a pin, center on the most recently added pin to make it easier
    // to add the next pin nearby, reducing the need for manual panning
    if (map) {
      // Use the flyTo function to animate to the last pin location with a slightly zoomed view
      flyToLocation(
        map,
        lastPinCoords,
        10, // Zoomed in enough to see details but not too close
        { duration: 1500 } // Slightly faster animation for better UX
      );
    }
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
        {/* Map Container with Search Bar */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="relative">
            {/* Search input */}
            <div className="absolute top-4 left-0 right-0 z-10 px-4">
              <div className="relative" ref={searchContainerRef}>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search for a city or location..."
                    className="pl-10 pr-4 py-2 w-full shadow-lg border-0"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <div className="h-4 w-4 border-2 border-primary-500 border-r-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Suggestions dropdown */}
                {showSuggestions && (debouncedSearchQuery.length > 1) && (
                  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-20 max-h-60 overflow-auto">
                    {citySuggestions.length === 0 && !isSearching ? (
                      <div className="px-4 py-3 text-sm text-neutral-500">
                        No locations found
                      </div>
                    ) : (
                      <ul>
                        {citySuggestions.map((city) => (
                          <li
                            key={city.id}
                            className="px-4 py-2 hover:bg-neutral-100 cursor-pointer flex items-center gap-2 text-sm"
                            onClick={() => handleSelectCity(city)}
                          >
                            <MapPinned className="h-4 w-4 text-primary-500" />
                            <div>
                              <div className="font-medium">{city.name}</div>
                              <div className="text-neutral-500 text-xs">{city.fullName}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Map */}
            <div ref={mapContainerRef} className="w-full h-[400px]"></div>
          </div>
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
            
            {/* Photo Upload Section */}
            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photos
              </FormLabel>
              
              {/* Image Preview Grid */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-neutral-200">
                      <img src={url} alt={`Location image ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center">
                <label htmlFor="photo-upload" className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition-colors">
                  <ImageIcon className="h-4 w-4 text-neutral-700" />
                  <span className="text-sm text-neutral-700">
                    {imageUrls.length === 0 ? 'Add photos' : 'Add more photos'}
                  </span>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadingImage && <span className="ml-3 text-sm text-neutral-500">Uploading...</span>}
              </div>
              
              {imageUrls.length > 0 && (
                <div className="text-xs text-neutral-500">
                  <Badge variant="outline" className="font-normal">
                    {imageUrls.length} photo{imageUrls.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
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

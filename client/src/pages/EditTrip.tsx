import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trip, Pin, InsertTrip, InsertPin, tripFormSchema, pinFormSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useToast } from "@/hooks/use-toast";
import { getTripById, getPinsByTripId } from "@/lib/api";
import { Calendar, Trash2, MapPin, Camera, Save, Edit, ArrowLeft, Pencil, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { MapView } from "@/components/MapView";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EditTrip = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("details");
  const [editingPin, setEditingPin] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Ensure we have a valid tripId
  const tripId = parseInt(id);
  const validTripId = !isNaN(tripId) ? tripId : 0;

  // Fetch trip data
  const { 
    data: trip, 
    isLoading: tripLoading, 
    error: tripError 
  } = useQuery<Trip>({
    queryKey: ['/api/trips', validTripId],
    queryFn: () => getTripById(validTripId),
    enabled: validTripId > 0,
  });

  // Fetch pins
  const { 
    data: pins = [], 
    isLoading: pinsLoading 
  } = useQuery<Pin[]>({
    queryKey: ['/api/trips', validTripId, 'pins'],
    queryFn: () => getPinsByTripId(validTripId),
    enabled: validTripId > 0,
  });

  // Setup trip form
  const tripForm = useForm<InsertTrip>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: "",
      summary: "",
      startDate: new Date(),
      endDate: new Date(),
      categories: [],
      coverImage: "",
    }
  });

  // Setup pin edit form
  const pinForm = useForm<InsertPin>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      tripId: validTripId,
      title: "",
      description: "",
      longitude: "",
      latitude: "",
      date: new Date(),
      order: 0,
      activities: [],
      photos: [],
    }
  });

  // Populate the trip form when trip data is loaded
  useEffect(() => {
    if (trip) {
      tripForm.reset({
        title: trip.title,
        summary: trip.summary,
        startDate: new Date(trip.startDate),
        endDate: new Date(trip.endDate),
        categories: trip.categories || [],
        coverImage: trip.coverImage || "",
      });
    }
  }, [trip]);

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async (data: InsertTrip) => {
      const response = await apiRequest(`/api/trips/${validTripId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trip updated!",
        description: "Your trip has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', validTripId] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-trips'] });
    },
    onError: () => {
      toast({
        title: "Error updating trip",
        description: "There was a problem updating your trip. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update pin mutation
  const updatePinMutation = useMutation({
    mutationFn: async ({ pinId, data }: { pinId: number; data: Partial<InsertPin> }) => {
      const response = await apiRequest(`/api/pins/${pinId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pin updated!",
        description: "Your location pin has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', validTripId, 'pins'] });
      setEditingPin(null);
    }
  });

  // Delete pin mutation
  const deletePinMutation = useMutation({
    mutationFn: async (pinId: number) => {
      await apiRequest(`/api/pins/${pinId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Pin deleted",
        description: "The location has been removed from your trip."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', validTripId, 'pins'] });
    }
  });

  // Handle trip form submission
  const handleTripUpdate = (data: InsertTrip) => {
    updateTripMutation.mutate(data);
  };

  // Handle pin update
  const handlePinUpdate = (pinId: number, data: Partial<InsertPin>) => {
    updatePinMutation.mutate({ pinId, data });
  };

  // Handle pin deletion
  const handlePinDelete = (pinId: number) => {
    if (confirm("Are you sure you want to delete this location? This cannot be undone.")) {
      deletePinMutation.mutate(pinId);
    }
  };

  // Start editing a pin
  const startEditingPin = (pin: Pin) => {
    pinForm.reset({
      tripId: pin.tripId,
      title: pin.title,
      description: pin.description || "",
      longitude: pin.longitude,
      latitude: pin.latitude,
      date: new Date(pin.date),
      order: pin.order || 0,
      activities: pin.activities || [],
      photos: pin.photos || [],
    });
    setEditingPin(pin.id);
  };

  // Handle image upload for pin editing
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
      const currentPhotos = pinForm.getValues().photos || [];
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
          toast({
            title: "Image compression error",
            description: "There was a problem compressing your image. Try a smaller file or different format.",
            variant: "destructive"
          });
        }
      }
      
      // Add all new image URLs to our form state
      pinForm.setValue('photos', [...currentPhotos, ...newImageUrls]);
      setUploadingImage(false);
    };
    
    // Start processing files
    processFiles();
  };
  
  // Remove an image from pin edit form
  const removeImage = (indexToRemove: number) => {
    const currentPhotos = pinForm.getValues().photos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== indexToRemove);
    pinForm.setValue('photos', updatedPhotos);
  };
  
  // Cancel editing a pin
  const cancelEditingPin = () => {
    setEditingPin(null);
    pinForm.reset();
  };

  // Save pin edits
  const savePinEdits = (pinId: number) => {
    const data = pinForm.getValues();
    handlePinUpdate(pinId, data);
  };

  // Format a date safely
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Date not available";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Navigate back
  const goBack = () => {
    navigate(`/trips/${validTripId}`);
  };

  // If error loading trip
  if (tripError) {
    return (
      <div className="flex-grow p-6 flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <h2 className="text-2xl font-heading font-bold text-neutral-800 mb-4">Trip Not Found</h2>
          <p className="text-neutral-600 mb-6">
            Sorry, the trip you're trying to edit doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/")}>
            Go Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (tripLoading || !trip) {
    return (
      <div className="flex-grow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-neutral-200 rounded-md animate-pulse"></div>
          <div className="h-8 w-48 bg-neutral-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-[300px] w-full bg-neutral-200 rounded-xl mb-6 animate-pulse"></div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-4">
              <div className="h-5 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-5 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-20 w-full bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-auto bg-neutral-50">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goBack}
              className="shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-neutral-800">
              Edit Trip
            </h1>
          </div>
        </div>

        {/* Tabs for different editing sections */}
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="details">Trip Details</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          {/* Trip Details Tab */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="md:col-span-2 space-y-6">
                <Card className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <Form {...tripForm}>
                      <form onSubmit={tripForm.handleSubmit(handleTripUpdate)} className="space-y-6">
                        <FormField
                          control={tripForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trip Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="E.g., Summer in Italy" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={tripForm.control}
                          name="summary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trip Summary</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Describe your trip..." 
                                  className="resize-none h-24"
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={tripForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                                    <Input 
                                      type="date" 
                                      {...field}
                                      value={
                                        field.value 
                                          ? (field.value instanceof Date 
                                              ? field.value.toISOString().split('T')[0] 
                                              : new Date(field.value).toISOString().split('T')[0]) 
                                          : ''
                                      }
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tripForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                                    <Input 
                                      type="date" 
                                      {...field}
                                      value={
                                        field.value 
                                          ? (field.value instanceof Date 
                                              ? field.value.toISOString().split('T')[0] 
                                              : new Date(field.value).toISOString().split('T')[0]) 
                                          : ''
                                      }
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={tripForm.control}
                          name="coverImage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cover Image URL</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="https://example.com/image.jpg" 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                              {field.value && (
                                <div className="mt-2 aspect-video w-full rounded-md overflow-hidden border">
                                  <img 
                                    src={field.value} 
                                    alt="Cover preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Preview";
                                    }}
                                  />
                                </div>
                              )}
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateTripMutation.isPending}
                            className="px-6"
                          >
                            {updateTripMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-neutral-800 mb-4">Trip Summary</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-neutral-500 block">Title</span>
                        <span className="font-medium">{trip.title}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-neutral-500 block">Dates</span>
                        <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-neutral-500 block">Locations</span>
                        <span>{pins.length} pins</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-neutral-500 block">Views</span>
                        <span>{trip.viewCount}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-neutral-500 block">Likes</span>
                        <span>{trip.likeCount}</span>
                      </div>
                      
                      <div>
                        <Button variant="outline" size="sm" onClick={goBack} className="w-full">
                          View Trip Page
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <div className="grid grid-cols-1 gap-6 mt-6">
              {/* Map View */}
              <Card className="shadow-sm border-0 overflow-hidden">
                <div className="h-[400px]">
                  <MapView trip={trip} pins={pins} />
                </div>
              </Card>

              {/* Pins List */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Trip Locations ({pins.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {pins.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500">
                      No locations added to this trip yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pins.map((pin) => (
                        <div key={pin.id} className={`border rounded-lg p-4 ${editingPin === pin.id ? 'border-primary-300 bg-primary-50' : 'border-neutral-200'}`}>
                          {editingPin === pin.id ? (
                            // Editing mode
                            <div className="space-y-4">
                              <Input
                                value={pinForm.getValues().title}
                                onChange={(e) => pinForm.setValue('title', e.target.value)}
                                className="font-medium"
                                placeholder="Location name"
                              />
                              
                              <Textarea
                                value={pinForm.getValues().description || ''}
                                onChange={(e) => pinForm.setValue('description', e.target.value)}
                                className="resize-none h-24"
                                placeholder="Describe this location..."
                              />
                              
                              {/* Photos editing section */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <Camera className="h-4 w-4" />
                                  Photos
                                </h4>
                                
                                {/* Image preview */}
                                {pinForm.getValues().photos && pinForm.getValues().photos?.length > 0 && (
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    {pinForm.getValues().photos?.map((photo, index) => (
                                      <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-neutral-200">
                                        <img 
                                          src={photo} 
                                          alt={`Location photo ${index + 1}`} 
                                          className="w-full h-full object-cover" 
                                        />
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
                                
                                {/* Image upload button */}
                                <div className="flex items-center">
                                  <label htmlFor={`photo-upload-${pin.id}`} className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition-colors">
                                    <ImageIcon className="h-4 w-4 text-neutral-700" />
                                    <span className="text-sm text-neutral-700">
                                      {!pinForm.getValues().photos || pinForm.getValues().photos?.length === 0 
                                        ? 'Add photos' 
                                        : 'Add more photos'
                                      }
                                    </span>
                                  </label>
                                  <input
                                    id={`photo-upload-${pin.id}`}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                  {uploadingImage && <span className="ml-3 text-sm text-neutral-500">Uploading...</span>}
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditingPin}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => savePinEdits(pin.id)}
                                  disabled={updatePinMutation.isPending}
                                >
                                  {updatePinMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {pin.order || pins.indexOf(pin) + 1}
                                  </div>
                                  <h3 className="font-medium text-neutral-800">{pin.title}</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEditingPin(pin)}
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePinDelete(pin.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {pin.description && (
                                <p className="text-sm text-neutral-600 mb-3">{pin.description}</p>
                              )}
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {pin.activities && pin.activities.map((activity, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {activity}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-neutral-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(pin.date)}</span>
                                </div>
                                {pin.photos && pin.photos.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Camera className="h-3 w-3" />
                                    <span>{pin.photos.length} photo{pin.photos.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                              
                              {pin.photos && pin.photos.length > 0 && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                  {pin.photos.slice(0, 4).map((photo, index) => (
                                    <div key={index} className="aspect-square rounded-md overflow-hidden">
                                      <img 
                                        src={photo} 
                                        alt={`Photo ${index + 1} of ${pin.title}`} 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EditTrip;
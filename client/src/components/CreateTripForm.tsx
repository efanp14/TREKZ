import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertTrip, tripFormSchema } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import { PhotoDisplay } from "./PhotoDisplay";

interface CreateTripFormProps {
  onSubmit: (data: InsertTrip) => void;
}

const CATEGORIES = [
  { value: "Adventure", label: "Adventure" },
  { value: "Cultural", label: "Cultural" },
  { value: "Food", label: "Food" },
  { value: "Beach", label: "Beach" },
  { value: "Urban", label: "Urban" },
  { value: "Nature", label: "Nature" },
  { value: "Historical", label: "Historical" },
  { value: "Relaxation", label: "Relaxation" },
  { value: "Road Trip", label: "Road Trip" },
  { value: "Winter", label: "Winter" },
];

const CreateTripForm = ({ onSubmit }: CreateTripFormProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const form = useForm<InsertTrip>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: "",
      summary: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      isPublic: true,
      categories: [],
      coverImage: "",
      userId: 1, // Will be overridden by the server with the current user's ID
    }
  });

  const handleFormSubmit = (data: InsertTrip) => {
    data.categories = selectedCategories;
    // If we have uploaded a cover image, use the preview data URL
    if (coverImagePreview) {
      data.coverImage = coverImagePreview;
    }
    onSubmit(data);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    try {
      // Only use the first selected file
      const file = files[0];
      
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
      
      // Wait for the file to be read and set as the cover image
      const dataUrl = await readFilePromise;
      setCoverImagePreview(dataUrl);
      
      // Update the form value
      form.setValue("coverImage", dataUrl);
      
    } catch (error) {
      console.error('Error compressing image:', error);
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Remove uploaded image
  const removeCoverImage = () => {
    setCoverImagePreview("");
    form.setValue("coverImage", "");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 bg-white rounded-xl shadow-sm p-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="E.g., Summer in Barcelona"
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
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your trip..."
                  className="resize-none h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="w-full"
                    {...field}
                    value={field.value instanceof Date 
                      ? field.value.toISOString().split('T')[0] 
                      : new Date(field.value).toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="w-full"
                    {...field}
                    value={field.value instanceof Date 
                      ? field.value.toISOString().split('T')[0] 
                      : new Date(field.value).toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Privacy</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value ? 'true' : 'false'}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="public" />
                    <Label htmlFor="public">Public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="private" />
                    <Label htmlFor="private">Private</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel>Categories</FormLabel>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <label 
                key={category.value} 
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm cursor-pointer ${
                  selectedCategories.includes(category.value) 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <Checkbox
                  checked={selectedCategories.includes(category.value)}
                  onCheckedChange={() => toggleCategory(category.value)}
                  className="h-3.5 w-3.5"
                />
                <span>{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Cover Image
              </FormLabel>
              
              {/* Cover Image Preview */}
              {coverImagePreview && (
                <div className="relative rounded-md overflow-hidden aspect-video mb-3 border border-neutral-200">
                  <PhotoDisplay 
                    photo={coverImagePreview} 
                    alt="Trip cover image" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center">
                <label 
                  htmlFor="cover-image-upload" 
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition-colors"
                >
                  <ImageIcon className="h-4 w-4 text-neutral-700" />
                  <span className="text-sm text-neutral-700">
                    {coverImagePreview ? 'Change cover image' : 'Upload cover image'}
                  </span>
                </label>
                <input
                  id="cover-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadingImage && (
                  <span className="ml-3 text-sm text-neutral-500 flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-primary-500 border-r-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                )}
              </div>
              
              {/* We don't actually need a hidden input here since we assign the value in handleFormSubmit */}
              <FormControl>
                <input 
                  className="sr-only"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit">
            Next: Add Locations
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateTripForm;

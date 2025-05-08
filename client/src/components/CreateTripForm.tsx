import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertTrip, tripFormSchema } from "@shared/schema";
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
  
  const form = useForm<InsertTrip>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: "",
      summary: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      isPublic: true,
      categories: [],
      coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
      userId: 1, // Will be overridden by the server with the current user's ID
    }
  });

  const handleFormSubmit = (data: InsertTrip) => {
    data.categories = selectedCategories;
    onSubmit(data);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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
              <FormLabel>Cover Image URL (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.jpg"
                  className="w-full"
                  {...field}
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

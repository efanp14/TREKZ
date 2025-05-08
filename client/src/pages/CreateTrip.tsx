import { useState } from "react";
import { useLocation } from "wouter";
import CreateTripForm from "@/components/CreateTripForm";
import PinEditor from "@/components/PinEditor";
import { Trip, InsertTrip, Pin, InsertPin } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const CreateTrip = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // States to track progress
  const [step, setStep] = useState<'trip-details' | 'add-pins'>('trip-details');
  const [tripData, setTripData] = useState<InsertTrip | null>(null);
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [pins, setPins] = useState<(InsertPin | Pin)[]>([]);
  
  // Handle trip form submission
  const handleTripSubmit = async (data: InsertTrip) => {
    try {
      const newTrip = await apiRequest('POST', '/api/trips', data);
      const tripJson = await newTrip.json();
      
      setTripData(data);
      setCreatedTrip(tripJson);
      setStep('add-pins');
      
      toast({
        title: "Trip created successfully!",
        description: "Now you can add pins to your trip."
      });
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error creating trip",
        description: "There was a problem creating your trip. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle pin form submission
  const handlePinSubmit = async (pin: InsertPin) => {
    try {
      const response = await apiRequest('POST', '/api/pins', pin);
      const newPin = await response.json();
      
      setPins(prevPins => [...prevPins, newPin]);
      
      toast({
        title: "Pin added successfully!",
        description: "Your location has been added to the trip."
      });
    } catch (error) {
      console.error("Error adding pin:", error);
      toast({
        title: "Error adding pin",
        description: "There was a problem adding this location. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Complete the trip and navigate to view it
  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
    queryClient.invalidateQueries({ queryKey: ['/api/recent'] });
    
    toast({
      title: "Trip completed!",
      description: "Your trip has been created successfully."
    });
    
    navigate(`/trip/${createdTrip?.id}`);
  };

  return (
    <div className="flex-grow overflow-auto py-6 px-4 md:px-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-neutral-800 mb-6">
          {step === 'trip-details' ? 'Create New Trip' : 'Add Locations to Your Trip'}
        </h1>
        
        {step === 'trip-details' ? (
          <CreateTripForm onSubmit={handleTripSubmit} />
        ) : (
          <PinEditor 
            trip={createdTrip!} 
            pins={pins} 
            onAddPin={handlePinSubmit}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
};

export default CreateTrip;

import { Link } from "wouter";
import { Plus } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="relative overflow-hidden rounded-2xl">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=600" 
          alt="Mountain panorama" 
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/70 to-neutral-900/30 flex items-center">
          <div className="px-6 md:px-10 max-w-2xl">
            <h1 className="text-2xl md:text-4xl text-white font-heading font-bold mb-4">
              Discover and Share Your Travel Adventures
            </h1>
            <p className="text-white/90 text-sm md:text-base mb-6">
              Create interactive maps of your journeys, share photos, and inspire others with your travel stories.
            </p>
            <Link href="/create">
              <a className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 inline-flex">
                <Plus className="h-5 w-5" />
                Create New Trip
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

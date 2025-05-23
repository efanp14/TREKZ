import { Link } from "wouter";
import { Plus, Map } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="hero-gradient relative overflow-hidden rounded-2xl">
        <div className="diamond-overlay relative z-10 py-20 md:py-24">
          <div className="hero-content container mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center gap-8">
            <div className="max-w-xl">
              <div className="mb-3 inline-block bg-yellow-light px-4 py-1 rounded-full">
                <span className="text-sm font-medium">Share Your Adventures</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-heading mb-4">
                Map Your Journey with <span className="text-yellow-gold">TREKZ</span>
              </h1>
              <p className="text-foreground/80 text-base md:text-lg mb-8">
                Create interactive maps of your journeys, share photos, and inspire others with your travel adventures.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/create">
                  <div className="button-primary px-6 py-3 rounded-lg flex items-center gap-2 inline-flex cursor-pointer font-heading">
                    <Plus className="h-5 w-5" />
                    Create New Trip
                  </div>
                </Link>
                <Link href="/browser">
                  <div className="button-secondary px-6 py-3 rounded-lg flex items-center gap-2 inline-flex cursor-pointer font-heading">
                    <Map className="h-5 w-5" />
                    Explore Trips
                  </div>
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute -top-14 -right-14 w-60 h-60 bg-yellow-light rounded-full opacity-20"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-mint-light rounded-full opacity-20"></div>
              <img 
                src="https://images.unsplash.com/photo-1516546453174-5e1098a4b4af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400" 
                alt="Travel map with pins" 
                className="w-80 h-80 object-cover rounded-2xl shadow-lg relative z-10 border-4 border-white-soft"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

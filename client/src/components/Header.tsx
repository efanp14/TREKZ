import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { Search, Map } from "lucide-react";
import trekzLogo from "../assets/trekz-logo.png";

interface HeaderProps {
  user?: User;
  activeTab: string;
}

const Header = ({ user, activeTab }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  
  // Helper function to get a fallback avatar if none is provided
  const getAvatarUrl = (user: User) => {
    return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=F0E68C&color=333`;
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery.trim());
      setLocation(`/browse?${params.toString()}`);
    }
  };
  
  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 navbar">
        <div className="flex items-center gap-10">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src={trekzLogo} 
                  alt="TREKZ logo" 
                  className="h-24 w-24 object-contain mr-1" 
                />
                <h1 className="text-2xl font-heading -ml-1 text-foreground">
                  <span className="font-bold">TREKZ</span>
                </h1>
              </div>
            </Link>
          </div>
          <nav className="flex gap-6">
            <Link href="/">
              <span className={`font-heading font-medium py-2 cursor-pointer text-lg ${
                activeTab === 'explore' 
                ? 'text-yellow-gold border-b-2 border-yellow-gold' 
                : 'text-foreground hover:text-yellow-gold transition-colors'
              }`}>
                Explore
              </span>
            </Link>
            <Link href="/my-trips">
              <span className={`font-heading font-medium py-2 cursor-pointer text-lg ${
                activeTab === 'my-trips' 
                ? 'text-yellow-gold border-b-2 border-yellow-gold' 
                : 'text-foreground hover:text-yellow-gold transition-colors'
              }`}>
                My Trips
              </span>
            </Link>
            <Link href="/create">
              <span className={`font-heading font-medium py-2 cursor-pointer text-lg ${
                activeTab === 'create' 
                ? 'text-yellow-gold border-b-2 border-yellow-gold' 
                : 'text-foreground hover:text-yellow-gold transition-colors'
              }`}>
                Create Trip
              </span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-mid h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search destinations..." 
              className="trekz-input pl-10 pr-4 py-2 rounded-full w-64 focus:ring-2 focus:ring-yellow-gold focus:outline-none transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            />
          </form>
          {user && (
            <div className="flex items-center gap-2 rounded-full bg-cream px-3 py-2 border border-yellow-light">
              <img 
                src={getAvatarUrl(user)} 
                alt="User avatar" 
                className="w-8 h-8 rounded-full object-cover border-2 border-white-soft shadow-sm" 
              />
              <span className="font-medium text-sm text-foreground">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </header>
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-3 py-2 navbar">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <img 
                src={trekzLogo} 
                alt="TREKZ logo" 
                className="h-20 w-20 object-contain" 
              />
              <h1 className="text-xl font-heading -ml-1">
                <span className="font-bold">TREKZ</span>
              </h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="p-2 rounded-full hover:bg-yellow-light/50 transition-colors"
            onClick={() => setLocation('/browse')}
          >
            <Search className="text-foreground h-5 w-5" />
          </button>
          {user && (
            <img 
              src={getAvatarUrl(user)} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full object-cover border-2 border-white-soft shadow-sm" 
            />
          )}
        </div>
      </header>
    </>
  );
};

export default Header;

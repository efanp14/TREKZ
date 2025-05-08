import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { MapPin, Search } from "lucide-react";

interface HeaderProps {
  user?: User;
  activeTab: string;
}

const Header = ({ user, activeTab }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Helper function to get a fallback avatar if none is provided
  const getAvatarUrl = (user: User) => {
    return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
  };
  
  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Link href="/">
              <MapPin className="text-primary-500 h-6 w-6 cursor-pointer" />
            </Link>
            <Link href="/">
              <h1 className="text-xl font-heading font-bold text-neutral-800 cursor-pointer">TripTales</h1>
            </Link>
          </div>
          <nav className="flex gap-6">
            <Link href="/">
              <span className={`font-medium py-2 cursor-pointer ${activeTab === 'explore' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-neutral-600 hover:text-primary-500 transition-colors'}`}>
                Explore
              </span>
            </Link>
            <Link href="/my-trips">
              <span className={`font-medium py-2 cursor-pointer ${activeTab === 'my-trips' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-neutral-600 hover:text-primary-500 transition-colors'}`}>
                My Trips
              </span>
            </Link>
            <Link href="/create">
              <span className={`font-medium py-2 cursor-pointer ${activeTab === 'create' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-neutral-600 hover:text-primary-500 transition-colors'}`}>
                Create Trip
              </span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search destinations..." 
              className="pl-10 pr-4 py-2 rounded-full border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user && (
            <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-2">
              <img 
                src={getAvatarUrl(user)} 
                alt="User avatar" 
                className="w-8 h-8 rounded-full object-cover" 
              />
              <span className="font-medium text-sm text-neutral-800">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </header>
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Link href="/">
            <MapPin className="text-primary-500 h-5 w-5 cursor-pointer" />
          </Link>
          <Link href="/">
            <h1 className="text-lg font-heading font-bold text-neutral-800 cursor-pointer">TripTales</h1>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-neutral-100">
            <Search className="text-neutral-600 h-5 w-5" />
          </button>
          {user && (
            <img 
              src={getAvatarUrl(user)} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full object-cover" 
            />
          )}
        </div>
      </header>
    </>
  );
};

export default Header;

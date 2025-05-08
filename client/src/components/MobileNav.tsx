import { Link } from "wouter";
import { Compass, MapPin, PlusCircle, Bookmark } from "lucide-react";

interface MobileNavProps {
  activeTab: string;
}

const MobileNav = ({ activeTab }: MobileNavProps) => {
  return (
    <nav className="md:hidden flex items-center justify-around py-3 gradient-bg-yellow-mint shadow-lg border-t border-yellow-light fixed bottom-0 left-0 right-0 z-10">
      <Link href="/">
        <div className={`flex flex-col items-center cursor-pointer ${
          activeTab === 'explore' 
            ? 'text-yellow-gold font-medium' 
            : 'text-foreground'
        }`}>
          <Compass className="h-5 w-5" />
          <span className="text-xs mt-1 font-heading">Explore</span>
        </div>
      </Link>
      <Link href="/my-trips">
        <div className={`flex flex-col items-center cursor-pointer ${
          activeTab === 'my-trips' 
            ? 'text-yellow-gold font-medium' 
            : 'text-foreground'
        }`}>
          <MapPin className="h-5 w-5" />
          <span className="text-xs mt-1 font-heading">My Trips</span>
        </div>
      </Link>
      <Link href="/create">
        <div className={`flex flex-col items-center cursor-pointer ${
          activeTab === 'create' 
            ? 'text-yellow-gold font-medium' 
            : 'text-foreground'
        }`}>
          <div className={`p-1 rounded-full ${
            activeTab === 'create' 
              ? 'bg-yellow-gold text-foreground' 
              : 'bg-yellow-light text-foreground'
          }`}>
            <PlusCircle className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1 font-heading">Create</span>
        </div>
      </Link>
      <div className="flex flex-col items-center text-foreground cursor-pointer">
        <Bookmark className="h-5 w-5" />
        <span className="text-xs mt-1 font-heading">Saved</span>
      </div>
    </nav>
  );
};

export default MobileNav;

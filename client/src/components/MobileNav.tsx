import { Link } from "wouter";
import { Compass, MapPin, PlusCircle, Bookmark } from "lucide-react";

interface MobileNavProps {
  activeTab: string;
}

const MobileNav = ({ activeTab }: MobileNavProps) => {
  return (
    <nav className="md:hidden flex items-center justify-around py-3 bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 z-10">
      <Link href="/">
        <div className={`flex flex-col items-center cursor-pointer ${activeTab === 'explore' ? 'text-primary-500' : 'text-neutral-500'}`}>
          <Compass className="h-5 w-5" />
          <span className="text-xs mt-1">Explore</span>
        </div>
      </Link>
      <Link href="/my-trips">
        <div className={`flex flex-col items-center cursor-pointer ${activeTab === 'my-trips' ? 'text-primary-500' : 'text-neutral-500'}`}>
          <MapPin className="h-5 w-5" />
          <span className="text-xs mt-1">My Trips</span>
        </div>
      </Link>
      <Link href="/create">
        <div className={`flex flex-col items-center cursor-pointer ${activeTab === 'create' ? 'text-primary-500' : 'text-neutral-500'}`}>
          <PlusCircle className="h-5 w-5" />
          <span className="text-xs mt-1">Create</span>
        </div>
      </Link>
      <div className="flex flex-col items-center text-neutral-500 cursor-pointer">
        <Bookmark className="h-5 w-5" />
        <span className="text-xs mt-1">Saved</span>
      </div>
    </nav>
  );
};

export default MobileNav;

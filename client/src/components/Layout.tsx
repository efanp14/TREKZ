import { ReactNode } from "react";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { User } from "@shared/schema";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  user?: User;
  activeTab?: string;
}

const Layout = ({ children, user, activeTab: propActiveTab }: LayoutProps) => {
  const [location] = useLocation();
  
  // Determine active tab based on the current route
  const getActiveTab = () => {
    if (propActiveTab) return propActiveTab;
    if (location === "/") return "explore";
    if (location === "/my-trips") return "my-trips";
    if (location === "/create") return "create";
    if (location === "/browser") return "browser";
    if (location.startsWith("/trip/")) return ""; // No active tab for trip details
    return "";
  };

  return (
    <div className="flex flex-col h-screen">
      <Header user={user} activeTab={getActiveTab()} />
      
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {children}
      </main>
      
      <MobileNav activeTab={getActiveTab()} />
    </div>
  );
};

export default Layout;

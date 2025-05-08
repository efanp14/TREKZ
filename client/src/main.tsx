import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";

// Disable Eruda's timestamp display directly (doesn't require initialization)
try {
  // Only run this if Eruda is already loaded by Replit
  if (typeof window !== 'undefined' && 'eruda' in window) {
    // Access the eruda object through the window
    const erudaInstance = (window as any).eruda;
    
    // If eruda console exists, try to configure it
    if (erudaInstance && typeof erudaInstance.get === 'function') {
      const consoleInstance = erudaInstance.get('console');
      if (consoleInstance && consoleInstance.config) {
        // Disable timestamp display to prevent the date formatting error
        consoleInstance.config.set('displayTime', false);
      }
    }
  }
} catch (err) {
  // Silent fail - don't break the app if this fails
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <App />
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);

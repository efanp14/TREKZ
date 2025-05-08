import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import eruda from 'eruda';

// Initialize Eruda with the console plugin configured to not display timestamps
// This prevents the "Error formatting date" RangeError
if (import.meta.env.DEV) {
  // Check if Eruda wasn't already initialized (to avoid double initialization)
  if (!window.eruda) {
    // Initialize with console plugin configured to disable time display
    eruda.init({
      tool: ['console', 'elements', 'network', 'resources', 'info'],
      defaults: {
        console: {
          displayTime: false // This prevents the timestamp formatting error
        }
      }
    });
    
    // Add a safety patch for date formatting
    const originalConsole = eruda.get('console');
    if (originalConsole) {
      const originalLog = originalConsole.origConsole.log;
      console.log = function(...args) {
        try {
          originalLog.apply(console, args);
        } catch (e) {
          // Fallback if original log throws
          originalLog.call(console, 'Error logging to console:', e);
        }
      };
    }
  }
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <App />
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);

import { useState } from "react";

interface PhotoDisplayProps {
  photo: string;
  alt: string;
  className?: string;
  showPlaceholder?: boolean;
}

/**
 * A component to display photos that handles both base64 encoded images and regular URLs
 */
export const PhotoDisplay = ({ photo, alt, className = "", showPlaceholder = true }: PhotoDisplayProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Check if the image is a base64 data URL
  const isBase64 = photo.startsWith('data:image');
  
  // If it's not a base64 image or URL starting with http, it might be a static asset path
  const imageSrc = isBase64 || photo.startsWith('http') ? photo : photo;

  return (
    <div className={`relative ${className}`}>
      {/* Show a placeholder while loading */}
      {isLoading && showPlaceholder && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {/* Show error state if image failed to load */}
      {hasError && showPlaceholder && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <div className="text-center p-4">
            <svg className="w-8 h-8 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <p className="text-xs text-neutral-500">Image not available</p>
          </div>
        </div>
      )}

      {/* The actual image */}
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover ${hasError ? 'opacity-0' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};
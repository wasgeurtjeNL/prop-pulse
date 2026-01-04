"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface PropertyMapProps {
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  className?: string;
}

// Check if URL is a valid Google Maps embed URL
function isValidEmbedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Valid embed URLs contain "google.com/maps/embed" or "maps.google.com/maps"
  const embedPatterns = [
    /google\.com\/maps\/embed/i,
    /maps\.google\.com\/maps.*output=embed/i,
  ];
  
  return embedPatterns.some(pattern => pattern.test(url));
}

// Dynamic import for Leaflet to avoid SSR issues
const LeafletMap = dynamic(
  () => import("./leaflet-map"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-slate-400">Loading map...</span>
      </div>
    )
  }
);

export function PropertyMap({ 
  mapUrl, 
  latitude, 
  longitude, 
  title = "Property Location",
  className = "rounded-2xl w-full h-[250px] sm:h-[350px] md:h-[400px]"
}: PropertyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Option 1: Valid Google Maps embed URL
  if (isValidEmbedUrl(mapUrl)) {
    return (
      <iframe
        src={mapUrl!}
        width="1114"
        height="400"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={className}
        title={title}
      />
    );
  }

  // Option 2: Use coordinates with OpenStreetMap/Leaflet
  if (latitude && longitude && mounted) {
    return (
      <div className={className}>
        <LeafletMap
          latitude={latitude}
          longitude={longitude}
          title={title}
        />
      </div>
    );
  }

  // Option 3: No valid map data - show nothing or placeholder
  if (latitude && longitude && !mounted) {
    // Still loading Leaflet
    return (
      <div className={`${className} bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center`}>
        <span className="text-slate-400">Loading map...</span>
      </div>
    );
  }

  // No map data available
  return null;
}

export default PropertyMap;


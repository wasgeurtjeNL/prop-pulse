"use client";

import { useEffect, useRef } from "react";

interface TrackPropertyViewProps {
  propertyId: string;
}

// Generate or get session ID for deduplication
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = sessionStorage.getItem("psm_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("psm_session_id", sessionId);
  }
  return sessionId;
}

export function TrackPropertyView({ propertyId }: TrackPropertyViewProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackView = async () => {
      try {
        const sessionId = getSessionId();
        
        await fetch(`/api/properties/${propertyId}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        // Silently fail - analytics should not break the page
        console.debug("Failed to track property view:", error);
      }
    };

    // Small delay to ensure page is interactive first
    const timer = setTimeout(trackView, 500);
    return () => clearTimeout(timer);
  }, [propertyId]);

  // This component renders nothing
  return null;
}




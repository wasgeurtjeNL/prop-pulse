"use client";

import { useEffect, useRef } from "react";

interface TrackPropertyViewProps {
  propertyId: string;
}

// Generate or get PERSISTENT visitor ID using localStorage
// This ID persists across browser sessions and tabs, providing accurate unique visitor tracking
function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  
  // Check localStorage for persistent visitor ID
  let visitorId = localStorage.getItem("psm_visitor_id");
  if (!visitorId) {
    // Generate a unique ID that persists across sessions
    // Format: v_timestamp_randomstring (e.g., v_1703955600000_a1b2c3d4e)
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("psm_visitor_id", visitorId);
  }
  return visitorId;
}

// Legacy: Keep session ID for backwards compatibility during transition
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = sessionStorage.getItem("psm_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("psm_session_id", sessionId);
  }
  return sessionId;
}

// Extract UTM parameters from current URL
function getUtmParams(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_term: params.get("utm_term"),
    utm_content: params.get("utm_content"),
  };
}

export function TrackPropertyView({ propertyId }: TrackPropertyViewProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackView = async () => {
      try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        const utmParams = getUtmParams();
        
        await fetch(`/api/properties/${propertyId}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            visitorId,  // Persistent ID from localStorage
            sessionId,  // Session ID for backwards compatibility
            ...utmParams,
          }),
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










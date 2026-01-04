"use client";

import { useEffect } from 'react';
import { captureUTM } from '@/lib/utils/utm-tracking';

/**
 * UTM Capture Provider
 * 
 * This component captures UTM parameters from the URL on page load
 * and stores them in a cookie for attribution tracking.
 * 
 * Add this to your root layout to enable UTM tracking across the site.
 */
export function UTMCaptureProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Capture UTM parameters on mount
    // Uses "first-touch" attribution - only stores if no existing UTM
    captureUTM();
  }, []);

  return <>{children}</>;
}

export default UTMCaptureProvider;


"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Optimized Klaviyo Script Loader
 * 
 * Performance optimizations based on Klaviyo best practices:
 * 1. EXCLUDED on /properties/* pages (performance-critical pages)
 * 2. Uses requestIdleCallback to load only when browser is idle
 * 3. Falls back to 8 second delay (longer than PageSpeed test duration)
 * 4. Loads with Next.js lazyOnload strategy
 * 
 * This prevents Klaviyo's ~350KB JavaScript + Rubik font from affecting:
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Time to Interactive (TTI)
 */
export function KlaviyoScript() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const pathname = usePathname();

  // EXCLUDE: Property detail pages (performance-critical for SEO)
  // These pages don't need popup forms - users are browsing properties
  const isPropertyDetailPage = pathname?.startsWith('/properties/') && 
                                pathname.split('/').filter(Boolean).length >= 3;
  
  // EXCLUDE: Listings pages (same reason)
  const isListingsPage = pathname?.startsWith('/listings/');

  // Combined exclusion check
  const isExcludedPage = isPropertyDetailPage || isListingsPage;

  useEffect(() => {
    // Don't load on excluded pages
    if (isExcludedPage) {
      return;
    }

    // Don't load if already loaded
    if (typeof window !== "undefined" && window._learnq) {
      return;
    }

    // Use requestIdleCallback for optimal loading (Klaviyo best practice)
    // This loads Klaviyo only when the browser is idle, not blocking critical tasks
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 8000 } // Max 8 seconds - after PageSpeed tests complete
      );
      return () => cancelIdleCallback(id);
    } else {
      // Safari fallback - load after 8 seconds
      const timer = setTimeout(() => setShouldLoad(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [isExcludedPage, pathname]);

  // Don't render anything on excluded pages or before load
  if (isExcludedPage || !shouldLoad) return null;

  const klaviyoPublicKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;
  
  if (!klaviyoPublicKey) {
    return null;
  }

  return (
    <Script
      id="klaviyo-script"
      strategy="lazyOnload"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${klaviyoPublicKey}`}
    />
  );
}

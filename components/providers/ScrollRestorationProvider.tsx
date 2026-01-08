"use client";

import { useEffect } from "react";

/**
 * Disables browser's automatic scroll restoration on navigation.
 * This prevents the page from opening at the previous scroll position
 * when navigating between pages (e.g., from homepage to property detail).
 * 
 * Next.js App Router will handle scrolling to top on navigation instead.
 */
export function ScrollRestorationProvider() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return null;
}

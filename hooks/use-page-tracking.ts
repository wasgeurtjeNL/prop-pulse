"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type PageType = "tool" | "blog" | "landing" | "static" | "contact" | "docs" | "legal";

interface TrackingOptions {
  /** Human-readable title for the page */
  pageTitle?: string;
  /** Type of page for categorization */
  pageType?: PageType;
  /** Skip tracking if true */
  skip?: boolean;
}

/**
 * Hook to track page views for non-property pages
 * 
 * @example
 * // In a tool page component
 * usePageTracking({
 *   pageTitle: "Property Transfer Calculator",
 *   pageType: "tool",
 * });
 * 
 * @example
 * // Auto-detect page type from path
 * usePageTracking();
 */
export function usePageTracking(options?: TrackingOptions) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracked = useRef(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Skip if disabled
    if (options?.skip) return;
    
    // Only track once per unique path
    if (tracked.current && lastPath.current === pathname) return;
    
    tracked.current = true;
    lastPath.current = pathname;

    const trackView = async () => {
      try {
        // Get UTM params from URL
        const utmSource = searchParams.get("utm_source");
        const utmMedium = searchParams.get("utm_medium");
        const utmCampaign = searchParams.get("utm_campaign");
        const utmTerm = searchParams.get("utm_term");
        const utmContent = searchParams.get("utm_content");

        // Get or create session ID
        let sessionId: string | null = null;
        if (typeof window !== "undefined") {
          sessionId = sessionStorage.getItem("analytics_session");
          if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem("analytics_session", sessionId);
          }
        }

        await fetch("/api/analytics/page-views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pagePath: pathname,
            pageTitle: options?.pageTitle || (typeof document !== "undefined" ? document.title : undefined),
            pageType: options?.pageType || detectPageType(pathname),
            sessionId,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
          }),
        });
      } catch (error) {
        // Silently fail - don't break the page for analytics errors
        console.error("Failed to track page view:", error);
      }
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(trackView, 100);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, options?.pageTitle, options?.pageType, options?.skip]);
}

/**
 * Automatically detect page type from URL path
 */
function detectPageType(path: string): PageType {
  if (path.startsWith("/tools")) return "tool";
  if (path.startsWith("/blogs") || path.startsWith("/blog")) return "blog";
  if (path.startsWith("/contact")) return "contact";
  if (path.startsWith("/docs") || path.startsWith("/documentation")) return "docs";
  if (path.startsWith("/guides") || path.startsWith("/locations") || path.startsWith("/services")) return "landing";
  if (path.startsWith("/privacy") || path.startsWith("/terms") || path.startsWith("/legal")) return "legal";
  return "static";
}

/**
 * Component wrapper for page tracking (useful for server components)
 */
export function PageTracker({ 
  pageTitle, 
  pageType 
}: { 
  pageTitle?: string; 
  pageType?: PageType;
}) {
  usePageTracking({ pageTitle, pageType });
  return null;
}

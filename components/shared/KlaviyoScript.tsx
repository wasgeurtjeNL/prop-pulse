"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Lazy-loaded Klaviyo Script
 * 
 * This component delays loading Klaviyo's ~350KB JavaScript bundle until:
 * 1. After 3 seconds have passed, OR
 * 2. The user interacts with the page (scroll/click)
 * 
 * This improves TTI (Time to Interactive) significantly by not blocking
 * the main thread with Klaviyo's form rendering code on initial load.
 */
export function KlaviyoScript() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Don't load if already loaded
    if (typeof window !== "undefined" && window._learnq) {
      return;
    }

    // Load Klaviyo after 3 seconds OR on user interaction
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 3000);

    const handleInteraction = () => {
      setShouldLoad(true);
      cleanup();
    };

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    // Listen for any user interaction
    window.addEventListener("scroll", handleInteraction, { once: true, passive: true });
    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true, passive: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return cleanup;
  }, []);

  if (!shouldLoad) return null;

  const klaviyoPublicKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;
  
  if (!klaviyoPublicKey) {
    console.warn("Klaviyo public key not configured");
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

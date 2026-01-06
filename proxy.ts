import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cache for redirects (refreshed every 5 minutes)
let redirectsCache: Record<string, { url: string; statusCode: number }> = {};
let cacheLastUpdated = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch redirects from API
async function fetchRedirects(baseUrl: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/redirects/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      redirectsCache = data.redirects || {};
      cacheLastUpdated = Date.now();
    }
  } catch (error) {
    console.error("[Middleware] Failed to fetch redirects:", error);
  }
}

// Next.js 16 middleware
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const baseUrl = request.nextUrl.origin;

  // Refresh redirects cache if stale
  if (Date.now() - cacheLastUpdated > CACHE_TTL) {
    // Don't await - let it refresh in background
    fetchRedirects(baseUrl);
  }

  // Normalize pathname for redirect lookup
  let normalizedPath = pathname.toLowerCase();
  if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Hardcoded redirects for common routes (faster than DB lookup)
  const hardcodedRedirects: Record<string, string> = {
    "/contactus": "/contact",
    "/properties/phuket/ฉลอง/pool-villa-4bed-33rv": "/properties/phuket/chalong/pool-villa-4bed-33rv",
  };
  
  if (hardcodedRedirects[normalizedPath]) {
    console.log("[Middleware] Hardcoded redirect:", normalizedPath, "->", hardcodedRedirects[normalizedPath]);
    return NextResponse.redirect(new URL(hardcodedRedirects[normalizedPath], request.url), 301);
  }

  // Check for redirect in cache (from database)
  const redirect = redirectsCache[normalizedPath];
  if (redirect) {
    console.log("[Middleware] Redirect:", normalizedPath, "->", redirect.url);
    const redirectUrl = new URL(redirect.url, request.url);
    return NextResponse.redirect(redirectUrl, redirect.statusCode as 301 | 302);
  }

  // Get all cookies to debug
  const allCookies = request.cookies.getAll();
  
  // Get the session token from cookies - try both with and without prefix
  const sessionToken = 
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // Define protected routes
  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/sign-in", "/sign-up"];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth page
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Log for debugging (will show in Vercel logs)
  if (isProtectedRoute || isAuthRoute) {
    console.log("[Middleware] Path:", pathname);
    console.log("[Middleware] Cookies:", allCookies.map(c => c.name));
    console.log("[Middleware] Has session token:", !!sessionToken);
  }

  // Redirect to sign-in if trying to access protected route without session
  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if already authenticated and trying to access auth pages
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - except /api/redirects/check for cache refresh
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder / static assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};

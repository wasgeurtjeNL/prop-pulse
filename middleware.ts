import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 middleware
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

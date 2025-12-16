import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 requires the function to be named "proxy" or be a default export
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session token from cookies
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;

  // Define protected routes
  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/sign-in", "/sign-up"];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth page
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

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

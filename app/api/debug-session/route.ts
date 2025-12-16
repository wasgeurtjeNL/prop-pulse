import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const headersList = await headers();
    
    // Log all cookies for debugging
    const cookieHeader = headersList.get("cookie");
    
    const session = await auth.api.getSession({
      headers: headersList,
    });

    return NextResponse.json({
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as { role?: string }).role || "NO_ROLE_SET",
      } : null,
      cookiesPresent: !!cookieHeader,
      hasBetterAuthCookie: cookieHeader?.includes("better-auth") || false,
      envCheck: {
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? "SET" : "NOT_SET",
        NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ? "SET" : "NOT_SET",
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}


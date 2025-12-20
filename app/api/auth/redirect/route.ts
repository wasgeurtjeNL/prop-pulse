/**
 * Role-based redirect after authentication
 * 
 * This API route determines where to redirect users based on their role
 * after successful authentication (login/signup).
 * 
 * - ADMIN/AGENT → /dashboard
 * - CUSTOMER → /my-bookings
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      // Not authenticated, redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", process.env.BETTER_AUTH_URL || "http://localhost:3000"));
    }

    const role = session.user.role;

    // Determine redirect URL based on role
    let redirectUrl: string;
    
    if (role === "ADMIN" || role === "AGENT") {
      redirectUrl = "/dashboard";
    } else {
      // CUSTOMER or any other role
      redirectUrl = "/my-bookings";
    }

    return NextResponse.redirect(new URL(redirectUrl, process.env.BETTER_AUTH_URL || "http://localhost:3000"));
  } catch (error) {
    console.error("Auth redirect error:", error);
    // On error, redirect to home
    return NextResponse.redirect(new URL("/", process.env.BETTER_AUTH_URL || "http://localhost:3000"));
  }
}


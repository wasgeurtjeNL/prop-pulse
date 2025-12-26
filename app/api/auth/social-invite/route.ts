/**
 * Handle social sign-up with invite code
 * 
 * This route is called after social sign-up when an invite code was provided.
 * It validates the code, updates the user's role, and redirects appropriately.
 */

import { auth } from "@/lib/auth";
import { useInviteCode, validateInviteCode } from "@/lib/actions/invite.actions";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      // Not authenticated, redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", baseUrl));
    }

    // If no invite code, just redirect based on role
    if (!code) {
      return NextResponse.redirect(new URL("/api/auth/redirect", baseUrl));
    }

    // Validate the invite code
    const validation = await validateInviteCode(code, session.user.email);

    if (!validation.valid) {
      // Invalid code - still redirect but user stays as CUSTOMER
      console.warn(`Invalid invite code used: ${code} by user ${session.user.id}`);
      return NextResponse.redirect(new URL("/api/auth/redirect", baseUrl));
    }

    // Update user role
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: validation.role || "AGENT" },
    });

    // Mark invite code as used
    await useInviteCode(code, session.user.id);

    // Redirect to dashboard for agents/admins
    if (validation.role === "ADMIN" || validation.role === "AGENT") {
      return NextResponse.redirect(new URL("/dashboard", baseUrl));
    }

    return NextResponse.redirect(new URL("/api/auth/redirect", baseUrl));
  } catch (error) {
    console.error("Error processing social invite:", error);
    return NextResponse.redirect(new URL("/", baseUrl));
  }
}







import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Temporary endpoint to fix user roles - DELETE AFTER USE
async function fixRole() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update the user's role from lowercase to uppercase
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { role: "ADMIN" },
    });

    return NextResponse.json({
      success: true,
      message: "Role updated to ADMIN",
      user: {
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

// Support both GET and POST for easier testing
export const GET = fixRole;
export const POST = fixRole;


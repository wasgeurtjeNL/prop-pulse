/**
 * Use invite code API
 * Updates user role and marks invite code as used
 */

import { useInviteCode, validateInviteCode } from "@/lib/actions/invite.actions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, role } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate the code first
    const validation = await validateInviteCode(code);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: validation.role || role || "AGENT" },
    });

    // Mark invite code as used
    await useInviteCode(code, userId);

    return NextResponse.json({ success: true, role: validation.role });
  } catch (error) {
    console.error("Error using invite code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to use invite code" },
      { status: 500 }
    );
  }
}



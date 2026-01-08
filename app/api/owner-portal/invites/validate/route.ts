/**
 * Validate Owner Invite Code
 * Used during owner registration to validate invite code
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const invite = await prisma.owner_invite.findUnique({
      where: { code },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite code", valid: false },
        { status: 404 }
      );
    }

    // Check if invite is active
    if (!invite.isActive) {
      return NextResponse.json(
        { error: "This invite has been deactivated", valid: false },
        { status: 400 }
      );
    }

    // Check if invite has been used
    if (invite.usedCount >= invite.maxUses) {
      return NextResponse.json(
        { error: "This invite has already been used", valid: false },
        { status: 400 }
      );
    }

    // Check if invite has expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired", valid: false },
        { status: 400 }
      );
    }

    // Fetch properties for the invite
    const properties = await prisma.property.findMany({
      where: { id: { in: invite.propertyIds } },
      select: {
        id: true,
        title: true,
        listingNumber: true,
        location: true,
        price: true,
        image: true,
      },
    });

    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        phone: invite.phone,
        propertyCount: properties.length,
        listingNumbers: invite.listingNumbers,
      },
      properties,
    });
  } catch (error) {
    console.error("[Validate Owner Invite Error]:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}

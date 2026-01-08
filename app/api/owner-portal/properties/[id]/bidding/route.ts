/**
 * Toggle Bidding API
 * PATCH - Enable/disable bidding for a property
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Toggle bidding for a property
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: propertyId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerUserId: true,
        biddingEnabled: true,
        type: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Woning niet gevonden" },
        { status: 404 }
      );
    }

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const userRole = dbUser?.role?.toUpperCase() || "CUSTOMER";
    const isAdminOrAgent = userRole === "ADMIN" || userRole === "AGENT";
    const isOwner = property.ownerUserId === session.user.id;

    // Only owner or admin/agent can toggle bidding
    if (!isOwner && !isAdminOrAgent) {
      return NextResponse.json(
        { error: "Geen toegang" },
        { status: 403 }
      );
    }

    // Only FOR_SALE properties can have bidding
    if (property.type !== "FOR_SALE") {
      return NextResponse.json(
        { error: "Biedingen zijn alleen mogelijk voor koopwoningen" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Geef aan of biedingen aan of uit moeten" },
        { status: 400 }
      );
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: { biddingEnabled: enabled },
    });

    return NextResponse.json({
      success: true,
      biddingEnabled: updatedProperty.biddingEnabled,
      message: enabled 
        ? "Biedingen zijn nu ingeschakeld voor deze woning" 
        : "Biedingen zijn nu uitgeschakeld voor deze woning",
    });
  } catch (error: any) {
    console.error("[Toggle Bidding Error]:", error);
    return NextResponse.json(
      { error: "Kon biedingen niet in-/uitschakelen" },
      { status: 500 }
    );
  }
}

/**
 * Reject Price Change Request
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reviewNote } = body;

    if (!reviewNote) {
      return NextResponse.json(
        { error: "A reason for rejection is required" },
        { status: 400 }
      );
    }

    // Find the request
    const priceRequest = await prisma.owner_price_change_request.findUnique({
      where: { id },
    });

    if (!priceRequest) {
      return NextResponse.json(
        { error: "Price request not found" },
        { status: 404 }
      );
    }

    if (priceRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Update the request
    await prisma.owner_price_change_request.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedByName: session.user.name,
        reviewedAt: new Date(),
        reviewNote,
      },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: priceRequest.ownerUserId,
        propertyId: priceRequest.propertyId,
        action: "PRICE_REJECTED",
        description: `Price change rejected by ${session.user.name}: ${priceRequest.currentPrice} → ${priceRequest.requestedPrice}`,
        metadata: {
          oldPrice: priceRequest.currentPrice,
          newPrice: priceRequest.requestedPrice,
          rejectedBy: session.user.name,
          reviewNote,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Price change request rejected",
    });
  } catch (error) {
    console.error("[Reject Price Request Error]:", error);
    return NextResponse.json(
      { error: "Failed to reject price request" },
      { status: 500 }
    );
  }
}

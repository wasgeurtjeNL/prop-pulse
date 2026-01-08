/**
 * Approve Price Change Request
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedByName: session.user.name,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
        appliedAt: new Date(),
      },
    });

    // Apply the price change to the property
    const property = await prisma.property.update({
      where: { id: priceRequest.propertyId },
      data: { price: priceRequest.requestedPrice },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: priceRequest.ownerUserId,
        propertyId: priceRequest.propertyId,
        action: "PRICE_APPROVED",
        description: `Price change approved by ${session.user.name}: ${priceRequest.currentPrice} → ${priceRequest.requestedPrice}`,
        metadata: {
          oldPrice: priceRequest.currentPrice,
          newPrice: priceRequest.requestedPrice,
          approvedBy: session.user.name,
          reviewNote,
        },
      },
    });

    // Revalidate property pages
    revalidatePath(`/properties/${property.slug}`);
    if (property.provinceSlug && property.areaSlug) {
      revalidatePath(`/properties/${property.provinceSlug}/${property.areaSlug}/${property.slug}`);
    }

    return NextResponse.json({
      success: true,
      message: "Price change approved and applied",
    });
  } catch (error) {
    console.error("[Approve Price Request Error]:", error);
    return NextResponse.json(
      { error: "Failed to approve price request" },
      { status: 500 }
    );
  }
}

/**
 * Owner Portal - Update Property Price
 * Allows owners to request price changes
 * Changes >10% require approval
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper to parse price string to number
function parsePrice(price: string): number {
  // Remove currency symbols and non-numeric characters except dots
  const numericPrice = price.replace(/[^0-9.]/g, "");
  return parseFloat(numericPrice) || 0;
}

// Helper to calculate percentage change
function calculatePercentageChange(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 100;
  return Math.abs(((newPrice - oldPrice) / oldPrice) * 100);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Access denied. Owner account required." },
        { status: 403 }
      );
    }

    const { id: propertyId } = await params;
    const body = await request.json();
    const { newPrice, ownerPhone, ownerNote } = body;

    if (!newPrice) {
      return NextResponse.json(
        { error: "New price is required" },
        { status: 400 }
      );
    }

    // Verify property belongs to this owner
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerUserId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.owner_price_change_request.findFirst({
      where: {
        propertyId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "There is already a pending price change request for this property" },
        { status: 400 }
      );
    }

    // Calculate percentage change
    const currentPriceNum = parsePrice(property.price);
    const newPriceNum = parsePrice(newPrice);
    const percentageChange = calculatePercentageChange(currentPriceNum, newPriceNum);
    const requiresApproval = percentageChange > 10;

    // If >10% change, require phone number
    if (requiresApproval && !ownerPhone) {
      return NextResponse.json(
        {
          error: "Phone number is required for price changes over 10%",
          requiresApproval: true,
          percentageChange,
        },
        { status: 400 }
      );
    }

    // Create price change request
    const priceRequest = await prisma.owner_price_change_request.create({
      data: {
        propertyId,
        ownerUserId: session.user.id,
        currentPrice: property.price,
        requestedPrice: newPrice,
        percentageChange,
        ownerPhone: ownerPhone || null,
        ownerNote: ownerNote || null,
        requiresApproval,
        status: requiresApproval ? "PENDING" : "AUTO_APPLIED",
        ...(requiresApproval ? {} : { appliedAt: new Date() }),
      },
    });

    // If no approval needed, apply the change immediately
    if (!requiresApproval) {
      await prisma.property.update({
        where: { id: propertyId },
        data: { price: newPrice },
      });

      // Log the activity
      await prisma.owner_activity_log.create({
        data: {
          userId: session.user.id,
          propertyId,
          action: "PRICE_UPDATE",
          description: `Price updated from ${property.price} to ${newPrice} (${percentageChange.toFixed(1)}% change)`,
          metadata: {
            oldPrice: property.price,
            newPrice,
            percentageChange,
            autoApproved: true,
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
        message: "Price updated successfully",
        applied: true,
        priceRequest,
      });
    }

    // Log pending request
    await prisma.owner_activity_log.create({
      data: {
        userId: session.user.id,
        propertyId,
        action: "PRICE_UPDATE_REQUESTED",
        description: `Price change requested from ${property.price} to ${newPrice} (${percentageChange.toFixed(1)}% change - awaiting approval)`,
        metadata: {
          oldPrice: property.price,
          newPrice,
          percentageChange,
          requiresApproval: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Price change request submitted for approval. We will contact you shortly.",
      applied: false,
      requiresApproval: true,
      percentageChange,
      priceRequest,
    });
  } catch (error) {
    console.error("[Owner Price Update Error]:", error);
    return NextResponse.json(
      { error: "Failed to update price" },
      { status: 500 }
    );
  }
}

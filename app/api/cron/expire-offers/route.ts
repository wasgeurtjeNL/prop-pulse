/**
 * Cron Job: Expire Offers
 * Runs daily to expire offers that have passed their 20-day window
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all offers that have expired
    const expiredOffers = await prisma.propertyOffer.findMany({
      where: {
        status: { in: ["PENDING_PASSPORT", "ACTIVE"] },
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        propertyId: true,
        buyerUserId: true,
        status: true,
      },
    });

    if (expiredOffers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No offers to expire",
        count: 0,
      });
    }

    // Update all expired offers
    const updateResult = await prisma.propertyOffer.updateMany({
      where: {
        id: { in: expiredOffers.map(o => o.id) },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Log the expiration
    console.log(`[Cron] Expired ${updateResult.count} offers`);

    // TODO: Send email notifications to buyers about expired offers

    return NextResponse.json({
      success: true,
      message: `Expired ${updateResult.count} offers`,
      count: updateResult.count,
      offerIds: expiredOffers.map(o => o.id),
    });
  } catch (error: any) {
    console.error("[Cron Expire Offers Error]:", error);
    return NextResponse.json(
      { error: "Failed to expire offers: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}

// POST also supported for Vercel Cron
export async function POST(request: Request) {
  return GET(request);
}

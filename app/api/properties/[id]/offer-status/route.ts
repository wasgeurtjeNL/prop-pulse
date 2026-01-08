/**
 * Property Offer Status API (Public)
 * GET - Check if property has active offers (for FOMO)
 * 
 * Optimized for performance:
 * - Parallel database queries
 * - Edge caching (30s CDN cache + stale-while-revalidate)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get offer status for a property (public, limited info)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: propertyId } = await params;

    // Parallel queries for better performance (was 3 sequential, now 2 parallel)
    const [property, offerCounts] = await Promise.all([
      prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          biddingEnabled: true,
          price: true,
          lowestRejectedOffer: true,
        },
      }),
      // Combined count query for both active and total offers
      prisma.propertyOffer.groupBy({
        by: ['status'],
        where: {
          propertyId,
          status: { in: ["PENDING_PASSPORT", "ACTIVE"] },
          expiresAt: { gt: new Date() },
        },
        _count: true,
      }),
    ]);

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (!property.biddingEnabled) {
      return NextResponse.json(
        {
          biddingEnabled: false,
          hasActiveOffers: false,
          offerCount: 0,
        },
        {
          headers: {
            // Cache disabled bidding status for 60s
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      );
    }

    // Calculate counts from grouped results
    const activeOfferCount = offerCounts.find(g => g.status === "ACTIVE")?._count ?? 0;
    const totalOfferCount = offerCounts.reduce((sum, g) => sum + g._count, 0);

    // Parse price for min bid calculation
    const priceStr = property.price.replace(/[฿$€£,\s]/g, "").replace(/THB/i, "");
    const match = priceStr.match(/[\d.]+/);
    const askingPrice = match ? parseFloat(match[0]) : 0;
    const minBid = askingPrice * 0.80;

    return NextResponse.json(
      {
        biddingEnabled: true,
        hasActiveOffers: activeOfferCount > 0,
        offerCount: totalOfferCount,
        minBid,
        askingPrice,
        hasRejectedOffers: !!property.lowestRejectedOffer,
      },
      {
        headers: {
          // Cache for 30 seconds on Vercel CDN, serve stale for 60 more while revalidating
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error("[Property Offer Status Error]:", error);
    return NextResponse.json(
      { error: "Failed to get offer status" },
      { status: 500 }
    );
  }
}

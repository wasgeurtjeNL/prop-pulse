/**
 * Owner Portal - Properties API
 * Get properties for logged-in owner
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Get owner's properties
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners can access their properties this way
    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Access denied. Owner account required." },
        { status: 403 }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        ownerUserId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        provinceSlug: true,
        areaSlug: true,
        listingNumber: true,
        location: true,
        price: true,
        status: true,
        type: true,
        beds: true,
        baths: true,
        sqft: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        biddingEnabled: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get pending price change requests for these properties
    const propertyIds = properties.map((p) => p.id);
    const pendingRequests = await prisma.owner_price_change_request.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "PENDING",
      },
      select: {
        propertyId: true,
        requestedPrice: true,
        status: true,
        createdAt: true,
      },
    });

    const pendingRequestsMap = pendingRequests.reduce((acc, req) => {
      acc[req.propertyId] = req;
      return acc;
    }, {} as Record<string, typeof pendingRequests[0]>);

    const propertiesWithPendingRequests = properties.map((property) => ({
      ...property,
      pendingPriceRequest: pendingRequestsMap[property.id] || null,
    }));

    return NextResponse.json({ properties: propertiesWithPendingRequests });
  } catch (error) {
    console.error("[Owner Properties GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

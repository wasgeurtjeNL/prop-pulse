/**
 * Owner Portal Offers API
 * GET - Get all offers for owner's properties
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Get all offers for owner's properties
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const userRole = dbUser?.role?.toUpperCase() || "CUSTOMER";

    // Build where clause based on role
    let whereClause: any = {};

    if (userRole === "OWNER") {
      // Owner can only see offers on their properties
      whereClause = {
        property: {
          ownerUserId: session.user.id,
        },
      };
    } else if (userRole === "ADMIN" || userRole === "AGENT") {
      // Admin/Agent can see all offers, with optional filters
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const propertyId = searchParams.get("propertyId");

      if (status) {
        whereClause.status = status;
      }
      if (propertyId) {
        whereClause.propertyId = propertyId;
      }
    } else {
      return NextResponse.json(
        { error: "Geen toegang" },
        { status: 403 }
      );
    }

    const offers = await prisma.propertyOffer.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            listingNumber: true,
            price: true,
            image: true,
            location: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Calculate stats
    const stats = {
      total: offers.length,
      pendingPassport: offers.filter(o => o.status === "PENDING_PASSPORT").length,
      active: offers.filter(o => o.status === "ACTIVE").length,
      accepted: offers.filter(o => o.status === "ACCEPTED").length,
      rejected: offers.filter(o => o.status === "REJECTED").length,
      expired: offers.filter(o => o.status === "EXPIRED").length,
    };

    // Calculate days remaining for each offer
    const offersWithDaysRemaining = offers.map(offer => ({
      ...offer,
      daysRemaining: Math.max(0, Math.ceil((new Date(offer.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      hasPassport: !!offer.passportImageUrl,
    }));

    return NextResponse.json({
      offers: offersWithDaysRemaining,
      stats,
    });
  } catch (error: any) {
    console.error("[Owner Portal Offers GET Error]:", error);
    return NextResponse.json(
      { error: "Kon biedingen niet ophalen" },
      { status: 500 }
    );
  }
}

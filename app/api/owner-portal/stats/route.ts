/**
 * Owner Portal Stats API
 * Get statistics for owner portal dashboard widget
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counts
    const [
      pendingPriceRequests,
      totalOwnerAccounts,
      todayLogins,
      recentStatusChanges,
      activeInvites,
    ] = await Promise.all([
      // Pending price change requests
      prisma.owner_price_change_request.count({
        where: { status: "PENDING" },
      }),

      // Total owner accounts
      prisma.user.count({
        where: { role: "OWNER" },
      }),

      // Today's logins
      prisma.owner_session_log.count({
        where: {
          action: "LOGIN",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Recent status changes (last 7 days)
      prisma.owner_status_change_log.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Active invites
      prisma.owner_invite.count({
        where: {
          isActive: true,
          usedCount: 0,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    ]);

    // Get recent sold/rented properties (last 30 days)
    const recentSoldRented = await prisma.owner_status_change_log.findMany({
      where: {
        newStatus: { in: ["SOLD", "RENTED"] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get property details for sold/rented
    const propertyIds = recentSoldRented.map((r) => r.propertyId);
    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: {
        id: true,
        title: true,
        listingNumber: true,
        price: true,
        status: true,
      },
    });

    const propertyMap = properties.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, typeof properties[0]>);

    const recentSoldRentedWithDetails = recentSoldRented.map((r) => ({
      ...r,
      property: propertyMap[r.propertyId] || null,
    }));

    return NextResponse.json({
      stats: {
        pendingPriceRequests,
        totalOwnerAccounts,
        todayLogins,
        recentStatusChanges,
        activeInvites,
      },
      recentSoldRented: recentSoldRentedWithDetails,
    });
  } catch (error) {
    console.error("[Owner Stats GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

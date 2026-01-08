/**
 * Owner Price Requests API
 * For admin/agent to view and manage price change requests
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - List all price change requests (admin/agent only)
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, AUTO_APPLIED
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const requests = await prisma.owner_price_change_request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Fetch property and owner details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (req) => {
        const property = await prisma.property.findUnique({
          where: { id: req.propertyId },
          select: {
            id: true,
            title: true,
            listingNumber: true,
            location: true,
            price: true,
            status: true,
            slug: true,
          },
        });

        const owner = await prisma.user.findUnique({
          where: { id: req.ownerUserId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        return {
          ...req,
          property,
          owner,
        };
      })
    );

    // Count pending requests for alert badge
    const pendingCount = await prisma.owner_price_change_request.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      requests: requestsWithDetails,
      pendingCount,
    });
  } catch (error) {
    console.error("[Price Requests GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch price requests" },
      { status: 500 }
    );
  }
}

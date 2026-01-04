import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Status } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // Auth check - only logged-in users can list properties
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const userId = session.user.id;
    const userRole = (session.user as { role?: string })?.role;

    // Admins can see all properties, agents only their own
    const whereClause = userRole === "ADMIN" 
      ? { status: Status.ACTIVE }
      : { status: Status.ACTIVE, userId };

    const properties = await prisma.property.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        listingNumber: true,
        location: true,
        price: true,
        type: true,
        status: true,
        areaSlug: true,
        provinceSlug: true,
      },
      orderBy: [
        { listingNumber: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({
      properties,
      total: properties.length,
    });
  } catch (error) {
    console.error("[GET /api/properties] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}


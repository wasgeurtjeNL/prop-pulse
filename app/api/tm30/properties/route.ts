/**
 * TM30 Properties API
 * Shows which properties have TM30 linkage and can be rented
 * 
 * GET /api/tm30/properties
 * Returns: List of properties with their TM30 status
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Status } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    if (!session || !["ADMIN", "AGENT"].includes(userRole)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "linked", "unlinked", "all"
    const rentalOnly = searchParams.get("rentalOnly") === "true";

    // Build where clause
    const whereClause: any = {
      status: Status.ACTIVE, // Only active properties
    };

    // Only rental properties
    if (rentalOnly) {
      whereClause.enableDailyRental = true;
    }

    // Filter by TM30 link status
    if (filter === "linked") {
      whereClause.tm30_accommodation_id = { not: null };
    } else if (filter === "unlinked") {
      whereClause.tm30_accommodation_id = null;
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        location: true,
        enableDailyRental: true,
        monthlyRentalPrice: true,
        tm30_accommodation_id: true,
        tm30_accommodation_name: true,
        image: true,
        createdAt: true,
      },
      orderBy: [
        { tm30_accommodation_id: "asc" }, // Unlinked first (nulls first)
        { title: "asc" },
      ],
    });

    // Get stats
    const totalRentalProperties = await prisma.property.count({
      where: { status: Status.ACTIVE, enableDailyRental: true },
    });

    const linkedRentalProperties = await prisma.property.count({
      where: { 
        status: Status.ACTIVE, 
        enableDailyRental: true,
        tm30_accommodation_id: { not: null },
      },
    });

    const unlinkedRentalProperties = totalRentalProperties - linkedRentalProperties;

    return NextResponse.json({
      properties: properties.map((p) => ({
        id: p.id,
        title: p.title,
        address: p.location, // Map location to address for frontend
        enableDailyRental: p.enableDailyRental,
        monthlyRentalPrice: p.monthlyRentalPrice,
        tm30AccommodationId: p.tm30_accommodation_id,
        tm30AccommodationName: p.tm30_accommodation_name,
        isLinked: p.tm30_accommodation_id !== null,
        canBeRented: p.tm30_accommodation_id !== null, // Property can only be rented if linked
        thumbnail: p.image || null,
      })),
      total: properties.length,
      stats: {
        totalRentalProperties,
        linkedRentalProperties,
        unlinkedRentalProperties,
        readyToRent: linkedRentalProperties,
        needsLinking: unlinkedRentalProperties,
      },
    });

  } catch (error: any) {
    console.error("[TM30] Get properties error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

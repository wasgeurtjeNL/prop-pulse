/**
 * TM30 Accommodations API
 * Fetches registered accommodations from TM30 system
 * 
 * GET /api/tm30/accommodations
 * Returns: List of TM30 accommodations for property linking
 * 
 * POST /api/tm30/accommodations
 * Links a property to a TM30 accommodation
 * 
 * DELETE /api/tm30/accommodations
 * Unlinks a property from TM30
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Tm30Accommodation, Property } from "@/lib/generated/prisma";

// Type for accommodation with property relation
type TM30AccommodationWithProperty = Tm30Accommodation & {
  property: Pick<Property, "id" | "title"> | null;
};

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
    const search = searchParams.get("search")?.toLowerCase() || "";
    const statusFilter = searchParams.get("status"); // "Approved", "Pending", etc.

    // Fetch from database
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const accommodations: TM30AccommodationWithProperty[] = await prisma.tm30Accommodation.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get linked count
    const linkedCount = accommodations.filter((a: TM30AccommodationWithProperty) => a.propertyId !== null).length;

    return NextResponse.json({
      accommodations: accommodations.map((a: TM30AccommodationWithProperty) => ({
        id: a.id,
        tm30Id: a.tm30Id,
        name: a.name,
        address: a.address,
        status: a.status,
        isLinked: a.propertyId !== null,
        linkedProperty: a.property ? {
          id: a.property.id,
          title: a.property.title,
        } : null,
      })),
      total: accommodations.length,
      linkedCount,
      lastUpdated: accommodations[0]?.updatedAt || null,
    });

  } catch (error: any) {
    console.error("[TM30] Get accommodations error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Link a property to a TM30 accommodation
export async function POST(request: Request) {
  try {
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

    const { propertyId, tm30AccommodationId } = await request.json();

    if (!propertyId || !tm30AccommodationId) {
      return NextResponse.json(
        { error: "propertyId and tm30AccommodationId are required" },
        { status: 400 }
      );
    }

    // Find accommodation in database
    const accommodation = await prisma.tm30Accommodation.findUnique({
      where: { id: tm30AccommodationId },
    });

    if (!accommodation) {
      return NextResponse.json(
        { error: "TM30 accommodation not found" },
        { status: 404 }
      );
    }

    // Check if already linked to another property
    if (accommodation.propertyId && accommodation.propertyId !== propertyId) {
      return NextResponse.json(
        { error: "This TM30 accommodation is already linked to another property" },
        { status: 400 }
      );
    }

    // Update both the accommodation and the property
    const [updatedAccommodation, updatedProperty] = await prisma.$transaction([
      prisma.tm30Accommodation.update({
        where: { id: tm30AccommodationId },
        data: { propertyId },
      }),
      prisma.property.update({
        where: { id: propertyId },
        data: {
          tm30AccommodationId: accommodation.tm30Id || accommodation.id,
          tm30AccommodationName: accommodation.name,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      property: {
        id: updatedProperty.id,
        title: updatedProperty.title,
        tm30AccommodationId: updatedProperty.tm30AccommodationId,
        tm30AccommodationName: updatedProperty.tm30AccommodationName,
      },
      message: `Property "${updatedProperty.title}" linked to TM30 accommodation "${accommodation.name}"`,
    });

  } catch (error: any) {
    console.error("[TM30] Link property error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Unlink a property from TM30
export async function DELETE(request: Request) {
  try {
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

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    // Find the linked accommodation
    const accommodation = await prisma.tm30Accommodation.findFirst({
      where: { propertyId },
    });

    // Update both
    const results = await prisma.$transaction([
      // Remove link from accommodation
      ...(accommodation ? [
        prisma.tm30Accommodation.update({
          where: { id: accommodation.id },
          data: { propertyId: null },
        }),
      ] : []),
      // Remove TM30 data from property
      prisma.property.update({
        where: { id: propertyId },
        data: {
          tm30AccommodationId: null,
          tm30AccommodationName: null,
        },
      }),
    ]);

    const updatedProperty = results[results.length - 1];

    return NextResponse.json({
      success: true,
      message: `TM30 link removed from property "${(updatedProperty as any).title}"`,
    });

  } catch (error: any) {
    console.error("[TM30] Unlink property error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

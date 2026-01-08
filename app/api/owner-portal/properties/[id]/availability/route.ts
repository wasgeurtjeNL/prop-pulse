import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

/**
 * GET /api/owner-portal/properties/[id]/availability
 * Get blocked dates for a property
 */
export async function GET(
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

    // Verify owner owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerUserId: session.user.id,
      },
      select: { id: true, title: true, type: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    // Get blocked dates
    const blockedDates = await prisma.property_blocked_date.findMany({
      where: { property_id: propertyId },
      orderBy: { start_date: "asc" },
    });

    // Get rental bookings (if any)
    const rentalBookings = await prisma.rental_booking.findMany({
      where: { property_id: propertyId },
      select: {
        id: true,
        check_in_date: true,
        check_out_date: true,
        status: true,
        guest_name: true,
      },
      orderBy: { check_in_date: "asc" },
    });

    return NextResponse.json({
      property: {
        id: property.id,
        title: property.title,
        type: property.type,
      },
      blockedDates: blockedDates.map((bd) => ({
        id: bd.id,
        startDate: bd.start_date.toISOString(),
        endDate: bd.end_date.toISOString(),
        reason: bd.reason,
        blockedBy: bd.blocked_by,
        createdAt: bd.created_at.toISOString(),
      })),
      bookings: rentalBookings.map((b) => ({
        id: b.id,
        checkIn: b.check_in_date.toISOString(),
        checkOut: b.check_out_date.toISOString(),
        status: b.status,
        guestName: b.guest_name,
      })),
    });
  } catch (error) {
    console.error("[Owner Availability GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owner-portal/properties/[id]/availability
 * Add blocked dates for a property
 */
export async function POST(
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
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    // Verify owner owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerUserId: session.user.id,
      },
      select: { id: true, type: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    // Only allow for rental properties
    if (property.type !== "FOR_RENT") {
      return NextResponse.json(
        { error: "Availability management is only available for rental properties" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Check for overlapping blocked dates
    const overlap = await prisma.property_blocked_date.findFirst({
      where: {
        property_id: propertyId,
        OR: [
          {
            start_date: { lte: end },
            end_date: { gte: start },
          },
        ],
      },
    });

    if (overlap) {
      return NextResponse.json(
        { error: "Date range overlaps with existing blocked dates" },
        { status: 400 }
      );
    }

    // Create blocked date
    const blockedDate = await prisma.property_blocked_date.create({
      data: {
        id: nanoid(),
        property_id: propertyId,
        start_date: start,
        end_date: end,
        reason: reason || "Owner blocked",
        blocked_by: session.user.name || session.user.email,
        updated_at: new Date(),
      },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: session.user.id,
        propertyId,
        action: "AVAILABILITY_BLOCKED",
        description: `Blocked dates: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}${reason ? ` (${reason})` : ""}`,
      },
    });

    return NextResponse.json({
      success: true,
      blockedDate: {
        id: blockedDate.id,
        startDate: blockedDate.start_date.toISOString(),
        endDate: blockedDate.end_date.toISOString(),
        reason: blockedDate.reason,
      },
    });
  } catch (error) {
    console.error("[Owner Availability POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to block dates" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/owner-portal/properties/[id]/availability
 * Remove blocked dates
 */
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const blockedDateId = searchParams.get("blockedDateId");

    if (!blockedDateId) {
      return NextResponse.json(
        { error: "Blocked date ID is required" },
        { status: 400 }
      );
    }

    // Verify owner owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerUserId: session.user.id,
      },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    // Get the blocked date before deleting
    const blockedDate = await prisma.property_blocked_date.findFirst({
      where: {
        id: blockedDateId,
        property_id: propertyId,
      },
    });

    if (!blockedDate) {
      return NextResponse.json(
        { error: "Blocked date not found" },
        { status: 404 }
      );
    }

    // Delete blocked date
    await prisma.property_blocked_date.delete({
      where: { id: blockedDateId },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: session.user.id,
        propertyId,
        action: "AVAILABILITY_UNBLOCKED",
        description: `Removed blocked dates: ${blockedDate.start_date.toLocaleDateString()} - ${blockedDate.end_date.toLocaleDateString()}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Owner Availability DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to remove blocked dates" },
      { status: 500 }
    );
  }
}

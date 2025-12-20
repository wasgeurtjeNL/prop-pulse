import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get all blocked dates for a property (including booked dates)
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: propertyId } = await context.params;
    console.log("[blocked-dates] Fetching for property:", propertyId);

    // Get manually blocked dates
    const blockedDates = await prisma.propertyBlockedDate.findMany({
      where: { propertyId },
      orderBy: { startDate: "asc" },
    });
    console.log("[blocked-dates] Manual blocks found:", blockedDates.length);

    // Get confirmed bookings (these dates are also blocked)
    const confirmedBookings = await prisma.rentalBooking.findMany({
      where: {
        propertyId,
        status: {
          in: ["CONFIRMED", "PENDING"], // Both confirmed and pending block dates
        },
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
        guestName: true,
      },
      orderBy: { checkIn: "asc" },
    });
    console.log("[blocked-dates] Bookings found:", confirmedBookings.length, confirmedBookings);

    // Combine both into a unified blocked dates format
    const allBlockedDates = [
      // Manually blocked dates
      ...blockedDates.map((bd) => ({
        id: bd.id,
        startDate: bd.startDate,
        endDate: bd.endDate,
        reason: bd.reason || "Blocked",
        type: "manual" as const,
      })),
      // Booking blocked dates
      ...confirmedBookings.map((booking) => ({
        id: booking.id,
        startDate: booking.checkIn,
        endDate: booking.checkOut,
        reason: booking.status === "CONFIRMED" 
          ? `Booked: ${booking.guestName}`
          : `Pending: ${booking.guestName}`,
        type: "booking" as const,
        status: booking.status,
      })),
    ];

    return NextResponse.json({ 
      blockedDates: allBlockedDates,
      manualBlocks: blockedDates,
      bookings: confirmedBookings,
    });
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked dates" },
      { status: 500 }
    );
  }
}

// POST - Add a manual blocked date range (admin only)
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins/agents can block dates
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: propertyId } = await context.params;
    const body = await request.json();
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
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

    // Check for overlapping bookings
    const overlappingBookings = await prisma.rentalBooking.findMany({
      where: {
        propertyId,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          { checkIn: { lt: end }, checkOut: { gt: start } },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot block dates that overlap with existing bookings" },
        { status: 400 }
      );
    }

    // Create the blocked date
    const blockedDate = await prisma.propertyBlockedDate.create({
      data: {
        propertyId,
        startDate: start,
        endDate: end,
        reason: reason || null,
        blockedBy: session.user.id,
      },
    });

    return NextResponse.json({ blockedDate });
  } catch (error) {
    console.error("Error creating blocked date:", error);
    return NextResponse.json(
      { error: "Failed to create blocked date" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a manual blocked date (admin only)
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const blockedDateId = searchParams.get("blockedDateId");

    if (!blockedDateId) {
      return NextResponse.json(
        { error: "Blocked date ID is required" },
        { status: 400 }
      );
    }

    await prisma.propertyBlockedDate.delete({
      where: { id: blockedDateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blocked date:", error);
    return NextResponse.json(
      { error: "Failed to delete blocked date" },
      { status: 500 }
    );
  }
}


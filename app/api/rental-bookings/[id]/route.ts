import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { transformRentalBooking } from "@/lib/transforms";

// GET - Fetch a single booking
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";

    const booking = await prisma.rental_booking.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            slug: true,
            provinceSlug: true,
            areaSlug: true,
            images: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
        user_rental_booking_userIdTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check access - user can only see their own bookings, admin can see all
    if (!isAdmin && booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Transform snake_case to camelCase for frontend compatibility using central utility
    return NextResponse.json({ booking: transformRentalBooking(booking) });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PATCH - Update booking status and details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins and agents can update bookings" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    const {
      status,
      checkInTime,
      checkOutTime,
      propertyAddress,
      propertyInstructions,
      wifiName,
      wifiPassword,
      accessCode,
      emergencyContact,
      houseRules,
      internalNotes,
    } = body;

    // Build update data (using snake_case for Prisma)
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "CONFIRMED") {
        updateData.confirmed_at = new Date();
        updateData.agent_id = session.user.id;
      } else if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = body.cancellationReason || "Rejected by admin";
      }
    }

    // Property access details (snake_case fields)
    if (checkInTime !== undefined) updateData.check_in_time = checkInTime;
    if (checkOutTime !== undefined) updateData.check_out_time = checkOutTime;
    if (propertyAddress !== undefined) updateData.property_address = propertyAddress;
    if (propertyInstructions !== undefined) updateData.property_instructions = propertyInstructions;
    if (wifiName !== undefined) updateData.wifi_name = wifiName;
    if (wifiPassword !== undefined) updateData.wifi_password = wifiPassword;
    if (accessCode !== undefined) updateData.access_code = accessCode;
    if (emergencyContact !== undefined) updateData.emergency_contact = emergencyContact;
    if (houseRules !== undefined) updateData.house_rules = houseRules;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

    const booking = await prisma.rental_booking.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            slug: true,
          },
        },
        user_rental_booking_userIdTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform snake_case to camelCase for frontend compatibility using central utility
    return NextResponse.json({ booking: transformRentalBooking(booking) });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}








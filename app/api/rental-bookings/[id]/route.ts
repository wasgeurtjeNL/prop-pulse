import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    const booking = await prisma.rentalBooking.findUnique({
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
        user: {
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

    return NextResponse.json({ booking });
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

    // Build update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "CONFIRMED") {
        updateData.confirmedAt = new Date();
        updateData.agentId = session.user.id;
      } else if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = body.cancellationReason || "Rejected by admin";
      }
    }

    // Property access details
    if (checkInTime !== undefined) updateData.checkInTime = checkInTime;
    if (checkOutTime !== undefined) updateData.checkOutTime = checkOutTime;
    if (propertyAddress !== undefined) updateData.propertyAddress = propertyAddress;
    if (propertyInstructions !== undefined) updateData.propertyInstructions = propertyInstructions;
    if (wifiName !== undefined) updateData.wifiName = wifiName;
    if (wifiPassword !== undefined) updateData.wifiPassword = wifiPassword;
    if (accessCode !== undefined) updateData.accessCode = accessCode;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (houseRules !== undefined) updateData.houseRules = houseRules;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

    const booking = await prisma.rentalBooking.update({
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}







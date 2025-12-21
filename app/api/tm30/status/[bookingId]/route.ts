/**
 * TM30 Status API
 * Get TM30 registration status for a booking
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTM30Status } from "@/lib/services/tm30-whatsapp";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ bookingId: string }>;
}

// GET - Get TM30 status for a booking
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { bookingId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get status
    const status = await getTM30Status(bookingId);

    if (!status) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify the user owns the booking or is admin
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    const isAdmin = session.user.role === "admin";
    if (booking?.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({ status });
  } catch (error: any) {
    console.error("Error getting TM30 status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get TM30 status" },
      { status: 500 }
    );
  }
}

// PATCH - Update TM30 status (admin only)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { bookingId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tm30Status, tm30Reference, tm30Error } = body;

    const updated = await prisma.rentalBooking.update({
      where: { id: bookingId },
      data: {
        tm30Status,
        tm30Reference,
        tm30Error,
        tm30SubmittedAt: tm30Status === "SUBMITTED" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: updated.id,
        tm30Status: updated.tm30Status,
        tm30Reference: updated.tm30Reference,
      },
    });
  } catch (error: any) {
    console.error("Error updating TM30 status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update TM30 status" },
      { status: 500 }
    );
  }
}



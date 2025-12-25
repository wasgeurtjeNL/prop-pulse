/**
 * TM30 Request Passports API
 * Triggers WhatsApp message to request passport photos from guests
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendPassportRequest } from "@/lib/services/tm30-whatsapp";
import prisma from "@/lib/prisma";

// POST - Send passport request for a booking
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Allow webhook calls with API key
    const apiKey = request.headers.get("x-api-key");
    const isWebhook = apiKey === process.env.INTERNAL_API_KEY;

    if (!session?.user && !isWebhook) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Verify booking exists
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
        property: {
          select: {
            tm30AccommodationId: true,
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

    // Check if property has TM30 configured
    if (!booking.property.tm30AccommodationId) {
      return NextResponse.json(
        { error: "Property does not have TM30 configured" },
        { status: 400 }
      );
    }

    // Check authorization (only booking owner or admin)
    if (!isWebhook && session?.user) {
      const isAdmin = session.user.role === "admin";
      if (booking.userId !== session.user.id && !isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // Send passport request
    const success = await sendPassportRequest(bookingId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send passport request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Passport request sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending passport request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send passport request" },
      { status: 500 }
    );
  }
}






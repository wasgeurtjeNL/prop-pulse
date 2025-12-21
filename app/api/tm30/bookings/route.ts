/**
 * TM30 Bookings List API
 * Get all bookings that need TM30 registration
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Get all bookings needing TM30
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    // Get bookings with TM30 enabled properties (confirmed bookings with future check-in)
    const bookings = await prisma.rentalBooking.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
        checkIn: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Include last 7 days
        },
        property: {
          tm30AccommodationId: {
            not: null,
          },
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            tm30AccommodationId: true,
            tm30AccommodationName: true,
          },
        },
        guests: {
          orderBy: { guestNumber: "asc" },
          select: {
            id: true,
            guestNumber: true,
            guestType: true,
            firstName: true,
            lastName: true,
            nationality: true,
            passportNumber: true,
            tm30Status: true,
            passportImageUrl: true,
            ocrConfidence: true,
            passportVerified: true,
          },
        },
      },
      orderBy: [
        { checkIn: "asc" },
      ],
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        guestEmail: b.guestEmail,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
        tm30Status: b.tm30Status,
        tm30Reference: b.tm30Reference,
        passportsRequired: b.passportsRequired,
        passportsReceived: b.passportsReceived,
        property: b.property,
        guests: b.guests,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching TM30 bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}



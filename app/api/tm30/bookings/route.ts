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

    if (!session?.user || !["admin", "ADMIN", "AGENT", "agent"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    // Get ALL bookings (confirmed/pending with recent or future check-in)
    const bookings = await prisma.rental_booking.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
        checkIn: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Include last 90 days
        },
        // No property filter - show all bookings
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            tm30_accommodation_id: true,
            tm30_accommodation_name: true,
          },
        },
        booking_guest: {
          orderBy: { guest_number: "asc" },
          select: {
            id: true,
            guest_number: true,
            guest_type: true,
            first_name: true,
            last_name: true,
            nationality: true,
            passport_number: true,
            tm30_status: true,
            passport_image_url: true,
            ocr_confidence: true,
            passport_verified: true,
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
        tm30Status: b.tm30_status,
        tm30Reference: b.tm30_reference,
        passportsRequired: b.passports_required,
        passportsReceived: b.passports_received,
        property: {
          id: b.property.id,
          title: b.property.title,
          tm30AccommodationId: b.property.tm30_accommodation_id,
          tm30AccommodationName: b.property.tm30_accommodation_name,
        },
        guests: b.booking_guest.map((g) => ({
          id: g.id,
          guestNumber: g.guest_number,
          guestType: g.guest_type,
          firstName: g.first_name,
          lastName: g.last_name,
          nationality: g.nationality,
          passportNumber: g.passport_number,
          tm30Status: g.tm30_status,
          passportImageUrl: g.passport_image_url,
          ocrConfidence: g.ocr_confidence,
          passportVerified: g.passport_verified,
        })),
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






/**
 * Booking Guests API
 * Manages guests for rental bookings (for TM30 passport management)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { transformBookingGuest } from "@/lib/transforms";

// GET - Get all guests for a booking
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    const guests = await prisma.booking_guest.findMany({
      where: { booking_id: bookingId },
      orderBy: { guest_number: "asc" },
    });

    return NextResponse.json({ guests: guests.map(transformBookingGuest) });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
}

// POST - Create guests for a booking (usually after booking is confirmed)
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, guests } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Verify booking exists and user has access
    const booking = await prisma.rental_booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        adults: true,
        children: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user owns the booking or is admin
    const isAdmin = session.user.role === "admin";
    if (booking.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // If guests array is provided, create them
    if (guests && Array.isArray(guests)) {
      const createdGuests = await prisma.$transaction(
        guests.map((guest: any, index: number) =>
          prisma.booking_guest.create({
            data: {
              id: crypto.randomUUID(),
              booking_id: bookingId,
              guest_type: guest.guestType || "adult",
              guest_number: index + 1,
              first_name: guest.firstName,
              last_name: guest.lastName,
              full_name: guest.fullName,
              updated_at: new Date(),
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        guests: createdGuests.map(transformBookingGuest),
      });
    }

    // Otherwise, create empty guest slots based on booking
    const totalGuests = booking.adults + booking.children;
    const guestsToCreate: any[] = [];

    for (let i = 0; i < booking.adults; i++) {
      guestsToCreate.push({
        id: crypto.randomUUID(),
        booking_id: bookingId,
        guest_type: "adult",
        guest_number: i + 1,
        updated_at: new Date(),
      });
    }

    for (let i = 0; i < booking.children; i++) {
      guestsToCreate.push({
        id: crypto.randomUUID(),
        booking_id: bookingId,
        guest_type: "child",
        guest_number: booking.adults + i + 1,
        updated_at: new Date(),
      });
    }

    const createdGuests = await prisma.booking_guest.createMany({
      data: guestsToCreate,
    });

    // Update booking with passports required count
    await prisma.rental_booking.update({
      where: { id: bookingId },
      data: {
        passports_required: totalGuests,
      },
    });

    return NextResponse.json({
      success: true,
      guestsCreated: createdGuests.count,
    });
  } catch (error) {
    console.error("Error creating guests:", error);
    return NextResponse.json(
      { error: "Failed to create guests" },
      { status: 500 }
    );
  }
}








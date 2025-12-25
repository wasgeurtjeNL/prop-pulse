/**
 * Booking Guests API
 * Manages guests for rental bookings (for TM30 passport management)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    const guests = await prisma.bookingGuest.findMany({
      where: { bookingId },
      orderBy: { guestNumber: "asc" },
    });

    return NextResponse.json({ guests });
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
    const booking = await prisma.rentalBooking.findUnique({
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
          prisma.bookingGuest.create({
            data: {
              bookingId,
              guestType: guest.guestType || "adult",
              guestNumber: index + 1,
              firstName: guest.firstName,
              lastName: guest.lastName,
              fullName: guest.fullName,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        guests: createdGuests,
      });
    }

    // Otherwise, create empty guest slots based on booking
    const totalGuests = booking.adults + booking.children;
    const guestsToCreate = [];

    for (let i = 0; i < booking.adults; i++) {
      guestsToCreate.push({
        bookingId,
        guestType: "adult",
        guestNumber: i + 1,
      });
    }

    for (let i = 0; i < booking.children; i++) {
      guestsToCreate.push({
        bookingId,
        guestType: "child",
        guestNumber: booking.adults + i + 1,
      });
    }

    const createdGuests = await prisma.bookingGuest.createMany({
      data: guestsToCreate,
    });

    // Update booking with passports required count
    await prisma.rentalBooking.update({
      where: { id: bookingId },
      data: {
        passportsRequired: totalGuests,
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






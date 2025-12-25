/**
 * TM30 Submit API
 * Triggers TM30 submission for a booking
 * 
 * POST /api/tm30/submit
 * Body: { bookingId: string, dryRun?: boolean }
 * 
 * This endpoint calls the TM30 automation service (GitHub Actions)
 * to submit the TM30 notification for a guest.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_TM30_REPO || "wasgeurtjeNL/tm30-automation";
const GITHUB_WORKFLOW_ID = "tm30-automation.yml";

interface TM30SubmitRequest {
  bookingId: string;
  guestId?: string; // Optional: submit for specific guest only
  dryRun?: boolean; // Default: true (safe mode)
}

export async function POST(request: Request) {
  try {
    // Auth check - only admins/agents can trigger TM30 submissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: TM30SubmitRequest = await request.json();
    const { bookingId, guestId, dryRun = true } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Fetch booking with property and guests
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: bookingId },
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
          where: guestId ? { id: guestId } : undefined,
          select: {
            id: true,
            guestType: true,
            guestNumber: true,
            firstName: true,
            lastName: true,
            passportNumber: true,
            dateOfBirth: true,
            nationality: true,
            gender: true,
            tm30Status: true,
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

    if (!booking.property.tm30AccommodationId) {
      return NextResponse.json(
        { error: "Property is not linked to a TM30 accommodation" },
        { status: 400 }
      );
    }

    // Filter guests that need TM30 submission
    const guestsToSubmit = booking.guests.filter(
      (guest) =>
        guest.passportNumber && // Has passport data
        guest.tm30Status !== "SUBMITTED" // Not already submitted
    );

    if (guestsToSubmit.length === 0) {
      return NextResponse.json(
        { error: "No guests to submit (all already submitted or missing passport data)" },
        { status: 400 }
      );
    }

    // Prepare payload for GitHub Actions
    const submissions = guestsToSubmit.map((guest) => ({
      guestId: guest.id,
      foreigner: {
        passportNumber: guest.passportNumber,
        nationality: guest.nationality || "Unknown",
        firstName: guest.firstName || "Unknown",
        lastName: guest.lastName || "",
        dateOfBirth: guest.dateOfBirth
          ? formatDate(new Date(guest.dateOfBirth))
          : "",
        gender: guest.gender === "F" || guest.gender === "Female" ? "F" : "M",
        arrivalDate: formatDate(new Date(booking.checkIn)),
        stayUntil: formatDate(new Date(booking.checkOut)),
      },
      accommodation: {
        name: booking.property.tm30AccommodationName || booking.property.tm30AccommodationId,
        address: "", // Will be selected by name in TM30 system
      },
      checkInDate: formatDate(new Date(booking.checkIn)),
      checkOutDate: formatDate(new Date(booking.checkOut)),
      dryRun,
    }));

    // Update booking status to PROCESSING
    await prisma.rentalBooking.update({
      where: { id: bookingId },
      data: { tm30Status: "PROCESSING" },
    });

    // Update guest statuses to PENDING (processing)
    await prisma.bookingGuest.updateMany({
      where: { 
        id: { in: guestsToSubmit.map(g => g.id) }
      },
      data: { tm30Status: "PENDING" },
    });

    // Trigger GitHub Actions workflow
    if (GITHUB_TOKEN) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`,
          {
            method: "POST",
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "Authorization": `Bearer ${GITHUB_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ref: "main",
              inputs: {
                action: "submit_tm30",
                payload: JSON.stringify({
                  bookingId,
                  submissions,
                }),
                debug: "true",
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[TM30] GitHub Actions trigger failed:", errorText);
          
          // Revert status
          await prisma.rentalBooking.update({
            where: { id: bookingId },
            data: { 
              tm30Status: "PENDING",
              tm30Error: `GitHub trigger failed: ${errorText}`,
            },
          });

          return NextResponse.json(
            { 
              error: "Failed to trigger TM30 automation",
              details: errorText,
            },
            { status: 500 }
          );
        }

        console.log("[TM30] GitHub Actions workflow triggered successfully");

        return NextResponse.json({
          success: true,
          message: dryRun 
            ? "TM30 dry run triggered. Check GitHub Actions for results."
            : "TM30 submission triggered. Processing...",
          bookingId,
          guestsTriggered: guestsToSubmit.length,
          dryRun,
        });

      } catch (githubError: any) {
        console.error("[TM30] GitHub API error:", githubError);
        
        await prisma.rentalBooking.update({
          where: { id: bookingId },
          data: { 
            tm30Status: "PENDING",
            tm30Error: githubError.message,
          },
        });

        return NextResponse.json(
          { error: "GitHub API error", details: githubError.message },
          { status: 500 }
        );
      }
    } else {
      // No GitHub token - return data for manual processing
      console.log("[TM30] No GITHUB_TOKEN configured, returning submission data");
      
      return NextResponse.json({
        success: true,
        message: "TM30 submission data prepared (no GitHub token configured)",
        manualMode: true,
        submissions,
      });
    }

  } catch (error: any) {
    console.error("[TM30] Submit API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper: Format date as DD/MM/YYYY in Thailand timezone (Asia/Bangkok, UTC+7)
function formatDate(date: Date): string {
  // Convert to Thailand timezone
  const thailandDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const day = thailandDate.getDate().toString().padStart(2, "0");
  const month = (thailandDate.getMonth() + 1).toString().padStart(2, "0");
  const year = thailandDate.getFullYear();
  return `${day}/${month}/${year}`;
}

// GET: Get pending TM30 submissions for today/tomorrow
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "1", 10);

    // Get bookings checking in within the next X days that need TM30
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const pendingBookings = await prisma.rentalBooking.findMany({
      where: {
        checkIn: {
          gte: now,
          lte: targetDate,
        },
        tm30Status: { in: ["PENDING", "FAILED"] },
        property: {
          tm30AccommodationId: { not: null },
        },
        passportsReceived: { gt: 0 }, // At least some passports received
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
          where: {
            passportNumber: { not: null },
            tm30Status: { not: "SUBMITTED" },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            passportNumber: true,
            nationality: true,
            tm30Status: true,
          },
        },
      },
      orderBy: { checkIn: "asc" },
    });

    return NextResponse.json({
      pendingBookings: pendingBookings.map((b) => ({
        id: b.id,
        guestName: b.guestName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        property: b.property.title,
        tm30Accommodation: b.property.tm30AccommodationName,
        tm30Status: b.tm30Status,
        guestsReady: b.guests.length,
      })),
      total: pendingBookings.length,
    });

  } catch (error: any) {
    console.error("[TM30] Get pending error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}








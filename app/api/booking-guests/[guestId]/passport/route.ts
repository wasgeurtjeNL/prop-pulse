/**
 * Passport Upload & OCR API
 * Handles passport image upload and OCR processing
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { scanPassport, validatePassportData } from "@/lib/services/passport-ocr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialize Supabase client to avoid build-time env var issues
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error("Supabase credentials not configured");
    }
    
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

interface RouteParams {
  params: Promise<{ guestId: string }>;
}

// POST - Upload passport image and run OCR
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { guestId } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Allow both authenticated users and webhook calls (via API key)
    const apiKey = request.headers.get("x-api-key");
    const isWebhook = apiKey === process.env.INTERNAL_API_KEY;

    if (!session?.user && !isWebhook) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get guest and verify access
    const guest = await prisma.bookingGuest.findUnique({
      where: { id: guestId },
      include: {
        booking: {
          select: {
            id: true,
            userId: true,
            propertyId: true,
          },
        },
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (!isWebhook && session?.user) {
      const isAdmin = session.user.role === "admin";
      if (guest.booking.userId !== session.user.id && !isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { imageUrl, imageBase64, mimeType } = body;

    // Either imageUrl or imageBase64 is required
    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "imageUrl or imageBase64 is required" },
        { status: 400 }
      );
    }

    let finalImageUrl = imageUrl;

    // If base64 image is provided, upload to Supabase Storage
    if (imageBase64) {
      const buffer = Buffer.from(imageBase64, "base64");
      const fileName = `passports/${guest.booking.id}/${guestId}-${Date.now()}.jpg`;

      const supabase = getSupabase();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, buffer, {
          contentType: mimeType || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload passport image" },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      finalImageUrl = urlData.publicUrl;

      // Update guest with image path
      await prisma.bookingGuest.update({
        where: { id: guestId },
        data: {
          passportImagePath: fileName,
        },
      });
    }

    // Run OCR
    console.log("[Passport API] Running OCR for guest:", guestId);
    const ocrResult = await scanPassport(finalImageUrl);

    // Validate the extracted data
    const validation = validatePassportData(ocrResult.data);

    // Update guest with OCR results
    const updatedGuest = await prisma.bookingGuest.update({
      where: { id: guestId },
      data: {
        passportImageUrl: finalImageUrl,
        ocrConfidence: ocrResult.confidence,
        ocrRawData: ocrResult.rawResponse ? JSON.parse(JSON.stringify({ raw: ocrResult.rawResponse })) : null,
        ocrProcessedAt: new Date(),
        tm30Status: ocrResult.success ? "SCANNED" : "PENDING",
        // Extracted data
        firstName: ocrResult.data?.firstName,
        lastName: ocrResult.data?.lastName,
        fullName: ocrResult.data?.fullName || 
          (ocrResult.data?.firstName && ocrResult.data?.lastName 
            ? `${ocrResult.data.firstName} ${ocrResult.data.lastName}` 
            : null),
        dateOfBirth: ocrResult.data?.dateOfBirth 
          ? new Date(ocrResult.data.dateOfBirth) 
          : null,
        nationality: ocrResult.data?.nationality,
        gender: ocrResult.data?.gender,
        passportNumber: ocrResult.data?.passportNumber,
        passportExpiry: ocrResult.data?.passportExpiry 
          ? new Date(ocrResult.data.passportExpiry) 
          : null,
        passportIssueDate: ocrResult.data?.passportIssueDate 
          ? new Date(ocrResult.data.passportIssueDate) 
          : null,
        passportCountry: ocrResult.data?.passportCountry,
      },
    });

    // Update booking TM30 status if all passports received
    await updateBookingTM30Status(guest.booking.id);

    return NextResponse.json({
      success: ocrResult.success,
      guest: {
        id: updatedGuest.id,
        firstName: updatedGuest.firstName,
        lastName: updatedGuest.lastName,
        fullName: updatedGuest.fullName,
        nationality: updatedGuest.nationality,
        passportNumber: updatedGuest.passportNumber,
        passportExpiry: updatedGuest.passportExpiry,
        tm30Status: updatedGuest.tm30Status,
        ocrConfidence: updatedGuest.ocrConfidence,
      },
      validation,
      ocrResult: {
        success: ocrResult.success,
        confidence: ocrResult.confidence,
        error: ocrResult.error,
      },
    });
  } catch (error: any) {
    console.error("Error processing passport:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process passport" },
      { status: 500 }
    );
  }
}

// PUT - Manually update passport data
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { guestId } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get guest and verify access
    const guest = await prisma.bookingGuest.findUnique({
      where: { id: guestId },
      include: {
        booking: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    // Check authorization - admin/agent or booking owner
    const userRole = session.user.role?.toUpperCase();
    const isAdmin = userRole === "ADMIN" || userRole === "AGENT";
    const isOwner = guest.booking.userId === session.user.id;
    
    console.log("[Passport PUT] Auth check:", { 
      userId: session.user.id, 
      userRole, 
      bookingUserId: guest.booking.userId,
      isAdmin,
      isOwner 
    });
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - not owner or admin" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      passportNumber, 
      nationality, 
      dateOfBirth, 
      gender,
      passportVerified 
    } = body;

    // Update guest with manual data
    const updatedGuest = await prisma.bookingGuest.update({
      where: { id: guestId },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        fullName: firstName && lastName ? `${firstName} ${lastName}` : null,
        passportNumber: passportNumber || null,
        nationality: nationality || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        passportVerified: passportVerified ?? false,
        tm30Status: passportVerified ? "VERIFIED" : "SCANNED",
      },
    });

    // Update booking TM30 status
    await updateBookingTM30Status(guest.booking.id);

    return NextResponse.json({
      success: true,
      guest: {
        id: updatedGuest.id,
        firstName: updatedGuest.firstName,
        lastName: updatedGuest.lastName,
        fullName: updatedGuest.fullName,
        nationality: updatedGuest.nationality,
        passportNumber: updatedGuest.passportNumber,
        tm30Status: updatedGuest.tm30Status,
        passportVerified: updatedGuest.passportVerified,
      },
    });
  } catch (error: any) {
    console.error("Error updating passport data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update passport data" },
      { status: 500 }
    );
  }
}

// GET - Get passport status for a guest
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { guestId } = await params;

    const guest = await prisma.bookingGuest.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        guestNumber: true,
        guestType: true,
        firstName: true,
        lastName: true,
        fullName: true,
        nationality: true,
        passportNumber: true,
        passportExpiry: true,
        passportImageUrl: true,
        ocrConfidence: true,
        ocrProcessedAt: true,
        tm30Status: true,
        passportVerified: true,
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Error fetching guest passport status:", error);
    return NextResponse.json(
      { error: "Failed to fetch passport status" },
      { status: 500 }
    );
  }
}

/**
 * Update booking TM30 status based on guest passport status
 */
async function updateBookingTM30Status(bookingId: string) {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: bookingId },
    include: {
      guests: {
        select: {
          passportImageUrl: true,
          tm30Status: true,
        },
      },
    },
  });

  if (!booking) return;

  const totalGuests = booking.guests.length;
  const passportsReceived = booking.guests.filter(g => g.passportImageUrl).length;
  const allScanned = booking.guests.every(g => 
    g.tm30Status === "SCANNED" || 
    g.tm30Status === "VERIFIED" || 
    g.tm30Status === "SUBMITTED"
  );

  let newStatus: "PENDING" | "PASSPORT_RECEIVED" | "PROCESSING" | "SUBMITTED" | "FAILED" = "PENDING";
  
  if (passportsReceived === totalGuests && allScanned) {
    newStatus = "PASSPORT_RECEIVED";
  } else if (passportsReceived > 0) {
    newStatus = "PENDING"; // Still waiting for more passports
  }

  await prisma.rentalBooking.update({
    where: { id: bookingId },
    data: {
      passportsReceived,
      tm30Status: newStatus,
    },
  });
}


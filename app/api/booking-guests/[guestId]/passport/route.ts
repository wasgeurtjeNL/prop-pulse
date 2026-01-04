/**
 * Passport Upload & OCR API
 * Handles passport image upload and OCR processing
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { scanPassport, validatePassportData } from "@/lib/services/passport-ocr";
import { imagekit } from "@/lib/imagekit";

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
    const guest = await prisma.booking_guest.findUnique({
      where: { id: guestId },
      include: {
        rental_booking: {
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

    // Check authorization - allow ADMIN, AGENT, or booking owner
    if (!isWebhook && session?.user) {
      // Get role from database for reliability
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      const userRole = dbUser?.role?.toUpperCase() || (session.user as any).role?.toUpperCase() || "CUSTOMER";
      const isAdminOrAgent = userRole === "ADMIN" || userRole === "AGENT";
      const isOwner = guest.rental_booking.userId === session.user.id;
      
      console.log("[Passport POST] Auth check:", { userId: session.user.id, userRole, isAdminOrAgent, isOwner });
      
      if (!isOwner && !isAdminOrAgent) {
        return NextResponse.json(
          { error: `Unauthorized - role: ${userRole}` },
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

    // If base64 image is provided, upload to ImageKit
    if (imageBase64) {
      const fileName = `passport-${guestId}-${Date.now()}.jpg`;
      const folderPath = `/passports/${guest.rental_booking.id}`;

      try {
        console.log("[Passport API] Uploading to ImageKit...");
        const uploadResult = await imagekit.upload({
          file: imageBase64, // base64 string
          fileName: fileName,
          folder: folderPath,
          useUniqueFileName: false,
        });

        finalImageUrl = uploadResult.url;
        console.log("[Passport API] Upload successful:", finalImageUrl);

        // Update guest with image path
        await prisma.booking_guest.update({
          where: { id: guestId },
          data: {
            passport_image_path: uploadResult.filePath,
            passport_image_url: uploadResult.url,
            updated_at: new Date(),
          },
        });
      } catch (uploadError: any) {
        console.error("ImageKit upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload passport image: " + (uploadError.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // Run OCR
    console.log("[Passport API] Running OCR for guest:", guestId);
    const ocrResult = await scanPassport(finalImageUrl);

    // Validate the extracted data
    const validation = validatePassportData(ocrResult.data);

    // Update guest with OCR results
    const updatedGuest = await prisma.booking_guest.update({
      where: { id: guestId },
      data: {
        passport_image_url: finalImageUrl,
        ocr_confidence: ocrResult.confidence,
        ocr_raw_data: ocrResult.rawResponse ? JSON.parse(JSON.stringify({ raw: ocrResult.rawResponse })) : null,
        ocr_processed_at: new Date(),
        tm30_status: ocrResult.success ? "SCANNED" : "PENDING",
        // Extracted data
        first_name: ocrResult.data?.firstName,
        last_name: ocrResult.data?.lastName,
        full_name: ocrResult.data?.fullName || 
          (ocrResult.data?.firstName && ocrResult.data?.lastName 
            ? `${ocrResult.data.firstName} ${ocrResult.data.lastName}` 
            : null),
        date_of_birth: ocrResult.data?.dateOfBirth 
          ? new Date(ocrResult.data.dateOfBirth) 
          : null,
        nationality: ocrResult.data?.nationality,
        gender: ocrResult.data?.gender,
        passport_number: ocrResult.data?.passportNumber,
        passport_expiry: ocrResult.data?.passportExpiry 
          ? new Date(ocrResult.data.passportExpiry) 
          : null,
        passport_issue_date: ocrResult.data?.passportIssueDate 
          ? new Date(ocrResult.data.passportIssueDate) 
          : null,
        passport_country: ocrResult.data?.passportCountry,
        updated_at: new Date(),
      },
    });

    // Update booking TM30 status if all passports received
    await updateBookingTM30Status(guest.rental_booking.id);

    return NextResponse.json({
      success: ocrResult.success,
      guest: {
        id: updatedGuest.id,
        firstName: updatedGuest.first_name,
        lastName: updatedGuest.last_name,
        fullName: updatedGuest.full_name,
        nationality: updatedGuest.nationality,
        passportNumber: updatedGuest.passport_number,
        passportExpiry: updatedGuest.passport_expiry,
        dateOfBirth: updatedGuest.date_of_birth,
        gender: updatedGuest.gender,
        tm30Status: updatedGuest.tm30_status,
        ocrConfidence: updatedGuest.ocr_confidence,
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
    
    console.log("[Passport PUT] Starting for guestId:", guestId);
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log("[Passport PUT] Session:", session ? "found" : "not found", session?.user?.email);

    if (!session?.user) {
      console.log("[Passport PUT] No session user found");
      return NextResponse.json(
        { error: "Unauthorized - no session" },
        { status: 401 }
      );
    }

    // Get guest and verify access
    const guest = await prisma.booking_guest.findUnique({
      where: { id: guestId },
      include: {
        rental_booking: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!guest) {
      console.log("[Passport PUT] Guest not found:", guestId);
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    // Get user role from database directly for reliability
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    const userRole = dbUser?.role?.toUpperCase() || (session.user as any).role?.toUpperCase() || "CUSTOMER";
    // Allow ADMIN and AGENT full access
    const isAdminOrAgent = userRole === "ADMIN" || userRole === "AGENT";
    const isOwner = guest.rental_booking.userId === session.user.id;
    
    console.log("[Passport PUT] Auth check:", { 
      userId: session.user.id, 
      userEmail: session.user.email,
      userRole,
      dbRole: dbUser?.role,
      sessionRole: (session.user as any).role,
      bookingUserId: guest.rental_booking.userId,
      isAdminOrAgent,
      isOwner 
    });
    
    // ADMIN and AGENT can always update, otherwise must be owner
    if (!isOwner && !isAdminOrAgent) {
      console.log("[Passport PUT] Authorization failed - not owner and not admin/agent");
      return NextResponse.json(
        { error: `Unauthorized - role: ${userRole}, isOwner: ${isOwner}` },
        { status: 401 }
      );
    }
    
    console.log("[Passport PUT] Authorization passed");

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
    const updatedGuest = await prisma.booking_guest.update({
      where: { id: guestId },
      data: {
        first_name: firstName || null,
        last_name: lastName || null,
        full_name: firstName && lastName ? `${firstName} ${lastName}` : null,
        passport_number: passportNumber || null,
        nationality: nationality || null,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        passport_verified: passportVerified ?? false,
        tm30_status: passportVerified ? "VERIFIED" : "SCANNED",
        updated_at: new Date(),
      },
    });

    // Update booking TM30 status
    await updateBookingTM30Status(guest.rental_booking.id);

    return NextResponse.json({
      success: true,
      guest: {
        id: updatedGuest.id,
        firstName: updatedGuest.first_name,
        lastName: updatedGuest.last_name,
        fullName: updatedGuest.full_name,
        nationality: updatedGuest.nationality,
        passportNumber: updatedGuest.passport_number,
        tm30Status: updatedGuest.tm30_status,
        passportVerified: updatedGuest.passport_verified,
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

    const guest = await prisma.booking_guest.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        guest_number: true,
        guest_type: true,
        first_name: true,
        last_name: true,
        full_name: true,
        nationality: true,
        passport_number: true,
        passport_expiry: true,
        passport_image_url: true,
        ocr_confidence: true,
        ocr_processed_at: true,
        tm30_status: true,
        passport_verified: true,
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    // Map snake_case to camelCase for frontend compatibility
    return NextResponse.json({ 
      guest: {
        id: guest.id,
        guestNumber: guest.guest_number,
        guestType: guest.guest_type,
        firstName: guest.first_name,
        lastName: guest.last_name,
        fullName: guest.full_name,
        nationality: guest.nationality,
        passportNumber: guest.passport_number,
        passportExpiry: guest.passport_expiry,
        passportImageUrl: guest.passport_image_url,
        ocrConfidence: guest.ocr_confidence,
        ocrProcessedAt: guest.ocr_processed_at,
        tm30Status: guest.tm30_status,
        passportVerified: guest.passport_verified,
      }
    });
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
  const booking = await prisma.rental_booking.findUnique({
    where: { id: bookingId },
    include: {
      booking_guest: {
        select: {
          passport_image_url: true,
          tm30_status: true,
        },
      },
    },
  });

  if (!booking) return;

  const totalGuests = booking.booking_guest.length;
  const passportsReceived = booking.booking_guest.filter(g => g.passport_image_url).length;
  const allScanned = booking.booking_guest.every(g => 
    g.tm30_status === "SCANNED" || 
    g.tm30_status === "VERIFIED" || 
    g.tm30_status === "SUBMITTED"
  );

  let newStatus: "PENDING" | "PASSPORT_RECEIVED" | "PROCESSING" | "SUBMITTED" | "FAILED" = "PENDING";
  
  if (passportsReceived === totalGuests && allScanned) {
    newStatus = "PASSPORT_RECEIVED";
  } else if (passportsReceived > 0) {
    newStatus = "PENDING"; // Still waiting for more passports
  }

  await prisma.rental_booking.update({
    where: { id: bookingId },
    data: {
      passports_received: passportsReceived,
      tm30_status: newStatus,
    },
  });
}


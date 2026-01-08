/**
 * Offer Passport Upload API
 * POST - Upload passport and run OCR
 * GET - Get passport (owner only, secured)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { scanPassport, validatePassportData } from "@/lib/services/passport-ocr";
import { imagekit } from "@/lib/imagekit";
import { sendEmail } from "@/lib/email";
import { passportUploadedOwnerNotificationTemplate } from "@/lib/email/templates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Upload passport image and run OCR
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: offerId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get offer and verify buyer
    const offer = await prisma.propertyOffer.findUnique({
      where: { id: offerId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            listingNumber: true,
            ownerUserId: true,
            ownerEmail: true,
            ownerName: true,
            ownerUser: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Bod niet gevonden" },
        { status: 404 }
      );
    }

    // Only the buyer can upload passport
    if (offer.buyerUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Je kunt alleen je eigen paspoort uploaden" },
        { status: 403 }
      );
    }

    // Check offer status
    if (offer.status !== "PENDING_PASSPORT") {
      return NextResponse.json(
        { error: "Paspoort kan alleen worden geüpload voor biedingen in afwachting van paspoort" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Afbeelding is verplicht" },
        { status: 400 }
      );
    }

    // Upload to ImageKit (private folder)
    const fileName = `passport-offer-${offerId}-${Date.now()}.jpg`;
    const folderPath = `/offers/${offer.propertyId}/passports`;

    let uploadResult;
    try {
      console.log("[Offer Passport] Uploading to ImageKit...");
      uploadResult = await imagekit.upload({
        file: imageBase64,
        fileName: fileName,
        folder: folderPath,
        useUniqueFileName: false,
        isPrivateFile: true, // Private file for security
      });
      console.log("[Offer Passport] Upload successful:", uploadResult.url);
    } catch (uploadError: any) {
      console.error("ImageKit upload error:", uploadError);
      return NextResponse.json(
        { error: "Kon paspoort niet uploaden: " + (uploadError.message || "Onbekende fout") },
        { status: 500 }
      );
    }

    // Get signed URL for OCR (15 min validity)
    const signedUrl = imagekit.url({
      path: uploadResult.filePath,
      signed: true,
      expireSeconds: 900,
    });

    // Run OCR
    console.log("[Offer Passport] Running OCR...");
    const ocrResult = await scanPassport(signedUrl);
    const validation = validatePassportData(ocrResult.data);

    // Update offer with passport and OCR data
    const updatedOffer = await prisma.propertyOffer.update({
      where: { id: offerId },
      data: {
        passportImageUrl: uploadResult.url,
        passportImagePath: uploadResult.filePath,
        passportUploadedAt: new Date(),
        ocrConfidence: ocrResult.confidence,
        ocrProcessedAt: new Date(),
        passportFirstName: ocrResult.data?.firstName,
        passportLastName: ocrResult.data?.lastName,
        passportFullName: ocrResult.data?.fullName || 
          (ocrResult.data?.firstName && ocrResult.data?.lastName 
            ? `${ocrResult.data.firstName} ${ocrResult.data.lastName}` 
            : null),
        passportNationality: ocrResult.data?.nationality,
        passportNumber: ocrResult.data?.passportNumber,
        passportDateOfBirth: ocrResult.data?.dateOfBirth 
          ? new Date(ocrResult.data.dateOfBirth) 
          : null,
        passportExpiry: ocrResult.data?.passportExpiry 
          ? new Date(ocrResult.data.passportExpiry) 
          : null,
        passportGender: ocrResult.data?.gender,
        passportCountry: ocrResult.data?.passportCountry,
        // Update status to ACTIVE if OCR successful
        status: ocrResult.success ? "ACTIVE" : "PENDING_PASSPORT",
        passportVerified: false, // Owner needs to verify
      },
    });

    // Send notification to property owner when passport is successfully processed
    if (ocrResult.success) {
      const ownerEmail = offer.property.ownerUser?.email || offer.property.ownerEmail;
      const ownerName = offer.property.ownerUser?.name || offer.property.ownerName || "Eigenaar";
      
      if (ownerEmail) {
        try {
          const emailData = passportUploadedOwnerNotificationTemplate({
            ownerName,
            propertyTitle: offer.property.title,
            propertySlug: offer.property.slug || offer.property.id,
            buyerName: offer.buyerName,
            buyerPassportName: updatedOffer.passportFullName || offer.buyerName,
            buyerNationality: updatedOffer.passportNationality || "Onbekend",
            offerAmount: offer.offerAmount.toLocaleString("en-US"),
            offerId: offer.id,
          });
          
          await sendEmail({
            to: ownerEmail,
            subject: emailData.subject,
            html: emailData.html,
          });
          console.log(`[Offer Passport] Owner notification sent to ${ownerEmail}`);
        } catch (emailError) {
          console.error("[Offer Passport] Failed to send owner notification:", emailError);
          // Don't fail the request if email fails
        }
      }
    }

    return NextResponse.json({
      success: ocrResult.success,
      offer: {
        id: updatedOffer.id,
        status: updatedOffer.status,
        passportData: {
          firstName: updatedOffer.passportFirstName,
          lastName: updatedOffer.passportLastName,
          fullName: updatedOffer.passportFullName,
          nationality: updatedOffer.passportNationality,
          passportNumber: updatedOffer.passportNumber,
          dateOfBirth: updatedOffer.passportDateOfBirth,
          expiry: updatedOffer.passportExpiry,
          gender: updatedOffer.passportGender,
        },
        ocrConfidence: updatedOffer.ocrConfidence,
      },
      validation,
      message: ocrResult.success 
        ? "Paspoort succesvol geverifieerd! Uw bod is nu actief." 
        : "Paspoort geüpload maar kon niet automatisch worden geverifieerd. Controleer de gegevens.",
    });
  } catch (error: any) {
    console.error("[Offer Passport POST Error]:", error);
    return NextResponse.json(
      { error: "Kon paspoort niet verwerken: " + (error.message || "Onbekende fout") },
      { status: 500 }
    );
  }
}

// GET - Get passport (owner/agent only)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: offerId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get offer
    const offer = await prisma.propertyOffer.findUnique({
      where: { id: offerId },
      include: {
        property: {
          select: {
            id: true,
            ownerUserId: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Bod niet gevonden" },
        { status: 404 }
      );
    }

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const userRole = dbUser?.role?.toUpperCase() || "CUSTOMER";
    const isAdminOrAgent = userRole === "ADMIN" || userRole === "AGENT";
    const isOwner = offer.property.ownerUserId === session.user.id;

    // Only owner or admin/agent can view passport
    if (!isOwner && !isAdminOrAgent) {
      return NextResponse.json(
        { error: "Je hebt geen toegang tot dit paspoort" },
        { status: 403 }
      );
    }

    if (!offer.passportImagePath) {
      return NextResponse.json(
        { error: "Geen paspoort geüpload" },
        { status: 404 }
      );
    }

    // Generate signed URL (15 min validity)
    const signedUrl = imagekit.url({
      path: offer.passportImagePath,
      signed: true,
      expireSeconds: 900,
    });

    // Log access for audit
    console.log(`[Offer Passport] Passport viewed by ${session.user.id} (${userRole}) for offer ${offerId}`);

    return NextResponse.json({
      passportUrl: signedUrl,
      expiresIn: 900,
      passportData: {
        firstName: offer.passportFirstName,
        lastName: offer.passportLastName,
        fullName: offer.passportFullName,
        nationality: offer.passportNationality,
        passportNumber: offer.passportNumber,
        dateOfBirth: offer.passportDateOfBirth,
        expiry: offer.passportExpiry,
        gender: offer.passportGender,
        country: offer.passportCountry,
      },
      ocrConfidence: offer.ocrConfidence,
      uploadedAt: offer.passportUploadedAt,
      verified: offer.passportVerified,
    });
  } catch (error: any) {
    console.error("[Offer Passport GET Error]:", error);
    return NextResponse.json(
      { error: "Kon paspoort niet ophalen" },
      { status: 500 }
    );
  }
}

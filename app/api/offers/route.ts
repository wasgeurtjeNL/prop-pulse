/**
 * Property Offers API
 * POST - Create a new offer (requires login)
 * GET - Get user's offers
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { newOfferOwnerNotificationTemplate, offerAdminNotificationTemplate } from "@/lib/email/templates";

// Parse price string to number
function parsePriceToNumber(priceStr: string): number {
  const cleaned = priceStr.replace(/[฿$€£,\s]/g, "").replace(/THB/i, "");
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// POST - Create a new offer
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om een bod te plaatsen" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId, offerAmount, buyerName, buyerEmail, buyerPhone, buyerMessage } = body;

    // Validate required fields
    if (!propertyId || !offerAmount || !buyerName || !buyerEmail || !buyerPhone) {
      return NextResponse.json(
        { error: "Alle velden zijn verplicht" },
        { status: 400 }
      );
    }

    // Get property and check if bidding is enabled
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        biddingEnabled: true,
        lowestRejectedOffer: true,
        type: true,
        status: true,
        // Owner info for notifications
        ownerEmail: true,
        ownerName: true,
        ownerUser: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Woning niet gevonden" },
        { status: 404 }
      );
    }

    if (!property.biddingEnabled) {
      return NextResponse.json(
        { error: "Biedingen zijn niet toegestaan voor deze woning" },
        { status: 400 }
      );
    }

    if (property.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Deze woning is niet meer beschikbaar" },
        { status: 400 }
      );
    }

    if (property.type !== "FOR_SALE") {
      return NextResponse.json(
        { error: "Biedingen zijn alleen mogelijk voor koopwoningen" },
        { status: 400 }
      );
    }

    // Parse asking price
    const askingPrice = parsePriceToNumber(property.price);
    if (askingPrice <= 0) {
      return NextResponse.json(
        { error: "Ongeldige vraagprijs" },
        { status: 400 }
      );
    }

    // Calculate percentage
    const percentageOfAsking = (offerAmount / askingPrice) * 100;

    // Validate minimum bid (80% of asking price)
    const minBid = askingPrice * 0.80;
    if (offerAmount < minBid) {
      return NextResponse.json(
        { 
          error: "Bod moet minimaal 80% van de vraagprijs zijn",
          minAmount: minBid,
          askingPrice,
        },
        { status: 400 }
      );
    }

    // Check against lowest rejected offer (smart rejection)
    if (property.lowestRejectedOffer && offerAmount <= property.lowestRejectedOffer) {
      return NextResponse.json(
        { 
          error: "Dit bedrag is al niet geaccepteerd door de eigenaar. Overweeg een hoger bod.",
        },
        { status: 400 }
      );
    }

    // Check if user already has an active offer on this property
    const existingOffer = await prisma.propertyOffer.findFirst({
      where: {
        propertyId,
        buyerUserId: session.user.id,
        status: {
          in: ["PENDING_PASSPORT", "ACTIVE"],
        },
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: "Je hebt al een actief bod op deze woning" },
        { status: 400 }
      );
    }

    // Calculate expiry date (20 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 20);

    // Create the offer
    const offer = await prisma.propertyOffer.create({
      data: {
        propertyId,
        buyerUserId: session.user.id,
        offerAmount,
        offerCurrency: "THB",
        askingPriceAtOffer: askingPrice,
        percentageOfAsking,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerMessage,
        status: "PENDING_PASSPORT",
        expiresAt,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            listingNumber: true,
          },
        },
      },
    });

    // Send notification to property owner
    const ownerEmail = property.ownerUser?.email || property.ownerEmail;
    const ownerName = property.ownerUser?.name || property.ownerName || "Eigenaar";
    
    if (ownerEmail) {
      try {
        const emailData = newOfferOwnerNotificationTemplate({
          ownerName,
          buyerName,
          buyerEmail,
          buyerPhone,
          propertyTitle: property.title,
          propertySlug: property.slug || property.id,
          propertyPrice: askingPrice.toLocaleString("en-US"),
          offerAmount: offerAmount.toLocaleString("en-US"),
          offerPercentage: percentageOfAsking,
          offerId: offer.id,
          message: buyerMessage,
          buyerPassportUploaded: false,
        });
        
        await sendEmail({
          to: ownerEmail,
          subject: emailData.subject,
          html: emailData.html,
        });
        console.log(`[Offers] Owner notification sent to ${ownerEmail}`);
      } catch (emailError) {
        console.error("[Offers] Failed to send owner notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    // Also send admin notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "info@realestatepulse.com";
      const adminEmailData = offerAdminNotificationTemplate({
        buyerName,
        buyerEmail,
        buyerPhone,
        propertyTitle: property.title,
        propertySlug: property.slug || property.id,
        propertyPrice: askingPrice.toLocaleString("en-US"),
        offerAmount: offerAmount.toLocaleString("en-US"),
        message: buyerMessage,
      });
      
      await sendEmail({
        to: adminEmail,
        subject: adminEmailData.subject,
        html: adminEmailData.html,
      });
      console.log(`[Offers] Admin notification sent to ${adminEmail}`);
    } catch (emailError) {
      console.error("[Offers] Failed to send admin notification:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        offer: {
          id: offer.id,
          offerAmount: offer.offerAmount,
          percentageOfAsking: offer.percentageOfAsking,
          status: offer.status,
          expiresAt: offer.expiresAt,
          property: offer.property,
        },
        message: "Bod succesvol geplaatst! Upload nu uw paspoort om het bod te bevestigen.",
        nextStep: "UPLOAD_PASSPORT",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Offers POST Error]:", error);
    return NextResponse.json(
      { error: "Kon bod niet plaatsen: " + (error.message || "Onbekende fout") },
      { status: 500 }
    );
  }
}

// GET - Get user's offers
export async function GET(request: Request) {
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

    const offers = await prisma.propertyOffer.findMany({
      where: {
        buyerUserId: session.user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            listingNumber: true,
            price: true,
            image: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ offers });
  } catch (error: any) {
    console.error("[Offers GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

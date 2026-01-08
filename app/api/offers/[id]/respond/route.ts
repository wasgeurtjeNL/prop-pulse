/**
 * Offer Response API
 * POST - Owner responds to an offer (accept/reject/counter)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Respond to an offer
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

    // Get offer with property info
    const offer = await prisma.propertyOffer.findUnique({
      where: { id: offerId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerUserId: true,
            price: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Only owner or admin/agent can respond
    if (!isOwner && !isAdminOrAgent) {
      return NextResponse.json(
        { error: "Je hebt geen toegang om op dit bod te reageren" },
        { status: 403 }
      );
    }

    // Check offer status - can only respond to ACTIVE offers (with passport)
    if (offer.status !== "ACTIVE") {
      if (offer.status === "PENDING_PASSPORT") {
        return NextResponse.json(
          { error: "Wacht tot de koper zijn paspoort heeft geüpload" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Dit bod kan niet meer worden beantwoord" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, response, counterOfferAmount, rejectionReason } = body;

    if (!action || !["ACCEPT", "REJECT", "COUNTER", "CANCEL"].includes(action)) {
      return NextResponse.json(
        { error: "Ongeldige actie" },
        { status: 400 }
      );
    }

    let newStatus: string;
    let updateData: any = {
      ownerResponse: response,
      respondedAt: new Date(),
    };

    switch (action) {
      case "ACCEPT":
        newStatus = "ACCEPTED";
        updateData.status = newStatus;
        
        // Update property status to SOLD
        await prisma.property.update({
          where: { id: offer.propertyId },
          data: { status: "SOLD" },
        });
        break;

      case "REJECT":
        if (!rejectionReason) {
          return NextResponse.json(
            { error: "Geef een reden voor afwijzing" },
            { status: 400 }
          );
        }
        newStatus = "REJECTED";
        updateData.status = newStatus;
        updateData.rejectionReason = rejectionReason;
        
        // Update lowest rejected offer for smart rejection
        const currentLowest = offer.property.lowestRejectedOffer || Infinity;
        if (offer.offerAmount < currentLowest) {
          await prisma.property.update({
            where: { id: offer.propertyId },
            data: { lowestRejectedOffer: offer.offerAmount },
          });
        }
        break;

      case "COUNTER":
        if (!counterOfferAmount || counterOfferAmount <= 0) {
          return NextResponse.json(
            { error: "Geef een tegenbod bedrag" },
            { status: 400 }
          );
        }
        newStatus = "COUNTERED";
        updateData.status = newStatus;
        updateData.counterOfferAmount = counterOfferAmount;
        updateData.counterOfferAt = new Date();
        break;

      case "CANCEL":
        // Owner can only cancel if offer is under 90% of asking price
        if (offer.percentageOfAsking >= 90) {
          return NextResponse.json(
            { error: "Bod kan alleen worden geannuleerd als het minder dan 90% van de vraagprijs is" },
            { status: 400 }
          );
        }
        newStatus = "CANCELLED";
        updateData.status = newStatus;
        break;

      default:
        return NextResponse.json(
          { error: "Ongeldige actie" },
          { status: 400 }
        );
    }

    // Update the offer
    const updatedOffer = await prisma.propertyOffer.update({
      where: { id: offerId },
      data: updateData,
    });

    // TODO: Send email notification to buyer

    return NextResponse.json({
      success: true,
      offer: {
        id: updatedOffer.id,
        status: updatedOffer.status,
        respondedAt: updatedOffer.respondedAt,
        counterOfferAmount: updatedOffer.counterOfferAmount,
      },
      message: action === "ACCEPT" 
        ? "Bod geaccepteerd! De koper wordt geïnformeerd."
        : action === "REJECT"
          ? "Bod afgewezen. De koper wordt geïnformeerd."
          : action === "COUNTER"
            ? "Tegenbod verzonden! De koper wordt geïnformeerd."
            : "Bod geannuleerd.",
    });
  } catch (error: any) {
    console.error("[Offer Respond Error]:", error);
    return NextResponse.json(
      { error: "Kon niet reageren op bod: " + (error.message || "Onbekende fout") },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const createAgreementSchema = z.object({
  propertyId: z.string(),
  commissionRate: z.number().min(0).max(100),
  message: z.string().min(1),
  sentVia: z.enum(["WHATSAPP", "EMAIL"]),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientEmail: z.string().optional(),
});

// POST - Log a new owner agreement
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createAgreementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Create the agreement log
    const agreement = await prisma.ownerAgreement.create({
      data: {
        propertyId: data.propertyId,
        commissionRate: data.commissionRate,
        message: data.message,
        sentVia: data.sentVia,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        recipientEmail: data.recipientEmail,
        sentBy: session.user.id,
        sentByName: session.user.name || "Unknown",
      },
    });

    // Update property commission rate if not set
    if (!property.commissionRate) {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { commissionRate: data.commissionRate },
      });
    }

    return NextResponse.json({
      success: true,
      agreement,
      message: "Agreement logged successfully",
    });
  } catch (error) {
    console.error("Error logging owner agreement:", error);
    return NextResponse.json(
      { error: "Failed to log agreement" },
      { status: 500 }
    );
  }
}

// GET - Get agreements for a property
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 });
    }

    const agreements = await prisma.ownerAgreement.findMany({
      where: { propertyId },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({ success: true, agreements });
  } catch (error) {
    console.error("Error fetching agreements:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreements" },
      { status: 500 }
    );
  }
}





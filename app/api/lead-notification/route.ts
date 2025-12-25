import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const createNotificationSchema = z.object({
  propertyId: z.string(),
  viewingRequestId: z.string().optional(),
  // Lead details
  leadName: z.string().min(1),
  leadPhone: z.string().optional(),
  leadCountryCode: z.string().optional(),
  leadEmail: z.string().optional(),
  leadNationality: z.string().optional(),
  leadType: z.string().optional(), // RENTER or BUYER
  leadMessage: z.string().optional(),
  // Owner details (snapshot)
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().optional(),
  ownerCompany: z.string().optional(),
  commissionRate: z.number().optional(),
  // Message and delivery
  message: z.string().min(1),
  sentVia: z.enum(["WHATSAPP", "EMAIL"]),
});

// POST - Log a lead notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createNotificationSchema.safeParse(body);

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

    // Create the notification log
    const notification = await prisma.leadNotification.create({
      data: {
        propertyId: data.propertyId,
        viewingRequestId: data.viewingRequestId,
        leadName: data.leadName,
        leadPhone: data.leadPhone,
        leadCountryCode: data.leadCountryCode,
        leadEmail: data.leadEmail,
        leadNationality: data.leadNationality,
        leadType: data.leadType,
        leadMessage: data.leadMessage,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail,
        ownerCompany: data.ownerCompany,
        commissionRate: data.commissionRate,
        message: data.message,
        sentVia: data.sentVia,
        sentBy: session.user.id,
        sentByName: session.user.name || "Unknown",
      },
    });

    return NextResponse.json({
      success: true,
      notification,
      message: "Lead notification logged successfully",
    });
  } catch (error) {
    console.error("Error logging lead notification:", error);
    return NextResponse.json(
      { error: "Failed to log notification" },
      { status: 500 }
    );
  }
}

// GET - Get notifications for a property or viewing request
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
    const viewingRequestId = searchParams.get("viewingRequestId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (viewingRequestId) where.viewingRequestId = viewingRequestId;

    const notifications = await prisma.leadNotification.findMany({
      where,
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}








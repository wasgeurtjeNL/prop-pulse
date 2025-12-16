import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Update schema
const updateAlertSchema = z.object({
  propertyType: z.enum(["FOR_SALE", "FOR_RENT"]).optional().nullable(),
  category: z.enum(["LUXURY_VILLA", "APARTMENT", "RESIDENTIAL_HOME", "OFFICE_SPACES"]).optional().nullable(),
  locations: z.array(z.string()).optional(),
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  minBeds: z.number().optional().nullable(),
  maxBeds: z.number().optional().nullable(),
  minBaths: z.number().optional().nullable(),
  maxBaths: z.number().optional().nullable(),
  minSqft: z.number().optional().nullable(),
  maxSqft: z.number().optional().nullable(),
  notifyImmediately: z.boolean().optional(),
  notifyDigest: z.boolean().optional(),
  digestDay: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET - Get a specific alert
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const alert = await prisma.propertyAlert.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        propertyType: true,
        category: true,
        locations: true,
        minPrice: true,
        maxPrice: true,
        minBeds: true,
        maxBeds: true,
        minBaths: true,
        maxBaths: true,
        notifyImmediately: true,
        notifyDigest: true,
        digestDay: true,
        isActive: true,
        isVerified: true,
        matchCount: true,
        notificationCount: true,
        lastNotifiedAt: true,
        createdAt: true,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      alert: {
        ...alert,
        locations: alert.locations ? JSON.parse(alert.locations) : [],
      },
    });
  } catch (error) {
    console.error("Error fetching alert:", error);
    return NextResponse.json({ error: "Failed to fetch alert" }, { status: 500 });
  }
}

// PUT - Update an alert
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = updateAlertSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Find the alert
    const existingAlert = await prisma.propertyAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check authorization
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user && existingAlert.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the alert
    const updatedAlert = await prisma.propertyAlert.update({
      where: { id },
      data: {
        propertyType: data.propertyType !== undefined ? data.propertyType : existingAlert.propertyType,
        category: data.category !== undefined ? data.category : existingAlert.category,
        locations: data.locations ? JSON.stringify(data.locations) : existingAlert.locations,
        minPrice: data.minPrice !== undefined ? data.minPrice : existingAlert.minPrice,
        maxPrice: data.maxPrice !== undefined ? data.maxPrice : existingAlert.maxPrice,
        minBeds: data.minBeds !== undefined ? data.minBeds : existingAlert.minBeds,
        maxBeds: data.maxBeds !== undefined ? data.maxBeds : existingAlert.maxBeds,
        minBaths: data.minBaths !== undefined ? data.minBaths : existingAlert.minBaths,
        maxBaths: data.maxBaths !== undefined ? data.maxBaths : existingAlert.maxBaths,
        minSqft: data.minSqft !== undefined ? data.minSqft : existingAlert.minSqft,
        maxSqft: data.maxSqft !== undefined ? data.maxSqft : existingAlert.maxSqft,
        notifyImmediately: data.notifyImmediately !== undefined ? data.notifyImmediately : existingAlert.notifyImmediately,
        notifyDigest: data.notifyDigest !== undefined ? data.notifyDigest : existingAlert.notifyDigest,
        digestDay: data.digestDay !== undefined ? data.digestDay : existingAlert.digestDay,
        isActive: data.isActive !== undefined ? data.isActive : existingAlert.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Alert updated successfully",
      alert: {
        ...updatedAlert,
        locations: updatedAlert.locations ? JSON.parse(updatedAlert.locations) : [],
      },
    });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

// DELETE - Delete an alert
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Find the alert
    const existingAlert = await prisma.propertyAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check authorization
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user && existingAlert.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete by setting isActive to false
    await prisma.propertyAlert.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}



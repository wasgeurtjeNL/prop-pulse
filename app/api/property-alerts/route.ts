import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";

// Validation schema for creating a property alert
const createAlertSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  phone: z.string().optional(),
  countryCode: z.string().default("+66"),
  
  // Filters
  propertyType: z.enum(["FOR_SALE", "FOR_RENT"]).optional().nullable(),
  category: z.enum(["LUXURY_VILLA", "APARTMENT", "RESIDENTIAL_HOME", "OFFICE_SPACES"]).optional().nullable(),
  locations: z.array(z.string()).optional(),
  
  // Price range
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  
  // Bedrooms
  minBeds: z.number().optional().nullable(),
  maxBeds: z.number().optional().nullable(),
  
  // Bathrooms
  minBaths: z.number().optional().nullable(),
  maxBaths: z.number().optional().nullable(),
  
  // Size
  minSqft: z.number().optional().nullable(),
  maxSqft: z.number().optional().nullable(),
  
  // Notification preferences
  notifyImmediately: z.boolean().default(true),
  notifyDigest: z.boolean().default(false),
  digestDay: z.string().optional(),
  
  // Source tracking
  source: z.string().optional(),
});

// POST - Create a new property alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createAlertSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if user is logged in
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;

    // Check for existing alert with same email and similar filters
    const existingAlert = await prisma.propertyAlert.findFirst({
      where: {
        email: data.email,
        propertyType: data.propertyType || null,
        isActive: true,
      },
    });

    if (existingAlert) {
      return NextResponse.json(
        { 
          error: "You already have an active alert with similar criteria",
          existingAlertId: existingAlert.id,
        },
        { status: 409 }
      );
    }

    // Generate verification token for non-logged-in users
    const verificationToken = !userId ? crypto.randomBytes(32).toString("hex") : null;

    // Create the alert
    const alert = await prisma.propertyAlert.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        countryCode: data.countryCode,
        userId,
        propertyType: data.propertyType || null,
        category: data.category || null,
        locations: data.locations ? JSON.stringify(data.locations) : null,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        minBeds: data.minBeds,
        maxBeds: data.maxBeds,
        minBaths: data.minBaths,
        maxBaths: data.maxBaths,
        minSqft: data.minSqft,
        maxSqft: data.maxSqft,
        notifyImmediately: data.notifyImmediately,
        notifyDigest: data.notifyDigest,
        digestDay: data.digestDay,
        verificationToken,
        isVerified: !!userId, // Auto-verify if logged in
        verifiedAt: userId ? new Date() : null,
        source: data.source,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    // TODO: Send verification email if not logged in
    // For now, auto-verify for simplicity
    if (!userId && verificationToken) {
      // Auto-verify for now (in production, send email)
      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: { isVerified: true, verifiedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: userId 
        ? "Property alert created successfully!" 
        : "Property alert created! Please check your email to verify.",
      alert: {
        id: alert.id,
        email: alert.email,
        isVerified: true, // Auto-verified for now
        unsubscribeToken: alert.unsubscribeToken,
      },
    });
  } catch (error) {
    console.error("Error creating property alert:", error);
    return NextResponse.json(
      { error: "Failed to create property alert" },
      { status: 500 }
    );
  }
}

// GET - Get all alerts for the current user or by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Check if user is logged in
    const session = await auth.api.getSession({ headers: await headers() });

    let whereClause: any = { isActive: true };

    if (session?.user) {
      // Logged-in user: get their alerts
      whereClause.OR = [
        { userId: session.user.id },
        { email: session.user.email },
      ];
    } else if (email) {
      // Guest: get alerts by email
      whereClause.email = email;
    } else {
      return NextResponse.json(
        { error: "Email required for guest users" },
        { status: 400 }
      );
    }

    const alerts = await prisma.propertyAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
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
        isActive: true,
        isVerified: true,
        matchCount: true,
        notificationCount: true,
        lastNotifiedAt: true,
        createdAt: true,
      },
    });

    // Parse locations JSON
    const formattedAlerts = alerts.map((alert) => ({
      ...alert,
      locations: alert.locations ? JSON.parse(alert.locations) : [],
    }));

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
    });
  } catch (error) {
    console.error("Error fetching property alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch property alerts" },
      { status: 500 }
    );
  }
}





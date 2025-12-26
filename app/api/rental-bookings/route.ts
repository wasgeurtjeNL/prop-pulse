import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateBookingPrice, getDefaultPricingConfig } from "@/lib/services/rental-pricing";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendPassportRequest } from "@/lib/services/tm30-whatsapp";

// POST - Create a new rental booking
export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to make a booking" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();
    const {
      propertyId,
      checkIn,
      checkOut,
      adults,
      children,
      babies,
      pets,
      guestName,
      guestEmail,
      guestPhone,
      guestCountryCode,
      guestMessage,
    } = body;

    // Validate required fields
    if (!propertyId || !checkIn || !checkOut || !guestName || !guestEmail || !guestPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get property to calculate price and get default access details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        monthlyRentalPrice: true,
        title: true,
        location: true,
        // Property access defaults
        defaultCheckInTime: true,
        defaultCheckOutTime: true,
        defaultPropertyAddress: true,
        defaultWifiName: true,
        defaultWifiPassword: true,
        defaultAccessCode: true,
        defaultEmergencyContact: true,
        defaultPropertyInstructions: true,
        defaultHouseRules: true,
        // TM30 Immigration
        tm30AccommodationId: true,
        tm30AccommodationName: true,
      },
    });

    if (!property || !property.monthlyRentalPrice) {
      return NextResponse.json(
        { error: "Property not found or daily rental not enabled" },
        { status: 404 }
      );
    }

    // Get pricing config directly from database (not via API call to avoid localhost issues on Vercel)
    let pricingConfig = getDefaultPricingConfig();
    try {
      const dbConfig = await prisma.rentalPricingConfig.findUnique({
        where: { id: "default" },
      });

      if (dbConfig) {
        const peakSurcharges = dbConfig.peakSeasonSurcharges as any[];
        const lowSurcharges = dbConfig.lowSeasonSurcharges as any[];
        
        pricingConfig = {
          peakSeasonMonths: dbConfig.peakSeasonMonths as number[],
          peakSeasonSurcharges: peakSurcharges.map((s: any) => ({
            minDays: s.minDays,
            maxDays: s.maxDays,
            surchargePercent: s.surchargePercent ?? s.discountPercent ?? 0,
          })),
          lowSeasonSurcharges: lowSurcharges.map((s: any) => ({
            minDays: s.minDays,
            maxDays: s.maxDays,
            surchargePercent: s.surchargePercent ?? s.discountPercent ?? 0,
          })),
          minimumStayDays: dbConfig.minimumStayDays,
          maximumStayDays: dbConfig.maximumStayDays,
        };
      }
    } catch (error) {
      console.error("Failed to fetch pricing config from DB, using defaults:", error);
    }

    // Calculate booking price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const priceCalculation = calculateBookingPrice(
      property.monthlyRentalPrice,
      checkInDate,
      checkOutDate,
      pricingConfig
    );

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate passports required (adults + children need passports, babies don't)
    const passportsRequired = (adults || 1) + (children || 0);

    // Create booking with user association and property access defaults
    const booking = await prisma.rentalBooking.create({
      data: {
        propertyId,
        userId, // Link booking to authenticated user
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        adults: adults || 1,
        children: children || 0,
        babies: babies || 0,
        pets: pets || 0,
        basePrice: priceCalculation.baseDailyPrice,
        season: priceCalculation.season,
        discountPercent: 0, // No discount - surcharges are applied for short stays instead
        totalPrice: priceCalculation.total,
        guestName,
        guestEmail,
        guestPhone,
        guestCountryCode: guestCountryCode || "+66",
        guestMessage: guestMessage || null,
        status: "PENDING",
        // Pre-fill property access details from property defaults
        checkInTime: property.defaultCheckInTime || "14:00",
        checkOutTime: property.defaultCheckOutTime || "11:00",
        propertyAddress: property.defaultPropertyAddress,
        wifiName: property.defaultWifiName,
        wifiPassword: property.defaultWifiPassword,
        accessCode: property.defaultAccessCode,
        emergencyContact: property.defaultEmergencyContact,
        propertyInstructions: property.defaultPropertyInstructions,
        houseRules: property.defaultHouseRules,
        // TM30 Immigration fields
        passportsRequired,
        passportsReceived: 0,
        tm30Status: "PENDING",
      },
    });

    // Create BookingGuest records for each guest (for TM30 passport management)
    const guestsToCreate = [];
    for (let i = 0; i < (adults || 1); i++) {
      guestsToCreate.push({
        bookingId: booking.id,
        guestType: "adult",
        guestNumber: i + 1,
      });
    }
    for (let i = 0; i < (children || 0); i++) {
      guestsToCreate.push({
        bookingId: booking.id,
        guestType: "child",
        guestNumber: (adults || 1) + i + 1,
      });
    }
    
    if (guestsToCreate.length > 0) {
      await prisma.bookingGuest.createMany({
        data: guestsToCreate,
      });
      console.log(`[Booking] Created ${guestsToCreate.length} guest records for TM30`);
    }

    // Send WhatsApp passport request if property has TM30 enabled
    if (property.tm30AccommodationId) {
      try {
        console.log("[Booking] Property has TM30 enabled, sending passport request...");
        await sendPassportRequest(booking.id);
        console.log("[Booking] Passport request sent successfully");
      } catch (error) {
        // Don't fail the booking if WhatsApp fails
        console.error("[Booking] Failed to send passport request:", error);
      }
    }

    // TODO: Send email notifications to property owner and guest

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        totalPrice: booking.totalPrice,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// GET - Retrieve bookings for current user or all (admin)
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view bookings" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");
    const adminView = searchParams.get("admin") === "true";

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";

    const where: any = {};
    
    // Only admins can view all bookings
    if (!isAdmin || !adminView) {
      where.userId = session.user.id;
    }
    
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;

    const bookings = await prisma.rentalBooking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            slug: true,
            provinceSlug: true,
            areaSlug: true,
            images: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
        ...(isAdmin && {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      { bookings },
      {
        headers: {
          // Private cache for authenticated user, 30s fresh, 60s stale-while-revalidate
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    console.error("Error meta:", JSON.stringify(error?.meta, null, 2));
    console.error("Error message:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error?.meta },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateBookingPrice, getDefaultPricingConfig } from "@/lib/services/rental-pricing";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendPassportRequest } from "@/lib/services/tm30-whatsapp";
import { transformRentalBooking } from "@/lib/transforms";

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
        // Property access defaults (snake_case as per Prisma schema)
        default_check_in_time: true,
        default_check_out_time: true,
        default_property_address: true,
        default_wifi_name: true,
        default_wifi_password: true,
        default_access_code: true,
        default_emergency_contact: true,
        default_property_instructions: true,
        default_house_rules: true,
        // TM30 Immigration
        tm30_accommodation_id: true,
        tm30_accommodation_name: true,
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
      const dbConfig = await prisma.rental_pricing_config.findUnique({
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
    const booking = await prisma.rental_booking.create({
      data: {
        id: crypto.randomUUID(), // Generate unique ID (required - no default in schema)
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
        check_in_time: property.default_check_in_time || "14:00",
        check_out_time: property.default_check_out_time || "11:00",
        property_address: property.default_property_address,
        wifi_name: property.default_wifi_name,
        wifi_password: property.default_wifi_password,
        access_code: property.default_access_code,
        emergency_contact: property.default_emergency_contact,
        property_instructions: property.default_property_instructions,
        house_rules: property.default_house_rules,
        // TM30 Immigration fields
        passports_required: passportsRequired,
        passports_received: 0,
        tm30_status: "PENDING",
        updatedAt: new Date(),
      },
    });

    // Create BookingGuest records for each guest (for TM30 passport management)
    const guestsToCreate: any[] = [];
    for (let i = 0; i < (adults || 1); i++) {
      guestsToCreate.push({
        id: crypto.randomUUID(),
        booking_id: booking.id,
        guest_type: "adult",
        guest_number: i + 1,
        updated_at: new Date(),
      });
    }
    for (let i = 0; i < (children || 0); i++) {
      guestsToCreate.push({
        id: crypto.randomUUID(),
        booking_id: booking.id,
        guest_type: "child",
        guest_number: (adults || 1) + i + 1,
        updated_at: new Date(),
      });
    }
    
    if (guestsToCreate.length > 0) {
      await prisma.booking_guest.createMany({
        data: guestsToCreate,
      });
      console.log(`[Booking] Created ${guestsToCreate.length} guest records for TM30`);
    }

    // Send WhatsApp passport request if property has TM30 enabled
    if (property.tm30_accommodation_id) {
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
  } catch (error: any) {
    console.error("Error creating booking:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error meta:", JSON.stringify(error?.meta, null, 2));
    
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: "Failed to create booking",
        details: error?.message || "Unknown error",
        code: error?.code || null,
      },
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

    const bookings = await prisma.rental_booking.findMany({
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
          user_rental_booking_userIdTouser: {
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

    // Transform snake_case to camelCase for frontend compatibility using central utility
    return NextResponse.json(
      { bookings: bookings.map(transformRentalBooking) },
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


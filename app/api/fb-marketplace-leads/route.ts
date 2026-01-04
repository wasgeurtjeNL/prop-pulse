import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FbLeadStatus } from "@prisma/client";

/**
 * Clean description text - remove JavaScript code and limit length
 */
function cleanDescription(text: string): string | null {
  if (!text) return null;
  
  // If text contains JavaScript patterns, try to extract real content
  if (text.includes('{"require":') || text.includes('__bbox') || text.length > 50000) {
    // Try to find actual property description in the noise
    // Look for Thai text or property keywords
    const patterns = [
      // Thai property descriptions often contain these
      /(?:ขาย|เช่า|บ้าน|คอนโด|ที่ดิน|ห้องนอน|ห้องน้ำ)[^\{\}]{20,500}/g,
      // English property descriptions
      /(?:bedroom|bathroom|house|condo|apartment|pool|villa)[^{}\[\]]{20,500}/gi,
      // Price patterns with context
      /(?:฿|THB|baht)\s*[\d,\.]+[^\{\}]{10,200}/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Join first few matches
        const cleanText = matches.slice(0, 3).join(' ').trim();
        if (cleanText.length > 50) {
          return cleanText.substring(0, 2000);
        }
      }
    }
    
    // If no good content found, return null instead of garbage
    return null;
  }
  
  // Normal text - just limit length
  return text.substring(0, 5000);
}

// GET all FB Marketplace leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const where: any = {};

    // Filter by status
    if (status && status !== "all") {
      where.status = status as FbLeadStatus;
    }

    // Search by seller name, property title, or location
    if (search) {
      where.OR = [
        { sellerName: { contains: search, mode: "insensitive" } },
        { propertyTitle: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { sellerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.fbMarketplaceLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit ? parseInt(limit) : undefined,
        skip: offset ? parseInt(offset) : undefined,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.fbMarketplaceLead.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.fbMarketplaceLead.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const statsMap = stats.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: leads,
      total,
      stats: {
        total,
        new: statsMap["NEW"] || 0,
        contacted: statsMap["CONTACTED"] || 0,
        responded: statsMap["RESPONDED"] || 0,
        interested: statsMap["INTERESTED"] || 0,
        notInterested: statsMap["NOT_INTERESTED"] || 0,
        converted: statsMap["CONVERTED"] || 0,
        duplicate: statsMap["DUPLICATE"] || 0,
        invalid: statsMap["INVALID"] || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching FB Marketplace leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST - Create new FB Marketplace lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      listingUrl,
      facebookId,
      sellerName,
      sellerPhone,
      sellerWhatsapp,
      sellerLineId,
      sellerEmail,
      sellerFacebookUrl,
      propertyTitle,
      price,
      location,
      description,
      images,
      propertyType,
      bedrooms,
      bathrooms,
      sqm,
      rawData,
      status,
      priority,
      contactNotes,
      assignedToId,
    } = body;

    // Validate required fields
    if (!listingUrl || !sellerName || !propertyTitle) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: listingUrl, sellerName, and propertyTitle are required",
        },
        { status: 400 }
      );
    }

    // Check for duplicate listing URL
    const existing = await prisma.fbMarketplaceLead.findUnique({
      where: { listingUrl },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "A lead with this listing URL already exists",
          existingId: existing.id,
        },
        { status: 409 }
      );
    }

    // Ensure facebookId is always a string (it can be a very large number)
    const safeFacebookId = facebookId ? String(facebookId) : null;
    
    // Parse and validate numeric fields (prevent overflow from incorrect parsing)
    const parsedBedrooms = bedrooms ? parseInt(String(bedrooms)) : null;
    const parsedBathrooms = bathrooms ? parseInt(String(bathrooms)) : null;
    const parsedSqm = sqm ? parseInt(String(sqm)) : null;
    const parsedPriority = priority ? parseInt(String(priority)) : 0;

    // Create new lead
    const lead = await prisma.fbMarketplaceLead.create({
      data: {
        listingUrl: String(listingUrl),
        facebookId: safeFacebookId,
        sellerName: String(sellerName),
        sellerPhone: sellerPhone ? String(sellerPhone) : null,
        sellerWhatsapp: sellerWhatsapp ? String(sellerWhatsapp) : null,
        sellerLineId: sellerLineId ? String(sellerLineId) : null,
        sellerEmail: sellerEmail ? String(sellerEmail) : null,
        sellerFacebookUrl: sellerFacebookUrl ? String(sellerFacebookUrl) : null,
        propertyTitle: String(propertyTitle),
        price: price ? String(price) : null,
        location: location ? String(location) : null,
        // Clean and limit description - remove JavaScript code and limit length
        description: description ? cleanDescription(String(description)) : null,
        images: images || [],
        propertyType: propertyType ? String(propertyType) : null,
        // Only use values if they're reasonable (max 100 rooms, max 100000 sqm)
        bedrooms: parsedBedrooms && parsedBedrooms > 0 && parsedBedrooms <= 100 ? parsedBedrooms : null,
        bathrooms: parsedBathrooms && parsedBathrooms > 0 && parsedBathrooms <= 100 ? parsedBathrooms : null,
        sqm: parsedSqm && parsedSqm > 0 && parsedSqm <= 100000 ? parsedSqm : null,
        rawData,
        status: status || "NEW",
        priority: parsedPriority >= 0 && parsedPriority <= 100 ? parsedPriority : 0,
        contactNotes: contactNotes ? String(contactNotes) : null,
        assignedToId: assignedToId ? String(assignedToId) : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Error creating FB Marketplace lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

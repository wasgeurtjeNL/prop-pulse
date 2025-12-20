import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Default export
import { mapSlugToCategory } from "@/lib/adapters/property-adapter";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const type = searchParams.get("type"); // FOR_SALE or FOR_RENT
    const location = searchParams.get("location");
    const categorySlug = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "3");

    if (!slug) {
      return NextResponse.json(
        { error: "slug parameter is required" },
        { status: 400 }
      );
    }

    // Convert slug format to database enum format
    const category = categorySlug ? mapSlugToCategory(categorySlug) : null;

    // Extract area from location
    const area = location?.split(",")[0]?.trim().toLowerCase() || "";

    // Build the where clause
    const whereClause: any = {
      slug: { not: slug }, // Exclude current property
      status: "ACTIVE", // Only active properties
    };

    // Filter by type (FOR_SALE or FOR_RENT) - very important!
    if (type) {
      whereClause.type = type;
    }

    // Build OR conditions for location and category matching
    const orConditions: any[] = [];
    
    if (area) {
      orConditions.push({ location: { contains: area, mode: "insensitive" } });
    }
    
    if (category) {
      orConditions.push({ category: category });
    }

    if (orConditions.length > 0) {
      whereClause.OR = orConditions;
    }

    // Fetch related properties
    const relatedProperties = await prisma.property.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        location: true,
        type: true,
        image: true,
        beds: true,
        baths: true,
        sqft: true,
        provinceSlug: true,
        areaSlug: true,
        images: {
          select: { url: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Format the response
    const formattedProperties = relatedProperties.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      location: p.location,
      type: p.type,
      image: p.images[0]?.url || p.image,
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft,
      provinceSlug: p.provinceSlug,
      areaSlug: p.areaSlug,
    }));

    return NextResponse.json({
      success: true,
      data: formattedProperties,
      count: formattedProperties.length,
    });
  } catch (error) {
    console.error("Error fetching related properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch related properties" },
      { status: 500 }
    );
  }
}


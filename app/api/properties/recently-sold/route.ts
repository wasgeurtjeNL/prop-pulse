import { NextResponse } from "next/server";
import { getRecentlySoldProperties } from "@/lib/actions/property.actions";
import { getOptimizedImageUrl } from "@/lib/imagekit";

/**
 * GET /api/properties/recently-sold
 * 
 * Returns recently sold/rented properties for the "Recently Sold" section.
 * These are properties marked as SOLD or RENTED in the last 90 days.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");

    const properties = await getRecentlySoldProperties(limit);

    // Transform properties for frontend consumption
    const transformedProperties = properties.map((property) => ({
      id: property.id,
      title: property.title,
      slug: property.slug,
      location: property.location,
      price: property.price,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      status: property.status,
      type: property.type,
      provinceSlug: property.provinceSlug,
      areaSlug: property.areaSlug,
      image: getOptimizedImageUrl(
        property.images?.[0]?.url || property.image,
        { width: 600, quality: 75 }
      ),
      updatedAt: property.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      properties: transformedProperties,
      total: transformedProperties.length,
    });
  } catch (error) {
    console.error("[GET /api/properties/recently-sold] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recently sold properties" },
      { status: 500 }
    );
  }
}

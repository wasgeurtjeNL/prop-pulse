import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * API Endpoint for Chrome Extension FB Marketplace Export
 * GET /api/properties/by-listing/[listingNumber]
 * 
 * Returns property data formatted for Facebook Marketplace auto-fill
 */

interface RouteParams {
  params: Promise<{ listingNumber: string }>;
}

// CORS headers for Chrome extension access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { listingNumber } = await params;
    
    if (!listingNumber) {
      return NextResponse.json(
        { success: false, error: "Listing number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize listing number (PP-0042, PP0042, or just 0042)
    const normalizedNumber = listingNumber.toUpperCase().trim();
    
    // Create search patterns
    const searchPatterns = [
      normalizedNumber,
      normalizedNumber.replace(/^PP-?/, ''),
      `PP-${normalizedNumber.replace(/^PP-?/, '')}`,
    ];

    // Find property by listing number
    const property = await prisma.property.findFirst({
      where: {
        OR: searchPatterns.map(pattern => ({
          listingNumber: { equals: pattern, mode: 'insensitive' as const }
        })),
        status: 'ACTIVE'
      },
      include: {
        images: {
          orderBy: { position: 'asc' },
          take: 10
        }
      }
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: `Property with listing number "${listingNumber}" not found` },
        { status: 404, headers: corsHeaders }
      );
    }

    // Map PropPulse category to FB Marketplace property type
    const fbPropertyType = mapCategoryToFBType(property.category);
    
    // Map PropPulse type to FB sale/rent
    const fbSaleOrRent = property.type === 'FOR_SALE' ? 'For sale' : 'Rent';

    // Generate FB-optimized description
    const fbDescription = generateFBDescription(property);

    // Extract numeric price
    const numericPrice = extractNumericPrice(property.price);

    // Format response data for FB Marketplace
    const fbData = {
      // Identifiers
      propertyId: property.id,
      listingNumber: property.listingNumber,
      
      // Core fields for FB form
      title: property.title,
      price: numericPrice,
      priceFormatted: property.price,
      currency: "THB",
      
      // FB Marketplace specific
      fbSaleOrRent: fbSaleOrRent,        // "Rent" or "For sale"
      fbPropertyType: fbPropertyType,     // "Flat", "House", "Townhouse"
      
      // Property details
      beds: property.beds,
      baths: Math.round(property.baths), // FB uses integers
      sqm: property.sqft,
      plotSize: property.plotSize,
      yearBuilt: property.yearBuilt,
      
      // Location
      location: property.location,
      district: property.district,
      
      // Content
      description: fbDescription,
      shortDescription: property.shortDescription,
      
      // Images (first 10)
      images: property.images.map(img => ({
        url: img.url,
        alt: img.alt || property.title
      })),
      mainImage: property.image,
      imageCount: property.images.length,
      
      // Original data
      originalType: property.type,
      originalCategory: property.category,
      
      // Website link for reference
      websiteUrl: buildPropertyUrl(property),
      
      // Metadata
      exportedAt: new Date().toISOString()
    };

    return NextResponse.json(
      { success: true, data: fbData },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error fetching property for FB export:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Map PropPulse PropertyCategory to FB Marketplace Property Type
 */
function mapCategoryToFBType(category: string): string {
  const mapping: Record<string, string> = {
    'APARTMENT': 'Flat',
    'LUXURY_VILLA': 'House',
    'RESIDENTIAL_HOME': 'House',
    'OFFICE_SPACES': 'Flat', // Closest match
    'TOWNHOUSE': 'Townhouse',
    'LAND': 'House', // No land option in FB, use House
    'COMMERCIAL': 'Flat',
  };
  
  return mapping[category] || 'House';
}

/**
 * Extract numeric price from formatted string
 * "฿12,500,000" → 12500000
 */
function extractNumericPrice(priceString: string): number {
  if (!priceString) return 0;
  
  // Remove currency symbols, commas, spaces, and text
  const numericString = priceString
    .replace(/[฿$€£,\s]/g, '')
    .replace(/[^\d.]/g, '');
  
  const match = numericString.match(/[\d.]+/);
  return match ? Math.round(parseFloat(match[0])) : 0;
}

/**
 * Generate FB-optimized description with emojis and structure
 */
function generateFBDescription(property: any): string {
  // Get amenities list (max 6)
  const amenitiesList = (property.amenities || [])
    .slice(0, 6)
    .map((a: string) => `• ${a}`)
    .join('\n');

  // Build property type label
  const typeLabel = property.type === 'FOR_SALE' ? '🏷️ For Sale' : '🔑 For Rent';
  
  // Build size info
  const sizeInfo = [
    `📐 ${property.sqft} m²`,
    property.plotSize ? `🌳 Plot: ${property.plotSize} m²` : null,
    property.yearBuilt ? `📅 Built: ${property.yearBuilt}` : null,
  ].filter(Boolean).join('\n');

  const description = `
🏠 ${property.title}

${typeLabel}
📍 ${property.location}
💰 ${property.price}

🛏️ ${property.beds} Bedroom${property.beds > 1 ? 's' : ''}
🚿 ${Math.round(property.baths)} Bathroom${property.baths > 1 ? 's' : ''}
${sizeInfo}

${property.shortDescription ? `${property.shortDescription}\n` : ''}
${amenitiesList ? `✨ Features:\n${amenitiesList}\n` : ''}
📞 Contact: PSM Phuket Real Estate
📱 WhatsApp: +66 98 626 1646
🌐 More details: psmphuket.com

#PhuketRealEstate #${property.type === 'FOR_SALE' ? 'PropertyForSale' : 'PropertyForRent'} #Thailand
  `.trim();

  return description;
}

/**
 * Build the full property URL
 */
function buildPropertyUrl(property: any): string {
  const baseUrl = 'https://psmphuket.com';
  
  if (property.provinceSlug && property.areaSlug) {
    return `${baseUrl}/properties/${property.provinceSlug}/${property.areaSlug}/${property.slug}`;
  }
  
  return `${baseUrl}/property/${property.slug}`;
}

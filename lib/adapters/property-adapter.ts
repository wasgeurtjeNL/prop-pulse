/**
 * Property Adapter - Transform Database Models to Frontend Format
 * Converts Prisma Property models to PropertyHomes format expected by frontend
 */

import type { Property, PropertyImage } from "@prisma/client";
import { getOptimizedImageUrl, getBlurPlaceholderUrl } from "@/lib/imagekit";
import { parseLocationToSlugs } from "@/lib/property-url";

export interface PropertyTemplateFormat {
  id: string; // Property ID - required for viewing requests
  listingNumber?: string; // Unique listing number for easy reference (e.g., "PP-0001")
  name: string;
  slug: string;
  title: string; // Full title
  category: string;
  type: "FOR_SALE" | "FOR_RENT"; // Property type
  status?: "ACTIVE" | "INACTIVE" | "SOLD" | "RENTED"; // Property availability status
  location: string;
  rate: string;
  priceRaw?: number; // Numeric price for calculations and price alerts
  beds: number;
  baths: number;
  area: number;
  plotSize?: number | null; // Land/plot size in m²
  images: Array<{ src: string; blurDataURL?: string }>;
  
  // Detail page fields
  content?: string; // Full description HTML from rich text editor
  amenities?: string[]; // Array of amenity names
  shortDescription?: string;
  descriptionParagraphs?: string[];
  propertyFeatures?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  amenitiesWithIcons?: Array<{
    name: string;
    icon: string;
  }>;
  yearBuilt?: number;
  mapUrl?: string;
  
  // Ownership details (only for FOR_SALE properties)
  ownershipType?: "FREEHOLD" | "LEASEHOLD" | null;
  isResale?: boolean | null;
  
  // Geo coordinates for map fallback
  latitude?: number | null;
  longitude?: number | null;
  
  // POI Location data (for badges)
  beachScore?: number | null;
  familyScore?: number | null;
  convenienceScore?: number | null;
  quietnessScore?: number | null;
  hasSeaView?: boolean | null;
  seaDistance?: number | null;
  district?: string | null;
  
  // Hierarchical URL slugs
  provinceSlug?: string | null;
  areaSlug?: string | null;
  
  // Daily rental configuration
  enableDailyRental?: boolean;
  monthlyRentalPrice?: number | null;
  maxGuests?: number | null;
  allowPets?: boolean;
}

type PropertyWithImages = Property & {
  images?: PropertyImage[];
};

/**
 * Transform database Property to frontend PropertyHomes format
 */
export function transformPropertyToTemplate(
  property: PropertyWithImages
): PropertyTemplateFormat {
  // Get images in correct order (position 1-4) with ImageKit optimization
  // Card images: 800px width, 75% quality for fast loading
  // Also generate blur placeholders for instant perceived loading
  const sortedImages = property.images
    ?.sort((a, b) => a.position - b.position)
    .map(img => ({ 
      src: getOptimizedImageUrl(img.url, { width: 800, quality: 75 }),
      blurDataURL: getBlurPlaceholderUrl(img.url),
    })) || [];
  
  // Fallback to main image if no images array (also optimized)
  const images = sortedImages.length > 0 
    ? sortedImages 
    : [{ 
        src: getOptimizedImageUrl(property.image, { width: 800, quality: 75 }),
        blurDataURL: getBlurPlaceholderUrl(property.image),
      }];

  // Parse JSON fields safely
  const descriptionParagraphs = parseJsonField<string[]>(
    property.descriptionParagraphs
  );
  
  const propertyFeatures = parseJsonField<Array<{
    title: string;
    description: string;
    icon: string;
  }>>(property.propertyFeatures);
  
  const amenitiesWithIcons = parseJsonField<Array<{
    name: string;
    icon: string;
  }>>(property.amenitiesWithIcons);

  // Extract numeric price from string (e.g., "฿15,000,000" -> 15000000)
  const priceRaw = extractNumericPrice(property.price);

  return {
    id: property.id, // Include database ID for viewing requests and updates
    listingNumber: property.listingNumber || undefined, // Unique listing reference
    name: property.title,
    title: property.title, // Full title
    slug: property.slug,
    category: mapCategoryToSlug(property.category),
    type: property.type as "FOR_SALE" | "FOR_RENT", // Property type
    status: property.status as "ACTIVE" | "INACTIVE" | "SOLD" | "RENTED", // Property availability status
    location: property.location,
    rate: property.price,
    priceRaw: priceRaw || undefined,
    beds: property.beds,
    baths: property.baths,
    area: property.sqft,
    plotSize: (property as any).plotSize ?? null,
    images,
    
    // Content fields
    content: property.content || undefined,
    amenities: property.amenities || undefined,
    
    // Optional fields for detail page
    shortDescription: property.shortDescription || undefined,
    descriptionParagraphs: descriptionParagraphs || undefined,
    propertyFeatures: propertyFeatures || undefined,
    amenitiesWithIcons: amenitiesWithIcons || undefined,
    yearBuilt: property.yearBuilt || undefined,
    mapUrl: property.mapUrl || undefined,
    
    // Ownership details (only for FOR_SALE properties)
    ownershipType: (property as any).ownershipType || undefined,
    isResale: (property as any).isResale || undefined,
    
    // Geo coordinates for map fallback
    latitude: (property as any).latitude ?? null,
    longitude: (property as any).longitude ?? null,
    
    // POI Location data (for badges)
    beachScore: (property as any).beachScore ?? null,
    familyScore: (property as any).familyScore ?? null,
    convenienceScore: (property as any).convenienceScore ?? null,
    quietnessScore: (property as any).quietnessScore ?? null,
    hasSeaView: (property as any).hasSeaView ?? null,
    seaDistance: (property as any).seaDistance ?? null,
    district: (property as any).district ?? null,
    
    // Hierarchical URL slugs - generate from location if not set in database
    provinceSlug: (property as any).provinceSlug || parseLocationToSlugs(property.location).provinceSlug,
    areaSlug: (property as any).areaSlug || parseLocationToSlugs(property.location).areaSlug,
    
    // Daily rental configuration
    enableDailyRental: (property as any).enableDailyRental ?? false,
    monthlyRentalPrice: (property as any).monthlyRentalPrice ?? null,
    maxGuests: (property as any).maxGuests ?? null,
    allowPets: (property as any).allowPets ?? false,
  };
}

/**
 * Map database category enum to frontend slug format
 */
function mapCategoryToSlug(category: string): string {
  const categoryMap: Record<string, string> = {
    'LUXURY_VILLA': 'luxury-villa',
    'APARTMENT': 'apartment',
    'RESIDENTIAL_HOME': 'residential-home',
    'OFFICE_SPACES': 'office-spaces',
  };
  
  return categoryMap[category] || 'residential-home';
}

/**
 * Map frontend category slug to database enum
 */
export function mapSlugToCategory(slug: string): string {
  const slugMap: Record<string, string> = {
    'luxury-villa': 'LUXURY_VILLA',
    'apartment': 'APARTMENT',
    'residential-home': 'RESIDENTIAL_HOME',
    'office-spaces': 'OFFICE_SPACES',
  };
  
  return slugMap[slug] || 'RESIDENTIAL_HOME';
}

/**
 * Extract numeric price from formatted price string
 * e.g., "฿15,000,000" -> 15000000
 * e.g., "THB 120,000/mo" -> 120000
 */
function extractNumericPrice(priceString: string): number | null {
  if (!priceString) return null;
  
  // Remove all non-numeric characters except decimal point
  const numericStr = priceString.replace(/[^0-9.]/g, '');
  
  if (!numericStr) return null;
  
  const price = parseFloat(numericStr);
  return isNaN(price) ? null : price;
}

/**
 * Safely parse JSON field
 */
function parseJsonField<T>(field: any): T | null {
  if (!field) return null;
  
  // Already parsed
  if (typeof field === 'object') {
    return field as T;
  }
  
  // Parse string
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Transform array of properties
 */
export function transformPropertiesToTemplate(
  properties: PropertyWithImages[]
): PropertyTemplateFormat[] {
  return properties.map(transformPropertyToTemplate);
}


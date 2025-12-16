/**
 * Property Adapter - Transform Database Models to Frontend Format
 * Converts Prisma Property models to PropertyHomes format expected by frontend
 */

import type { Property, PropertyImage } from "@/lib/generated/prisma/client";

export interface PropertyTemplateFormat {
  id: string; // Property ID - required for viewing requests
  name: string;
  slug: string;
  title: string; // Full title
  category: string;
  type: "FOR_SALE" | "FOR_RENT"; // Property type
  location: string;
  rate: string;
  beds: number;
  baths: number;
  area: number;
  images: Array<{ src: string }>;
  
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
  // Get images in correct order (position 1-4)
  const sortedImages = property.images
    ?.sort((a, b) => a.position - b.position)
    .map(img => ({ src: img.url })) || [];
  
  // Fallback to main image if no images array
  const images = sortedImages.length > 0 
    ? sortedImages 
    : [{ src: property.image }];

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

  return {
    id: property.id, // Include database ID for viewing requests and updates
    name: property.title,
    title: property.title, // Full title
    slug: property.slug,
    category: mapCategoryToSlug(property.category),
    type: property.type as "FOR_SALE" | "FOR_RENT", // Property type
    location: property.location,
    rate: property.price,
    beds: property.beds,
    baths: property.baths,
    area: property.sqft,
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


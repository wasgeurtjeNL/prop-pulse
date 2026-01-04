/**
 * POI Blog Templates
 * 
 * Defines blog templates that combine property data with POI information
 * for automated, data-driven blog generation.
 */

import { PoiCategory, PropertyCategory } from '@prisma/client';

export interface PoiBlogTemplate {
  id: string;
  titleTemplate: string;  // Met placeholders: {poiName}, {district}, {maxPrice}, {limit}
  type: 'near_poi' | 'best_for' | 'top_list' | 'district_guide' | 'lifestyle';
  description: string;  // For UI display
  
  // Query parameters
  query: {
    // POI filters
    poiCategories?: PoiCategory[];
    poiName?: string;           // Specifieke POI naam (bijv. "Patong Beach")
    maxPoiDistance?: number;    // Max afstand in meters
    
    // Property filters
    propertyCategory?: PropertyCategory;
    maxPrice?: number;
    minPrice?: number;
    minBeds?: number;
    minScore?: {
      beach?: number;
      family?: number;
      convenience?: number;
      quietness?: number;
    };
    hasSeaView?: boolean;
    district?: string;
    
    // Output
    limit?: number;
  };
  
  // SEO hints
  seoCategory: string;
  suggestedTags: string[];
}

export const POI_BLOG_TEMPLATES: PoiBlogTemplate[] = [
  // ===== NEAR POI TEMPLATES - Beach =====
  {
    id: 'villas-near-beach-budget',
    titleTemplate: 'Top {limit} Villas Near {poiName} Under ฿{maxPriceFormatted}',
    type: 'near_poi',
    description: 'Villas close to a specific beach within budget',
    query: {
      poiCategories: ['BEACH'],
      maxPoiDistance: 2000,
      propertyCategory: 'LUXURY_VILLA',
      maxPrice: 15000000,
      limit: 5,
    },
    seoCategory: 'guide',
    suggestedTags: ['villas', 'beach', 'luxury', 'budget'],
  },
  
  {
    id: 'beachfront-properties',
    titleTemplate: 'Beachfront Properties in {district}: Walking Distance to the Sea',
    type: 'near_poi',
    description: 'Properties within walking distance of beaches',
    query: {
      poiCategories: ['BEACH'],
      maxPoiDistance: 1000,
      minScore: { beach: 80 },
      limit: 10,
    },
    seoCategory: 'guide',
    suggestedTags: ['beachfront', 'sea-view', 'walking-distance'],
  },

  // ===== FAMILY-FOCUSED TEMPLATES =====
  {
    id: 'properties-near-schools',
    titleTemplate: 'Best Properties for Families: Near International Schools in {district}',
    type: 'best_for',
    description: 'Family properties near international schools',
    query: {
      poiCategories: ['INTERNATIONAL_SCHOOL', 'KINDERGARTEN'],
      maxPoiDistance: 5000,
      minScore: { family: 70 },
      minBeds: 3,
      limit: 10,
    },
    seoCategory: 'guide',
    suggestedTags: ['families', 'schools', 'expat-living', 'education'],
  },
  
  {
    id: 'family-friendly-neighborhood',
    titleTemplate: 'Family-Friendly Neighborhoods in {district}: Schools, Parks & Safety',
    type: 'best_for',
    description: 'Comprehensive family neighborhood guide',
    query: {
      poiCategories: ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'HOSPITAL', 'PARK'],
      maxPoiDistance: 3000,
      minScore: { family: 65 },
      minBeds: 2,
      limit: 8,
    },
    seoCategory: 'lifestyle',
    suggestedTags: ['families', 'neighborhoods', 'safety', 'parks'],
  },

  // ===== LIFESTYLE TEMPLATES =====
  {
    id: 'quiet-retreats',
    titleTemplate: 'Quiet Retreats: Properties Away from {district} Nightlife',
    type: 'lifestyle',
    description: 'Peaceful properties for those seeking tranquility',
    query: {
      minScore: { quietness: 75 },
      limit: 8,
    },
    seoCategory: 'lifestyle',
    suggestedTags: ['peaceful', 'retreat', 'privacy', 'tranquil'],
  },
  
  {
    id: 'walkable-lifestyle',
    titleTemplate: 'Best Walkable Neighborhoods in {district}: Properties Near Everything',
    type: 'lifestyle',
    description: 'Properties with high convenience scores',
    query: {
      minScore: { convenience: 80 },
      poiCategories: ['SUPERMARKET', 'RESTAURANT', 'CAFE', 'GYM'],
      maxPoiDistance: 1000,
      limit: 10,
    },
    seoCategory: 'lifestyle',
    suggestedTags: ['walkable', 'urban', 'convenience', 'city-living'],
  },
  
  {
    id: 'golf-course-living',
    titleTemplate: 'Golf Course Properties in {district}: Live on the Fairway',
    type: 'lifestyle',
    description: 'Properties near golf courses',
    query: {
      poiCategories: ['GOLF_COURSE'],
      maxPoiDistance: 3000,
      limit: 8,
    },
    seoCategory: 'lifestyle',
    suggestedTags: ['golf', 'luxury', 'resort-living', 'sports'],
  },

  // ===== DISTRICT GUIDE TEMPLATES =====
  {
    id: 'sea-view-district',
    titleTemplate: 'Sea View Properties in {district}: Complete Guide',
    type: 'district_guide',
    description: 'Comprehensive sea view guide for a district',
    query: {
      hasSeaView: true,
      limit: 10,
    },
    seoCategory: 'guide',
    suggestedTags: ['sea-view', 'ocean-view', 'panoramic', 'views'],
  },
  
  {
    id: 'district-overview',
    titleTemplate: '{district} Property Guide: Best Areas, Prices & Lifestyle',
    type: 'district_guide',
    description: 'Complete district overview with all property types',
    query: {
      limit: 15,
    },
    seoCategory: 'guide',
    suggestedTags: ['guide', 'area-guide', 'investment'],
  },

  // ===== HEALTHCARE PROXIMITY =====
  {
    id: 'near-hospital',
    titleTemplate: 'Properties Near {poiName}: Healthcare Proximity Guide',
    type: 'near_poi',
    description: 'Properties near major hospitals',
    query: {
      poiCategories: ['HOSPITAL', 'CLINIC'],
      maxPoiDistance: 3000,
      minScore: { family: 60 },
      limit: 8,
    },
    seoCategory: 'guide',
    suggestedTags: ['healthcare', 'retirees', 'medical', 'convenience'],
  },
  
  {
    id: 'retiree-friendly',
    titleTemplate: 'Retirement-Friendly Properties in {district}: Near Healthcare & Amenities',
    type: 'best_for',
    description: 'Properties ideal for retirees',
    query: {
      poiCategories: ['HOSPITAL', 'CLINIC', 'PHARMACY', 'SUPERMARKET'],
      maxPoiDistance: 2000,
      minScore: { convenience: 70, quietness: 60 },
      limit: 10,
    },
    seoCategory: 'guide',
    suggestedTags: ['retirement', 'retirees', 'healthcare', 'peaceful'],
  },

  // ===== INVESTMENT FOCUSED =====
  {
    id: 'high-rental-potential',
    titleTemplate: 'High Rental Potential: Properties Near {district} Tourist Hotspots',
    type: 'top_list',
    description: 'Properties near tourist attractions for rental income',
    query: {
      poiCategories: ['BEACH', 'SHOPPING_MALL', 'RESTAURANT', 'TOURIST_AREA'],
      maxPoiDistance: 2000,
      minScore: { convenience: 70 },
      limit: 10,
    },
    seoCategory: 'investment',
    suggestedTags: ['investment', 'rental', 'roi', 'tourist'],
  },

  // ===== LUXURY SEGMENT =====
  {
    id: 'luxury-with-marina',
    titleTemplate: 'Luxury Properties Near {poiName}: Marina Living in Phuket',
    type: 'near_poi',
    description: 'High-end properties near marinas',
    query: {
      poiCategories: ['MARINA'],
      maxPoiDistance: 3000,
      propertyCategory: 'LUXURY_VILLA',
      minPrice: 20000000,
      limit: 6,
    },
    seoCategory: 'lifestyle',
    suggestedTags: ['luxury', 'marina', 'yachts', 'waterfront'],
  },
];

/**
 * Generate dynamic templates per district
 */
export function generateDistrictTemplates(districts: string[]): PoiBlogTemplate[] {
  return districts.flatMap(district => [
    {
      id: `sea-view-${district.toLowerCase().replace(/\s+/g, '-')}`,
      titleTemplate: `Sea View Properties in ${district}: Complete Guide`,
      type: 'district_guide' as const,
      description: `Sea view properties specifically in ${district}`,
      query: {
        district,
        hasSeaView: true,
        limit: 10,
      },
      seoCategory: 'guide',
      suggestedTags: ['sea-view', district.toLowerCase()],
    },
    {
      id: `family-${district.toLowerCase().replace(/\s+/g, '-')}`,
      titleTemplate: `Family-Friendly Properties in ${district}`,
      type: 'best_for' as const,
      description: `Family properties in ${district}`,
      query: {
        district,
        minScore: { family: 65 },
        minBeds: 3,
        limit: 8,
      },
      seoCategory: 'guide',
      suggestedTags: ['families', district.toLowerCase()],
    },
  ]);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PoiBlogTemplate | undefined {
  return POI_BLOG_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: PoiBlogTemplate['type']): PoiBlogTemplate[] {
  return POI_BLOG_TEMPLATES.filter(t => t.type === type);
}


'use server';

/**
 * POI Blog Actions
 * 
 * Server actions for fetching combined property + POI data
 * for automated blog generation.
 */

import prisma from '@/lib/prisma';
import { PoiCategory, PropertyCategory } from '@prisma/client';
import { 
  POI_BLOG_TEMPLATES, 
  PoiBlogTemplate,
  getTemplateById 
} from '@/lib/services/poi-blog/templates';
import { formatDistance } from '@/lib/services/poi/distance';

// ============================================
// TYPES
// ============================================

export interface PoiBlogProperty {
  id: string;
  title: string;
  slug: string;
  price: string;
  priceNumeric: number;
  type: 'FOR_SALE' | 'FOR_RENT';
  location: string;
  district: string | null;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  hasSeaView: boolean;
  seaViewDirection: string | null;
  // Scores
  beachScore: number | null;
  familyScore: number | null;
  convenienceScore: number | null;
  quietnessScore: number | null;
  // Nearest POIs for this query
  nearestPois: {
    name: string;
    category: PoiCategory;
    distanceMeters: number;
    distanceFormatted: string;
  }[];
}

export interface PoiBlogStats {
  totalMatching: number;
  // Sale properties stats
  saleCount: number;
  avgSalePrice: number | null;
  salePriceRange: { min: number; max: number } | null;
  // Rental properties stats
  rentCount: number;
  avgRentPrice: number | null;  // Per month
  rentPriceRange: { min: number; max: number } | null;
  // Scores (all properties)
  avgBeachScore: number | null;
  avgFamilyScore: number | null;
  avgConvenienceScore: number | null;
  avgQuietnessScore: number | null;
}

export interface PoiBlogData {
  template: PoiBlogTemplate;
  properties: PoiBlogProperty[];
  targetPoi?: {
    id: string;
    name: string;
    category: PoiCategory;
  };
  district?: string;
  stats: PoiBlogStats;
  generatedTitle: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse price string to number
 */
function parsePrice(price: string): number {
  const cleaned = price.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format price for display in title
 */
function formatPriceForTitle(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)}M`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`;
  }
  return price.toLocaleString();
}

/**
 * Calculate average of nullable numbers
 */
function calculateAverage(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

/**
 * Build dynamic title from template
 */
function buildTitle(
  template: PoiBlogTemplate,
  data: {
    poiName?: string;
    district?: string;
    propertyCount: number;
    maxPrice?: number;
  }
): string {
  let title = template.titleTemplate;
  
  // Replace placeholders
  if (data.poiName) {
    title = title.replace('{poiName}', data.poiName);
  }
  if (data.district) {
    title = title.replace('{district}', data.district);
  }
  title = title.replace('{limit}', String(data.propertyCount));
  
  if (data.maxPrice) {
    title = title.replace('{maxPriceFormatted}', formatPriceForTitle(data.maxPrice));
  }
  
  // Clean up any remaining placeholders
  title = title.replace(/\{[^}]+\}/g, 'Phuket');
  
  return title;
}

// ============================================
// MAIN ACTIONS
// ============================================

/**
 * Fetch properties + POI data for a specific blog template
 */
export async function getPoiBlogData(
  templateId: string,
  overrides?: Partial<PoiBlogTemplate['query']>
): Promise<{ success: boolean; data?: PoiBlogData; error?: string }> {
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      return { success: false, error: `Template "${templateId}" not found` };
    }

    const query = { ...template.query, ...overrides };

    // Build property WHERE clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propertyWhere: any = {
      status: 'ACTIVE',
    };

    if (query.district) {
      propertyWhere.district = query.district;
    }

    if (query.propertyCategory) {
      propertyWhere.category = query.propertyCategory;
    }

    if (query.hasSeaView) {
      propertyWhere.hasSeaView = true;
    }

    if (query.minBeds) {
      propertyWhere.beds = { gte: query.minBeds };
    }

    // Score filters
    if (query.minScore?.beach) {
      propertyWhere.beachScore = { gte: query.minScore.beach };
    }
    if (query.minScore?.family) {
      propertyWhere.familyScore = { gte: query.minScore.family };
    }
    if (query.minScore?.convenience) {
      propertyWhere.convenienceScore = { gte: query.minScore.convenience };
    }
    if (query.minScore?.quietness) {
      propertyWhere.quietnessScore = { gte: query.minScore.quietness };
    }

    // Track target POI for title generation
    let targetPoi: { id: string; name: string; category: PoiCategory } | undefined;

    // If filtering by POI proximity
    if (query.poiCategories?.length || query.poiName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const poiWhere: any = {
        isActive: true,
      };

      if (query.poiCategories?.length) {
        poiWhere.category = { in: query.poiCategories };
      }

      if (query.poiName) {
        poiWhere.name = { contains: query.poiName, mode: 'insensitive' };
      }

      // Get matching POI(s)
      const matchingPois = await prisma.poi.findMany({
        where: poiWhere,
        select: { id: true, name: true, category: true },
        orderBy: { importance: 'desc' },
        take: 10,
      });

      if (matchingPois.length > 0) {
        // Use first/most important matching POI for title
        targetPoi = matchingPois[0];

        // Find properties near these POIs
        const poiIds = matchingPois.map(p => p.id);
        
        propertyWhere.poiDistances = {
          some: {
            poiId: { in: poiIds },
            distanceMeters: { lte: query.maxPoiDistance || 5000 },
          },
        };
      }
    }

    // Determine sort order based on template type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any[] = [];
    
    if (query.minScore?.beach || template.type === 'near_poi' && query.poiCategories?.includes('BEACH')) {
      orderBy.push({ beachScore: 'desc' });
    }
    if (query.minScore?.family) {
      orderBy.push({ familyScore: 'desc' });
    }
    if (query.minScore?.convenience) {
      orderBy.push({ convenienceScore: 'desc' });
    }
    if (query.minScore?.quietness) {
      orderBy.push({ quietnessScore: 'desc' });
    }
    if (query.hasSeaView) {
      orderBy.push({ seaDistance: 'asc' });
    }
    orderBy.push({ createdAt: 'desc' });

    // Fetch properties with POI distances
    const properties = await prisma.property.findMany({
      where: propertyWhere,
      include: {
        images: {
          select: { url: true },
          orderBy: { position: 'asc' },
          take: 1,
        },
        poiDistances: {
          where: query.poiCategories?.length
            ? { poi: { category: { in: query.poiCategories } } }
            : undefined,
          include: {
            poi: {
              select: { name: true, category: true },
            },
          },
          orderBy: { distanceMeters: 'asc' },
          take: 5,
        },
      },
      orderBy,
      take: (query.limit || 10) * 2, // Fetch more for post-filtering
    });

    // Price filter (post-query since price is string)
    let filteredProperties = properties;
    if (query.maxPrice || query.minPrice) {
      filteredProperties = properties.filter(p => {
        const numericPrice = parsePrice(p.price);
        if (query.maxPrice && numericPrice > query.maxPrice) return false;
        if (query.minPrice && numericPrice < query.minPrice) return false;
        return true;
      });
    }

    // Limit to requested count
    filteredProperties = filteredProperties.slice(0, query.limit || 10);

    if (filteredProperties.length === 0) {
      return { 
        success: false, 
        error: 'No properties found matching the criteria. Try adjusting filters.' 
      };
    }

    // Transform to blog-friendly format
    const blogProperties: PoiBlogProperty[] = filteredProperties.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      priceNumeric: parsePrice(p.price),
      type: p.type as 'FOR_SALE' | 'FOR_RENT',
      location: p.location,
      district: p.district,
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft,
      image: p.images[0]?.url || p.image,
      hasSeaView: p.hasSeaView,
      seaViewDirection: p.seaViewDirection,
      beachScore: p.beachScore,
      familyScore: p.familyScore,
      convenienceScore: p.convenienceScore,
      quietnessScore: p.quietnessScore,
      nearestPois: p.poiDistances.map(d => ({
        name: d.poi.name,
        category: d.poi.category,
        distanceMeters: d.distanceMeters,
        distanceFormatted: formatDistance(d.distanceMeters),
      })),
    }));

    // Calculate stats - separate for sale and rent
    const saleProperties = blogProperties.filter(p => p.type === 'FOR_SALE');
    const rentProperties = blogProperties.filter(p => p.type === 'FOR_RENT');
    
    const salePrices = saleProperties.map(p => p.priceNumeric).filter(p => p > 0);
    const rentPrices = rentProperties.map(p => p.priceNumeric).filter(p => p > 0);
    
    const stats: PoiBlogStats = {
      totalMatching: blogProperties.length,
      // Sale stats
      saleCount: saleProperties.length,
      avgSalePrice: salePrices.length > 0 
        ? Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length) 
        : null,
      salePriceRange: salePrices.length > 0 
        ? { min: Math.min(...salePrices), max: Math.max(...salePrices) }
        : null,
      // Rent stats
      rentCount: rentProperties.length,
      avgRentPrice: rentPrices.length > 0 
        ? Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length) 
        : null,
      rentPriceRange: rentPrices.length > 0 
        ? { min: Math.min(...rentPrices), max: Math.max(...rentPrices) }
        : null,
      // Score averages
      avgBeachScore: calculateAverage(blogProperties.map(p => p.beachScore)),
      avgFamilyScore: calculateAverage(blogProperties.map(p => p.familyScore)),
      avgConvenienceScore: calculateAverage(blogProperties.map(p => p.convenienceScore)),
      avgQuietnessScore: calculateAverage(blogProperties.map(p => p.quietnessScore)),
    };

    // Build generated title
    const generatedTitle = buildTitle(template, {
      poiName: targetPoi?.name,
      district: query.district,
      propertyCount: blogProperties.length,
      maxPrice: query.maxPrice,
    });

    return {
      success: true,
      data: {
        template,
        properties: blogProperties,
        targetPoi,
        district: query.district,
        stats,
        generatedTitle,
      },
    };
  } catch (error) {
    console.error('Error fetching POI blog data:', error);
    return { success: false, error: 'Failed to fetch POI blog data' };
  }
}

/**
 * Get all available districts for template generation
 */
export async function getAvailableDistricts(): Promise<{ 
  success: boolean; 
  data?: { district: string; propertyCount: number }[]; 
  error?: string 
}> {
  try {
    const districts = await prisma.property.groupBy({
      by: ['district'],
      where: {
        district: { not: null },
        status: 'ACTIVE',
      },
      _count: { district: true },
      orderBy: { _count: { district: 'desc' } },
    });

    return {
      success: true,
      data: districts
        .filter(d => d.district !== null)
        .map(d => ({
          district: d.district!,
          propertyCount: d._count.district,
        })),
    };
  } catch (error) {
    console.error('Error fetching districts:', error);
    return { success: false, error: 'Failed to fetch districts' };
  }
}

/**
 * Get popular POIs for blog generation
 */
export async function getPopularPois(
  categories?: PoiCategory[]
): Promise<{ 
  success: boolean; 
  data?: { id: string; name: string; category: PoiCategory; propertyCount: number }[]; 
  error?: string 
}> {
  try {
    const pois = await prisma.poi.findMany({
      where: {
        isActive: true,
        importance: { gte: 6 },
        ...(categories?.length ? { category: { in: categories } } : {}),
      },
      include: {
        _count: {
          select: { propertyDistances: true },
        },
      },
      orderBy: [
        { importance: 'desc' },
      ],
      take: 30,
    });

    // Filter to POIs that have properties nearby
    const poisWithProperties = pois
      .filter(p => p._count.propertyDistances > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        propertyCount: p._count.propertyDistances,
      }));

    return { success: true, data: poisWithProperties };
  } catch (error) {
    console.error('Error fetching popular POIs:', error);
    return { success: false, error: 'Failed to fetch popular POIs' };
  }
}

/**
 * Get all available templates with current data availability
 */
export async function getAvailableTemplates(): Promise<{
  success: boolean;
  data?: {
    template: PoiBlogTemplate;
    estimatedProperties: number;
    canGenerate: boolean;
  }[];
  error?: string;
}> {
  try {
    const results = await Promise.all(
      POI_BLOG_TEMPLATES.map(async (template) => {
        // Quick count query to estimate available properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { status: 'ACTIVE' };
        
        if (template.query.propertyCategory) {
          where.category = template.query.propertyCategory;
        }
        if (template.query.hasSeaView) {
          where.hasSeaView = true;
        }
        if (template.query.minScore?.beach) {
          where.beachScore = { gte: template.query.minScore.beach };
        }
        if (template.query.minScore?.family) {
          where.familyScore = { gte: template.query.minScore.family };
        }
        if (template.query.minScore?.quietness) {
          where.quietnessScore = { gte: template.query.minScore.quietness };
        }

        const count = await prisma.property.count({ where });

        return {
          template,
          estimatedProperties: count,
          canGenerate: count >= 3, // Need at least 3 properties
        };
      })
    );

    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching available templates:', error);
    return { success: false, error: 'Failed to fetch templates' };
  }
}


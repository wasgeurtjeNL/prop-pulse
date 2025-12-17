'use server';

/**
 * POI Server Actions
 * 
 * Server-side actions for POI functionality:
 * - Get nearby POIs for a property
 * - Sync POIs from external sources
 * - Calculate property POI distances
 * - Geocode property locations
 */

import prisma from '@/lib/prisma';
import { PoiCategory } from '@/lib/generated/prisma';
import { 
  geocodePropertyLocation, 
  isWithinPhuket 
} from '@/lib/services/poi/geocoding';
import { 
  syncPois, 
  analyzeProperty, 
  batchAnalyzeProperties,
  getAirportDistance,
} from '@/lib/services/poi/sync';
import { 
  formatDistance, 
  formatWalkingTime,
  formatDrivingTime,
} from '@/lib/services/poi/distance';
import { POI_CATEGORY_CONFIG } from '@/lib/services/poi/overpass';
import type { GroupedPois, PoiWithDistance } from '@/lib/services/poi/types';

// ============================================
// PUBLIC ACTIONS - For frontend use
// ============================================

/**
 * Get nearby POIs for a property
 */
export async function getNearbyPois(
  propertyId: string,
  options: {
    maxDistance?: number;
    categories?: PoiCategory[];
    limit?: number;
  } = {}
): Promise<{ success: boolean; data?: GroupedPois[]; error?: string }> {
  try {
    const { maxDistance = 5000, categories, limit = 50 } = options;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, latitude: true, longitude: true },
    });

    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    if (!property.latitude || !property.longitude) {
      return { success: false, error: 'Property has no coordinates' };
    }

    // Get POI distances
    const distances = await prisma.propertyPoiDistance.findMany({
      where: {
        propertyId,
        distanceMeters: { lte: maxDistance },
        ...(categories && { poi: { category: { in: categories } } }),
      },
      include: {
        poi: true,
      },
      orderBy: { distanceMeters: 'asc' },
      take: limit,
    });

    // Transform to PoiWithDistance
    const poisWithDistance: PoiWithDistance[] = distances.map(d => ({
      id: d.poi.id,
      name: d.poi.name,
      nameTh: d.poi.nameTh || undefined,
      category: d.poi.category,
      subCategory: d.poi.subCategory || undefined,
      latitude: d.poi.latitude,
      longitude: d.poi.longitude,
      distanceMeters: d.distanceMeters,
      walkingMinutes: d.walkingMinutes || undefined,
      drivingMinutes: d.drivingMinutes || undefined,
      importance: d.poi.importance,
      isHighlight: d.isHighlight,
    }));

    // Group by category
    const grouped = groupPoisByCategory(poisWithDistance);

    return { success: true, data: grouped };
  } catch (error) {
    console.error('Error getting nearby POIs:', error);
    return { success: false, error: 'Failed to get nearby POIs' };
  }
}

/**
 * Get property location summary (for property cards)
 */
export async function getPropertyLocationSummary(
  propertyId: string
): Promise<{
  success: boolean;
  data?: {
    beachScore: number | null;
    familyScore: number | null;
    convenienceScore: number | null;
    quietnessScore: number | null;
    hasSeaView: boolean;
    seaViewDirection: string | null;
    seaDistance: number | null;
    district: string | null;
    nearestBeach: { name: string; distance: string } | null;
    nearestSchool: { name: string; distance: string } | null;
    airportDistance: { distance: string; time: string } | null;
  };
  error?: string;
}> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        latitude: true,
        longitude: true,
        beachScore: true,
        familyScore: true,
        convenienceScore: true,
        quietnessScore: true,
        hasSeaView: true,
        seaViewDirection: true,
        seaDistance: true,
        district: true,
      },
    });

    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    // Get nearest beach
    const nearestBeach = await prisma.propertyPoiDistance.findFirst({
      where: { propertyId, poi: { category: 'BEACH' } },
      include: { poi: { select: { name: true } } },
      orderBy: { distanceMeters: 'asc' },
    });

    // Get nearest school
    const nearestSchool = await prisma.propertyPoiDistance.findFirst({
      where: { 
        propertyId, 
        poi: { category: { in: ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL'] } } 
      },
      include: { poi: { select: { name: true } } },
      orderBy: { distanceMeters: 'asc' },
    });

    // Calculate airport distance if coordinates available
    let airportDistance = null;
    if (property.latitude && property.longitude) {
      const airport = getAirportDistance(property.latitude, property.longitude);
      airportDistance = {
        distance: formatDistance(airport.distanceMeters),
        time: `${airport.drivingMinutes} min`,
      };
    }

    return {
      success: true,
      data: {
        beachScore: property.beachScore,
        familyScore: property.familyScore,
        convenienceScore: property.convenienceScore,
        quietnessScore: property.quietnessScore,
        hasSeaView: property.hasSeaView,
        seaViewDirection: property.seaViewDirection,
        seaDistance: property.seaDistance,
        district: property.district,
        nearestBeach: nearestBeach ? {
          name: nearestBeach.poi.name,
          distance: formatDistance(nearestBeach.distanceMeters),
        } : null,
        nearestSchool: nearestSchool ? {
          name: nearestSchool.poi.name,
          distance: formatDistance(nearestSchool.distanceMeters),
        } : null,
        airportDistance,
      },
    };
  } catch (error) {
    console.error('Error getting property location summary:', error);
    return { success: false, error: 'Failed to get location summary' };
  }
}

/**
 * Get highlighted POIs for a property (for property detail page)
 */
export async function getHighlightedPois(
  propertyId: string
): Promise<{
  success: boolean;
  data?: {
    leisure: PoiWithDistance[];
    family: PoiWithDistance[];
    dailyLife: PoiWithDistance[];
    transport: PoiWithDistance[];
  };
  error?: string;
}> {
  try {
    const distances = await prisma.propertyPoiDistance.findMany({
      where: {
        propertyId,
        isHighlight: true,
      },
      include: { poi: true },
      orderBy: { distanceMeters: 'asc' },
    });

    const transform = (d: typeof distances[0]): PoiWithDistance => ({
      id: d.poi.id,
      name: d.poi.name,
      nameTh: d.poi.nameTh || undefined,
      category: d.poi.category,
      subCategory: d.poi.subCategory || undefined,
      latitude: d.poi.latitude,
      longitude: d.poi.longitude,
      distanceMeters: d.distanceMeters,
      walkingMinutes: d.walkingMinutes || undefined,
      drivingMinutes: d.drivingMinutes || undefined,
      importance: d.poi.importance,
      isHighlight: true,
    });

    const leisureCategories: PoiCategory[] = ['BEACH', 'PARK', 'VIEWPOINT', 'GOLF_COURSE', 'MARINA'];
    const familyCategories: PoiCategory[] = ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'KINDERGARTEN', 'HOSPITAL', 'CLINIC'];
    const dailyLifeCategories: PoiCategory[] = ['SHOPPING_MALL', 'SUPERMARKET', 'GYM', 'COWORKING', 'RESTAURANT'];
    const transportCategories: PoiCategory[] = ['AIRPORT', 'BUS_STATION', 'FERRY_TERMINAL'];

    return {
      success: true,
      data: {
        leisure: distances.filter(d => leisureCategories.includes(d.poi.category)).map(transform),
        family: distances.filter(d => familyCategories.includes(d.poi.category)).map(transform),
        dailyLife: distances.filter(d => dailyLifeCategories.includes(d.poi.category)).map(transform),
        transport: distances.filter(d => transportCategories.includes(d.poi.category)).map(transform),
      },
    };
  } catch (error) {
    console.error('Error getting highlighted POIs:', error);
    return { success: false, error: 'Failed to get highlighted POIs' };
  }
}

// ============================================
// ADMIN ACTIONS - For dashboard use
// ============================================

/**
 * Geocode and update property coordinates
 */
export async function geocodeProperty(
  propertyId: string
): Promise<{ success: boolean; error?: string; coordinates?: { lat: number; lng: number } }> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { location: true, mapUrl: true },
    });

    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    const result = await geocodePropertyLocation(property.location, property.mapUrl);

    if (!result) {
      return { success: false, error: 'Could not geocode location' };
    }

    // Validate coordinates are in Phuket area
    if (!isWithinPhuket(result.latitude, result.longitude)) {
      console.warn(`Coordinates outside Phuket: ${result.latitude}, ${result.longitude}`);
    }

    // Update property
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        latitude: result.latitude,
        longitude: result.longitude,
        district: result.district,
      },
    });

    return {
      success: true,
      coordinates: { lat: result.latitude, lng: result.longitude },
    };
  } catch (error) {
    console.error('Error geocoding property:', error);
    return { success: false, error: 'Failed to geocode property' };
  }
}

/**
 * Analyze property POIs (calculate distances and scores)
 */
export async function analyzePropertyPois(
  propertyId: string
): Promise<{ success: boolean; error?: string; result?: { poisCalculated: number; scores: Record<string, number> } }> {
  try {
    const result = await analyzeProperty(propertyId);
    
    return {
      success: true,
      result: {
        poisCalculated: result.poisCalculated,
        scores: result.scores,
      },
    };
  } catch (error) {
    console.error('Error analyzing property POIs:', error);
    return { success: false, error: 'Failed to analyze property POIs' };
  }
}

/**
 * Sync POIs from Overpass API (admin only)
 */
export async function triggerPoiSync(
  categories?: PoiCategory[]
): Promise<{ success: boolean; error?: string; result?: { created: number; updated: number } }> {
  try {
    const result = await syncPois({ categories });
    
    if (!result.success) {
      return { success: false, error: result.errors?.join(', ') || 'Sync failed' };
    }

    return {
      success: true,
      result: {
        created: result.poisCreated,
        updated: result.poisUpdated,
      },
    };
  } catch (error) {
    console.error('Error syncing POIs:', error);
    return { success: false, error: 'Failed to sync POIs' };
  }
}

/**
 * Batch analyze all properties (admin only)
 * First geocodes properties without coordinates, then analyzes POI distances
 */
export async function triggerBatchAnalysis(
  options?: { forceRefresh?: boolean; limit?: number }
): Promise<{ success: boolean; error?: string; result?: { analyzed: number; failed: number; geocoded: number } }> {
  try {
    const result = await batchAnalyzeProperties(options);
    
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('Error in batch analysis:', error);
    return { success: false, error: 'Failed to batch analyze properties' };
  }
}

/**
 * Get POI statistics (admin dashboard)
 */
export async function getPoiStats(): Promise<{
  success: boolean;
  data?: {
    totalPois: number;
    byCategory: Record<string, number>;
    lastSyncJob: { id: string; status: string; completedAt: Date | null } | null;
    propertiesWithCoords: number;
    propertiesWithoutCoords: number;
  };
  error?: string;
}> {
  try {
    const [totalPois, categoryStats, lastSync, withCoords, withoutCoords] = await Promise.all([
      prisma.poi.count({ where: { isActive: true } }),
      prisma.poi.groupBy({
        by: ['category'],
        _count: { category: true },
        where: { isActive: true },
      }),
      prisma.poiSyncJob.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, completedAt: true },
      }),
      prisma.property.count({
        where: { latitude: { not: null }, longitude: { not: null } },
      }),
      prisma.property.count({
        where: { OR: [{ latitude: null }, { longitude: null }] },
      }),
    ]);

    const byCategory: Record<string, number> = {};
    for (const stat of categoryStats) {
      byCategory[stat.category] = stat._count.category;
    }

    return {
      success: true,
      data: {
        totalPois,
        byCategory,
        lastSyncJob: lastSync,
        propertiesWithCoords: withCoords,
        propertiesWithoutCoords: withoutCoords,
      },
    };
  } catch (error) {
    console.error('Error getting POI stats:', error);
    return { success: false, error: 'Failed to get POI statistics' };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Group POIs by category for UI display
 */
function groupPoisByCategory(pois: PoiWithDistance[]): GroupedPois[] {
  const groups = new Map<PoiCategory, PoiWithDistance[]>();

  for (const poi of pois) {
    const existing = groups.get(poi.category) || [];
    existing.push(poi);
    groups.set(poi.category, existing);
  }

  const result: GroupedPois[] = [];

  for (const [category, categoryPois] of groups) {
    const config = POI_CATEGORY_CONFIG.find(c => c.category === category);
    
    result.push({
      category,
      label: config?.label || category,
      icon: config?.icon || 'ph:map-pin',
      pois: categoryPois.sort((a, b) => a.distanceMeters - b.distanceMeters),
    });
  }

  // Sort groups by first POI distance
  return result.sort((a, b) => {
    const aMin = Math.min(...a.pois.map(p => p.distanceMeters));
    const bMin = Math.min(...b.pois.map(p => p.distanceMeters));
    return aMin - bMin;
  });
}


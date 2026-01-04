/**
 * POI Sync Service - Sync POIs to database and calculate distances
 * 
 * Handles:
 * - Syncing POIs from Overpass API to database
 * - Calculating distances between properties and POIs
 * - Updating property location scores
 */

import prisma from '@/lib/prisma';
import { PoiCategory, PoiSource } from '@prisma/client';
import { 
  ProcessedPoi, 
  PoiSyncOptions, 
  PoiSyncResult, 
  PropertyLocationScores,
  PHUKET_BBOX,
  PHUKET_AIRPORT,
} from './types';
import { fetchAllPois, fetchHighPriorityPois, getCategoryConfig } from './overpass';
import { 
  haversineDistance, 
  estimateWalkingTime, 
  estimateDrivingTime,
  analyzeSeaView,
} from './distance';
import { geocodePropertyLocation } from './geocoding';

/**
 * Upsert a POI to the database
 */
async function upsertPoi(poi: ProcessedPoi): Promise<{ created: boolean; updated: boolean }> {
  try {
    const existing = await prisma.poi.findFirst({
      where: {
        externalId: poi.externalId,
        source: poi.source as PoiSource,
      },
    });

    if (existing) {
      // Update existing POI
      await prisma.poi.update({
        where: { id: existing.id },
        data: {
          name: poi.name,
          nameTh: poi.nameTh,
          nameLocal: poi.nameLocal,
          category: poi.category as PoiCategory,
          subCategory: poi.subCategory,
          latitude: poi.latitude,
          longitude: poi.longitude,
          address: poi.address,
          district: poi.district,
          osmTags: poi.osmTags,
          importance: poi.importance,
          noiseLevel: poi.noiseLevel,
          trafficLevel: poi.trafficLevel,
          lastSyncedAt: new Date(),
          syncError: null,
        },
      });
      return { created: false, updated: true };
    } else {
      // Create new POI
      await prisma.poi.create({
        data: {
          externalId: poi.externalId,
          source: poi.source as PoiSource,
          name: poi.name,
          nameTh: poi.nameTh,
          nameLocal: poi.nameLocal,
          category: poi.category as PoiCategory,
          subCategory: poi.subCategory,
          latitude: poi.latitude,
          longitude: poi.longitude,
          address: poi.address,
          district: poi.district,
          osmTags: poi.osmTags,
          importance: poi.importance,
          noiseLevel: poi.noiseLevel,
          trafficLevel: poi.trafficLevel,
          lastSyncedAt: new Date(),
        },
      });
      return { created: true, updated: false };
    }
  } catch (error) {
    console.error(`Error upserting POI ${poi.name}:`, error);
    throw error;
  }
}

/**
 * Sync POIs from Overpass API to database
 */
export async function syncPois(options: PoiSyncOptions = {}): Promise<PoiSyncResult> {
  const startTime = Date.now();
  const jobId = `sync-${Date.now()}`;
  
  // Create sync job record
  const job = await prisma.poiSyncJob.create({
    data: {
      jobType: options.categories ? 'CATEGORY_SYNC' : 'FULL_SYNC',
      status: 'RUNNING',
      category: options.categories?.[0],
      district: options.district,
      startedAt: new Date(),
    },
  });

  try {
    // Fetch POIs from Overpass
    const bbox = options.boundingBox || PHUKET_BBOX;
    const pois = options.categories 
      ? await fetchAllPois(options.categories, bbox)
      : await fetchHighPriorityPois(bbox);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Upsert each POI
    for (const poi of pois) {
      try {
        const result = await upsertPoi(poi);
        if (result.created) created++;
        if (result.updated) updated++;
      } catch {
        skipped++;
      }
    }

    // Update job record
    await prisma.poiSyncJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        poisFetched: pois.length,
        poisCreated: created,
        poisUpdated: updated,
        poisSkipped: skipped,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      jobId: job.id,
      poisFetched: pois.length,
      poisCreated: created,
      poisUpdated: updated,
      poisSkipped: skipped,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    // Update job with error
    await prisma.poiSyncJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      jobId: job.id,
      poisFetched: 0,
      poisCreated: 0,
      poisUpdated: 0,
      poisSkipped: 0,
      duration: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Calculate and store distances between a property and all nearby POIs
 */
export async function calculatePropertyPoiDistances(
  propertyId: string,
  maxDistanceMeters: number = 10000
): Promise<number> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { latitude: true, longitude: true },
  });

  if (!property?.latitude || !property?.longitude) {
    console.warn(`Property ${propertyId} has no coordinates`);
    return 0;
  }

  // Calculate approximate lat/lng bounds for the query
  // 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(lat)
  const latDelta = maxDistanceMeters / 111000;
  const lngDelta = maxDistanceMeters / (111000 * Math.cos(property.latitude * Math.PI / 180));

  // Get all active POIs within the bounding box
  const pois = await prisma.poi.findMany({
    where: {
      isActive: true,
      latitude: {
        gte: property.latitude - latDelta,
        lte: property.latitude + latDelta,
      },
      longitude: {
        gte: property.longitude - lngDelta,
        lte: property.longitude + lngDelta,
      },
    },
  });

  // Delete existing distances for this property
  await prisma.propertyPoiDistance.deleteMany({
    where: { propertyId },
  });

  // Calculate and store distances
  const distances = pois.map(poi => {
    const distanceMeters = haversineDistance(
      property.latitude!,
      property.longitude!,
      poi.latitude,
      poi.longitude
    );

    // Get category config for highlight radius
    const config = getCategoryConfig(poi.category);
    const highlightRadius = config?.highlightRadius || 2000;

    return {
      propertyId,
      poiId: poi.id,
      distanceMeters,
      walkingMinutes: estimateWalkingTime(distanceMeters),
      drivingMinutes: estimateDrivingTime(distanceMeters),
      isHighlight: distanceMeters <= highlightRadius && poi.importance >= 7,
    };
  }).filter(d => d.distanceMeters <= maxDistanceMeters);

  // Bulk insert distances
  if (distances.length > 0) {
    await prisma.propertyPoiDistance.createMany({
      data: distances,
    });
  }

  // Update property's poisLastCalculatedAt
  await prisma.property.update({
    where: { id: propertyId },
    data: { poisLastCalculatedAt: new Date() },
  });

  return distances.length;
}

/**
 * Calculate location scores for a property
 */
export async function calculatePropertyScores(
  propertyId: string
): Promise<PropertyLocationScores> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { latitude: true, longitude: true },
  });

  if (!property?.latitude || !property?.longitude) {
    return { beachScore: 0, familyScore: 0, convenienceScore: 0, quietnessScore: 100 };
  }

  // Get all POI distances for this property
  const distances = await prisma.propertyPoiDistance.findMany({
    where: { propertyId },
    include: { poi: true },
  });

  // Calculate Beach Score (0-100)
  const beachDistances = distances
    .filter(d => d.poi.category === 'BEACH')
    .map(d => d.distanceMeters);
  const nearestBeach = beachDistances.length > 0 ? Math.min(...beachDistances) : Infinity;
  // 100 if < 500m, 0 if > 5km, linear in between
  const beachScore = nearestBeach > 5000 ? 0 : 
    nearestBeach < 500 ? 100 :
    Math.round(100 - ((nearestBeach - 500) / 4500) * 100);

  // Calculate Family Score (0-100) - based on schools and hospitals
  const schoolDistances = distances
    .filter(d => ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'KINDERGARTEN'].includes(d.poi.category))
    .map(d => d.distanceMeters);
  const hospitalDistances = distances
    .filter(d => ['HOSPITAL', 'CLINIC'].includes(d.poi.category))
    .map(d => d.distanceMeters);
  
  const nearestSchool = schoolDistances.length > 0 ? Math.min(...schoolDistances) : Infinity;
  const nearestHospital = hospitalDistances.length > 0 ? Math.min(...hospitalDistances) : Infinity;
  
  const schoolScore = nearestSchool > 5000 ? 0 : 
    nearestSchool < 1000 ? 100 :
    Math.round(100 - ((nearestSchool - 1000) / 4000) * 100);
  const hospitalScore = nearestHospital > 10000 ? 0 :
    nearestHospital < 2000 ? 100 :
    Math.round(100 - ((nearestHospital - 2000) / 8000) * 100);
  
  const familyScore = Math.round((schoolScore + hospitalScore) / 2);

  // Calculate Convenience Score (0-100) - based on shopping and daily life
  const convenienceCategories = ['SUPERMARKET', 'SHOPPING_MALL', 'CONVENIENCE_STORE', 'RESTAURANT'];
  const convenienceDistances = distances
    .filter(d => convenienceCategories.includes(d.poi.category))
    .map(d => d.distanceMeters);
  
  const nearestConvenience = convenienceDistances.length > 0 ? Math.min(...convenienceDistances) : Infinity;
  const convenienceCount = convenienceDistances.filter(d => d < 2000).length;
  
  const proximityScore = nearestConvenience > 3000 ? 0 :
    nearestConvenience < 500 ? 100 :
    Math.round(100 - ((nearestConvenience - 500) / 2500) * 100);
  const densityScore = Math.min(100, convenienceCount * 10);
  
  const convenienceScore = Math.round((proximityScore + densityScore) / 2);

  // Calculate Quietness Score (0-100) - inverse of noise
  const noiseCategories = ['NIGHTCLUB', 'BAR'];
  const noiseDistances = distances
    .filter(d => noiseCategories.includes(d.poi.category))
    .map(d => d.distanceMeters);
  
  const nearestNoise = noiseDistances.length > 0 ? Math.min(...noiseDistances) : Infinity;
  const noiseCount = noiseDistances.filter(d => d < 500).length;
  
  // Further from nightlife = higher quietness
  let quietnessScore = 100;
  if (nearestNoise < 200) quietnessScore = 20;
  else if (nearestNoise < 500) quietnessScore = 50;
  else if (nearestNoise < 1000) quietnessScore = 70;
  else if (nearestNoise < 2000) quietnessScore = 85;
  
  // Reduce score based on density of noise sources
  quietnessScore = Math.max(0, quietnessScore - noiseCount * 10);

  // Update property with scores
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      beachScore,
      familyScore,
      convenienceScore,
      quietnessScore,
    },
  });

  return { beachScore, familyScore, convenienceScore, quietnessScore };
}

/**
 * Analyze sea view for a property
 */
export async function analyzePropertySeaView(propertyId: string): Promise<void> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { latitude: true, longitude: true },
  });

  if (!property?.latitude || !property?.longitude) {
    return;
  }

  const analysis = analyzeSeaView({
    latitude: property.latitude,
    longitude: property.longitude,
  });

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      hasSeaView: analysis.hasSeaView,
      seaViewDirection: analysis.seaViewDirection,
      seaDistance: analysis.seaDistance,
    },
  });
}

/**
 * Full property POI analysis
 * Runs all calculations for a property
 */
export async function analyzeProperty(propertyId: string): Promise<{
  poisCalculated: number;
  scores: PropertyLocationScores;
}> {
  // Calculate POI distances
  const poisCalculated = await calculatePropertyPoiDistances(propertyId);
  
  // Calculate location scores
  const scores = await calculatePropertyScores(propertyId);
  
  // Analyze sea view
  await analyzePropertySeaView(propertyId);
  
  return { poisCalculated, scores };
}

/**
 * Batch analyze all properties that need POI updates
 * First geocodes properties without coordinates, then analyzes POI distances
 */
export async function batchAnalyzeProperties(
  options: {
    forceRefresh?: boolean;
    limit?: number;
  } = {}
): Promise<{ analyzed: number; failed: number; geocoded: number }> {
  const { forceRefresh = false, limit = 100 } = options;

  let analyzed = 0;
  let failed = 0;
  let geocoded = 0;

  // Step 1: Geocode properties that don't have coordinates yet
  const propertiesWithoutCoords = await prisma.property.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: { id: true, location: true, mapUrl: true },
    take: limit,
  });

  console.log(`Found ${propertiesWithoutCoords.length} properties without coordinates`);

  for (const property of propertiesWithoutCoords) {
    try {
      const coords = await geocodePropertyLocation(property.location, property.mapUrl);
      
      if (coords) {
        await prisma.property.update({
          where: { id: property.id },
          data: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            district: coords.district,
          },
        });
        geocoded++;
        console.log(`Geocoded property ${property.id}: ${property.location} -> ${coords.latitude}, ${coords.longitude}`);
      } else {
        console.warn(`Could not geocode: ${property.location}`);
      }
    } catch (error) {
      console.error(`Failed to geocode property ${property.id}:`, error);
    }
  }

  // Step 2: Analyze properties with coordinates
  const whereClause = forceRefresh
    ? { latitude: { not: null }, longitude: { not: null } }
    : {
        latitude: { not: null },
        longitude: { not: null },
        OR: [
          { poisLastCalculatedAt: null },
          { poisLastCalculatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Older than 7 days
        ],
      };

  const properties = await prisma.property.findMany({
    where: whereClause as any,
    select: { id: true },
    take: limit,
  });

  console.log(`Found ${properties.length} properties to analyze`);

  for (const property of properties) {
    try {
      await analyzeProperty(property.id);
      analyzed++;
    } catch (error) {
      console.error(`Failed to analyze property ${property.id}:`, error);
      failed++;
    }
  }

  return { analyzed, failed, geocoded };
}

/**
 * Get airport distance for a property
 */
export function getAirportDistance(
  latitude: number,
  longitude: number
): { distanceMeters: number; drivingMinutes: number } {
  const distanceMeters = haversineDistance(
    latitude,
    longitude,
    PHUKET_AIRPORT.latitude,
    PHUKET_AIRPORT.longitude
  );
  
  return {
    distanceMeters,
    drivingMinutes: estimateDrivingTime(distanceMeters),
  };
}


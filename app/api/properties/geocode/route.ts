/**
 * API Route: Geocode Properties
 * 
 * POST /api/properties/geocode
 * Body: { propertyId?: string, all?: boolean, limit?: number }
 * 
 * - If propertyId is provided: geocode single property
 * - If all: true: geocode all properties without coordinates
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { geocodePropertyLocation, isWithinPhuket } from '@/lib/services/poi/geocoding';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, all = false, limit = 50 } = body;

    // Single property geocoding
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, title: true, location: true, mapUrl: true, latitude: true, longitude: true },
      });

      if (!property) {
        return NextResponse.json(
          { success: false, error: 'Property not found' },
          { status: 404 }
        );
      }

      // Clean the location string before geocoding
      const cleanedLocation = cleanLocationString(property.location);
      
      const coords = await geocodePropertyLocation(cleanedLocation, property.mapUrl);
      
      if (!coords) {
        return NextResponse.json({
          success: false,
          error: 'Could not geocode location',
          property: {
            id: property.id,
            title: property.title,
            location: property.location,
            cleanedLocation,
          },
          suggestion: 'Add a Google Maps URL or improve the location string',
        });
      }

      // Validate coordinates are within Phuket region
      if (!isWithinPhuket(coords.latitude, coords.longitude)) {
        return NextResponse.json({
          success: false,
          error: 'Coordinates are outside Phuket region',
          coords,
          suggestion: 'The location might be incorrect or not in Phuket',
        });
      }

      // Update property with coordinates
      await prisma.property.update({
        where: { id: property.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          district: coords.district,
        },
      });

      return NextResponse.json({
        success: true,
        property: {
          id: property.id,
          title: property.title,
          location: property.location,
          cleanedLocation,
        },
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          district: coords.district,
          displayName: coords.displayName,
          confidence: coords.confidence,
        },
      });
    }

    // Batch geocoding
    if (all) {
      const propertiesWithoutCoords = await prisma.property.findMany({
        where: {
          OR: [
            { latitude: null },
            { longitude: null },
          ],
        },
        select: { id: true, title: true, location: true, mapUrl: true },
        take: limit,
      });

      const results = {
        total: propertiesWithoutCoords.length,
        success: 0,
        failed: 0,
        outOfRegion: 0,
        details: [] as Array<{
          id: string;
          title: string;
          location: string;
          status: 'geocoded' | 'failed' | 'out_of_region';
          coords?: { latitude: number; longitude: number; district?: string };
          error?: string;
        }>,
      };

      for (const property of propertiesWithoutCoords) {
        const cleanedLocation = cleanLocationString(property.location);
        
        try {
          const coords = await geocodePropertyLocation(cleanedLocation, property.mapUrl);
          
          if (!coords) {
            results.failed++;
            results.details.push({
              id: property.id,
              title: property.title,
              location: property.location,
              status: 'failed',
              error: 'Could not geocode location',
            });
            continue;
          }

          // Validate coordinates
          if (!isWithinPhuket(coords.latitude, coords.longitude)) {
            results.outOfRegion++;
            results.details.push({
              id: property.id,
              title: property.title,
              location: property.location,
              status: 'out_of_region',
              coords: { latitude: coords.latitude, longitude: coords.longitude },
              error: 'Coordinates outside Phuket region',
            });
            continue;
          }

          // Update property
          await prisma.property.update({
            where: { id: property.id },
            data: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              district: coords.district,
            },
          });

          results.success++;
          results.details.push({
            id: property.id,
            title: property.title,
            location: property.location,
            status: 'geocoded',
            coords: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              district: coords.district,
            },
          });
        } catch (error) {
          results.failed++;
          results.details.push({
            id: property.id,
            title: property.title,
            location: property.location,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Geocoded ${results.success}/${results.total} properties`,
        results,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide propertyId or set all: true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in geocode API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to geocode properties' },
      { status: 500 }
    );
  }
}

/**
 * Clean location string for better geocoding results
 */
function cleanLocationString(location: string): string {
  if (!location) return '';
  
  // Remove encoding artifacts
  let cleaned = location
    .replace(/\?+/g, '') // Remove question marks (encoding issues)
    .replace(/ï¿½/g, '') // Remove replacement characters
    .replace(/Tha[ïi]?lande?/gi, 'Thailand') // Fix various Thailand spellings
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Remove leading numbers like "435 4233" which are often internal codes
  cleaned = cleaned.replace(/^\d+\s+\d+\s*/, '');
  
  // If it's just a district name, add Phuket context
  const shortLocations = ['rawai', 'patong', 'kamala', 'kata', 'karon', 'surin', 'bang tao', 'nai harn', 'chalong'];
  const lowerCleaned = cleaned.toLowerCase();
  
  for (const loc of shortLocations) {
    if (lowerCleaned === loc || lowerCleaned === `${loc}, thailand`) {
      cleaned = `${cleaned}, Phuket, Thailand`;
      break;
    }
  }
  
  return cleaned;
}

/**
 * GET handler to check geocoding capability for a location string
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const mapUrl = searchParams.get('mapUrl');
  
  if (!location) {
    return NextResponse.json(
      { success: false, error: 'Location parameter required' },
      { status: 400 }
    );
  }
  
  const cleanedLocation = cleanLocationString(location);
  const coords = await geocodePropertyLocation(cleanedLocation, mapUrl);
  
  if (!coords) {
    return NextResponse.json({
      success: false,
      original: location,
      cleaned: cleanedLocation,
      error: 'Could not geocode this location',
      suggestions: [
        'Try adding "Phuket, Thailand" to the location',
        'Provide a Google Maps URL with coordinates',
        'Use a more specific address',
      ],
    });
  }
  
  return NextResponse.json({
    success: true,
    original: location,
    cleaned: cleanedLocation,
    coords,
    isWithinPhuket: isWithinPhuket(coords.latitude, coords.longitude),
  });
}


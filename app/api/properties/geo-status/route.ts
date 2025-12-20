/**
 * API Route: Property Geo Status
 * 
 * Returns overview of properties with/without geocoding data
 * Useful for monitoring POI system coverage
 * 
 * GET /api/properties/geo-status
 * Query params:
 *   - format: 'summary' | 'detailed' (default: 'detailed')
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'detailed';

    // Get all properties with their geo status
    const allProperties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        mapUrl: true,
        latitude: true,
        longitude: true,
        district: true,
        beachScore: true,
        familyScore: true,
        convenienceScore: true,
        quietnessScore: true,
        hasSeaView: true,
        seaViewDirection: true,
        seaDistance: true,
        poisLastCalculatedAt: true,
        createdAt: true,
        _count: {
          select: {
            poiDistances: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Categorize properties
    const withCoordinates = allProperties.filter(
      (p) => p.latitude !== null && p.longitude !== null
    );
    const withoutCoordinates = allProperties.filter(
      (p) => p.latitude === null || p.longitude === null
    );
    const withPois = allProperties.filter((p) => p._count.poiDistances > 0);
    const withScores = allProperties.filter(
      (p) => p.beachScore !== null || p.familyScore !== null
    );

    // Summary stats
    const summary = {
      total: allProperties.length,
      geocoded: withCoordinates.length,
      pending: withoutCoordinates.length,
      withPois: withPois.length,
      withScores: withScores.length,
      geocodedPercentage: allProperties.length > 0 
        ? Math.round((withCoordinates.length / allProperties.length) * 100) 
        : 0,
    };

    if (format === 'summary') {
      return NextResponse.json({
        success: true,
        summary,
      });
    }

    // Detailed response
    return NextResponse.json({
      success: true,
      summary,
      withCoordinates: withCoordinates.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        district: p.district,
        scores: {
          beach: p.beachScore,
          family: p.familyScore,
          convenience: p.convenienceScore,
          quietness: p.quietnessScore,
        },
        seaView: {
          has: p.hasSeaView,
          direction: p.seaViewDirection,
          distance: p.seaDistance,
        },
        poisCount: p._count.poiDistances,
        lastAnalyzed: p.poisLastCalculatedAt,
      })),
      withoutCoordinates: withoutCoordinates.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        location: p.location,
        mapUrl: p.mapUrl,
        createdAt: p.createdAt,
        // Hints for why geocoding might have failed
        hints: getGeocodingHints(p.location, p.mapUrl),
      })),
    });
  } catch (error) {
    console.error('Error fetching geo status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch property geo status' },
      { status: 500 }
    );
  }
}

/**
 * Analyze location string and provide hints for why geocoding might fail
 */
function getGeocodingHints(location: string | null, mapUrl: string | null): string[] {
  const hints: string[] = [];

  if (!location) {
    hints.push('No location string provided');
    return hints;
  }

  // Check for encoding issues
  if (location.includes('???') || location.includes('??')) {
    hints.push('Location contains encoding issues (special characters not properly decoded)');
  }

  // Check if location is too vague
  const vaguePhrases = ['phuket', 'rawai', 'patong'];
  const locationLower = location.toLowerCase();
  const isVague = vaguePhrases.some(
    (phrase) => locationLower === phrase || locationLower === `${phrase}, thailand`
  );
  if (isVague) {
    hints.push('Location is too vague (only district/city name, no specific address)');
  }

  // Check for Thai address format
  if (/^\d+\s+\d+/.test(location)) {
    hints.push('Address starts with numbers - might be Thai format that OSM cannot parse');
  }

  // Check for Google Maps URL
  if (mapUrl) {
    if (mapUrl.includes('google.com/maps') || mapUrl.includes('goo.gl')) {
      hints.push('Has Google Maps URL - can extract coordinates from URL');
    }
  } else {
    hints.push('No Google Maps URL provided - could add for reliable geocoding');
  }

  // General suggestions
  if (hints.length === 0) {
    hints.push('Location looks valid - might need manual verification');
  }

  return hints;
}


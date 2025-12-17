/**
 * Property POI API Routes
 * 
 * GET /api/pois/:propertyId - Get POIs near a specific property
 * POST /api/pois/:propertyId/analyze - Analyze property POIs (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatDistance } from '@/lib/services/poi/distance';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const { searchParams } = new URL(request.url);
    
    const maxDistance = parseInt(searchParams.get('maxDistance') || '5000');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, latitude: true, longitude: true },
    });
    
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }
    
    if (!property.latitude || !property.longitude) {
      return NextResponse.json(
        { success: false, error: 'Property has no coordinates' },
        { status: 400 }
      );
    }
    
    // Get POI distances
    const distances = await prisma.propertyPoiDistance.findMany({
      where: {
        propertyId,
        distanceMeters: { lte: maxDistance },
      },
      include: {
        poi: {
          select: {
            id: true,
            name: true,
            nameTh: true,
            category: true,
            subCategory: true,
            latitude: true,
            longitude: true,
            importance: true,
          },
        },
      },
      orderBy: { distanceMeters: 'asc' },
      take: limit,
    });
    
    // Transform response
    const pois = distances.map(d => ({
      id: d.poi.id,
      name: d.poi.name,
      nameTh: d.poi.nameTh,
      category: d.poi.category,
      subCategory: d.poi.subCategory,
      latitude: d.poi.latitude,
      longitude: d.poi.longitude,
      importance: d.poi.importance,
      distance: {
        meters: d.distanceMeters,
        formatted: formatDistance(d.distanceMeters),
        walkingMinutes: d.walkingMinutes,
        drivingMinutes: d.drivingMinutes,
      },
      isHighlight: d.isHighlight,
    }));
    
    // Group by category
    const grouped: Record<string, typeof pois> = {};
    for (const poi of pois) {
      if (!grouped[poi.category]) {
        grouped[poi.category] = [];
      }
      grouped[poi.category].push(poi);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        propertyId,
        coordinates: {
          latitude: property.latitude,
          longitude: property.longitude,
        },
        pois,
        grouped,
        count: pois.length,
      },
    });
  } catch (error) {
    console.error('Error fetching property POIs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch POIs' },
      { status: 500 }
    );
  }
}


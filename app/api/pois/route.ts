/**
 * POI API Routes
 * 
 * GET /api/pois - Get POIs (with optional filters)
 * POST /api/pois/sync - Trigger POI sync (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PoiCategory } from '@/lib/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const category = searchParams.get('category') as PoiCategory | null;
    const district = searchParams.get('district');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    };
    
    if (category) {
      where.category = category;
    }
    
    if (district) {
      where.district = district;
    }
    
    // If lat/lng provided, filter by bounding box
    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius) / 1000;
      
      // Approximate bounding box
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));
      
      where.latitude = {
        gte: latNum - latDelta,
        lte: latNum + latDelta,
      };
      where.longitude = {
        gte: lngNum - lngDelta,
        lte: lngNum + lngDelta,
      };
    }
    
    const pois = await prisma.poi.findMany({
      where,
      take: limit,
      orderBy: { importance: 'desc' },
    });
    
    return NextResponse.json({
      success: true,
      data: pois,
      count: pois.length,
    });
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch POIs' },
      { status: 500 }
    );
  }
}


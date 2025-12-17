/**
 * POI Sync API Route
 * 
 * POST /api/pois/sync - Trigger POI sync from Overpass API
 * 
 * This is an admin-only endpoint for manually triggering POI sync.
 * In production, this should also run as a scheduled job (cron).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { syncPois } from '@/lib/services/poi/sync';
import { PoiCategory } from '@/lib/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = session.user.role;
    if (!['ADMIN', 'AGENT'].includes(userRole || '')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    let categories: PoiCategory[] | undefined;
    
    try {
      const body = await request.json();
      if (body.categories && Array.isArray(body.categories)) {
        categories = body.categories as PoiCategory[];
      }
    } catch {
      // No body or invalid JSON - sync all categories
    }

    // Trigger sync
    const result = await syncPois({ categories });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Sync failed',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        poisFetched: result.poisFetched,
        poisCreated: result.poisCreated,
        poisUpdated: result.poisUpdated,
        poisSkipped: result.poisSkipped,
        duration: `${(result.duration / 1000).toFixed(2)}s`,
      },
    });
  } catch (error) {
    console.error('Error in POI sync:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


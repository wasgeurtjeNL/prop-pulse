/**
 * WhatsApp Sessions API
 * 
 * Admin endpoints for managing WhatsApp listing sessions.
 * 
 * GET /api/whatsapp/sessions - List all sessions
 * DELETE /api/whatsapp/sessions - Cleanup expired sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionStats, cleanupExpiredSessions } from '@/lib/whatsapp';

// ============================================
// GET - List Sessions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let whereClause = '';
    const params: (string | number)[] = [];
    
    if (status) {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }
    
    // Get sessions with pagination
    const sessions = await prisma.$queryRawUnsafe<Array<{
      id: string;
      phone_number: string;
      status: string;
      image_count: number;
      latitude: number | null;
      longitude: number | null;
      district: string | null;
      generated_title: string | null;
      property_id: string | null;
      error_message: string | null;
      created_at: Date;
      updated_at: Date;
      completed_at: Date | null;
      expires_at: Date;
    }>>(
      `SELECT id, phone_number, status, image_count, latitude, longitude, 
              district, generated_title, property_id, error_message,
              created_at, updated_at, completed_at, expires_at
       FROM whatsapp_listing_session
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      ...params
    );
    
    // Get total count
    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM whatsapp_listing_session ${whereClause}`,
      ...params
    );
    const totalCount = Number(countResult[0]?.count || 0);
    
    // Get stats
    const stats = await getSessionStats();
    
    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        phoneNumber: s.phone_number,
        status: s.status,
        imageCount: s.image_count,
        location: s.latitude && s.longitude 
          ? { lat: s.latitude, lng: s.longitude, district: s.district }
          : null,
        generatedTitle: s.generated_title,
        propertyId: s.property_id,
        errorMessage: s.error_message,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        completedAt: s.completed_at,
        expiresAt: s.expires_at,
        isExpired: new Date() > s.expires_at,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + sessions.length < totalCount,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Cleanup Expired Sessions
// ============================================

export async function DELETE() {
  try {
    const deletedCount = await cleanupExpiredSessions();
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired sessions`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup sessions' },
      { status: 500 }
    );
  }
}








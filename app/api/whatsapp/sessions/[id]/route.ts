/**
 * WhatsApp Session Detail API
 * 
 * GET /api/whatsapp/sessions/[id] - Get session details
 * DELETE /api/whatsapp/sessions/[id] - Cancel/delete a session
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionById, cancelSession } from '@/lib/whatsapp';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// GET - Get Session Details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const session = await prisma.$queryRaw<Array<{
      id: string;
      phone_number: string;
      whatsapp_id: string;
      status: string;
      images: string[];
      image_count: number;
      latitude: number | null;
      longitude: number | null;
      location_name: string | null;
      address: string | null;
      district: string | null;
      detected_features: object | null;
      generated_title: string | null;
      generated_description: string | null;
      generated_content_html: string | null;
      suggested_price: string | null;
      poi_scores: object | null;
      property_id: string | null;
      initiated_by: string | null;
      initiated_by_name: string | null;
      error_message: string | null;
      error_at: Date | null;
      created_at: Date;
      updated_at: Date;
      completed_at: Date | null;
      expires_at: Date;
    }>>`
      SELECT * FROM whatsapp_listing_session WHERE id = ${id}
    `;
    
    if (session.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const s = session[0];
    
    // Get linked property if exists
    let property = null;
    if (s.property_id) {
      property = await prisma.property.findUnique({
        where: { id: s.property_id },
        select: {
          id: true,
          title: true,
          slug: true,
          listingNumber: true,
          status: true,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      session: {
        id: s.id,
        phoneNumber: s.phone_number,
        whatsappId: s.whatsapp_id,
        status: s.status,
        images: s.images || [],
        imageCount: s.image_count || 0,
        location: s.latitude && s.longitude ? {
          latitude: s.latitude,
          longitude: s.longitude,
          name: s.location_name,
          address: s.address,
          district: s.district,
        } : null,
        detectedFeatures: s.detected_features,
        generatedContent: {
          title: s.generated_title,
          description: s.generated_description,
          contentHtml: s.generated_content_html,
          suggestedPrice: s.suggested_price,
        },
        poiScores: s.poi_scores,
        property,
        initiatedBy: s.initiated_by,
        initiatedByName: s.initiated_by_name,
        error: s.error_message ? {
          message: s.error_message,
          at: s.error_at,
        } : null,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        completedAt: s.completed_at,
        expiresAt: s.expires_at,
        isExpired: new Date() > s.expires_at,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Cancel/Delete Session
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Check if session exists
    const session = await getSessionById(id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Cancel the session
    await cancelSession(id);
    
    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel session' },
      { status: 500 }
    );
  }
}




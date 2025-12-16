import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Force recompile with updated Prisma Client - Dec 7, 2025 - Cancelled tracking v2

const updateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = updateSchema.parse(body);

    console.log('[PATCH] Updating viewing request:', id, 'to status:', status);

    // Get current user session
    let session;
    try {
      session = await auth.api.getSession({
        headers: await headers(),
      });
      console.log('[PATCH] Session user:', session?.user?.name, session?.user?.id);
    } catch (authError) {
      console.error('[PATCH] Error getting session:', authError);
      // Continue without session - agent tracking will be skipped
    }

    // Prepare update data
    const updateData: any = { status };

    // Track agent who confirmed, completed, or cancelled
    if (status === 'CONFIRMED' && session?.user) {
      updateData.confirmedBy = session.user.id;
      updateData.confirmedByName = session.user.name;
      updateData.confirmedAt = new Date();
      console.log('[PATCH] Adding confirmed tracking for:', session.user.name);
    }

    if (status === 'COMPLETED' && session?.user) {
      updateData.completedBy = session.user.id;
      updateData.completedByName = session.user.name;
      updateData.completedAt = new Date();
      console.log('[PATCH] Adding completed tracking for:', session.user.name);
    }

    if (status === 'CANCELLED' && session?.user) {
      updateData.cancelledBy = session.user.id;
      updateData.cancelledByName = session.user.name;
      updateData.cancelledAt = new Date();
      console.log('[PATCH] Adding cancelled tracking for:', session.user.name);
    }

    console.log('[PATCH] Update data:', updateData);

    const viewingRequest = await prisma.viewingRequest.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    console.log('[PATCH] Successfully updated viewing request');

    return NextResponse.json({
      success: true,
      message: 'Viewing request updated successfully',
      data: viewingRequest,
    });
  } catch (error) {
    console.error('[PATCH] Error updating viewing request:', error);
    console.error('[PATCH] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[PATCH] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update viewing request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.viewingRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Viewing request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting viewing request:', error);
    return NextResponse.json(
      { error: 'Failed to delete viewing request' },
      { status: 500 }
    );
  }
}


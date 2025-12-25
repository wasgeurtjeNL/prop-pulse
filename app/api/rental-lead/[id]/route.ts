import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateRentalLeadSchema = z.object({
  status: z.enum([
    'NEW',
    'CONTACTED',
    'VIEWING_SCHEDULED',
    'OFFER_MADE',
    'RENTED',
    'NOT_INTERESTED',
    'LOST',
  ]).optional(),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional(),
});

// PATCH endpoint to update rental lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateRentalLeadSchema.parse(body);

    // Check if rental lead exists
    const existingLead = await prisma.rentalLead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rental lead not found',
        },
        { status: 404 }
      );
    }

    // Update the rental lead
    const updatedLead = await prisma.rentalLead.update({
      where: { id },
      data: {
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.assignedToId !== undefined && {
          assignedToId: validatedData.assignedToId,
        }),
        updatedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rental lead updated successfully',
      data: updatedLead,
    });
  } catch (error) {
    console.error('[PATCH /api/rental-lead/[id]] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update rental lead',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete rental lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if rental lead exists
    const existingLead = await prisma.rentalLead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rental lead not found',
        },
        { status: 404 }
      );
    }

    // Delete the rental lead
    await prisma.rentalLead.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Rental lead deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/rental-lead/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete rental lead',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve single rental lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await prisma.rentalLead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rental lead not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('[GET /api/rental-lead/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rental lead',
      },
      { status: 500 }
    );
  }
}










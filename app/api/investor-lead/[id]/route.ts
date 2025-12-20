import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateInvestorLeadSchema = z.object({
  status: z.enum([
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL_SENT',
    'CONVERTED',
    'NOT_INTERESTED',
    'LOST',
  ]).optional(),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional(),
});

// PATCH endpoint to update investor lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateInvestorLeadSchema.parse(body);

    // Check if investor lead exists
    const existingLead = await prisma.investorLead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Investor lead not found',
        },
        { status: 404 }
      );
    }

    // Update the investor lead
    const updatedLead = await prisma.investorLead.update({
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
      message: 'Investor lead updated successfully',
      data: updatedLead,
    });
  } catch (error) {
    console.error('[PATCH /api/investor-lead/[id]] Error:', error);

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
        error: 'Failed to update investor lead',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete investor lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if investor lead exists
    const existingLead = await prisma.investorLead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Investor lead not found',
        },
        { status: 404 }
      );
    }

    // Delete the investor lead
    await prisma.investorLead.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Investor lead deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/investor-lead/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete investor lead',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve single investor lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await prisma.investorLead.findUnique({
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
          error: 'Investor lead not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('[GET /api/investor-lead/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch investor lead',
      },
      { status: 500 }
    );
  }
}






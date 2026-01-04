import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const rentalLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  countryCode: z.string().default('+66'),
  propertyType: z.enum(['villa', 'apartment', 'condo', 'house']),
  bedrooms: z.enum(['1', '2', '3', '4', '5+']),
  budget: z.enum(['under-20k', '20k-40k', '40k-60k', '60k-100k', '100k+']),
  rentalDuration: z.enum(['short-term', '6-12months', '1-2years', '2+years']),
  preferredAreas: z.string().optional(),
  moveInDate: z.enum(['immediate', '1month', '2-3months', 'flexible']).optional(),
  furnished: z.enum(['yes', 'no', 'partial']).optional(),
  pets: z.enum(['yes', 'no']).optional(),
  message: z.string().optional(),
  newsletter: z.boolean().default(true),
  source: z.string().optional(),
  // UTM tracking parameters
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = rentalLeadSchema.parse(body);

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create rental lead in database
    const rentalLead = await prisma.rentalLead.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        countryCode: validatedData.countryCode,
        propertyType: validatedData.propertyType,
        bedrooms: validatedData.bedrooms,
        budget: validatedData.budget,
        rentalDuration: validatedData.rentalDuration,
        preferredAreas: validatedData.preferredAreas,
        moveInDate: validatedData.moveInDate,
        furnished: validatedData.furnished,
        pets: validatedData.pets,
        message: validatedData.message,
        newsletter: validatedData.newsletter,
        source: validatedData.source || 'rental-page',
        ipAddress,
        userAgent,
        status: 'NEW',
        // UTM tracking for attribution
        utmSource: validatedData.utm_source,
        utmMedium: validatedData.utm_medium,
        utmCampaign: validatedData.utm_campaign,
        utmTerm: validatedData.utm_term,
        utmContent: validatedData.utm_content,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Rental inquiry submitted successfully',
        data: {
          id: rentalLead.id,
          email: rentalLead.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/rental-lead] Error:', error);

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
        error: 'Failed to submit rental inquiry',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for dashboard to retrieve rental leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = status ? { status: status as any } : {};

    const leads = await prisma.rentalLead.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
      data: leads,
      count: leads.length,
    });
  } catch (error) {
    console.error('[GET /api/rental-lead] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rental leads',
      },
      { status: 500 }
    );
  }
}













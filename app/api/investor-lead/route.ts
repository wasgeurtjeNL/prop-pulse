import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const investorLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  countryCode: z.string().default('+66'),
  currency: z.enum(['EUR', 'USD', 'GBP', 'THB', 'AUD']).default('EUR'),
  investmentBudget: z.enum(['50k-200k', '200k-500k', '500k-1m', '1m+']),
  investmentGoal: z.enum(['buy-hold', 'fix-flip', 'rental-income', 'vacation-home', 'diversification']),
  timeline: z.enum(['immediate', '3-6months', '6-12months', '12+months']),
  preferredAreas: z.string().optional(),
  propertyType: z.string().optional(),
  experience: z.enum(['first-time', '1-3properties', '4-10properties', '10+properties']).optional(),
  financing: z.enum(['cash', 'mortgage', 'mixed']).optional(),
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
    const validatedData = investorLeadSchema.parse(body);

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create investor lead in database
    const investorLead = await prisma.investorLead.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        countryCode: validatedData.countryCode,
        currency: validatedData.currency,
        investmentBudget: validatedData.investmentBudget,
        investmentGoal: validatedData.investmentGoal,
        timeline: validatedData.timeline,
        preferredAreas: validatedData.preferredAreas,
        propertyType: validatedData.propertyType,
        experience: validatedData.experience,
        financing: validatedData.financing,
        message: validatedData.message,
        newsletter: validatedData.newsletter,
        source: validatedData.source || 'investment-opportunities-page',
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
        message: 'Investment inquiry submitted successfully',
        data: {
          id: investorLead.id,
          email: investorLead.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/investor-lead] Error:', error);

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
        error: 'Failed to submit investment inquiry',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for dashboard to retrieve leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = status ? { status: status as any } : {};

    const leads = await prisma.investorLead.findMany({
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
    console.error('[GET /api/investor-lead] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch investor leads',
      },
      { status: 500 }
    );
  }
}


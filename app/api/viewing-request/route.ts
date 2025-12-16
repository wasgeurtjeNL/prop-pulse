import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { offerConfirmationTemplate, offerAdminNotificationTemplate } from '@/lib/email/templates';

const viewingRequestSchema = z.object({
  propertyId: z.string(),
  requestType: z.enum(['SCHEDULE_VIEWING', 'MAKE_OFFER']),
  viewingDate: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  countryCode: z.string().default('+66'),
  language: z.string().optional(),
  message: z.string().optional(),
  offerAmount: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Received viewing request:', body);
    
    const validatedData = viewingRequestSchema.parse(body);

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // For SCHEDULE_VIEWING, we need viewing date AND contact information
    if (validatedData.requestType === 'SCHEDULE_VIEWING') {
      if (!validatedData.viewingDate) {
        return NextResponse.json(
          { error: 'Viewing date is required for schedule viewing requests' },
          { status: 400 }
        );
      }
      if (!validatedData.name || !validatedData.email || !validatedData.phone) {
        return NextResponse.json(
          { error: 'Name, email, and phone are required for viewing requests' },
          { status: 400 }
        );
      }
    }

    // For MAKE_OFFER, we need contact information and offer amount
    if (validatedData.requestType === 'MAKE_OFFER') {
      if (!validatedData.name || !validatedData.email || !validatedData.phone) {
        return NextResponse.json(
          { error: 'Name, email, and phone are required for offer requests' },
          { status: 400 }
        );
      }
      if (!validatedData.offerAmount) {
        return NextResponse.json(
          { error: 'Offer amount is required for offer requests' },
          { status: 400 }
        );
      }
    }

    // Prepare data with actual contact information
    // Both SCHEDULE_VIEWING and MAKE_OFFER now require real contact info
    const requestData = {
      propertyId: validatedData.propertyId,
      requestType: validatedData.requestType,
      viewingDate: validatedData.viewingDate ? new Date(validatedData.viewingDate) : null,
      name: validatedData.name!,  // Required (validated above)
      email: validatedData.email!, // Required (validated above)
      phone: validatedData.phone!, // Required (validated above)
      countryCode: validatedData.countryCode,
      language: validatedData.language || undefined,
      message: validatedData.message || undefined,
      offerAmount: validatedData.offerAmount || undefined,
      ipAddress,
      userAgent,
      status: 'PENDING' as const,
    };
    
    console.log('Creating viewing request with data:', {
      ...requestData,
      email: validatedData.email, // Log real email for verification
      name: validatedData.name,
    });

    // Create the viewing request
    const viewingRequest = await prisma.viewingRequest.create({
      data: requestData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            price: true,
          },
        },
      },
    });

    // Send email notifications for MAKE_OFFER requests
    if (validatedData.requestType === 'MAKE_OFFER' && viewingRequest.property) {
      const emailData = {
        buyerName: validatedData.name!,
        buyerEmail: validatedData.email!,
        buyerPhone: `${validatedData.countryCode}${validatedData.phone}`,
        propertyTitle: viewingRequest.property.title,
        propertySlug: viewingRequest.property.slug,
        propertyPrice: viewingRequest.property.price,
        offerAmount: validatedData.offerAmount!,
        message: validatedData.message,
        language: validatedData.language,
      };

      // Send confirmation email to buyer
      try {
        const buyerEmail = offerConfirmationTemplate(emailData);
        await sendEmail({
          to: validatedData.email!,
          subject: buyerEmail.subject,
          html: buyerEmail.html,
        });
        console.log('✅ Offer confirmation email sent to buyer:', validatedData.email);
      } catch (emailError) {
        console.error('❌ Failed to send buyer confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      // Send notification email to admin
      try {
        const adminEmail = offerAdminNotificationTemplate(emailData);
        const adminEmailAddress = process.env.ADMIN_EMAIL || 'admin@proppulse.com';
        await sendEmail({
          to: adminEmailAddress,
          subject: adminEmail.subject,
          html: adminEmail.html,
        });
        console.log('✅ Offer notification email sent to admin:', adminEmailAddress);
      } catch (emailError) {
        console.error('❌ Failed to send admin notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: validatedData.requestType === 'MAKE_OFFER' 
        ? 'Offer submitted successfully' 
        : 'Viewing request submitted successfully',
      data: {
        id: viewingRequest.id,
        requestType: viewingRequest.requestType,
        status: viewingRequest.status,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating viewing request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit viewing request' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve viewing requests (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    const where: any = {};
    
    if (propertyId) {
      where.propertyId = propertyId;
    }
    
    if (status) {
      where.status = status;
    }

    const viewingRequests = await prisma.viewingRequest.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: viewingRequests,
      count: viewingRequests.length,
    });

  } catch (error) {
    console.error('Error fetching viewing requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch viewing requests' },
      { status: 500 }
    );
  }
}


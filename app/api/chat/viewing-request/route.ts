import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

interface ViewingRequestBody {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  message?: string;
  propertyId?: string;
  propertyTitle?: string;
  isRental?: boolean;
}

// Email template for admin notification
function generateAdminEmailHtml(data: ViewingRequestBody & { property?: { title: string; slug: string; location: string; price: string } | null }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #004aac, #003380); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📅 New Viewing Request</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Via AI Chatbot</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #374151; margin-top: 0;">Contact Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${data.email}">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><a href="tel:${data.phone}">${data.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Preferred Date:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date(data.preferredDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
        </table>

        ${data.property ? `
        <h2 style="color: #374151; margin-top: 20px;">Property Interest</h2>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 5px 0; color: #004aac;">${data.property.title}</h3>
          <p style="margin: 0; color: #6b7280;">📍 ${data.property.location}</p>
          <p style="margin: 5px 0 0 0; color: #374151; font-weight: bold;">${data.property.price}</p>
          <a href="https://prop-pulse-nine.vercel.app/properties/${data.property.slug}" style="display: inline-block; margin-top: 10px; color: #004aac; text-decoration: none;">View Property →</a>
        </div>
        ` : `
        <p style="color: #6b7280; font-style: italic;">No specific property selected - general viewing inquiry</p>
        `}

        ${data.message ? `
        <h2 style="color: #374151; margin-top: 20px;">Message</h2>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
        ` : ''}
      </div>
      
      <div style="background: #374151; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
        <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">
          This request was submitted via the AI Chatbot on ${new Date().toLocaleString('en-GB')}
        </p>
      </div>
    </body>
    </html>
  `;
}

// Email template for customer confirmation
function generateCustomerEmailHtml(data: ViewingRequestBody & { property?: { title: string; slug: string } | null }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #004aac, #003380); padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🏡 PSM Phuket</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Viewing Request is Confirmed!</p>
      </div>
      
      <div style="background: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px;">Dear ${data.name},</p>
        
        <p>Thank you for your interest in viewing ${data.property ? `<strong>${data.property.title}</strong>` : 'properties with us'}!</p>
        
        <div style="background: #004aac; color: white; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>📅 Requested Date:</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 18px;">${new Date(data.preferredDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ul style="color: #6b7280;">
          <li>Our team will review your request</li>
          <li>We'll contact you within 24 hours to confirm the viewing</li>
          <li>We'll arrange transportation if needed</li>
        </ul>

        ${data.property ? `
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 20px;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">PROPERTY OF INTEREST</p>
          <h3 style="margin: 0; color: #374151;">${data.property.title}</h3>
          <a href="https://prop-pulse-nine.vercel.app/properties/${data.property.slug}" style="display: inline-block; margin-top: 10px; background: #004aac; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Property Details</a>
        </div>
        ` : ''}

        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280;">Questions? Contact us:</p>
          <p style="margin: 5px 0;">📞 <a href="tel:+66986261646" style="color: #004aac;">+66 98 626 1646</a></p>
          <p style="margin: 5px 0;">💬 <a href="https://wa.me/66986261646" style="color: #004aac;">WhatsApp</a></p>
          <p style="margin: 5px 0;">✉️ <a href="mailto:info@psmphuket.com" style="color: #004aac;">info@psmphuket.com</a></p>
        </div>
      </div>
      
      <div style="background: #374151; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
        <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">
          PSM Phuket - Premium Property Management
        </p>
        <p style="color: rgba(255,255,255,0.6); margin: 5px 0 0 0; font-size: 12px;">
          Phuket & Pattaya, Thailand
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body: ViewingRequestBody = await request.json();

    console.log('📥 Received viewing request:', { 
      name: body.name, 
      email: body.email,
      propertyId: body.propertyId,
      isRental: body.isRental 
    });

    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.preferredDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Fetch property details if propertyId is provided
    let property = null;
    if (body.propertyId) {
      try {
        property = await prisma.property.findUnique({
          where: { id: body.propertyId },
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            price: true,
            type: true,
          },
        });
      } catch (propError) {
        console.error('⚠️ Could not fetch property details:', propError);
        // Continue without property details
      }
    }

    // Use propertyTitle from request if property lookup failed
    if (!property && body.propertyTitle) {
      property = {
        id: body.propertyId || '',
        title: body.propertyTitle,
        slug: '',
        location: '',
        price: '',
        type: body.isRental ? 'FOR_RENT' : 'FOR_SALE',
      };
    }

    // Try to create viewing request in database (but don't fail if it doesn't work)
    let viewingRequestId = null;
    try {
      const viewingRequest = await prisma.viewingRequest.create({
        data: {
          propertyId: body.propertyId || null,
          requestType: 'SCHEDULE_VIEWING',
          viewingDate: new Date(body.preferredDate),
          name: body.name,
          email: body.email,
          phone: body.phone,
          countryCode: '+66',
          message: body.message || `Submitted via AI Chatbot${property ? ` for property: ${property.title}` : ''}`,
          ipAddress,
          userAgent,
          status: 'PENDING',
        },
      });
      viewingRequestId = viewingRequest.id;
      console.log('✅ Viewing request created in DB:', viewingRequestId);
    } catch (dbError) {
      console.error('⚠️ Database error (continuing with email):', dbError);
      // Continue to send emails even if DB fails
    }

    // Determine which email to send to based on property type
    const adminEmail = body.isRental || property?.type === 'FOR_RENT' 
      ? 'rental@psmphuket.com' 
      : 'info@psmphuket.com';

    console.log(`📧 Sending admin email to: ${adminEmail}`);

    // Send email to admin
    let adminEmailSent = false;
    try {
      await sendEmail({
        to: adminEmail,
        subject: `📅 New Viewing Request${property ? `: ${property.title}` : ' - General Inquiry'}`,
        html: generateAdminEmailHtml({ ...body, property }),
      });
      adminEmailSent = true;
      console.log(`✅ Admin notification sent to ${adminEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send admin email:', emailError);
    }

    // Send confirmation email to customer
    let customerEmailSent = false;
    try {
      await sendEmail({
        to: body.email,
        subject: '🏡 Your Viewing Request - PSM Phuket',
        html: generateCustomerEmailHtml({ ...body, property }),
      });
      customerEmailSent = true;
      console.log(`✅ Confirmation sent to ${body.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
    }

    // Return success if at least one notification was sent or DB record created
    if (viewingRequestId || adminEmailSent) {
      return NextResponse.json({
        success: true,
        message: 'Viewing request submitted successfully',
        data: {
          id: viewingRequestId || 'email-only',
          status: 'PENDING',
          emailsSent: { admin: adminEmailSent, customer: customerEmailSent },
        },
      });
    }

    // If nothing worked, return error
    return NextResponse.json(
      { success: false, error: 'Failed to process viewing request' },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Error creating viewing request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit viewing request' },
      { status: 500 }
    );
  }
}


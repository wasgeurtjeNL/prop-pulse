import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Schema for creating a price alert subscription
const createAlertSchema = z.object({
  email: z.string().email('Invalid email address'),
  propertyId: z.string().min(1, 'Property ID is required'),
  notifyPriceDrop: z.boolean().optional().default(true),
  notifyPriceChange: z.boolean().optional().default(false),
  notifyStatusChange: z.boolean().optional().default(false),
});

// POST - Subscribe to price alerts for a property
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createAlertSchema.parse(body);

    // Get the property to store current price
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { 
        id: true, 
        title: true, 
        price: true,
        listingNumber: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }

    // Extract numeric price from string (e.g., "฿15,000,000" -> 15000000)
    const numericPrice = parseFloat(
      property.price.replace(/[^0-9.]/g, '')
    ) || 0;

    // Check if subscription already exists
    const existingAlert = await prisma.propertyPriceAlert.findUnique({
      where: {
        email_propertyId: {
          email: data.email,
          propertyId: data.propertyId,
        },
      },
    });

    if (existingAlert) {
      // Update existing subscription if it was inactive
      if (!existingAlert.isActive) {
        const updated = await prisma.propertyPriceAlert.update({
          where: { id: existingAlert.id },
          data: {
            isActive: true,
            subscribedPrice: numericPrice,
            notifyPriceDrop: data.notifyPriceDrop,
            notifyPriceChange: data.notifyPriceChange,
            notifyStatusChange: data.notifyStatusChange,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Price alert reactivated!',
          alertId: updated.id,
          propertyTitle: property.title,
          listingNumber: property.listingNumber,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to price alerts for this property.',
        alertId: existingAlert.id,
        alreadySubscribed: true,
      });
    }

    // Get request metadata
    const headersList = request.headers;
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      'unknown';
    const userAgent = headersList.get('user-agent') || undefined;

    // Create new subscription
    const alert = await prisma.propertyPriceAlert.create({
      data: {
        email: data.email,
        propertyId: data.propertyId,
        subscribedPrice: numericPrice,
        notifyPriceDrop: data.notifyPriceDrop,
        notifyPriceChange: data.notifyPriceChange,
        notifyStatusChange: data.notifyStatusChange,
        unsubscribeToken: nanoid(32),
        source: 'property_page',
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: `You'll be notified when the price changes for ${property.title}!`,
      alertId: alert.id,
      propertyTitle: property.title,
      listingNumber: property.listingNumber,
      currentPrice: property.price,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Price alert subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create price alert subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from price alerts
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const propertyId = searchParams.get('propertyId');

    // Unsubscribe by token (from email link)
    if (token) {
      const alert = await prisma.propertyPriceAlert.findUnique({
        where: { unsubscribeToken: token },
      });

      if (!alert) {
        return NextResponse.json(
          { success: false, message: 'Invalid unsubscribe token' },
          { status: 404 }
        );
      }

      await prisma.propertyPriceAlert.update({
        where: { id: alert.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully unsubscribed from price alerts',
      });
    }

    // Unsubscribe by email + propertyId (from UI)
    if (email && propertyId) {
      const alert = await prisma.propertyPriceAlert.findUnique({
        where: {
          email_propertyId: { email, propertyId },
        },
      });

      if (!alert) {
        return NextResponse.json(
          { success: false, message: 'No subscription found' },
          { status: 404 }
        );
      }

      await prisma.propertyPriceAlert.update({
        where: { id: alert.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully unsubscribed from price alerts',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Token or email+propertyId required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

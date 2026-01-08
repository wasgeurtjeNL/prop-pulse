import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiKeySession, ProfilesApi, EventsApi } from 'klaviyo-api';
import { z } from 'zod';

// Schema for price change notification (called from updateProperty action)
const notifySchema = z.object({
  propertyId: z.string(),
  oldPrice: z.number(),
  newPrice: z.number(),
  propertyTitle: z.string(),
  propertySlug: z.string(),
  provinceSlug: z.string().default('phuket'),
  areaSlug: z.string().default('other'),
  listingNumber: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  internalSecret: z.string(), // Simple auth for internal API calls
});

// POST - Notify all subscribers of a price change (internal use only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = notifySchema.parse(body);

    // Simple internal authentication
    if (data.internalSecret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const priceChange = data.newPrice - data.oldPrice;
    const priceChangePercent = ((priceChange / data.oldPrice) * 100).toFixed(1);
    const isPriceDrop = priceChange < 0;

    // Find all active subscribers for this property
    const subscribers = await prisma.propertyPriceAlert.findMany({
      where: {
        propertyId: data.propertyId,
        isActive: true,
        // Filter based on notification preferences
        OR: [
          { notifyPriceChange: true }, // Any price change
          { notifyPriceDrop: isPriceDrop ? true : undefined }, // Only price drops
        ],
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers to notify',
        notifiedCount: 0,
      });
    }

    // Check if Klaviyo is configured
    if (!process.env.KLAVIYO_PRIVATE_API_KEY) {
      console.error('Klaviyo Private API Key not configured');
      return NextResponse.json({
        success: false,
        message: 'Email service not configured',
      }, { status: 500 });
    }

    const session = new ApiKeySession(process.env.KLAVIYO_PRIVATE_API_KEY);
    const eventsApi = new EventsApi(session);

    // Generate property URL with full path: /properties/{province}/{area}/{slug}
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.psmphuket.com';
    const propertyUrl = `${baseUrl}/properties/${data.provinceSlug}/${data.areaSlug}/${data.propertySlug}`;

    // Send Klaviyo events for each subscriber
    const results = await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        // Create/track Klaviyo event for this subscriber
        await eventsApi.createEvent({
          data: {
            type: 'event',
            attributes: {
              metric: {
                data: {
                  type: 'metric',
                  attributes: {
                    name: isPriceDrop ? 'Price Drop Alert' : 'Price Change Alert',
                  },
                },
              },
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email: subscriber.email,
                  },
                },
              },
              properties: {
                // Use underscores for Klaviyo template compatibility
                'Property_ID': data.propertyId,
                'Property_Title': data.propertyTitle,
                'Property_URL': propertyUrl,
                'Listing_Number': data.listingNumber || 'N/A',
                'Location': data.location || 'Thailand',
                'Old_Price': data.oldPrice.toLocaleString('en-US'), // Formatted with commas
                'New_Price': data.newPrice.toLocaleString('en-US'), // Formatted with commas
                'Price_Change': Math.abs(priceChange).toLocaleString('en-US'), // Always positive for display
                'Price_Change_Percent': Math.abs(parseFloat(priceChangePercent)).toFixed(1),
                'Is_Price_Drop': isPriceDrop,
                'Subscribed_Price': subscriber.subscribedPrice.toLocaleString('en-US'),
                'Image_URL': data.imageUrl || '',
                'Unsubscribe_Token': subscriber.unsubscribeToken,
                'Unsubscribe_URL': `${baseUrl}/api/property-price-alerts/unsubscribe?token=${subscriber.unsubscribeToken}`,
              },
              time: new Date().toISOString(),
            },
          },
        });

        // Update subscriber record
        await prisma.propertyPriceAlert.update({
          where: { id: subscriber.id },
          data: {
            lastNotifiedAt: new Date(),
            lastNotifiedPrice: data.newPrice,
            notificationCount: { increment: 1 },
          },
        });

        return subscriber.email;
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Notified ${successCount} subscribers`,
      notifiedCount: successCount,
      failedCount,
      priceChange: {
        from: data.oldPrice,
        to: data.newPrice,
        changePercent: priceChangePercent,
        isPriceDrop,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Price notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send price notifications' },
      { status: 500 }
    );
  }
}

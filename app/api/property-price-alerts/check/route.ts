import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Check if a user is subscribed to price alerts for a property
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const propertyId = searchParams.get('propertyId');

    if (!email || !propertyId) {
      return NextResponse.json(
        { success: false, message: 'Email and propertyId are required' },
        { status: 400 }
      );
    }

    const alert = await prisma.propertyPriceAlert.findUnique({
      where: {
        email_propertyId: { email, propertyId },
      },
      select: {
        id: true,
        isActive: true,
        subscribedPrice: true,
        notifyPriceDrop: true,
        notifyPriceChange: true,
        notifyStatusChange: true,
        createdAt: true,
      },
    });

    if (!alert) {
      return NextResponse.json({
        success: true,
        subscribed: false,
      });
    }

    return NextResponse.json({
      success: true,
      subscribed: alert.isActive,
      alert: {
        id: alert.id,
        subscribedPrice: alert.subscribedPrice,
        notifyPriceDrop: alert.notifyPriceDrop,
        notifyPriceChange: alert.notifyPriceChange,
        notifyStatusChange: alert.notifyStatusChange,
        createdAt: alert.createdAt,
      },
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

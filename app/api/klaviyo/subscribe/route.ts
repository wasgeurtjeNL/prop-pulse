import { NextRequest, NextResponse } from 'next/server';
import { ProfilesApi, ApiKeySession } from 'klaviyo-api';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.KLAVIYO_PRIVATE_API_KEY) {
      console.error('KLAVIYO_PRIVATE_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Newsletter service is not configured' },
        { status: 500 }
      );
    }

    // Initialize Klaviyo API session and client
    const session = new ApiKeySession(process.env.KLAVIYO_PRIVATE_API_KEY);
    const profilesApi = new ProfilesApi(session);

    // Create or update profile in Klaviyo
    const profileResponse = await profilesApi.createProfile({
      data: {
        type: 'profile',
        attributes: {
          email: email.toLowerCase().trim(),
          properties: {
            source: 'Footer Newsletter Signup',
            signup_date: new Date().toISOString(),
          },
        },
      },
    });

    // Get the profile ID from the response
    const profileId = profileResponse.body.data.id;

    console.log('Successfully subscribed email to Klaviyo:', email);

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      profileId,
    });
  } catch (error: any) {
    console.error('Klaviyo subscription error:', error);

    // Handle Klaviyo API errors
    if (error.status === 409) {
      // Profile already exists - this is OK
      return NextResponse.json({
        success: true,
        message: 'Email is already subscribed!',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to subscribe. Please try again later.',
      },
      { status: 500 }
    );
  }
}

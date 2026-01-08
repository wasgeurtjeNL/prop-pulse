import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Unsubscribe from price alerts using token (email link)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new Response(
        generateHTML(false, 'Invalid unsubscribe link. Token is missing.'),
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Find the subscription by token
    const subscription = await prisma.propertyPriceAlert.findUnique({
      where: { unsubscribeToken: token },
      include: {
        property: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!subscription) {
      return new Response(
        generateHTML(false, 'This unsubscribe link is invalid or has already been used.'),
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    if (!subscription.isActive) {
      return new Response(
        generateHTML(true, `You have already unsubscribed from price alerts for "${subscription.property.title}".`),
        { 
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Deactivate the subscription
    await prisma.propertyPriceAlert.update({
      where: { id: subscription.id },
      data: { isActive: false },
    });

    return new Response(
      generateHTML(
        true, 
        `You have been successfully unsubscribed from price alerts for "${subscription.property.title}".`,
        subscription.property.slug
      ),
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(
      generateHTML(false, 'An error occurred while processing your request. Please try again.'),
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Generate HTML response page
function generateHTML(success: boolean, message: string, propertySlug?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.psmphuket.com';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} - PSM Phuket</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .icon.success {
      background: #dcfce7;
      color: #16a34a;
    }
    .icon.error {
      background: #fee2e2;
      color: #dc2626;
    }
    h1 {
      color: #1e293b;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #64748b;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: #1CB2FF;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.3s;
    }
    .btn:hover {
      background: #0ea5e9;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #1e293b;
      margin-left: 12px;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #1CB2FF;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${success ? 'success' : 'error'}">
      ${success ? '✓' : '✕'}
    </div>
    <h1>${success ? 'Unsubscribed Successfully' : 'Oops!'}</h1>
    <p>${message}</p>
    <div>
      ${propertySlug ? `<a href="${baseUrl}/properties/${propertySlug}" class="btn">View Property</a>` : ''}
      <a href="${baseUrl}" class="btn ${propertySlug ? 'btn-secondary' : ''}">Go to Homepage</a>
    </div>
    <div class="footer">
      <p>Need help? <a href="${baseUrl}/contact">Contact us</a></p>
    </div>
  </div>
</body>
</html>`;
}

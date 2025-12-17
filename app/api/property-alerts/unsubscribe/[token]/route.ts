import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET - Unsubscribe from property alerts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Find the alert by unsubscribe token
    const alert = await prisma.propertyAlert.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!alert) {
      // Return HTML page for invalid token
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Link - PSM Phuket</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            h1 { color: #dc2626; }
            a { color: #2563eb; }
          </style>
        </head>
        <body>
          <h1>❌ Invalid Link</h1>
          <p>This unsubscribe link is invalid or has expired.</p>
          <p><a href="/">Return to Homepage</a></p>
        </body>
        </html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    // Deactivate the alert
    await prisma.propertyAlert.update({
      where: { id: alert.id },
      data: { isActive: false },
    });

    // Return success HTML page
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - PSM Phuket</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          h1 { color: #16a34a; }
          .box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          a { color: #2563eb; }
        </style>
      </head>
      <body>
        <h1>✓ Successfully Unsubscribed</h1>
        <div class="box">
          <p>You have been unsubscribed from property alerts.</p>
          <p>Email: <strong>${alert.email}</strong></p>
        </div>
        <p>Changed your mind? You can always create a new alert on our website.</p>
        <p><a href="/">Return to Homepage</a></p>
      </body>
      </html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - PSM Phuket</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          h1 { color: #dc2626; }
          a { color: #2563eb; }
        </style>
      </head>
      <body>
        <h1>⚠️ Something went wrong</h1>
        <p>Please try again later or contact support.</p>
        <p><a href="/">Return to Homepage</a></p>
      </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}





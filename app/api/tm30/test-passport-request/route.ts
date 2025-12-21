/**
 * TEST ENDPOINT - TM30 Passport Request
 * Remove in production!
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// Ensure WhatsApp number has correct format
const rawTwilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
const TWILIO_WHATSAPP_NUMBER = rawTwilioNumber.startsWith("whatsapp:") 
  ? rawTwilioNumber 
  : `whatsapp:+${rawTwilioNumber.replace(/^\+/, "")}`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");

  if (!bookingId) {
    return NextResponse.json(
      { error: "bookingId is required as query parameter" },
      { status: 400 }
    );
  }

  // Get booking
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: bookingId },
    include: {
      property: { select: { title: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Format phone number
  const phoneNumber = booking.guestCountryCode + booking.guestPhone.replace(/^0/, "");
  const formattedTo = `whatsapp:${phoneNumber}`;

  // Debug info
  const debug = {
    bookingId,
    guestName: booking.guestName,
    originalPhone: booking.guestPhone,
    countryCode: booking.guestCountryCode,
    formattedPhone: phoneNumber,
    twilioFrom: TWILIO_WHATSAPP_NUMBER,
    twilioTo: formattedTo,
    hasTwilioSid: !!TWILIO_ACCOUNT_SID,
    hasTwilioToken: !!TWILIO_AUTH_TOKEN,
    twilioSidPrefix: TWILIO_ACCOUNT_SID?.substring(0, 10) + "...",
  };

  // Check Twilio credentials
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return NextResponse.json({
      success: false,
      error: "Missing Twilio credentials",
      debug,
    });
  }

  // Create message
  const message = `🔔 *TEST* TM30 Passport Request

Hi ${booking.guestName}!

This is a test message from PSM Phuket.

📅 Booking: ${booking.property.title}
📸 We need 1 passport photo for TM30 registration.

Please reply with a photo of your passport.`;

  // Send via Twilio
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER,
          To: formattedTo,
          Body: message,
        }).toString(),
      }
    );

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: "Twilio API error",
        statusCode: response.status,
        twilioResponse: responseData,
        debug,
      });
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp sent successfully!",
      twilioResponse: responseData,
      debug,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      debug,
    }, { status: 500 });
  }
}


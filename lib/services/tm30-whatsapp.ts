/**
 * TM30 WhatsApp Service
 * Handles passport collection flow via WhatsApp
 */

import prisma from "@/lib/prisma";
import { scanPassport, validatePassportData } from "./passport-ocr";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;

// Ensure WhatsApp number has correct prefix
const rawWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
const TWILIO_WHATSAPP_NUMBER = rawWhatsAppNumber.startsWith("whatsapp:") 
  ? rawWhatsAppNumber 
  : `whatsapp:${rawWhatsAppNumber}`;

// ============================================
// MESSAGE TEMPLATES
// ============================================

export const TM30_MESSAGES = {
  BOOKING_CONFIRMED: (booking: {
    propertyName: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
  }) => {
    const checkInStr = booking.checkIn.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const checkOutStr = booking.checkOut.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const totalGuests = booking.adults + booking.children;

    return `🎉 *Booking Request Received!*

Thank you for booking *${booking.propertyName}*!

📅 *Check-in:* ${checkInStr}
📅 *Check-out:* ${checkOutStr}
👥 *Guests:* ${totalGuests}

━━━━━━━━━━━━━━━━━━━━━━

🇹🇭 *TM30 Immigration Registration*

Under Thai Immigration Act B.E. 2522 (Section 38), all accommodation providers are *legally required* to register foreign guests with Immigration within 24 hours of arrival. This is called the *"TM30 notification"*.

*We handle this registration for you!* 🙌

To comply with Thai law and confirm your booking, please send a clear photo of the passport photo page for each guest.

📸 *${totalGuests} passport${totalGuests > 1 ? "s" : ""} needed*

━━━━━━━━━━━━━━━━━━━━━━

📷 *Photo Requirements:*
• Full passport data page visible
• Clear, readable text & photo
• No glare, shadows, or blur

━━━━━━━━━━━━━━━━━━━━━━

🔒 *Privacy & Data Protection*

Your passport data is protected:

✅ *Legal Basis:* Collection is required by Thai Immigration law (TM30)
✅ *Purpose:* Used exclusively for TM30 registration
✅ *Security:* End-to-end encrypted transmission, secure storage
✅ *Retention:* Automatically deleted 90 days after checkout
✅ *Access:* Only authorized staff for TM30 processing

📄 Full privacy policy: psmphuket.com/legal/tm30-privacy

━━━━━━━━━━━━━━━━━━━━━━

⚠️ *Important:* Your booking will be confirmed once all ${totalGuests} passport${totalGuests > 1 ? "s are" : " is"} received.

Reply with the first passport photo to get started! 📷`;
  },

  PASSPORT_RECEIVED: (data: {
    guestNumber: number;
    totalGuests: number;
    name: string;
    nationality: string;
    passportNumber: string;
  }) => {
    const remaining = data.totalGuests - data.guestNumber;

    return `📷 *Passport ${data.guestNumber}/${data.totalGuests} Received!*

✅ *Scanned Data:*
• Name: ${data.name}
• Nationality: ${data.nationality}
• Passport: ${data.passportNumber}

Is this correct? Reply *YES* to confirm or *NO* to resend.${
      remaining > 0
        ? `

📸 *${remaining} more passport${remaining > 1 ? "s" : ""} needed.*
Please send the next passport photo.`
        : ""
    }`;
  },

  ALL_PASSPORTS_RECEIVED: (booking: {
    checkInDate: Date;
    propertyName: string;
    propertyAddress?: string;
  }) => {
    const checkInStr = booking.checkInDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `🎉🎉🎉 *BOOKING CONFIRMED!* 🎉🎉🎉

✅ All passports have been received and verified!

Your booking for *${booking.propertyName}* is now *CONFIRMED*!

━━━━━━━━━━━━━━━━━━━━━━

📅 *Check-in:* ${checkInStr}
${booking.propertyAddress ? `📍 *Address:* ${booking.propertyAddress}` : ""}

━━━━━━━━━━━━━━━━━━━━━━

🇹🇭 *TM30 Registration*

Your TM30 immigration registration will be automatically submitted on your check-in date. You will receive a confirmation with your reference number.

━━━━━━━━━━━━━━━━━━━━━━

We look forward to hosting you! 🏖️

If you have any questions, just reply to this message.`;
  },

  PASSPORT_SCAN_FAILED: `❌ *Could Not Read Passport*

Sorry, I couldn't read the passport clearly. Please send a new photo:

• Make sure the page is fully visible
• Avoid glare and shadows
• Hold the camera steady

Please try again.`,

  PASSPORT_EXPIRED: (expiryDate: string) =>
    `⚠️ *Passport Expired*

This passport expired on ${expiryDate}.

Please provide a valid passport for TM30 registration.`,

  CONFIRMATION_NEEDED: `Please reply:
• *YES* - to confirm the passport data
• *NO* - to resend a clearer photo`,

  TM30_SUBMITTED: (referenceNumber: string) =>
    `✅ *TM30 Registration Complete!*

Your TM30 notification has been successfully submitted to Thai Immigration.

📋 *Reference Number:* ${referenceNumber}

This registration is valid for your entire stay. No further action is needed from you.

🔒 *Your Data:* Your passport information was used solely for this registration and will be automatically deleted 90 days after checkout as per our privacy policy.

Enjoy your stay! 🏖️`,

  TM30_FAILED: `❌ *TM30 Submission Failed*

Unfortunately, there was an issue submitting your TM30 registration.

Our team has been notified and will process it manually. You will receive a confirmation once completed.

We apologize for the inconvenience.`,
};

// ============================================
// SEND MESSAGE FUNCTIONS
// ============================================

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  try {
    // Ensure phone number is in correct format
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString(
              "base64"
            ),
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER,
          To: formattedTo,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[TM30 WhatsApp] Failed to send message:", error);
      return false;
    }

    console.log("[TM30 WhatsApp] Message sent to:", formattedTo);
    return true;
  } catch (error) {
    console.error("[TM30 WhatsApp] Error sending message:", error);
    return false;
  }
}

// ============================================
// BOOKING FLOW FUNCTIONS
// ============================================

/**
 * Send passport request after booking is confirmed/paid
 */
export async function sendPassportRequest(bookingId: string): Promise<boolean> {
  try {
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            title: true,
            tm30AccommodationId: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      console.error("[TM30] Booking not found:", bookingId);
      return false;
    }

    // Create guest slots if not already created
    const existingGuests = await prisma.bookingGuest.count({
      where: { bookingId },
    });

    if (existingGuests === 0) {
      const guestsToCreate = [];

      for (let i = 0; i < booking.adults; i++) {
        guestsToCreate.push({
          bookingId,
          guestType: "adult",
          guestNumber: i + 1,
        });
      }

      for (let i = 0; i < booking.children; i++) {
        guestsToCreate.push({
          bookingId,
          guestType: "child",
          guestNumber: booking.adults + i + 1,
        });
      }

      await prisma.bookingGuest.createMany({ data: guestsToCreate });

      // Update booking with passports required
      await prisma.rentalBooking.update({
        where: { id: bookingId },
        data: {
          passportsRequired: booking.adults + booking.children,
        },
      });
    }

    // Send WhatsApp message
    const message = TM30_MESSAGES.BOOKING_CONFIRMED({
      propertyName: booking.property.title,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      adults: booking.adults,
      children: booking.children,
    });

    // Use the guest phone from booking
    const phoneNumber = booking.guestCountryCode + booking.guestPhone.replace(/^0/, "");
    
    return await sendWhatsAppMessage(phoneNumber, message);
  } catch (error) {
    console.error("[TM30] Error sending passport request:", error);
    return false;
  }
}

/**
 * Process incoming passport photo from WhatsApp
 */
export async function processPassportPhoto(
  bookingId: string,
  imageUrl: string,
  whatsappMessageId?: string
): Promise<{
  success: boolean;
  message: string;
  guest?: any;
}> {
  try {
    // Find the next guest without a passport
    const nextGuest = await prisma.bookingGuest.findFirst({
      where: {
        bookingId,
        passportImageUrl: null,
      },
      orderBy: { guestNumber: "asc" },
    });

    if (!nextGuest) {
      return {
        success: false,
        message: "All passports have already been received.",
      };
    }

    // Get booking for context
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: bookingId },
      include: {
        guests: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        message: "Booking not found.",
      };
    }

    // Run OCR
    console.log("[TM30] Running OCR for guest:", nextGuest.id);
    const ocrResult = await scanPassport(imageUrl);

    if (!ocrResult.success || !ocrResult.data) {
      return {
        success: false,
        message: TM30_MESSAGES.PASSPORT_SCAN_FAILED,
      };
    }

    // Validate passport
    const validation = validatePassportData(ocrResult.data);

    // Check for expired passport
    if (validation.errors.includes("Passport is expired")) {
      return {
        success: false,
        message: TM30_MESSAGES.PASSPORT_EXPIRED(ocrResult.data.passportExpiry),
      };
    }

    // Extract ImageKit path from URL for reference
    const imagekitPath = imageUrl.includes('ik.imagekit.io') 
      ? imageUrl.replace(/https?:\/\/ik\.imagekit\.io\/[^\/]+/, '')
      : `/tm30-passports/${Date.now()}.jpg`;

    // Update guest with passport data
    const updatedGuest = await prisma.bookingGuest.update({
      where: { id: nextGuest.id },
      data: {
        passportImageUrl: imageUrl,
        passportImagePath: imagekitPath,
        ocrConfidence: ocrResult.confidence,
        ocrRawData: { raw: ocrResult.rawResponse },
        ocrProcessedAt: new Date(),
        tm30Status: "SCANNED",
        firstName: ocrResult.data.firstName,
        lastName: ocrResult.data.lastName,
        fullName: ocrResult.data.fullName,
        dateOfBirth: ocrResult.data.dateOfBirth
          ? new Date(ocrResult.data.dateOfBirth)
          : null,
        nationality: ocrResult.data.nationality,
        gender: ocrResult.data.gender,
        passportNumber: ocrResult.data.passportNumber,
        passportExpiry: ocrResult.data.passportExpiry
          ? new Date(ocrResult.data.passportExpiry)
          : null,
        passportCountry: ocrResult.data.passportCountry,
        whatsappMessageId,
        whatsappReceivedAt: new Date(),
      },
    });

    // Count received passports
    const passportsReceived = await prisma.bookingGuest.count({
      where: {
        bookingId,
        passportImageUrl: { not: null },
      },
    });

    // Check if all passports received
    const allPassportsReceived = passportsReceived === booking.passportsRequired;

    // Update booking - AUTO CONFIRM when all passports received!
    await prisma.rentalBooking.update({
      where: { id: bookingId },
      data: {
        passportsReceived,
        tm30Status: allPassportsReceived ? "PASSPORT_RECEIVED" : "PENDING",
        // AUTO CONFIRM the booking when all passports are received!
        status: allPassportsReceived ? "CONFIRMED" : undefined,
        confirmedAt: allPassportsReceived ? new Date() : undefined,
      },
    });

    // Generate response message
    const responseMessage = TM30_MESSAGES.PASSPORT_RECEIVED({
      guestNumber: nextGuest.guestNumber,
      totalGuests: booking.passportsRequired,
      name: ocrResult.data.fullName,
      nationality: ocrResult.data.nationality,
      passportNumber: ocrResult.data.passportNumber,
    });

    // Check if all passports received - send confirmation message
    if (allPassportsReceived) {
      // Get property details for the confirmation message
      const bookingWithProperty = await prisma.rentalBooking.findUnique({
        where: { id: bookingId },
        include: {
          property: {
            select: {
              title: true,
              defaultPropertyAddress: true,
            },
          },
        },
      });

      return {
        success: true,
        message:
          responseMessage +
          "\n\n" +
          TM30_MESSAGES.ALL_PASSPORTS_RECEIVED({
            checkInDate: booking.checkIn,
            propertyName: bookingWithProperty?.property.title || "your accommodation",
            propertyAddress: bookingWithProperty?.property.defaultPropertyAddress || undefined,
          }),
        guest: updatedGuest,
        bookingConfirmed: true,
      };
    }

    return {
      success: true,
      message: responseMessage,
      guest: updatedGuest,
      bookingConfirmed: false,
    };
  } catch (error: any) {
    console.error("[TM30] Error processing passport:", error);
    return {
      success: false,
      message: TM30_MESSAGES.PASSPORT_SCAN_FAILED,
    };
  }
}

/**
 * Get TM30 status for a booking
 */
export async function getTM30Status(bookingId: string) {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: bookingId },
    include: {
      guests: {
        orderBy: { guestNumber: "asc" },
        select: {
          id: true,
          guestNumber: true,
          guestType: true,
          firstName: true,
          lastName: true,
          nationality: true,
          passportNumber: true,
          tm30Status: true,
          passportImageUrl: true,
          ocrConfidence: true,
          passportVerified: true,
        },
      },
      property: {
        select: {
          title: true,
          tm30AccommodationId: true,
          tm30AccommodationName: true,
        },
      },
    },
  });

  if (!booking) return null;

  return {
    bookingId: booking.id,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    tm30Status: booking.tm30Status,
    tm30Reference: booking.tm30Reference,
    passportsRequired: booking.passportsRequired,
    passportsReceived: booking.passportsReceived,
    property: booking.property,
    guests: booking.guests,
  };
}


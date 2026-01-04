/**
 * TM30 Callback API
 * Receives results from GitHub Actions TM30 automation
 * 
 * POST /api/tm30/callback
 * Headers: X-TM30-Callback-Secret: <secret> (or X-Callback-Secret for backwards compatibility)
 * Body: { action: "test" | "fetch_accommodations" | "submit_tm30" | "add_accommodation", success: boolean, data: {...} }
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp/api-client";

const CALLBACK_SECRET = process.env.TM30_CALLBACK_SECRET;

interface Accommodation {
  id?: string;
  name: string;
  address: string;
  status?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export async function POST(request: Request) {
  try {
    // Verify callback secret (support both header names for compatibility)
    const secret = request.headers.get("X-TM30-Callback-Secret") || 
                   request.headers.get("X-Callback-Secret");
    
    if (!secret || secret !== CALLBACK_SECRET) {
      console.error("[TM30 Callback] Invalid or missing secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("[TM30 Callback] Received:", JSON.stringify(body, null, 2));

    const { action, success, error, data, timestamp } = body;

    // Handle fetch_accommodations callback
    if (action === "fetch_accommodations") {
      return handleAccommodationsCallback(body);
    }

    // Handle TM30 submission result
    if (action === "submit_tm30" || action === "tm30_result") {
      return handleSubmissionCallback(body);
    }

    // Handle add_accommodation result
    if (action === "add_accommodation") {
      return handleAddAccommodationCallback(body);
    }

    // Handle test/login actions (just acknowledge)
    if (action === "test" || action === "login") {
      console.log(`[TM30 Callback] Test/login action received - success: ${success}`);
      return NextResponse.json({
        success: true,
        message: `Action '${action}' acknowledged`,
      });
    }

    return NextResponse.json(
      { error: "Unknown action: " + action },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("[TM30 Callback] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle accommodations sync callback
 */
async function handleAccommodationsCallback(body: any) {
  const { success, data, error } = body;

  if (!success) {
    console.error("[TM30 Callback] Fetch accommodations failed:", error);
    return NextResponse.json({
      success: false,
      message: "Accommodations fetch failed",
      error,
    });
  }

  const accommodations: Accommodation[] = data?.accommodations || [];
  const total = data?.total || accommodations.length;
  
  console.log(`[TM30 Callback] Received ${accommodations.length} accommodations (reported total: ${total})`);

  if (accommodations.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No accommodations to sync",
      total: 0,
    });
  }

  let created = 0;
  let updated = 0;

  for (const acc of accommodations) {
    try {
      const tm30Id = acc.id || `TM30-${acc.name.replace(/\s+/g, "-").substring(0, 20)}-${Date.now()}`;

      const existing = await prisma.tm30_accommodation.findFirst({
        where: {
          OR: [
            { tm30Id },
            { name: acc.name, address: acc.address },
          ],
        },
      });

      if (existing) {
        await prisma.tm30_accommodation.update({
          where: { id: existing.id },
          data: {
            name: acc.name,
            address: acc.address,
            status: acc.status || "Approved",
            lastSyncedAt: new Date(),
            syncSource: "github-actions",
          },
        });
        updated++;
      } else {
        await prisma.tm30_accommodation.create({
          data: {
            tm30Id,
            name: acc.name,
            address: acc.address,
            status: acc.status || "Approved",
            lastSyncedAt: new Date(),
            syncSource: "github-actions",
          },
        });
        created++;
      }
    } catch (e: any) {
      console.error(`[TM30 Callback] Error upserting ${acc.name}:`, e.message);
    }
  }

  console.log(`[TM30 Callback] Sync complete: ${created} created, ${updated} updated`);

  return NextResponse.json({
    success: true,
    message: `Synced ${accommodations.length} accommodations`,
    created,
    updated,
    total: accommodations.length,
  });
}

/**
 * Handle TM30 submission result callback
 */
async function handleSubmissionCallback(body: any) {
  const { success, data, error } = body;
  
  const bookingId = data?.bookingId;
  const results = data?.results;
  const totalGuests = data?.totalGuests;
  const successCount = data?.successCount;
  const referenceNumber = data?.referenceNumber;

  if (!bookingId) {
    console.error("[TM30 Callback] No bookingId provided in data");
    return NextResponse.json(
      { error: "bookingId is required in data for submit_tm30" },
      { status: 400 }
    );
  }

  let newStatus: string;
  if (!success) {
    newStatus = "FAILED";
  } else if (totalGuests && successCount && successCount === totalGuests) {
    newStatus = "SUBMITTED";
  } else if (successCount && successCount > 0) {
    newStatus = "PARTIALLY_SUBMITTED";
  } else {
    newStatus = "FAILED";
  }
  
  // Get booking details for WhatsApp notification
  let booking: any = null;
  try {
    booking = await prisma.rental_booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            title: true,
          },
        },
      },
    });

    await prisma.rental_booking.update({
      where: { id: bookingId },
      data: {
        tm30_status: newStatus,
        tm30_submitted_at: success ? new Date() : undefined,
        tm30_reference: referenceNumber || undefined,
        tm30_error: error || (results?.find((r: any) => r.error)?.error) || undefined,
      },
    });

    console.log(`[TM30 Callback] Updated booking ${bookingId} to status: ${newStatus}`);
  } catch (e: any) {
    console.error(`[TM30 Callback] Error updating booking ${bookingId}:`, e.message);
  }

  if (results && Array.isArray(results)) {
    for (const result of results) {
      if (result.guestId) {
        try {
          await prisma.booking_guest.update({
            where: { id: result.guestId },
            data: {
              tm30_status: result.success ? "SUBMITTED" : "PENDING",
              tm30_submitted_at: result.success ? new Date() : undefined,
              tm30_error: result.error || undefined,
              updated_at: new Date(),
            },
          });
          console.log(`[TM30 Callback] Updated guest ${result.guestId} - success: ${result.success}`);
        } catch (e: any) {
          console.error(`[TM30 Callback] Error updating guest ${result.guestId}:`, e.message);
        }
      }
    }
  }

  // Send WhatsApp notification to guest
  if (booking && booking.guestPhone) {
    const guestPhone = `${booking.guestCountryCode || '+66'}${booking.guestPhone.replace(/^0/, '')}`;
    const propertyName = booking.property?.title || 'your accommodation';
    
    const message = success
      ? `🇹🇭 *TM30 Registration Complete!*\n\n` +
        `Your immigration registration for *${propertyName}* has been submitted successfully.\n\n` +
        (referenceNumber ? `📋 Reference: ${referenceNumber}\n\n` : '') +
        `✅ You are now legally registered with Thai Immigration.\n\n` +
        `Have a wonderful stay! 🌴`
      : `⚠️ *TM30 Registration Issue*\n\n` +
        `There was a problem with your immigration registration for *${propertyName}*.\n\n` +
        `Our team has been notified and will resolve this shortly.\n\n` +
        `If you have questions, please contact us.`;
    
    try {
      await sendTextMessage(guestPhone, message);
      console.log(`[TM30 Callback] WhatsApp notification sent to guest ${guestPhone}`);
    } catch (e: any) {
      console.error(`[TM30 Callback] Failed to send WhatsApp to guest:`, e.message);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Submission callback processed",
    bookingId,
    newStatus,
    totalGuests,
    successCount,
    referenceNumber,
  });
}

/**
 * Handle add_accommodation result callback
 */
async function handleAddAccommodationCallback(body: any) {
  const { success, data, error } = body;
  
  const requestId = data?.requestId;
  const tm30Id = data?.tm30Id;
  const accommodationName = data?.accommodationName;
  
  console.log(`[TM30 Callback] Add accommodation result - requestId: ${requestId}, success: ${success}`);

  if (requestId) {
    try {
      const request = await prisma.tm30_accommodationRequest.findUnique({
        where: { id: requestId },
      });

      if (request) {
        const newStatus = success ? "SUBMITTED" : "FAILED";
        
        await prisma.tm30_accommodationRequest.update({
          where: { id: requestId },
          data: {
            status: newStatus as any,
            tm30_id: tm30Id || undefined,
            submitted_at: success ? new Date() : undefined,
            error_message: error || undefined,
          },
        });
        
        console.log(`[TM30 Callback] Updated request ${requestId} to status: ${newStatus}`);

        // Send WhatsApp notification to user if phone number is available
        if (request.whatsappPhone) {
          const message = success
            ? `✅ *TM30 Accommodation Added Successfully!*\n\n` +
              `🏠 *${accommodationName || request.accommodationName}*\n\n` +
              `Your accommodation has been submitted to Thailand Immigration.\n` +
              `It will appear in your listings after approval.\n\n` +
              `📋 Request ID: ${requestId}`
            : `❌ *TM30 Accommodation Failed*\n\n` +
              `There was an error adding your accommodation.\n\n` +
              `Error: ${error || 'Unknown error'}\n\n` +
              `Please try again or contact support.`;
          
          try {
            await sendTextMessage(request.whatsappPhone, message);
            console.log(`[TM30 Callback] WhatsApp notification sent to ${request.whatsappPhone}`);
          } catch (e: any) {
            console.error(`[TM30 Callback] Failed to send WhatsApp notification:`, e.message);
          }
        }

        // Trigger sync to fetch the new accommodation from TM30
        if (success) {
          console.log(`[TM30 Callback] Triggering sync to fetch new accommodation...`);
          await triggerAccommodationsSync();
        }
      } else {
        console.warn(`[TM30 Callback] Request ${requestId} not found in database`);
      }
    } catch (e: any) {
      console.error(`[TM30 Callback] Error updating request ${requestId}:`, e.message);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Add accommodation callback processed",
    requestId,
    accommodationName,
    status: success ? "SUBMITTED" : "FAILED",
    syncTriggered: success,
  });
}

/**
 * Trigger accommodations sync via GitHub Actions
 */
async function triggerAccommodationsSync(): Promise<boolean> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_TM30_REPO = process.env.GITHUB_TM30_REPO || "wasgeurtjeNL/tm30-automation";

  if (!GITHUB_TOKEN) {
    console.warn("[TM30 Callback] GITHUB_TOKEN not configured, cannot trigger sync");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_TM30_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          event_type: "tm30-action",
          client_payload: {
            action: "fetch_accommodations",
            data: {},
            triggeredBy: "callback-auto-sync",
            triggeredAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (response.status === 204) {
      console.log("[TM30 Callback] ✅ Sync workflow triggered successfully");
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[TM30 Callback] Failed to trigger sync: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (e: any) {
    console.error("[TM30 Callback] Error triggering sync:", e.message);
    return false;
  }
}

/**
 * TM30 Daily Submit Cron Job
 * 
 * Runs daily at 06:00 Thailand time (23:00 UTC previous day)
 * Finds all bookings with check-in TODAY and submits TM30 notifications
 * 
 * POST /api/cron/tm30-submit
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_TM30_REPO || "wasgeurtjeNL/tm30-automation";
const CRON_SECRET = process.env.CRON_SECRET;

// Format date as DD/MM/YYYY for TM30 system
function formatDateForTM30(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function POST(request: Request) {
  try {
    // Verify cron secret (Vercel sends this)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('[TM30 Cron] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[TM30 Cron] Starting daily TM30 submit check...');

    // Get today's date in Thailand timezone (UTC+7)
    const now = new Date();
    const thailandOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const thailandNow = new Date(now.getTime() + thailandOffset);
    
    // Get start and end of today in Thailand time
    const todayStart = new Date(thailandNow);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(thailandNow);
    todayEnd.setHours(23, 59, 59, 999);

    console.log(`[TM30 Cron] Looking for check-ins between ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);

    // Find all bookings with check-in today that have all passports and haven't been submitted
    const bookingsToSubmit = await prisma.rental_booking.findMany({
      where: {
        checkIn: {
          gte: todayStart,
          lte: todayEnd,
        },
        tm30_status: 'PASSPORT_RECEIVED', // All passports received, ready to submit
        status: 'CONFIRMED', // Booking must be confirmed
        property: {
          tm30_accommodation_id: { not: null }, // Property must be linked to TM30
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            tm30_accommodation_id: true,
            tm30_accommodation_name: true,
          },
        },
        booking_guest: {
          where: {
            passport_number: { not: null }, // Has passport data
            tm30_status: { not: 'SUBMITTED' }, // Not already submitted
          },
          select: {
            id: true,
            guest_type: true,
            guest_number: true,
            first_name: true,
            last_name: true,
            passport_number: true,
            date_of_birth: true,
            nationality: true,
            gender: true,
            tm30_status: true,
          },
        },
      },
    });

    console.log(`[TM30 Cron] Found ${bookingsToSubmit.length} bookings to submit`);

    if (bookingsToSubmit.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings to submit today',
        date: todayStart.toISOString().split('T')[0],
        processed: 0,
      });
    }

    const results: any[] = [];

    for (const booking of bookingsToSubmit) {
      if (booking.booking_guest.length === 0) {
        console.log(`[TM30 Cron] Booking ${booking.id} has no guests to submit, skipping`);
        continue;
      }

      console.log(`[TM30 Cron] Processing booking ${booking.id} with ${booking.booking_guest.length} guests`);

      // Prepare submissions for each guest
      const submissions = booking.booking_guest.map((guest) => ({
        guestId: guest.id,
        foreigner: {
          passportNumber: guest.passport_number,
          nationality: guest.nationality || 'Unknown',
          firstName: guest.first_name || 'Unknown',
          lastName: guest.last_name || '',
          dateOfBirth: guest.date_of_birth 
            ? formatDateForTM30(new Date(guest.date_of_birth))
            : '',
          gender: guest.gender === 'F' || guest.gender === 'Female' ? 'F' : 'M',
          arrivalDate: formatDateForTM30(new Date(booking.checkIn)),
          stayUntil: formatDateForTM30(new Date(booking.checkOut)),
        },
        accommodation: {
          name: booking.property.tm30_accommodation_name || booking.property.tm30_accommodation_id,
        },
        checkInDate: formatDateForTM30(new Date(booking.checkIn)),
        checkOutDate: formatDateForTM30(new Date(booking.checkOut)),
        dryRun: false, // Live mode
      }));

      // Update booking status to PROCESSING
      await prisma.rental_booking.update({
        where: { id: booking.id },
        data: { tm30_status: 'PROCESSING' },
      });

      // Update guest statuses
      await prisma.booking_guest.updateMany({
        where: { id: { in: booking.booking_guest.map(g => g.id) } },
        data: { tm30_status: 'PENDING' },
      });

      // Trigger GitHub Actions workflow
      if (GITHUB_TOKEN) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
            {
              method: 'POST',
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                event_type: 'tm30-action',
                client_payload: {
                  action: 'submit_tm30',
                  bookingId: booking.id,
                  submissions,
                  triggeredBy: 'cron-daily',
                  triggeredAt: new Date().toISOString(),
                },
              }),
            }
          );

          if (response.status === 204) {
            console.log(`[TM30 Cron] ✅ Workflow triggered for booking ${booking.id}`);
            results.push({
              bookingId: booking.id,
              property: booking.property.title,
              guests: booking.booking_guest.length,
              status: 'triggered',
            });
          } else {
            const errorText = await response.text();
            console.error(`[TM30 Cron] ❌ Failed to trigger workflow for booking ${booking.id}: ${errorText}`);
            
            // Revert status
            await prisma.rental_booking.update({
              where: { id: booking.id },
              data: { 
                tm30_status: 'PASSPORT_RECEIVED',
                tm30_error: `Cron trigger failed: ${errorText}`,
              },
            });

            results.push({
              bookingId: booking.id,
              property: booking.property.title,
              status: 'failed',
              error: errorText,
            });
          }
        } catch (error: any) {
          console.error(`[TM30 Cron] ❌ Error triggering workflow for booking ${booking.id}:`, error);
          
          await prisma.rental_booking.update({
            where: { id: booking.id },
            data: { 
              tm30_status: 'PASSPORT_RECEIVED',
              tm30_error: error.message,
            },
          });

          results.push({
            bookingId: booking.id,
            property: booking.property.title,
            status: 'error',
            error: error.message,
          });
        }
      } else {
        console.log('[TM30 Cron] ⚠️ GITHUB_TOKEN not configured, skipping workflow trigger');
        results.push({
          bookingId: booking.id,
          property: booking.property.title,
          status: 'skipped',
          reason: 'GITHUB_TOKEN not configured',
        });
      }
    }

    console.log(`[TM30 Cron] Completed. Processed ${results.length} bookings.`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} bookings for TM30 submission`,
      date: todayStart.toISOString().split('T')[0],
      processed: results.length,
      results,
    });

  } catch (error: any) {
    console.error('[TM30 Cron] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: Request) {
  // For manual testing, just return status
  const now = new Date();
  const thailandOffset = 7 * 60 * 60 * 1000;
  const thailandNow = new Date(now.getTime() + thailandOffset);
  
  const todayStart = new Date(thailandNow);
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(thailandNow);
  todayEnd.setHours(23, 59, 59, 999);

  // Count bookings that would be submitted today
  const count = await prisma.rental_booking.count({
    where: {
      checkIn: {
        gte: todayStart,
        lte: todayEnd,
      },
      tm30_status: 'PASSPORT_RECEIVED',
      status: 'CONFIRMED',
      property: {
        tm30_accommodation_id: { not: null },
      },
    },
  });

  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/tm30-submit',
    schedule: 'Daily at 06:00 ICT (23:00 UTC)',
    currentTime: {
      utc: now.toISOString(),
      thailand: thailandNow.toISOString(),
    },
    bookingsToSubmitToday: count,
    message: count > 0 
      ? `${count} booking(s) ready for TM30 submission today`
      : 'No bookings to submit today',
  });
}







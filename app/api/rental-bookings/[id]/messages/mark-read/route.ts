import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST - Mark all messages as read for agent
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await context.params;

    // Verify booking exists
    const booking = await prisma.rental_booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is admin/agent
    const userRole = (session.user as { role?: string })?.role;
    const isAdmin = userRole === "ADMIN" || userRole === "AGENT";

    // Mark all customer messages as read (for agent view)
    if (isAdmin) {
      await prisma.booking_message.updateMany({
        where: {
          booking_id: bookingId,
          sender_role: "customer",
          is_read: false,
        },
        data: {
          is_read: true,
        },
      });
    } else {
      // Mark all agent messages as read (for customer view)
      await prisma.booking_message.updateMany({
        where: {
          booking_id: bookingId,
          sender_role: "agent",
          is_read: false,
        },
        data: {
          is_read: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}








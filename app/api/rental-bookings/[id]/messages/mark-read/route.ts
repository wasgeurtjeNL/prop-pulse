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
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is admin/agent
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";

    // Mark all customer messages as read (for agent view)
    if (isAdmin) {
      await prisma.bookingMessage.updateMany({
        where: {
          bookingId,
          senderRole: "customer",
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      // Mark all agent messages as read (for customer view)
      await prisma.bookingMessage.updateMany({
        where: {
          bookingId,
          senderRole: "agent",
          isRead: false,
        },
        data: {
          isRead: true,
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






import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Get all booking conversations with message counts for admin
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins/agents can access this
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get all bookings with message counts
    const bookings = await prisma.rentalBooking.findMany({
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        status: true,
        checkIn: true,
        checkOut: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        messages: {
          select: {
            id: true,
            message: true,
            senderRole: true,
            isRead: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get only the latest message
        },
        _count: {
          select: {
            messages: {
              where: {
                senderRole: "customer",
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform data for frontend
    const conversations = bookings.map((booking) => ({
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      propertyTitle: booking.property?.title || "Unknown Property",
      propertyId: booking.property?.id,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      lastMessage: booking.messages[0] || null,
      unreadCount: booking._count.messages,
      createdAt: booking.createdAt,
    }));

    // Sort by unread first, then by last message date
    conversations.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    // Calculate total unread
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return NextResponse.json({ conversations, totalUnread });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}



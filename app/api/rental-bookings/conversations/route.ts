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
    const userRole = (session.user as { role?: string })?.role;
    const isAdmin = userRole === "ADMIN" || userRole === "AGENT";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get all bookings with message counts
    // Note: model is rental_booking (snake_case) and booking_message
    const bookings = await prisma.rental_booking.findMany({
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
        booking_message: {
          select: {
            id: true,
            message: true,
            sender_role: true,
            is_read: true,
            created_at: true,
          },
          orderBy: {
            created_at: "desc",
          },
          take: 1, // Get only the latest message
        },
        _count: {
          select: {
            booking_message: {
              where: {
                sender_role: "customer",
                is_read: false,
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
      lastMessage: booking.booking_message[0] ? {
        id: booking.booking_message[0].id,
        message: booking.booking_message[0].message,
        senderRole: booking.booking_message[0].sender_role,
        isRead: booking.booking_message[0].is_read,
        createdAt: booking.booking_message[0].created_at,
      } : null,
      unreadCount: booking._count.booking_message,
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








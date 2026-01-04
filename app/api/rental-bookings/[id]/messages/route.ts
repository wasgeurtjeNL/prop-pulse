import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { transformBookingMessage } from "@/lib/transforms";

// GET - Fetch messages for a booking
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";

    // Verify booking access
    const booking = await prisma.rental_booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!isAdmin && booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await prisma.booking_message.findMany({
      where: { booking_id: bookingId },
      orderBy: { created_at: "asc" },
    });

    // Mark messages as read for the viewer
    const senderRoleToMark = isAdmin ? "customer" : "agent";
    await prisma.booking_message.updateMany({
      where: {
        booking_id: bookingId,
        sender_role: senderRoleToMark,
        is_read: false,
      },
      data: { is_read: true },
    });

    return NextResponse.json({ messages: messages.map(transformBookingMessage) });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { message, senderRole: requestedRole } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "AGENT";

    // Verify booking access
    const booking = await prisma.rental_booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!isAdmin && booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Determine sender role:
    // - If explicitly requested as "customer" and user owns the booking -> customer
    // - If admin/agent and NOT the booking owner -> agent
    // - If booking owner (regardless of role) -> customer
    let senderRole = "customer";
    if (isAdmin && booking.userId !== session.user.id) {
      senderRole = "agent";
    } else if (requestedRole === "agent" && isAdmin) {
      senderRole = "agent";
    }

    // Create message
    const newMessage = await prisma.booking_message.create({
      data: {
        id: crypto.randomUUID(),
        booking_id: bookingId,
        sender_id: session.user.id,
        sender_role: senderRole,
        message: message.trim(),
        is_read: false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ message: transformBookingMessage(newMessage) });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}


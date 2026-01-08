import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/owner-portal/messages
 * Get all messages for the owner (conversations)
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Access denied. Owner account required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    // Get messages where user is sender or recipient
    const messages = await prisma.owner_message.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: session.user.id },
              { recipientId: session.user.id },
            ],
          },
          // Only get root messages (not replies)
          { parentId: null },
          // Filter by property if specified
          propertyId ? { propertyId } : {},
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            listingNumber: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get unread count
    const unreadCount = await prisma.owner_message.count({
      where: {
        recipientId: session.user.id,
        isRead: false,
      },
    });

    // Format messages
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      subject: msg.subject,
      message: msg.message,
      senderType: msg.senderType,
      isFromMe: msg.senderId === session.user.id,
      isRead: msg.isRead,
      property: msg.property
        ? {
            id: msg.property.id,
            title: msg.property.title,
            listingNumber: msg.property.listingNumber,
          }
        : null,
      replyCount: msg._count.replies,
      createdAt: msg.createdAt.toISOString(),
      lastReply: msg.replies.length > 0
        ? {
            message: msg.replies[msg.replies.length - 1].message,
            createdAt: msg.replies[msg.replies.length - 1].createdAt.toISOString(),
            senderType: msg.replies[msg.replies.length - 1].senderType,
          }
        : null,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      unreadCount,
    });
  } catch (error) {
    console.error("[Owner Messages GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owner-portal/messages
 * Send a new message to the agent team
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Access denied. Owner account required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subject, message, propertyId, parentId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // If propertyId provided, verify owner owns this property
    if (propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerUserId: session.user.id,
        },
      });

      if (!property) {
        return NextResponse.json(
          { error: "Property not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Find an admin user to be the recipient (messages go to agent team)
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ["ADMIN", "AGENT"] },
      },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No agent available to receive messages" },
        { status: 500 }
      );
    }

    // Create message
    const newMessage = await prisma.owner_message.create({
      data: {
        senderId: session.user.id,
        senderType: "OWNER",
        recipientId: adminUser.id,
        subject: subject || null,
        message,
        propertyId: propertyId || null,
        parentId: parentId || null,
      },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: session.user.id,
        propertyId: propertyId || null,
        action: "MESSAGE_SENT",
        description: subject
          ? `Sent message: ${subject}`
          : "Sent message to agent",
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        subject: newMessage.subject,
        message: newMessage.message,
        createdAt: newMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Owner Messages POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

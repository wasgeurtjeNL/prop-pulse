import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/owner-portal/messages/[id]
 * Get a specific message thread
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: messageId } = await params;

    // Get message with replies
    const message = await prisma.owner_message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            listingNumber: true,
            image: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Mark as read if recipient is viewing
    if (message.recipientId === session.user.id && !message.isRead) {
      await prisma.owner_message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    // Also mark replies as read
    await prisma.owner_message.updateMany({
      where: {
        parentId: messageId,
        recipientId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Format response
    const formattedMessage = {
      id: message.id,
      subject: message.subject,
      message: message.message,
      senderType: message.senderType,
      isFromMe: message.senderId === session.user.id,
      isRead: message.isRead,
      property: message.property,
      createdAt: message.createdAt.toISOString(),
      replies: message.replies.map((reply) => ({
        id: reply.id,
        message: reply.message,
        senderType: reply.senderType,
        isFromMe: reply.senderId === session.user.id,
        isRead: reply.isRead,
        createdAt: reply.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ message: formattedMessage });
  } catch (error) {
    console.error("[Owner Message GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owner-portal/messages/[id]
 * Reply to a message thread
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: parentMessageId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get parent message
    const parentMessage = await prisma.owner_message.findFirst({
      where: {
        id: parentMessageId,
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id },
        ],
      },
    });

    if (!parentMessage) {
      return NextResponse.json(
        { error: "Message thread not found" },
        { status: 404 }
      );
    }

    // Determine recipient (the other party in the conversation)
    const recipientId = parentMessage.senderId === session.user.id
      ? parentMessage.recipientId
      : parentMessage.senderId;

    // Create reply
    const reply = await prisma.owner_message.create({
      data: {
        senderId: session.user.id,
        senderType: "OWNER",
        recipientId,
        message,
        propertyId: parentMessage.propertyId,
        parentId: parentMessageId,
      },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: session.user.id,
        propertyId: parentMessage.propertyId,
        action: "MESSAGE_REPLY",
        description: `Replied to message thread`,
      },
    });

    return NextResponse.json({
      success: true,
      reply: {
        id: reply.id,
        message: reply.message,
        createdAt: reply.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Owner Message Reply POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}

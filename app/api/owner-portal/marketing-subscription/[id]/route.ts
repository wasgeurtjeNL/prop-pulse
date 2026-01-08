import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch a specific marketing subscription
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

    const { id } = await params;

    const subscription = await prisma.owner_marketing_subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            listingNumber: true,
            price: true,
            image: true,
            location: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Owners can only see their own subscriptions
    if (
      session.user.role === "OWNER" &&
      subscription.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("[Marketing Subscription GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// PATCH - Update subscription status (admin only)
export async function PATCH(
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

    if (session.user.role !== "ADMIN" && session.user.role !== "AGENT") {
      return NextResponse.json(
        { error: "Only admins can update subscription status" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { status, adminNote } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.owner_marketing_subscription.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            title: true,
            listingNumber: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      ...(adminNote && { adminNote }),
    };

    // Set signedAt when activating
    if (status === "ACTIVE" && !subscription.signedAt) {
      updateData.signedAt = new Date();
      
      // For exclusive contracts, set expiry to 6 months
      if (subscription.packageType === "EXCLUSIVE_CONTRACT") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        updateData.expiresAt = expiresAt;
      }
    }

    const updated = await prisma.owner_marketing_subscription.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: subscription.userId,
        propertyId: subscription.propertyId,
        action: `MARKETING_SUBSCRIPTION_${status}`,
        description: `Marketing subscription ${status.toLowerCase()} by ${session.user.name}`,
        metadata: {
          subscriptionId: id,
          previousStatus: subscription.status,
          newStatus: status,
          adminNote,
        },
      },
    });

    return NextResponse.json({
      subscription: updated,
      message: `Subscription ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("[Marketing Subscription PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel subscription
export async function DELETE(
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

    const { id } = await params;

    const subscription = await prisma.owner_marketing_subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Owners can only cancel their own pending subscriptions
    if (session.user.role === "OWNER") {
      if (subscription.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      if (subscription.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending subscriptions can be cancelled" },
          { status: 400 }
        );
      }
    }

    await prisma.owner_marketing_subscription.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: subscription.userId,
        propertyId: subscription.propertyId,
        action: "MARKETING_SUBSCRIPTION_CANCELLED",
        description: `Marketing subscription cancelled by ${session.user.name}`,
        metadata: {
          subscriptionId: id,
          cancelledBy: session.user.id,
        },
      },
    });

    return NextResponse.json({ message: "Subscription cancelled" });
  } catch (error) {
    console.error("[Marketing Subscription DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch marketing subscriptions for the logged-in owner
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Owners can only see their own subscriptions
    if (session.user.role === "OWNER") {
      const subscriptions = await prisma.owner_marketing_subscription.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              listingNumber: true,
              price: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ subscriptions });
    }

    // Admins/Agents can see all subscriptions
    if (session.user.role === "ADMIN" || session.user.role === "AGENT") {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const packageType = searchParams.get("packageType");

      const subscriptions = await prisma.owner_marketing_subscription.findMany({
        where: {
          ...(status && { status: status as any }),
          ...(packageType && { packageType: packageType as any }),
        },
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ subscriptions });
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  } catch (error) {
    console.error("[Marketing Subscription GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing subscriptions" },
      { status: 500 }
    );
  }
}

// POST - Create a new marketing subscription
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
        { error: "Only property owners can subscribe to marketing packages" },
        { status: 403 }
      );
    }

    const { propertyId, packageType, ownerNote } = await request.json();

    if (!propertyId || !packageType) {
      return NextResponse.json(
        { error: "Property ID and package type are required" },
        { status: 400 }
      );
    }

    // Verify property belongs to owner
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerUserId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or not owned by user" },
        { status: 404 }
      );
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.owner_marketing_subscription.findFirst({
      where: {
        propertyId,
        status: { in: ["PENDING", "ACTIVE"] },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "This property already has an active or pending marketing subscription" },
        { status: 400 }
      );
    }

    // Parse price from string (remove currency symbols, commas, etc.)
    const priceStr = property.price.replace(/[฿$€£,\s]/g, "").replace(/THB/i, "");
    const priceMatch = priceStr.match(/[\d.]+/);
    const propertyPrice = priceMatch ? parseFloat(priceMatch[0]) : 0;

    // Calculate amounts based on package type
    let marketingPercentage: number | null = null;
    let commissionPercentage: number | null = null;
    let calculatedAmount: number | null = null;

    if (packageType === "MARKETING_FEE") {
      marketingPercentage = 0.25;
      calculatedAmount = propertyPrice * (marketingPercentage / 100);
    } else if (packageType === "EXCLUSIVE_CONTRACT") {
      commissionPercentage = 15;
      calculatedAmount = propertyPrice * (commissionPercentage / 100);
    } else if (packageType === "STANDARD") {
      // No marketing - just tracking that owner explicitly chose not to have marketing
      marketingPercentage = 0;
      commissionPercentage = 0;
      calculatedAmount = 0;
    } else {
      return NextResponse.json(
        { error: "Invalid package type" },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await prisma.owner_marketing_subscription.create({
      data: {
        userId: session.user.id,
        propertyId,
        packageType,
        marketingPercentage,
        commissionPercentage,
        calculatedAmount,
        propertyPrice,
        ownerNote,
        status: "PENDING",
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            listingNumber: true,
          },
        },
      },
    });

    // Get appropriate description based on package type
    const getPackageDescription = () => {
      switch (packageType) {
        case "MARKETING_FEE":
          return "Marketing Budget (0.25% per month)";
        case "EXCLUSIVE_CONTRACT":
          return "Exclusivity Contract (15%)";
        case "STANDARD":
          return "Standard Listing (No Extra Marketing)";
        default:
          return packageType;
      }
    };

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: session.user.id,
        propertyId,
        action: packageType === "STANDARD" ? "MARKETING_DECLINED" : "MARKETING_SUBSCRIPTION_CREATED",
        description: `Selected: ${getPackageDescription()}`,
        metadata: {
          subscriptionId: subscription.id,
          packageType,
          calculatedAmount,
          propertyPrice,
        },
      },
    });

    // Get appropriate response message
    const getMessage = () => {
      switch (packageType) {
        case "MARKETING_FEE":
          return `Marketing subscription created! Monthly amount: ฿${calculatedAmount?.toLocaleString()}/month`;
        case "EXCLUSIVE_CONTRACT":
          return `Exclusivity contract request submitted! Our team will contact you.`;
        case "STANDARD":
          return `Standard listing confirmed. You can upgrade to a marketing package anytime.`;
        default:
          return "Subscription created successfully.";
      }
    };

    return NextResponse.json(
      {
        subscription,
        message: getMessage(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Marketing Subscription POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to create marketing subscription" },
      { status: 500 }
    );
  }
}

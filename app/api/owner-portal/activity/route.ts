/**
 * Owner Activity Log API
 * View all owner activities (price changes, status changes, logins, etc.)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - List all owner activities (admin/agent only)
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const userId = searchParams.get("userId");
    const propertyId = searchParams.get("propertyId");
    const action = searchParams.get("action");

    const where: any = {};

    if (userId) where.userId = userId;
    if (propertyId) where.propertyId = propertyId;
    if (action) where.action = action;

    const activities = await prisma.owner_activity_log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Fetch user and property details
    const userIds = [...new Set(activities.map((a) => a.userId))];
    const propertyIds = [...new Set(activities.map((a) => a.propertyId).filter(Boolean))] as string[];

    const [users, properties] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, title: true, listingNumber: true },
      }),
    ]);

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, typeof users[0]>);

    const propertyMap = properties.reduce((acc, property) => {
      acc[property.id] = property;
      return acc;
    }, {} as Record<string, typeof properties[0]>);

    const activitiesWithDetails = activities.map((a) => ({
      ...a,
      user: userMap[a.userId] || null,
      property: a.propertyId ? propertyMap[a.propertyId] || null : null,
    }));

    return NextResponse.json({ activities: activitiesWithDetails });
  } catch (error) {
    console.error("[Owner Activity GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

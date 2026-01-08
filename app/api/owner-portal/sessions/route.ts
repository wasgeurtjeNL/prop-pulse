/**
 * Owner Sessions API
 * View login sessions of property owners
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - List all owner login sessions (admin/agent only)
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

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    const sessions = await prisma.owner_session_log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Fetch user details
    const userIds = [...new Set(sessions.map((s) => s.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, typeof users[0]>);

    const sessionsWithUsers = sessions.map((s) => ({
      ...s,
      user: userMap[s.userId] || null,
    }));

    return NextResponse.json({ sessions: sessionsWithUsers });
  } catch (error) {
    console.error("[Owner Sessions GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST - Log a new session (called on owner login)
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action = "LOGIN" } = body;

    // Get request headers for IP and user agent
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.owner_session_log.create({
      data: {
        userId: session.user.id,
        ipAddress,
        userAgent,
        action,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Owner Session Log Error]:", error);
    return NextResponse.json(
      { error: "Failed to log session" },
      { status: 500 }
    );
  }
}

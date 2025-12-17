import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Fetch schedule settings
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.blogScheduleSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      // Return defaults if not found
      return NextResponse.json({
        settings: {
          maxBlogsPerWeek: 3,
          minDaysBetweenPosts: 2,
          preferredPostTime: "09:00",
          preferredPostDays: ["Monday", "Wednesday", "Friday"]
        }
      });
    }

    return NextResponse.json({
      settings: {
        ...settings,
        preferredPostDays: settings.preferredPostDays 
          ? JSON.parse(settings.preferredPostDays) 
          : ["Monday", "Wednesday", "Friday"]
      }
    });

  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST - Update schedule settings
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      maxBlogsPerWeek,
      minDaysBetweenPosts,
      preferredPostTime,
      preferredPostDays
    } = body;

    // Validate values
    if (maxBlogsPerWeek !== undefined && (maxBlogsPerWeek < 1 || maxBlogsPerWeek > 7)) {
      return NextResponse.json(
        { error: "Max blogs per week must be between 1 and 7" },
        { status: 400 }
      );
    }

    if (minDaysBetweenPosts !== undefined && (minDaysBetweenPosts < 0 || minDaysBetweenPosts > 7)) {
      return NextResponse.json(
        { error: "Minimum days between posts must be between 0 and 7" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (maxBlogsPerWeek !== undefined) {
      updateData.maxBlogsPerWeek = maxBlogsPerWeek;
    }
    if (minDaysBetweenPosts !== undefined) {
      updateData.minDaysBetweenPosts = minDaysBetweenPosts;
    }
    if (preferredPostTime !== undefined) {
      updateData.preferredPostTime = preferredPostTime;
    }
    if (preferredPostDays !== undefined) {
      updateData.preferredPostDays = JSON.stringify(preferredPostDays);
    }

    const settings = await prisma.blogScheduleSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        maxBlogsPerWeek: maxBlogsPerWeek ?? 3,
        minDaysBetweenPosts: minDaysBetweenPosts ?? 2,
        preferredPostTime: preferredPostTime ?? "09:00",
        preferredPostDays: preferredPostDays ? JSON.stringify(preferredPostDays) : '["Monday", "Wednesday", "Friday"]'
      }
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        preferredPostDays: settings.preferredPostDays 
          ? JSON.parse(settings.preferredPostDays) 
          : ["Monday", "Wednesday", "Friday"]
      }
    });

  } catch (error: any) {
    console.error("Settings POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}





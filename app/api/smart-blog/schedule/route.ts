import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Fetch all scheduled blogs and settings
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM
    const status = searchParams.get("status");

    // Default settings
    const defaultSettings = {
      maxBlogsPerWeek: 3,
      minDaysBetweenPosts: 2,
      preferredPostTime: "09:00",
      preferredPostDays: '["Monday", "Wednesday", "Friday"]'
    };

    // Try to fetch scheduled blogs (with fallback if table doesn't exist)
    let scheduledBlogs: any[] = [];
    try {
      // Build filter
      const where: any = {};
      
      if (month) {
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        
        where.scheduledFor = {
          gte: startDate,
          lt: endDate
        };
      }
      
      if (status) {
        where.status = status;
      }

      scheduledBlogs = await prisma.scheduledBlog.findMany({
        where,
        orderBy: { scheduledFor: "asc" }
      });
    } catch (e) {
      console.log("ScheduledBlog table not available yet:", e);
      scheduledBlogs = [];
    }

    // Try to fetch schedule settings (with fallback)
    let settings: any = defaultSettings;
    try {
      const dbSettings = await prisma.blogScheduleSettings.findUnique({
        where: { id: "default" }
      });
      if (dbSettings) {
        settings = {
          maxBlogsPerWeek: dbSettings.maxBlogsPerWeek,
          minDaysBetweenPosts: dbSettings.minDaysBetweenPosts,
          preferredPostTime: dbSettings.preferredPostTime || "09:00",
          preferredPostDays: dbSettings.preferredPostDays || '["Monday", "Wednesday", "Friday"]'
        };
      }
    } catch (e) {
      console.log("BlogScheduleSettings table not available yet:", e);
    }

    // Fetch published blogs for the same period (to show in calendar)
    let publishedBlogs: any[] = [];
    if (month) {
      try {
        publishedBlogs = await prisma.blog.findMany({
          where: {
            published: true,
            publishedAt: {
              gte: new Date(`${month}-01`),
              lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
            }
          },
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true
          },
          orderBy: { publishedAt: "asc" }
        });
      } catch (e) {
        console.log("Error fetching published blogs:", e);
      }
    }

    return NextResponse.json({
      scheduledBlogs,
      publishedBlogs,
      settings: {
        ...settings,
        preferredPostDays: settings.preferredPostDays 
          ? (typeof settings.preferredPostDays === 'string' 
              ? JSON.parse(settings.preferredPostDays) 
              : settings.preferredPostDays)
          : ["Monday", "Wednesday", "Friday"]
      }
    });

  } catch (error: any) {
    console.error("Schedule GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// POST - Create a new scheduled blog
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      topicId,
      topicTitle, 
      scheduledFor, 
      language = "en",
      length = "medium",
      tone = "professional",
      includeResearch = true
    } = body;

    if (!topicTitle || !scheduledFor) {
      return NextResponse.json(
        { error: "Topic title and scheduled date are required" },
        { status: 400 }
      );
    }

    // Get settings to validate
    const settings = await prisma.blogScheduleSettings.findUnique({
      where: { id: "default" }
    });

    const scheduledDate = new Date(scheduledFor);
    
    // Check minimum days between posts
    if (settings) {
      const minDays = settings.minDaysBetweenPosts;
      const rangeStart = new Date(scheduledDate);
      rangeStart.setDate(rangeStart.getDate() - minDays);
      const rangeEnd = new Date(scheduledDate);
      rangeEnd.setDate(rangeEnd.getDate() + minDays);

      const conflictingBlogs = await prisma.scheduledBlog.findMany({
        where: {
          scheduledFor: {
            gte: rangeStart,
            lte: rangeEnd
          },
          status: { in: ["SCHEDULED", "PROCESSING"] }
        }
      });

      // Also check published blogs
      const conflictingPublished = await prisma.blog.findMany({
        where: {
          published: true,
          publishedAt: {
            gte: rangeStart,
            lte: rangeEnd
          }
        }
      });

      if (conflictingBlogs.length > 0 || conflictingPublished.length > 0) {
        return NextResponse.json(
          { 
            error: `Minimum ${minDays} days required between posts. There's already a blog scheduled/published nearby.`,
            conflictingDates: [
              ...conflictingBlogs.map(b => b.scheduledFor),
              ...conflictingPublished.map(b => b.publishedAt)
            ]
          },
          { status: 400 }
        );
      }

      // Check max blogs per week
      const weekStart = new Date(scheduledDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const blogsThisWeek = await prisma.scheduledBlog.count({
        where: {
          scheduledFor: {
            gte: weekStart,
            lt: weekEnd
          },
          status: { in: ["SCHEDULED", "PROCESSING", "COMPLETED"] }
        }
      });

      const publishedThisWeek = await prisma.blog.count({
        where: {
          published: true,
          publishedAt: {
            gte: weekStart,
            lt: weekEnd
          }
        }
      });

      if (blogsThisWeek + publishedThisWeek >= settings.maxBlogsPerWeek) {
        return NextResponse.json(
          { 
            error: `Maximum ${settings.maxBlogsPerWeek} blogs per week reached for this week.`,
            currentCount: blogsThisWeek + publishedThisWeek
          },
          { status: 400 }
        );
      }
    }

    // Create the scheduled blog
    const scheduledBlog = await prisma.scheduledBlog.create({
      data: {
        topicId,
        topicTitle,
        scheduledFor: scheduledDate,
        scheduledBy: session.user.id,
        language,
        length,
        tone,
        includeResearch,
        status: "SCHEDULED"
      }
    });

    // If from a topic, update the topic status
    if (topicId) {
      await prisma.topicSuggestion.update({
        where: { id: topicId },
        data: { status: "SCHEDULED" }
      });
    }

    return NextResponse.json({
      success: true,
      scheduledBlog
    });

  } catch (error: any) {
    console.error("Schedule POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create scheduled blog" },
      { status: 500 }
    );
  }
}

// PATCH - Update a scheduled blog (reschedule, cancel, etc.)
export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, scheduledFor, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Scheduled blog ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (scheduledFor) {
      updateData.scheduledFor = new Date(scheduledFor);
    }
    
    if (status) {
      updateData.status = status;
      
      // If cancelling, also update the topic if linked
      if (status === "CANCELLED") {
        const scheduledBlog = await prisma.scheduledBlog.findUnique({
          where: { id }
        });
        
        if (scheduledBlog?.topicId) {
          await prisma.topicSuggestion.update({
            where: { id: scheduledBlog.topicId },
            data: { status: "AVAILABLE" }
          });
        }
      }
    }

    const updated = await prisma.scheduledBlog.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      scheduledBlog: updated
    });

  } catch (error: any) {
    console.error("Schedule PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update scheduled blog" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scheduled blog
export async function DELETE(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Scheduled blog ID is required" },
        { status: 400 }
      );
    }

    // Get the scheduled blog to check for linked topic
    const scheduledBlog = await prisma.scheduledBlog.findUnique({
      where: { id }
    });

    if (!scheduledBlog) {
      return NextResponse.json(
        { error: "Scheduled blog not found" },
        { status: 404 }
      );
    }

    // If linked to a topic, make it available again
    if (scheduledBlog.topicId) {
      await prisma.topicSuggestion.update({
        where: { id: scheduledBlog.topicId },
        data: { status: "AVAILABLE" }
      });
    }

    await prisma.scheduledBlog.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Scheduled blog deleted"
    });

  } catch (error: any) {
    console.error("Schedule DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete scheduled blog" },
      { status: 500 }
    );
  }
}


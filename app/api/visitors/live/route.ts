import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    
    // Live visitors = active in last 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Get recent views with property details
    const recentViews = await prisma.propertyView.findMany({
      where: {
        property: { userId },
        viewedAt: { gte: fiveMinutesAgo },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            listingNumber: true,
            provinceSlug: true,
            areaSlug: true,
            slug: true,
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 50,
    });

    // Count unique visitors (by sessionId or ipHash)
    const uniqueVisitors = new Set(
      recentViews.map((v) => v.sessionId || v.ipHash || v.id)
    );

    // Get views from last 24 hours for the timeline
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24hViews = await prisma.propertyView.findMany({
      where: {
        property: { userId },
        viewedAt: { gte: twentyFourHoursAgo },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            listingNumber: true,
            provinceSlug: true,
            areaSlug: true,
            slug: true,
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 100,
    });

    // Parse user agent to get device/browser info
    const parseUserAgent = (ua: string | null) => {
      if (!ua) return { device: "Unknown", browser: "Unknown" };
      
      let device = "Desktop";
      if (/mobile/i.test(ua)) device = "Mobile";
      else if (/tablet|ipad/i.test(ua)) device = "Tablet";
      
      let browser = "Unknown";
      if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = "Chrome";
      else if (/firefox/i.test(ua)) browser = "Firefox";
      else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
      else if (/edge/i.test(ua)) browser = "Edge";
      else if (/opera|opr/i.test(ua)) browser = "Opera";
      
      return { device, browser };
    };

    // Format the response
    const formattedViews = last24hViews.map((view) => {
      const { device, browser } = parseUserAgent(view.userAgent);
      return {
        id: view.id,
        viewedAt: view.viewedAt,
        property: view.property,
        country: view.country,
        city: view.city,
        device,
        browser,
        referrer: view.referrer,
        visitorId: view.sessionId || view.ipHash?.substring(0, 8) || "anonymous",
        isLive: view.viewedAt >= fiveMinutesAgo,
      };
    });

    // Group live visitors by visitorId
    const liveVisitorMap = new Map<string, typeof formattedViews[0][]>();
    formattedViews
      .filter((v) => v.isLive)
      .forEach((v) => {
        const key = v.visitorId;
        if (!liveVisitorMap.has(key)) {
          liveVisitorMap.set(key, []);
        }
        liveVisitorMap.get(key)!.push(v);
      });

    const liveVisitors = Array.from(liveVisitorMap.entries()).map(
      ([visitorId, views]) => ({
        visitorId,
        country: views[0].country,
        city: views[0].city,
        device: views[0].device,
        browser: views[0].browser,
        pagesViewed: views.length,
        lastSeen: views[0].viewedAt,
        currentPage: views[0].property,
        recentPages: views.slice(0, 5).map((v) => v.property),
      })
    );

    return NextResponse.json({
      liveCount: uniqueVisitors.size,
      liveVisitors,
      recentViews: formattedViews,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching live visitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch live visitors" },
      { status: 500 }
    );
  }
}





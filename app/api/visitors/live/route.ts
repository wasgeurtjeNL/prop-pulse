import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Generate a short unique visitor code from hash - prioritize ipHash for consistency
function generateVisitorCode(ipHash: string | null, sessionId: string | null): string {
  const source = ipHash || sessionId || "";
  if (!source) return "anon";
  
  // Create a short but recognizable code (e.g., "V-A3X9")
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars
  let code = "";
  for (let i = 0; i < 4; i++) {
    const charCode = source.charCodeAt(i % source.length) + source.charCodeAt((i + 3) % source.length);
    code += chars[charCode % chars.length];
  }
  return `V-${code}`;
}

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

    // Get unique visitor identifiers - USE ipHash as PRIMARY identifier
    // ipHash is the most reliable for grouping visitors, especially for historical data
    // This ensures all sessions from same IP are counted as 1 visitor
    const getVisitorKey = (v: { sessionId: string | null; ipHash: string | null; id: string }) => 
      v.ipHash || v.id;

    const uniqueVisitors = new Set(recentViews.map(getVisitorKey));

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
      take: 200,
    });

    // Get ALL historical views to determine returning visitors
    // We'll look at the last 30 days to check visit history
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const historicalViews = await prisma.propertyView.findMany({
      where: {
        property: { userId },
        viewedAt: { gte: thirtyDaysAgo },
      },
      select: {
        sessionId: true,
        ipHash: true,
        viewedAt: true,
        country: true,
        city: true,
      },
      orderBy: { viewedAt: "asc" },
    });

    // Build visitor history map
    const visitorHistory = new Map<string, {
      firstSeen: Date;
      totalVisits: number;
      visitDays: Set<string>;
      country: string | null;
      city: string | null;
    }>();

    historicalViews.forEach((view) => {
      // Use ipHash as primary key - groups all sessions from same IP as 1 visitor
      const key = view.ipHash || "";
      if (!key) return;
      
      const dayKey = view.viewedAt.toISOString().split("T")[0];
      
      if (!visitorHistory.has(key)) {
        visitorHistory.set(key, {
          firstSeen: view.viewedAt,
          totalVisits: 1,
          visitDays: new Set([dayKey]),
          country: view.country,
          city: view.city,
        });
      } else {
        const history = visitorHistory.get(key)!;
        history.totalVisits++;
        history.visitDays.add(dayKey);
      }
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

    // Format the response with enriched visitor data
    const formattedViews = last24hViews.map((view) => {
      const { device, browser } = parseUserAgent(view.userAgent);
      // Use ipHash as primary key - ensures consistent visitor identification
      const visitorKey = view.ipHash || "";
      const history = visitorHistory.get(visitorKey);
      const visitorCode = generateVisitorCode(view.ipHash, null);
      
      return {
        id: view.id,
        viewedAt: view.viewedAt,
        property: view.property,
        country: view.country,
        city: view.city,
        device,
        browser,
        referrer: view.referrer,
        visitorId: visitorKey,
        visitorCode,
        isLive: view.viewedAt >= fiveMinutesAgo,
        isReturning: history ? history.visitDays.size > 1 : false,
        totalVisits: history?.totalVisits || 1,
        visitDays: history?.visitDays.size || 1,
        firstSeen: history?.firstSeen || view.viewedAt,
      };
    });

    // Group live visitors by ipHash (visitorId is now ipHash-based)
    const liveVisitorMap = new Map<string, typeof formattedViews[0][]>();
    formattedViews
      .filter((v) => v.isLive)
      .forEach((v) => {
        const key = v.visitorId; // This is now ipHash-based
        if (!key) return;
        if (!liveVisitorMap.has(key)) {
          liveVisitorMap.set(key, []);
        }
        liveVisitorMap.get(key)!.push(v);
      });

    const liveVisitors = Array.from(liveVisitorMap.entries()).map(
      ([visitorId, views]) => {
        const history = visitorHistory.get(visitorId);
        return {
          visitorId,
          visitorCode: views[0].visitorCode,
          country: views[0].country,
          city: views[0].city,
          device: views[0].device,
          browser: views[0].browser,
          pagesViewed: views.length,
          lastSeen: views[0].viewedAt,
          currentPage: views[0].property,
          recentPages: views.slice(0, 5).map((v) => v.property),
          isReturning: history ? history.visitDays.size > 1 : false,
          totalVisits: history?.totalVisits || views.length,
          visitDays: history?.visitDays.size || 1,
          firstSeen: history?.firstSeen || views[views.length - 1].viewedAt,
        };
      }
    );

    // Country stats with unique visitors
    const countryStats = new Map<string, {
      uniqueVisitors: Set<string>;
      totalViews: number;
      returningVisitors: number;
    }>();

    formattedViews.forEach((view) => {
      const country = view.country || "Unknown";
      if (!countryStats.has(country)) {
        countryStats.set(country, {
          uniqueVisitors: new Set(),
          totalViews: 0,
          returningVisitors: 0,
        });
      }
      const stats = countryStats.get(country)!;
      if (!stats.uniqueVisitors.has(view.visitorId)) {
        stats.uniqueVisitors.add(view.visitorId);
        if (view.isReturning) {
          stats.returningVisitors++;
        }
      }
      stats.totalViews++;
    });

    const countryBreakdown = Array.from(countryStats.entries())
      .map(([country, stats]) => ({
        country,
        uniqueVisitors: stats.uniqueVisitors.size,
        totalViews: stats.totalViews,
        returningVisitors: stats.returningVisitors,
        newVisitors: stats.uniqueVisitors.size - stats.returningVisitors,
      }))
      .sort((a, b) => b.uniqueVisitors - a.uniqueVisitors);

    return NextResponse.json({
      liveCount: uniqueVisitors.size,
      liveVisitors,
      recentViews: formattedViews,
      countryBreakdown,
      stats: {
        totalViews24h: last24hViews.length,
        // Use ipHash as primary identifier - most reliable for unique visitor count
        uniqueVisitors24h: new Set(last24hViews.map(v => v.ipHash).filter(Boolean)).size,
        returningVisitors24h: formattedViews.filter(v => v.isReturning).length > 0 
          ? new Set(formattedViews.filter(v => v.isReturning).map(v => v.visitorId)).size 
          : 0,
      },
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










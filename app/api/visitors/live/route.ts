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

// Unified page info type
interface PageInfo {
  id: string;
  title: string;
  listingNumber?: string | null;
  provinceSlug?: string | null;
  areaSlug?: string | null;
  slug?: string | null;
  pagePath?: string | null;
  pageType?: string | null;
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
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Fetch PropertyViews and PageViews in parallel
    const [
      recentPropertyViews,
      last24hPropertyViews,
      historicalPropertyViews,
      recentPageViews,
      last24hPageViews,
      historicalPageViews,
    ] = await Promise.all([
      // Property views - last 5 minutes
      prisma.propertyView.findMany({
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
      }),
      // Property views - last 24 hours
      prisma.propertyView.findMany({
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
      }),
      // Historical property views - 30 days
      prisma.propertyView.findMany({
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
      }),
      // Page views - last 5 minutes
      prisma.pageView.findMany({
        where: {
          viewedAt: { gte: fiveMinutesAgo },
        },
        orderBy: { viewedAt: "desc" },
        take: 50,
      }),
      // Page views - last 24 hours
      prisma.pageView.findMany({
        where: {
          viewedAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { viewedAt: "desc" },
        take: 200,
      }),
      // Historical page views - 30 days
      prisma.pageView.findMany({
        where: {
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
      }),
    ]);

    // Build unified visitor history map from both sources
    const visitorHistory = new Map<string, {
      firstSeen: Date;
      totalVisits: number;
      visitDays: Set<string>;
      country: string | null;
      city: string | null;
    }>();

    // Process historical property views
    historicalPropertyViews.forEach((view) => {
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

    // Process historical page views
    historicalPageViews.forEach((view) => {
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

    // Format property views
    const formattedPropertyViews = last24hPropertyViews.map((view) => {
      const { device, browser } = parseUserAgent(view.userAgent);
      const visitorKey = view.ipHash || "";
      const history = visitorHistory.get(visitorKey);
      const visitorCode = generateVisitorCode(view.ipHash, null);
      
      const page: PageInfo = {
        id: view.property.id,
        title: view.property.title,
        listingNumber: view.property.listingNumber,
        provinceSlug: view.property.provinceSlug,
        areaSlug: view.property.areaSlug,
        slug: view.property.slug,
        pageType: "property",
      };
      
      return {
        id: view.id,
        viewedAt: view.viewedAt,
        page,
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

    // Format page views
    const formattedPageViews = last24hPageViews.map((view) => {
      const { device, browser } = parseUserAgent(view.userAgent);
      const visitorKey = view.ipHash || "";
      const history = visitorHistory.get(visitorKey);
      const visitorCode = generateVisitorCode(view.ipHash, null);
      
      const page: PageInfo = {
        id: view.id,
        title: view.pageTitle || view.pagePath,
        pagePath: view.pagePath,
        pageType: view.pageType,
      };
      
      return {
        id: view.id,
        viewedAt: view.viewedAt,
        page,
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

    // Combine and sort all views
    const allFormattedViews = [...formattedPropertyViews, ...formattedPageViews]
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 200);

    // Get all live views (last 5 minutes)
    const allLiveViews = allFormattedViews.filter(v => v.isLive);
    
    // Unique live visitors
    const uniqueLiveVisitors = new Set(allLiveViews.map(v => v.visitorId).filter(Boolean));

    // Group live visitors by ipHash
    const liveVisitorMap = new Map<string, typeof allFormattedViews[0][]>();
    allLiveViews.forEach((v) => {
      const key = v.visitorId;
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
          currentPage: views[0].page,
          recentPages: views.slice(0, 5).map((v) => v.page),
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

    allFormattedViews.forEach((view) => {
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

    // Calculate unique visitors (using ipHash from both sources)
    const allUniqueVisitors24h = new Set([
      ...last24hPropertyViews.map(v => v.ipHash).filter(Boolean),
      ...last24hPageViews.map(v => v.ipHash).filter(Boolean),
    ]);

    return NextResponse.json({
      liveCount: uniqueLiveVisitors.size,
      liveVisitors,
      recentViews: allFormattedViews,
      countryBreakdown,
      stats: {
        totalViews24h: last24hPropertyViews.length + last24hPageViews.length,
        uniqueVisitors24h: allUniqueVisitors24h.size,
        returningVisitors24h: allFormattedViews.filter(v => v.isReturning).length > 0 
          ? new Set(allFormattedViews.filter(v => v.isReturning).map(v => v.visitorId)).size 
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










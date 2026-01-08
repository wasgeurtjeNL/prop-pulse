import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import crypto from "crypto";

// Helper to hash IP for privacy
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);
}

// Geo lookup using ip-api.com (free tier)
async function getGeoInfo(ip: string): Promise<{ country: string | null; city: string | null }> {
  if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: null, city: null };
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        return {
          country: data.countryCode || null,
          city: data.city || null,
        };
      }
    }
  } catch (error) {
    console.error("Geo lookup failed:", error);
  }
  
  return { country: null, city: null };
}

// POST - Track a page view (public endpoint)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      pagePath, 
      pageTitle, 
      pageType, 
      sessionId, 
      utmSource, 
      utmMedium, 
      utmCampaign, 
      utmTerm, 
      utmContent 
    } = body;

    if (!pagePath) {
      return NextResponse.json({ error: "pagePath is required" }, { status: 400 });
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               headersList.get("x-real-ip") || 
               "unknown";
    const userAgent = headersList.get("user-agent") || "";
    const referrer = headersList.get("referer") || "";

    // Get geo info
    const { country, city } = await getGeoInfo(ip);

    // Create page view
    await prisma.pageView.create({
      data: {
        pagePath,
        pageTitle,
        pageType,
        sessionId,
        ipHash: hashIP(ip),
        userAgent,
        referrer,
        country,
        city,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/analytics/page-views] Error:", error);
    return NextResponse.json({ error: "Failed to track page view" }, { status: 500 });
  }
}

// GET - Retrieve page view analytics (protected endpoint)
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get("pageType");
    const pagePath = searchParams.get("pagePath");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const days = parseInt(searchParams.get("days") || "30");

    // Build date filter
    const fromDate = fromParam ? new Date(fromParam) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const toDate = toParam ? new Date(toParam) : new Date();
    if (toParam) {
      toDate.setHours(23, 59, 59, 999);
    }

    // Build where clause
    type WhereClause = {
      viewedAt: { gte: Date; lte: Date };
      pageType?: string;
      pagePath?: string;
    };
    
    const whereClause: WhereClause = {
      viewedAt: { gte: fromDate, lte: toDate },
    };
    if (pageType) whereClause.pageType = pageType;
    if (pagePath) whereClause.pagePath = pagePath;

    // Get views grouped by page
    const views = await prisma.pageView.groupBy({
      by: ["pagePath", "pageTitle", "pageType"],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    });

    // Get total views
    const totalViews = await prisma.pageView.count({ where: whereClause });
    
    // Get unique visitors count
    const uniqueVisitorsResult = await prisma.pageView.findMany({
      where: whereClause,
      select: { ipHash: true },
      distinct: ["ipHash"],
    });
    const uniqueVisitors = uniqueVisitorsResult.filter(v => v.ipHash).length;

    // Get views by page type
    const viewsByType = await prisma.pageView.groupBy({
      by: ["pageType"],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Get views over time (daily) using raw query for better aggregation
    const viewsOverTime = await prisma.$queryRaw`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*)::int as views
      FROM page_view
      WHERE viewed_at >= ${fromDate} AND viewed_at <= ${toDate}
      GROUP BY DATE(viewed_at)
      ORDER BY date ASC
    ` as { date: Date; views: number }[];

    // Get UTM sources
    const utmSources = await prisma.pageView.groupBy({
      by: ["utmSource"],
      where: {
        ...whereClause,
        utmSource: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Format response
    const topPages = views.map((v) => ({
      pagePath: v.pagePath,
      pageTitle: v.pageTitle,
      pageType: v.pageType,
      views: v._count.id,
    }));

    return NextResponse.json({
      summary: {
        totalViews,
        uniqueVisitors,
        period: `${days} days`,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      topPages,
      viewsByType: viewsByType.map(v => ({
        pageType: v.pageType || "unknown",
        views: v._count.id,
      })),
      viewsOverTime: viewsOverTime.map((v) => ({
        date: v.date,
        views: v.views,
      })),
      utmSources: utmSources.map(v => ({
        source: v.utmSource,
        views: v._count.id,
      })),
    });
  } catch (error) {
    console.error("[GET /api/analytics/page-views] Error:", error);
    return NextResponse.json({ error: "Failed to fetch page view analytics" }, { status: 500 });
  }
}

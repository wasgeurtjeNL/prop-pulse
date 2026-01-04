import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Source icons mapping
const sourceIcons: Record<string, string> = {
  facebook: "📘",
  instagram: "📸",
  google: "🔍",
  tiktok: "🎵",
  youtube: "📺",
  line: "💬",
  whatsapp: "💚",
  email: "📧",
  partner: "🤝",
  qr: "📱",
};

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = (session.user as { role?: string })?.role;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    
    // Get date range (default: last 30 days)
    let fromDate: Date;
    let toDate: Date | undefined;
    
    if (fromParam) {
      fromDate = new Date(fromParam);
    } else {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
    }
    
    if (toParam) {
      toDate = new Date(toParam);
      // Set to end of day
      toDate.setHours(23, 59, 59, 999);
    }

    // Build where clause
    type WhereClause = {
      property?: { userId: string } | { id: string };
      propertyId?: string;
      viewedAt: { gte: Date; lte?: Date };
    };
    
    const whereClause: WhereClause = {
      viewedAt: { gte: fromDate },
    };
    
    if (toDate) {
      whereClause.viewedAt.lte = toDate;
    }

    if (propertyId) {
      whereClause.propertyId = propertyId;
    } else if (userRole !== "ADMIN") {
      whereClause.property = { userId };
    }

    // Get all views with UTM data for user's properties
    const views = await prisma.propertyView.findMany({
      where: whereClause,
      select: {
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
      },
    });

    // Count by UTM source
    const sourceCounts: Record<string, number> = {};
    const mediumCounts: Record<string, number> = {};
    const campaignCounts: Record<string, number> = {};
    const sourceMediaCombos: Record<string, number> = {};

    let trackedViews = 0;
    let untrackedViews = 0;

    views.forEach(view => {
      if (view.utmSource) {
        trackedViews++;
        sourceCounts[view.utmSource] = (sourceCounts[view.utmSource] || 0) + 1;
        
        if (view.utmMedium) {
          const combo = `${view.utmSource} / ${view.utmMedium}`;
          sourceMediaCombos[combo] = (sourceMediaCombos[combo] || 0) + 1;
        }
      } else {
        untrackedViews++;
      }
      
      if (view.utmMedium) {
        mediumCounts[view.utmMedium] = (mediumCounts[view.utmMedium] || 0) + 1;
      }
      
      if (view.utmCampaign) {
        campaignCounts[view.utmCampaign] = (campaignCounts[view.utmCampaign] || 0) + 1;
      }
    });

    // Sort and format results
    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ 
        source, 
        count,
        icon: sourceIcons[source] || "🔗",
      }));

    const topMediums = Object.entries(mediumCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([medium, count]) => ({ medium, count }));

    const topCampaigns = Object.entries(campaignCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([campaign, count]) => ({ campaign, count }));

    const topSourceMediums = Object.entries(sourceMediaCombos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([combo, count]) => ({ combo, count }));

    return NextResponse.json({
      summary: {
        trackedViews,
        untrackedViews,
        trackingRate: views.length > 0 ? Math.round(trackedViews / views.length * 100) : 0,
      },
      sources: topSources,
      mediums: topMediums,
      campaigns: topCampaigns,
      sourceMediums: topSourceMediums,
    });
  } catch (error) {
    console.error("Error fetching UTM analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch UTM analytics" },
      { status: 500 }
    );
  }
}


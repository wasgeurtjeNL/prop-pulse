import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as { role?: string })?.role;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Build where clause based on role and property filter
    type WhereClause = {
      property?: { userId: string };
      propertyId?: string;
      viewedAt?: { gte?: Date; lte?: Date };
    };
    
    const whereClause: WhereClause = {};
    
    // Date filtering
    if (fromParam || toParam) {
      whereClause.viewedAt = {};
      if (fromParam) {
        whereClause.viewedAt.gte = new Date(fromParam);
      }
      if (toParam) {
        const toDate = new Date(toParam);
        toDate.setHours(23, 59, 59, 999);
        whereClause.viewedAt.lte = toDate;
      }
    }
    
    if (propertyId) {
      whereClause.propertyId = propertyId;
    } else if (userRole !== "ADMIN") {
      whereClause.property = { userId };
    }

    // Fetch all views
    const views = await prisma.propertyView.findMany({
      where: whereClause,
      select: {
        userAgent: true,
        referrer: true,
        country: true,
        city: true,
      },
    });

    // Parse devices from user agents
    const deviceCounts: Record<string, number> = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0,
    };

    const countryCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};

    views.forEach((view) => {
      // Device detection
      const ua = view.userAgent?.toLowerCase() || "";
      if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        if (ua.includes("ipad") || ua.includes("tablet")) {
          deviceCounts["Tablet"]++;
        } else {
          deviceCounts["Mobile"]++;
        }
      } else {
        deviceCounts["Desktop"]++;
      }

      // Country counting
      if (view.country) {
        countryCounts[view.country] = (countryCounts[view.country] || 0) + 1;
      }

      // Referrer parsing
      if (view.referrer) {
        try {
          const url = new URL(view.referrer);
          const domain = url.hostname.replace("www.", "");
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          // Invalid URL, skip
        }
      } else {
        referrerCounts["direct"] = (referrerCounts["direct"] || 0) + 1;
      }
    });

    // Calculate device percentages
    const totalDevices = Object.values(deviceCounts).reduce((a, b) => a + b, 0);
    const devices = Object.entries(deviceCounts)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        value: totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0,
        color: name === "Desktop" ? "#3b82f6" : name === "Mobile" ? "#22c55e" : "#f59e0b",
      }));

    // Sort and format referrers
    const totalReferrers = Object.values(referrerCounts).reduce((a, b) => a + b, 0);
    const referrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalReferrers > 0 ? Math.round((count / totalReferrers) * 100) : 0,
      }));

    // Sort and format countries
    const countries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([country, views]) => ({ country, views }));

    return NextResponse.json({
      devices,
      referrers,
      countries,
      totalViews: views.length,
    });
  } catch (error) {
    console.error("[GET /api/analytics/traffic-sources] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic sources" },
      { status: 500 }
    );
  }
}


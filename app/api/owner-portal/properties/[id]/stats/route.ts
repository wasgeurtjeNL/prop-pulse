import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/owner-portal/properties/[id]/stats
 * Get property statistics for owner (views, leads, viewing requests)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Access denied. Owner account required." },
        { status: 403 }
      );
    }

    const { id: propertyId } = await params;

    // Verify owner owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerUserId: session.user.id,
      },
      select: { id: true, title: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get property views
    const [totalViews, viewsToday, viewsThisWeek, viewsThisMonth, viewsByDay] = await Promise.all([
      // Total views all time
      prisma.propertyView.count({
        where: { propertyId },
      }),
      // Views today
      prisma.propertyView.count({
        where: {
          propertyId,
          viewedAt: { gte: todayStart },
        },
      }),
      // Views this week
      prisma.propertyView.count({
        where: {
          propertyId,
          viewedAt: { gte: weekAgo },
        },
      }),
      // Views this month
      prisma.propertyView.count({
        where: {
          propertyId,
          viewedAt: { gte: monthAgo },
        },
      }),
      // Views by day for chart (last 30 days)
      prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE("viewedAt") as date, COUNT(*) as count
        FROM property_view
        WHERE "propertyId" = ${propertyId}
          AND "viewedAt" >= ${monthAgo}
        GROUP BY DATE("viewedAt")
        ORDER BY date ASC
      `,
    ]);

    // Get viewing requests (leads)
    const [totalViewingRequests, pendingViewingRequests, viewingRequestsList] = await Promise.all([
      // Total viewing requests
      prisma.viewingRequest.count({
        where: { propertyId },
      }),
      // Pending viewing requests
      prisma.viewingRequest.count({
        where: {
          propertyId,
          status: "PENDING",
        },
      }),
      // Recent viewing requests (last 10)
      prisma.viewingRequest.findMany({
        where: { propertyId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          viewingDate: true,
          requestType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Get top countries from views
    const viewsByCountry = await prisma.propertyView.groupBy({
      by: ["country"],
      where: {
        propertyId,
        country: { not: null },
      },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 5,
    });

    // Format views by day for chart
    const viewsChart = viewsByDay.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      views: Number(item.count),
    }));

    return NextResponse.json({
      property: {
        id: property.id,
        title: property.title,
      },
      views: {
        total: totalViews,
        today: viewsToday,
        thisWeek: viewsThisWeek,
        thisMonth: viewsThisMonth,
        chart: viewsChart,
        byCountry: viewsByCountry.map((item) => ({
          country: item.country || "Unknown",
          count: item._count.country,
        })),
      },
      leads: {
        total: totalViewingRequests,
        pending: pendingViewingRequests,
        recent: viewingRequestsList.map((req) => ({
          id: req.id,
          name: req.name,
          email: req.email,
          phone: req.phone,
          status: req.status,
          viewingDate: req.viewingDate?.toISOString() || null,
          requestType: req.requestType,
          createdAt: req.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[Owner Property Stats GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch property statistics" },
      { status: 500 }
    );
  }
}

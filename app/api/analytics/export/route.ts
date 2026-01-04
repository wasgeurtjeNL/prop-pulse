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
    const isAdmin = userRole === "ADMIN";
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "views"; // views, leads, utm
    const format = searchParams.get("format") || "csv";
    const propertyId = searchParams.get("propertyId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Build date filter
    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (fromParam || toParam) {
      dateFilter = {};
      if (fromParam) {
        dateFilter.gte = new Date(fromParam);
      }
      if (toParam) {
        const toDate = new Date(toParam);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
    }

    let csvContent = "";
    let filename = "";

    if (type === "views") {
      // Export property views
      type ViewWhereClause = {
        property?: { userId: string };
        propertyId?: string;
        viewedAt?: { gte?: Date; lte?: Date };
      };
      
      const whereClause: ViewWhereClause = {};
      if (propertyId) {
        whereClause.propertyId = propertyId;
      } else if (!isAdmin) {
        whereClause.property = { userId };
      }
      if (dateFilter) {
        whereClause.viewedAt = dateFilter;
      }

      const views = await prisma.propertyView.findMany({
        where: whereClause,
        select: {
          id: true,
          viewedAt: true,
          country: true,
          city: true,
          userAgent: true,
          referrer: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          property: {
            select: {
              title: true,
              listingNumber: true,
            },
          },
        },
        orderBy: { viewedAt: "desc" },
        take: 10000, // Limit to 10k rows
      });

      // Create CSV
      csvContent = "Date,Property,Listing Number,Country,City,UTM Source,UTM Medium,UTM Campaign,Referrer\n";
      views.forEach((view) => {
        const row = [
          new Date(view.viewedAt).toISOString(),
          `"${(view.property?.title || "").replace(/"/g, '""')}"`,
          view.property?.listingNumber || "",
          view.country || "",
          view.city || "",
          view.utmSource || "",
          view.utmMedium || "",
          view.utmCampaign || "",
          `"${(view.referrer || "").replace(/"/g, '""')}"`,
        ];
        csvContent += row.join(",") + "\n";
      });

      filename = `property-views-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "leads") {
      // Export leads
      type LeadWhereClause = {
        property?: { userId: string };
        propertyId?: string;
        createdAt?: { gte?: Date; lte?: Date };
      };
      
      const whereClause: LeadWhereClause = {};
      if (propertyId) {
        whereClause.propertyId = propertyId;
      } else if (!isAdmin) {
        whereClause.property = { userId };
      }
      if (dateFilter) {
        whereClause.createdAt = dateFilter;
      }

      const viewingRequests = await prisma.viewingRequest.findMany({
        where: whereClause,
        select: {
          id: true,
          createdAt: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          requestType: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          property: {
            select: {
              title: true,
              listingNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });

      csvContent = "Date,Type,Name,Email,Phone,Property,Listing Number,Status,UTM Source,UTM Medium,UTM Campaign\n";
      viewingRequests.forEach((lead) => {
        const row = [
          new Date(lead.createdAt).toISOString(),
          lead.requestType,
          `"${(lead.name || "").replace(/"/g, '""')}"`,
          lead.email,
          lead.phone,
          `"${(lead.property?.title || "").replace(/"/g, '""')}"`,
          lead.property?.listingNumber || "",
          lead.status,
          lead.utmSource || "",
          lead.utmMedium || "",
          lead.utmCampaign || "",
        ];
        csvContent += row.join(",") + "\n";
      });

      filename = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "utm") {
      // Export UTM summary
      type UtmWhereClause = {
        property?: { userId: string };
        propertyId?: string;
        viewedAt?: { gte?: Date; lte?: Date };
        utmSource: { not: null };
      };
      
      const whereClause: UtmWhereClause = {
        utmSource: { not: null },
      };
      if (propertyId) {
        whereClause.propertyId = propertyId;
      } else if (!isAdmin) {
        whereClause.property = { userId };
      }
      if (dateFilter) {
        whereClause.viewedAt = dateFilter;
      }

      const views = await prisma.propertyView.findMany({
        where: whereClause,
        select: {
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
        },
      });

      // Aggregate by source/medium/campaign
      const aggregated: Record<string, number> = {};
      views.forEach((view) => {
        const key = `${view.utmSource || ""},${view.utmMedium || ""},${view.utmCampaign || ""}`;
        aggregated[key] = (aggregated[key] || 0) + 1;
      });

      csvContent = "UTM Source,UTM Medium,UTM Campaign,Views\n";
      Object.entries(aggregated)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
          csvContent += `${key},${count}\n`;
        });

      filename = `utm-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/analytics/export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}


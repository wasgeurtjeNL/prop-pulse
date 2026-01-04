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
    const propertyId = searchParams.get("propertyId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

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

    // Build viewing request where clause
    type ViewingWhereClause = {
      property?: { userId: string } | { id: string };
      propertyId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    };
    
    const viewingWhere: ViewingWhereClause = {};
    if (propertyId) {
      viewingWhere.propertyId = propertyId;
    } else if (!isAdmin) {
      viewingWhere.property = { userId };
    }
    if (dateFilter) {
      viewingWhere.createdAt = dateFilter;
    }

    // Build investor/rental lead where clause
    type LeadWhereClause = {
      assignedToId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    };
    
    const investorRentalWhere: LeadWhereClause = isAdmin ? {} : { assignedToId: userId };
    if (dateFilter) {
      investorRentalWhere.createdAt = dateFilter;
    }

    // Fetch all leads in parallel
    const [viewingRequests, investorLeads, rentalLeads] = await Promise.all([
      prisma.viewingRequest.findMany({
        where: viewingWhere,
        select: {
          id: true,
          status: true,
          createdAt: true,
          requestType: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          property: {
            select: {
              id: true,
              title: true,
              listingNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Investor and rental leads don't have propertyId, so only filter if no specific property selected
      propertyId ? Promise.resolve([]) : prisma.investorLead.findMany({
        where: investorRentalWhere,
        select: {
          id: true,
          status: true,
          createdAt: true,
          investmentBudget: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      propertyId ? Promise.resolve([]) : prisma.rentalLead.findMany({
        where: investorRentalWhere,
        select: {
          id: true,
          status: true,
          createdAt: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Calculate summary stats
    const totalLeads = viewingRequests.length + investorLeads.length + rentalLeads.length;
    const last30DaysLeads = [
      ...viewingRequests.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo),
      ...investorLeads.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo),
      ...rentalLeads.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo),
    ].length;

    // Lead types breakdown
    const leadsByType = [
      { type: "Viewing Requests", count: viewingRequests.length, color: "#3b82f6" },
      { type: "Investor Leads", count: investorLeads.length, color: "#22c55e" },
      { type: "Rental Leads", count: rentalLeads.length, color: "#f59e0b" },
    ].filter((t) => t.count > 0);

    // Status breakdown for viewing requests
    const viewingStatusCounts: Record<string, number> = {};
    viewingRequests.forEach((vr) => {
      viewingStatusCounts[vr.status] = (viewingStatusCounts[vr.status] || 0) + 1;
    });
    const viewingStatusBreakdown = Object.entries(viewingStatusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count }));

    // Status breakdown for investor leads
    const investorStatusCounts: Record<string, number> = {};
    investorLeads.forEach((il) => {
      investorStatusCounts[il.status] = (investorStatusCounts[il.status] || 0) + 1;
    });
    const investorStatusBreakdown = Object.entries(investorStatusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count }));

    // UTM Attribution for leads
    const allLeads = [...viewingRequests, ...investorLeads, ...rentalLeads];
    const utmSourceCounts: Record<string, number> = {};
    const utmMediumCounts: Record<string, number> = {};
    const utmCampaignCounts: Record<string, number> = {};

    allLeads.forEach((lead) => {
      if (lead.utmSource) {
        utmSourceCounts[lead.utmSource] = (utmSourceCounts[lead.utmSource] || 0) + 1;
      }
      if (lead.utmMedium) {
        utmMediumCounts[lead.utmMedium] = (utmMediumCounts[lead.utmMedium] || 0) + 1;
      }
      if (lead.utmCampaign) {
        utmCampaignCounts[lead.utmCampaign] = (utmCampaignCounts[lead.utmCampaign] || 0) + 1;
      }
    });

    const leadsWithUtm = allLeads.filter((l) => l.utmSource).length;
    const leadsWithoutUtm = totalLeads - leadsWithUtm;

    const topUtmSources = Object.entries(utmSourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    const topUtmCampaigns = Object.entries(utmCampaignCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([campaign, count]) => ({ campaign, count }));

    // Leads over time (last 6 months)
    const monthlyLeads: Record<string, { viewing: number; investor: number; rental: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyLeads[key] = { viewing: 0, investor: 0, rental: 0 };
    }

    viewingRequests.forEach((vr) => {
      const date = new Date(vr.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyLeads[key]) monthlyLeads[key].viewing++;
    });

    investorLeads.forEach((il) => {
      const date = new Date(il.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyLeads[key]) monthlyLeads[key].investor++;
    });

    rentalLeads.forEach((rl) => {
      const date = new Date(rl.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyLeads[key]) monthlyLeads[key].rental++;
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const leadsOverTime = Object.entries(monthlyLeads).map(([key, counts]) => {
      const [year, month] = key.split("-");
      return {
        month: monthNames[parseInt(month) - 1],
        year,
        viewing: counts.viewing,
        investor: counts.investor,
        rental: counts.rental,
        total: counts.viewing + counts.investor + counts.rental,
      };
    });

    // Top properties by leads
    const propertyLeadCounts: Record<string, { id: string; title: string; listingNumber: string | null; count: number }> = {};
    viewingRequests.forEach((vr) => {
      if (vr.property) {
        const key = vr.property.id;
        if (!propertyLeadCounts[key]) {
          propertyLeadCounts[key] = {
            id: vr.property.id,
            title: vr.property.title,
            listingNumber: vr.property.listingNumber,
            count: 0,
          };
        }
        propertyLeadCounts[key].count++;
      }
    });

    const topPropertiesByLeads = Object.values(propertyLeadCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent leads
    const recentLeads = [
      ...viewingRequests.slice(0, 5).map((vr) => ({
        id: vr.id,
        type: "viewing",
        status: vr.status,
        createdAt: vr.createdAt,
        property: vr.property?.title || "General Inquiry",
        utmSource: vr.utmSource,
      })),
      ...investorLeads.slice(0, 5).map((il) => ({
        id: il.id,
        type: "investor",
        status: il.status,
        createdAt: il.createdAt,
        property: `Budget: ${il.investmentBudget}`,
        utmSource: il.utmSource,
      })),
      ...rentalLeads.slice(0, 5).map((rl) => ({
        id: rl.id,
        type: "rental",
        status: rl.status,
        createdAt: rl.createdAt,
        property: "Rental Inquiry",
        utmSource: rl.utmSource,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        totalLeads,
        last30DaysLeads,
        leadsWithUtm,
        leadsWithoutUtm,
        trackingRate: totalLeads > 0 ? Math.round((leadsWithUtm / totalLeads) * 100) : 0,
      },
      leadsByType,
      viewingStatusBreakdown,
      investorStatusBreakdown,
      leadsOverTime,
      topUtmSources,
      topUtmCampaigns,
      topPropertiesByLeads,
      recentLeads,
    });
  } catch (error) {
    console.error("[GET /api/analytics/leads] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads analytics" },
      { status: 500 }
    );
  }
}


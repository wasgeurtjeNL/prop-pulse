"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Status, PropertyType } from "@prisma/client";

// Date range filter interface
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

// Get properties added per month (last 6 months)
export async function getPropertiesOverTime() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const properties = await prisma.property.findMany({
    where: {
      userId,
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by month
  const monthlyData: Record<string, number> = {};
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = 0;
  }

  // Count properties per month
  properties.forEach((property) => {
    const date = new Date(property.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key] !== undefined) {
      monthlyData[key]++;
    }
  });

  // Convert to array format for charts
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return Object.entries(monthlyData).map(([key, count]) => {
    const [year, month] = key.split("-");
    return {
      month: monthNames[parseInt(month) - 1],
      year: year,
      properties: count,
    };
  });
}

// Get property status distribution
export async function getPropertyStatusDistribution() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const [active, inactive, sold, rented] = await Promise.all([
    prisma.property.count({ where: { userId, status: Status.ACTIVE } }),
    prisma.property.count({ where: { userId, status: Status.INACTIVE } }),
    prisma.property.count({ where: { userId, status: Status.SOLD } }),
    prisma.property.count({ where: { userId, status: Status.RENTED } }),
  ]);

  return [
    { name: "Active", value: active, color: "#22c55e" },
    { name: "Inactive", value: inactive, color: "#6b7280" },
    { name: "Sold", value: sold, color: "#3b82f6" },
    { name: "Rented", value: rented, color: "#f59e0b" },
  ].filter((item) => item.value > 0);
}

// Get property type distribution (For Sale vs For Rent)
export async function getPropertyTypeDistribution() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const [forSale, forRent] = await Promise.all([
    prisma.property.count({ where: { userId, type: PropertyType.FOR_SALE } }),
    prisma.property.count({ where: { userId, type: PropertyType.FOR_RENT } }),
  ]);

  return [
    { name: "For Sale", value: forSale, color: "#8b5cf6" },
    { name: "For Rent", value: forRent, color: "#ec4899" },
  ].filter((item) => item.value > 0);
}

// Get leads over time (last 6 months) - viewing requests
export async function getLeadsOverTime() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Get viewing requests for user's properties
  const viewingRequests = await prisma.viewingRequest.findMany({
    where: {
      property: {
        userId,
      },
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by month
  const monthlyData: Record<string, number> = {};
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = 0;
  }

  // Count leads per month
  viewingRequests.forEach((request) => {
    const date = new Date(request.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key] !== undefined) {
      monthlyData[key]++;
    }
  });

  // Convert to array format for charts
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return Object.entries(monthlyData).map(([key, count]) => {
    const [year, month] = key.split("-");
    return {
      month: monthNames[parseInt(month) - 1],
      year: year,
      leads: count,
    };
  });
}

// Get top performing properties (most viewing requests)
export async function getTopPerformingProperties(limit = 5) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const properties = await prisma.property.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      listingNumber: true,
      _count: {
        select: {
          viewingRequests: true,
        },
      },
    },
    orderBy: {
      viewingRequests: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return properties
    .filter((p) => p._count.viewingRequests > 0)
    .map((p) => ({
      name: p.listingNumber || p.title.substring(0, 20),
      inquiries: p._count.viewingRequests,
    }));
}

// Get most viewed properties (page views)
export async function getMostViewedProperties(limit = 5) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const properties = await prisma.property.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      listingNumber: true,
      _count: {
        select: {
          views: true,
        },
      },
    },
    orderBy: {
      views: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return properties
    .filter((p) => p._count.views > 0)
    .map((p) => ({
      name: p.listingNumber || p.title.substring(0, 20),
      views: p._count.views,
    }));
}

// Get views over time (with date range filter)
export async function getViewsOverTime(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  
  // Use date range or default to last 30 days
  const to = dateRange?.to || new Date();
  const from = dateRange?.from || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();

  const views = await prisma.propertyView.findMany({
    where: {
      property: {
        userId,
      },
      viewedAt: { 
        gte: from,
        lte: to,
      },
    },
    select: {
      viewedAt: true,
    },
  });

  // Calculate number of days in range
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  
  // Group by day
  const dailyData: Record<string, number> = {};
  
  // Initialize days in range with 0
  for (let i = daysDiff; i >= 0; i--) {
    const date = new Date(to);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    dailyData[key] = 0;
  }

  // Count views per day
  views.forEach((view) => {
    const date = new Date(view.viewedAt);
    const key = date.toISOString().split("T")[0];
    if (dailyData[key] !== undefined) {
      dailyData[key]++;
    }
  });

  // Convert to array format for charts
  return Object.entries(dailyData).map(([date, count]) => {
    const d = new Date(date);
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      fullDate: date,
      views: count,
    };
  });
}

// Get total views stats (with date range filter)
export async function getViewsStats(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  
  // If date range specified, show stats for that range
  if (dateRange?.from && dateRange?.to) {
    const rangeViews = await prisma.propertyView.count({
      where: {
        property: { userId },
        viewedAt: { 
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
    });

    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const avgPerDay = daysDiff > 0 ? Math.round(rangeViews / daysDiff) : 0;

    return {
      total: rangeViews,
      label: "Selected period",
      avgPerDay,
      days: daysDiff,
    };
  }
  
  // Default: show today, week, month stats
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 7);
  const thisMonthStart = new Date(today);
  thisMonthStart.setDate(today.getDate() - 30);

  const [totalViews, todayViews, weekViews, monthViews] = await Promise.all([
    prisma.propertyView.count({
      where: { property: { userId } },
    }),
    prisma.propertyView.count({
      where: {
        property: { userId },
        viewedAt: { gte: today },
      },
    }),
    prisma.propertyView.count({
      where: {
        property: { userId },
        viewedAt: { gte: thisWeekStart },
      },
    }),
    prisma.propertyView.count({
      where: {
        property: { userId },
        viewedAt: { gte: thisMonthStart },
      },
    }),
  ]);

  return {
    total: totalViews,
    today: todayViews,
    thisWeek: weekViews,
    thisMonth: monthViews,
  };
}

// Country name mapping for common country codes
const countryNames: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  NL: "Netherlands",
  DE: "Germany",
  FR: "France",
  TH: "Thailand",
  AU: "Australia",
  CA: "Canada",
  SG: "Singapore",
  HK: "Hong Kong",
  CN: "China",
  JP: "Japan",
  KR: "South Korea",
  IN: "India",
  RU: "Russia",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  IT: "Italy",
  ES: "Spain",
  PT: "Portugal",
  PL: "Poland",
  CZ: "Czechia",
  IE: "Ireland",
  NZ: "New Zealand",
  AE: "UAE",
  SA: "Saudi Arabia",
  IL: "Israel",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  BR: "Brazil",
  MX: "Mexico",
  ZA: "South Africa",
};

// Get views by country (with date range filter)
export async function getViewsByCountry(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const whereClause: {
    property: { userId: string };
    country: { not: null };
    viewedAt?: { gte?: Date; lte?: Date };
  } = {
    property: { userId },
    country: { not: null },
  };

  if (dateRange?.from || dateRange?.to) {
    whereClause.viewedAt = {};
    if (dateRange.from) whereClause.viewedAt.gte = dateRange.from;
    if (dateRange.to) whereClause.viewedAt.lte = dateRange.to;
  }

  const views = await prisma.propertyView.groupBy({
    by: ["country"],
    where: whereClause,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  return views.map((v) => ({
    country: v.country || "Unknown",
    name: countryNames[v.country || ""] || v.country || "Unknown",
    views: v._count.id,
  }));
}

// ============================================
// CONVERSION FUNNEL
// Views → Inquiries → Viewings Scheduled → Completed/Sold
// ============================================
export async function getConversionFunnel(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  
  const whereDate = dateRange?.from && dateRange?.to ? {
    viewedAt: { gte: dateRange.from, lte: dateRange.to },
  } : {};
  
  const whereRequestDate = dateRange?.from && dateRange?.to ? {
    createdAt: { gte: dateRange.from, lte: dateRange.to },
  } : {};

  const [totalViews, totalInquiries, scheduledViewings, completedViewings, closedDeals] = await Promise.all([
    // Total property views
    prisma.propertyView.count({
      where: { property: { userId }, ...whereDate },
    }),
    // Total inquiries (viewing requests)
    prisma.viewingRequest.count({
      where: { property: { userId }, ...whereRequestDate },
    }),
    // Scheduled viewings
    prisma.viewingRequest.count({
      where: { 
        property: { userId }, 
        status: "CONFIRMED",
        ...whereRequestDate,
      },
    }),
    // Completed viewings
    prisma.viewingRequest.count({
      where: { 
        property: { userId }, 
        status: "COMPLETED",
        ...whereRequestDate,
      },
    }),
    // Closed deals (sold + rented properties)
    prisma.property.count({
      where: { 
        userId, 
        status: { in: [Status.SOLD, Status.RENTED] },
        updatedAt: dateRange?.from && dateRange?.to 
          ? { gte: dateRange.from, lte: dateRange.to }
          : undefined,
      },
    }),
  ]);

  // Calculate conversion rates
  const viewToInquiryRate = totalViews > 0 ? (totalInquiries / totalViews * 100) : 0;
  const inquiryToViewingRate = totalInquiries > 0 ? (scheduledViewings / totalInquiries * 100) : 0;
  const viewingToCloseRate = completedViewings > 0 ? (closedDeals / completedViewings * 100) : 0;

  return {
    funnel: [
      { stage: "Views", count: totalViews, rate: 100 },
      { stage: "Inquiries", count: totalInquiries, rate: viewToInquiryRate },
      { stage: "Viewings", count: scheduledViewings + completedViewings, rate: inquiryToViewingRate },
      { stage: "Closed", count: closedDeals, rate: viewingToCloseRate },
    ],
    rates: {
      viewToInquiry: Math.round(viewToInquiryRate * 10) / 10,
      inquiryToViewing: Math.round(inquiryToViewingRate * 10) / 10,
      viewingToClose: Math.round(viewingToCloseRate * 10) / 10,
    },
  };
}

// ============================================
// REVENUE & PORTFOLIO VALUE
// ============================================
export async function getRevenueMetrics() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const properties = await prisma.property.findMany({
    where: { userId },
    select: {
      id: true,
      price: true,
      status: true,
      commissionRate: true,
      type: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Parse prices (handle formats like "฿15,500,000" or "15500000")
  const parsePrice = (price: string): number => {
    const cleaned = price.replace(/[฿$€,\s]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const activeProperties = properties.filter(p => p.status === Status.ACTIVE);
  const soldProperties = properties.filter(p => p.status === Status.SOLD);
  const rentedProperties = properties.filter(p => p.status === Status.RENTED);

  const activePortfolioValue = activeProperties.reduce((sum, p) => sum + parsePrice(p.price), 0);
  const soldValue = soldProperties.reduce((sum, p) => sum + parsePrice(p.price), 0);
  const potentialCommission = activeProperties.reduce((sum, p) => {
    const price = parsePrice(p.price);
    const rate = p.commissionRate || 3;
    return sum + (price * rate / 100);
  }, 0);
  const earnedCommission = soldProperties.reduce((sum, p) => {
    const price = parsePrice(p.price);
    const rate = p.commissionRate || 3;
    return sum + (price * rate / 100);
  }, 0);

  return {
    activeListings: activeProperties.length,
    activePortfolioValue,
    soldProperties: soldProperties.length,
    soldValue,
    rentedProperties: rentedProperties.length,
    potentialCommission,
    earnedCommission,
  };
}

// ============================================
// AVERAGE DAYS ON MARKET
// ============================================
export async function getDaysOnMarket() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // Get sold/rented properties to calculate actual DOM
  const closedProperties = await prisma.property.findMany({
    where: { 
      userId, 
      status: { in: [Status.SOLD, Status.RENTED] },
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  // Get active properties for current DOM
  const activeProperties = await prisma.property.findMany({
    where: { 
      userId, 
      status: Status.ACTIVE,
    },
    select: {
      createdAt: true,
    },
  });

  const now = new Date();
  
  // Average DOM for closed deals
  const closedDoms = closedProperties.map(p => 
    Math.ceil((p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgClosedDom = closedDoms.length > 0 
    ? Math.round(closedDoms.reduce((a, b) => a + b, 0) / closedDoms.length)
    : 0;

  // Average DOM for active listings
  const activeDoms = activeProperties.map(p => 
    Math.ceil((now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgActiveDom = activeDoms.length > 0 
    ? Math.round(activeDoms.reduce((a, b) => a + b, 0) / activeDoms.length)
    : 0;

  // Listings by age bracket
  const under30 = activeDoms.filter(d => d <= 30).length;
  const under60 = activeDoms.filter(d => d > 30 && d <= 60).length;
  const under90 = activeDoms.filter(d => d > 60 && d <= 90).length;
  const over90 = activeDoms.filter(d => d > 90).length;

  return {
    avgClosedDom,
    avgActiveDom,
    distribution: [
      { label: "0-30 days", count: under30 },
      { label: "31-60 days", count: under60 },
      { label: "61-90 days", count: under90 },
      { label: "90+ days", count: over90 },
    ],
  };
}

// ============================================
// PERIOD COMPARISON
// ============================================
export async function getPeriodComparison(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  
  // Current period
  const now = new Date();
  const currentEnd = dateRange?.to || now;
  const currentStart = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Previous period (same duration, before current)
  const duration = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  const [currentViews, previousViews, currentInquiries, previousInquiries] = await Promise.all([
    prisma.propertyView.count({
      where: { 
        property: { userId },
        viewedAt: { gte: currentStart, lte: currentEnd },
      },
    }),
    prisma.propertyView.count({
      where: { 
        property: { userId },
        viewedAt: { gte: previousStart, lte: previousEnd },
      },
    }),
    prisma.viewingRequest.count({
      where: { 
        property: { userId },
        createdAt: { gte: currentStart, lte: currentEnd },
      },
    }),
    prisma.viewingRequest.count({
      where: { 
        property: { userId },
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    }),
  ]);

  const viewsChange = previousViews > 0 
    ? Math.round((currentViews - previousViews) / previousViews * 100) 
    : currentViews > 0 ? 100 : 0;
  
  const inquiriesChange = previousInquiries > 0 
    ? Math.round((currentInquiries - previousInquiries) / previousInquiries * 100) 
    : currentInquiries > 0 ? 100 : 0;

  return {
    current: {
      views: currentViews,
      inquiries: currentInquiries,
      period: `${currentStart.toLocaleDateString()} - ${currentEnd.toLocaleDateString()}`,
    },
    previous: {
      views: previousViews,
      inquiries: previousInquiries,
      period: `${previousStart.toLocaleDateString()} - ${previousEnd.toLocaleDateString()}`,
    },
    changes: {
      views: viewsChange,
      inquiries: inquiriesChange,
    },
  };
}

// ============================================
// DEVICE & REFERRER ANALYTICS
// ============================================
export async function getTrafficSources(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const whereClause: { property: { userId: string }; viewedAt?: { gte?: Date; lte?: Date } } = {
    property: { userId },
  };

  if (dateRange?.from || dateRange?.to) {
    whereClause.viewedAt = {};
    if (dateRange.from) whereClause.viewedAt.gte = dateRange.from;
    if (dateRange.to) whereClause.viewedAt.lte = dateRange.to;
  }

  const views = await prisma.propertyView.findMany({
    where: whereClause,
    select: {
      userAgent: true,
      referrer: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
    },
  });

  // Parse device from user agent
  const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0, Other: 0 };
  const referrerCounts: Record<string, number> = {};

  views.forEach(view => {
    // Device detection
    const ua = (view.userAgent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceCounts.Mobile++;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceCounts.Tablet++;
    } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
      deviceCounts.Desktop++;
    } else {
      deviceCounts.Other++;
    }

    // Referrer parsing
    if (view.referrer) {
      try {
        const url = new URL(view.referrer);
        const domain = url.hostname.replace('www.', '');
        referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
      } catch {
        referrerCounts['Direct'] = (referrerCounts['Direct'] || 0) + 1;
      }
    } else {
      referrerCounts['Direct'] = (referrerCounts['Direct'] || 0) + 1;
    }
  });

  // Sort referrers by count and take top 5
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  return {
    devices: [
      { name: "Desktop", value: deviceCounts.Desktop, color: "#3b82f6" },
      { name: "Mobile", value: deviceCounts.Mobile, color: "#22c55e" },
      { name: "Tablet", value: deviceCounts.Tablet, color: "#f59e0b" },
    ].filter(d => d.value > 0),
    referrers: topReferrers,
  };
}

// ============================================
// UTM CAMPAIGN ANALYTICS
// ============================================
export async function getUtmAnalytics(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const whereClause: { 
    property: { userId: string }; 
    viewedAt?: { gte?: Date; lte?: Date };
    utmSource?: { not: null };
  } = {
    property: { userId },
  };

  if (dateRange?.from || dateRange?.to) {
    whereClause.viewedAt = {};
    if (dateRange.from) whereClause.viewedAt.gte = dateRange.from;
    if (dateRange.to) whereClause.viewedAt.lte = dateRange.to;
  }

  // Get all views with UTM data
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
  
  // Count source + medium combinations
  const sourceMediaCombos: Record<string, number> = {};

  views.forEach(view => {
    if (view.utmSource) {
      sourceCounts[view.utmSource] = (sourceCounts[view.utmSource] || 0) + 1;
      
      if (view.utmMedium) {
        const combo = `${view.utmSource} / ${view.utmMedium}`;
        sourceMediaCombos[combo] = (sourceMediaCombos[combo] || 0) + 1;
      }
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
    .map(([source, count]) => ({ source, count }));

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

  // Count views with vs without UTM tracking
  const trackedViews = views.filter(v => v.utmSource).length;
  const untrackedViews = views.length - trackedViews;

  // Icons for common sources
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
  };

  return {
    summary: {
      trackedViews,
      untrackedViews,
      trackingRate: views.length > 0 ? Math.round(trackedViews / views.length * 100) : 0,
    },
    sources: topSources.map(s => ({
      ...s,
      icon: sourceIcons[s.source] || "🔗",
    })),
    mediums: topMediums,
    campaigns: topCampaigns,
    sourceMediums: topSourceMediums,
  };
}

// ============================================
// PEAK TRAFFIC HOURS
// ============================================
export async function getPeakTrafficHours(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const whereClause: { property: { userId: string }; viewedAt?: { gte?: Date; lte?: Date } } = {
    property: { userId },
  };

  if (dateRange?.from || dateRange?.to) {
    whereClause.viewedAt = {};
    if (dateRange.from) whereClause.viewedAt.gte = dateRange.from;
    if (dateRange.to) whereClause.viewedAt.lte = dateRange.to;
  }

  const views = await prisma.propertyView.findMany({
    where: whereClause,
    select: {
      viewedAt: true,
    },
  });

  // Count views by hour
  const hourCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourCounts[i] = 0;

  // Count views by day of week
  const dayCounts: Record<number, number> = {};
  for (let i = 0; i < 7; i++) dayCounts[i] = 0;

  views.forEach(view => {
    const hour = view.viewedAt.getHours();
    const day = view.viewedAt.getDay();
    hourCounts[hour]++;
    dayCounts[day]++;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return {
    byHour: Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      views: count,
    })),
    byDay: Object.entries(dayCounts).map(([day, count]) => ({
      day: dayNames[parseInt(day)],
      views: count,
    })),
    peakHour: Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '12',
    peakDay: dayNames[parseInt(Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '0')],
  };
}

// ============================================
// AI-GENERATED INSIGHTS
// ============================================
export async function getAutoInsights(dateRange?: DateRangeFilter) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const insights: { type: 'success' | 'warning' | 'info'; title: string; description: string }[] = [];

  // Get data for insights
  const [comparison, daysOnMarket, conversionFunnel] = await Promise.all([
    getPeriodComparison(dateRange),
    getDaysOnMarket(),
    getConversionFunnel(dateRange),
  ]);

  // Insight: Views trending
  if (comparison.changes.views > 20) {
    insights.push({
      type: 'success',
      title: `Views up ${comparison.changes.views}%`,
      description: 'Your listings are getting more attention than last period!',
    });
  } else if (comparison.changes.views < -20) {
    insights.push({
      type: 'warning',
      title: `Views down ${Math.abs(comparison.changes.views)}%`,
      description: 'Consider updating listing photos or descriptions to boost visibility.',
    });
  }

  // Insight: Inquiries trending
  if (comparison.changes.inquiries > 30) {
    insights.push({
      type: 'success',
      title: `Inquiries surging`,
      description: `${comparison.changes.inquiries}% more inquiries than last period. Great momentum!`,
    });
  }

  // Insight: Stale listings
  if (daysOnMarket.distribution[3].count > 0) {
    insights.push({
      type: 'warning',
      title: `${daysOnMarket.distribution[3].count} listings over 90 days`,
      description: 'Consider price adjustments or refreshing these listings.',
    });
  }

  // Insight: Low conversion
  if (conversionFunnel.rates.viewToInquiry < 1) {
    insights.push({
      type: 'info',
      title: 'Low view-to-inquiry rate',
      description: 'Improve listing quality, add more photos, or highlight key features.',
    });
  }

  // Insight: High conversion
  if (conversionFunnel.rates.viewToInquiry > 5) {
    insights.push({
      type: 'success',
      title: 'Excellent conversion rate',
      description: `${conversionFunnel.rates.viewToInquiry}% of viewers are inquiring - your listings are compelling!`,
    });
  }

  return insights.slice(0, 4); // Max 4 insights
}

// Get comprehensive dashboard analytics (with optional date range filter)
export async function getDashboardAnalytics(dateRange?: DateRangeFilter) {
  const [
    propertiesOverTime,
    statusDistribution,
    typeDistribution,
    leadsOverTime,
    topProperties,
    mostViewedProperties,
    viewsOverTime,
    viewsStats,
    viewsByCountry,
    conversionFunnel,
    revenueMetrics,
    daysOnMarket,
    periodComparison,
    trafficSources,
    peakTraffic,
    insights,
    utmAnalytics,
  ] = await Promise.all([
    getPropertiesOverTime(),
    getPropertyStatusDistribution(),
    getPropertyTypeDistribution(),
    getLeadsOverTime(),
    getTopPerformingProperties(),
    getMostViewedProperties(),
    getViewsOverTime(dateRange),
    getViewsStats(dateRange),
    getViewsByCountry(dateRange),
    getConversionFunnel(dateRange),
    getRevenueMetrics(),
    getDaysOnMarket(),
    getPeriodComparison(dateRange),
    getTrafficSources(dateRange),
    getPeakTrafficHours(dateRange),
    getAutoInsights(dateRange),
    getUtmAnalytics(dateRange),
  ]);

  return {
    propertiesOverTime,
    statusDistribution,
    typeDistribution,
    leadsOverTime,
    topProperties,
    mostViewedProperties,
    viewsOverTime,
    viewsStats,
    viewsByCountry,
    // New high-end features
    conversionFunnel,
    revenueMetrics,
    daysOnMarket,
    periodComparison,
    trafficSources,
    peakTraffic,
    insights,
    utmAnalytics,
  };
}


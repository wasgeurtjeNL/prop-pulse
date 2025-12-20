"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Status, PropertyType } from "@/lib/generated/prisma/client";

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

// Get views over time (last 30 days)
export async function getViewsOverTime() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const views = await prisma.propertyView.findMany({
    where: {
      property: {
        userId,
      },
      viewedAt: { gte: thirtyDaysAgo },
    },
    select: {
      viewedAt: true,
    },
  });

  // Group by day
  const dailyData: Record<string, number> = {};
  
  // Initialize last 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
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
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      views: count,
    };
  });
}

// Get total views stats
export async function getViewsStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  
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

// Get views by country
export async function getViewsByCountry() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const views = await prisma.propertyView.groupBy({
    by: ["country"],
    where: {
      property: { userId },
      country: { not: null },
    },
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

// Get comprehensive dashboard analytics
export async function getDashboardAnalytics() {
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
  ] = await Promise.all([
    getPropertiesOverTime(),
    getPropertyStatusDistribution(),
    getPropertyTypeDistribution(),
    getLeadsOverTime(),
    getTopPerformingProperties(),
    getMostViewedProperties(),
    getViewsOverTime(),
    getViewsStats(),
    getViewsByCountry(),
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
  };
}


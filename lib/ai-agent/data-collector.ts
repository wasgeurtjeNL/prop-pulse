// ============================================
// AI AGENT DATA COLLECTOR
// Collects all data sources for AI analysis
// ============================================

import prisma from '@/lib/prisma';
import type { DataSnapshot } from './types';

export class AIDataCollector {
  /**
   * Collect a complete snapshot of all relevant data for AI analysis
   */
  async collectSnapshot(daysBack: number = 30): Promise<DataSnapshot> {
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - daysBack);

    const [
      trafficData,
      leadsData,
      propertiesData,
      contentData,
      systemHealthData,
      seoData,
    ] = await Promise.all([
      this.collectTrafficData(periodStart, now),
      this.collectLeadsData(periodStart, now),
      this.collectPropertiesData(periodStart, now),
      this.collectContentData(periodStart, now),
      this.collectSystemHealthData(),
      this.collectSEOData(periodStart, now),
    ]);

    return {
      traffic: trafficData,
      leads: leadsData,
      properties: propertiesData,
      content: contentData,
      systemHealth: systemHealthData,
      seo: seoData,
      collectedAt: now,
      periodStart,
      periodEnd: now,
    };
  }

  /**
   * Collect traffic and view data
   */
  private async collectTrafficData(start: Date, end: Date) {
    // Get total views
    const totalViews = await prisma.propertyView.count({
      where: {
        viewedAt: { gte: start, lte: end },
      },
    });

    // Get unique visitors (by session/ip)
    const uniqueVisitorsResult = await prisma.propertyView.groupBy({
      by: ['sessionId'],
      where: {
        viewedAt: { gte: start, lte: end },
        sessionId: { not: null },
      },
    });
    const uniqueVisitors = uniqueVisitorsResult.length;

    // Get views by country
    const viewsByCountryRaw = await prisma.propertyView.groupBy({
      by: ['country'],
      where: {
        viewedAt: { gte: start, lte: end },
        country: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const viewsByCountry = viewsByCountryRaw.map((v: { country: string | null; _count: { id: number } }) => ({
      country: v.country || 'Unknown',
      views: v._count.id,
    }));

    // Get top pages (properties with most views)
    const topPagesRaw = await prisma.propertyView.groupBy({
      by: ['propertyId'],
      where: {
        viewedAt: { gte: start, lte: end },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const topPages = await Promise.all(
      topPagesRaw.map(async (p: { propertyId: string; _count: { id: number } }) => {
        const property = await prisma.property.findUnique({
          where: { id: p.propertyId },
          select: { slug: true },
        });
        return {
          path: property ? `/properties/${property.slug}` : `/properties/${p.propertyId}`,
          views: p._count.id,
        };
      })
    );

    return {
      totalViews,
      uniqueVisitors,
      bounceRate: null, // Would need more tracking to calculate
      avgSessionDuration: null,
      viewsByCountry,
      topPages,
    };
  }

  /**
   * Collect leads and conversion data
   */
  private async collectLeadsData(start: Date, end: Date) {
    const [viewingRequests, investorLeads, rentalLeads] = await Promise.all([
      prisma.viewingRequest.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.investorLead.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.rentalLead.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    const totalInquiries = viewingRequests + investorLeads + rentalLeads;

    // Get views for conversion rate calculation
    const totalViews = await prisma.propertyView.count({
      where: { viewedAt: { gte: start, lte: end } },
    });

    const conversionRate = totalViews > 0 
      ? (totalInquiries / totalViews) * 100 
      : null;

    // Get leads by source
    const investorBySource = await prisma.investorLead.groupBy({
      by: ['source'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
    });

    const rentalBySource = await prisma.rentalLead.groupBy({
      by: ['source'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
    });

    // Combine sources
    const sourceMap = new Map<string, number>();
    investorBySource.forEach((s: { source: string | null; _count: { id: number } }) => {
      const source = s.source || 'unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + s._count.id);
    });
    rentalBySource.forEach((s: { source: string | null; _count: { id: number } }) => {
      const source = s.source || 'unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + s._count.id);
    });

    const leadsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    return {
      totalInquiries,
      viewingRequests,
      investorLeads,
      rentalLeads,
      conversionRate,
      leadsBySource,
    };
  }

  /**
   * Collect property performance data
   */
  private async collectPropertiesData(start: Date, end: Date) {
    const [total, active, newCount] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.property.count({ where: { createdAt: { gte: start } } }),
    ]);

    // Get average views per property
    const viewsPerProperty = await prisma.propertyView.groupBy({
      by: ['propertyId'],
      where: { viewedAt: { gte: start, lte: end } },
      _count: { id: true },
    });

    const avgViews = viewsPerProperty.length > 0
      ? viewsPerProperty.reduce((sum: number, p: { propertyId: string; _count: { id: number } }) => sum + p._count.id, 0) / viewsPerProperty.length
      : 0;

    // Get top viewed properties
    const topViewedRaw = await prisma.propertyView.groupBy({
      by: ['propertyId'],
      where: { viewedAt: { gte: start, lte: end } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topViewed = await Promise.all(
      topViewedRaw.map(async (p: { propertyId: string; _count: { id: number } }) => {
        const property = await prisma.property.findUnique({
          where: { id: p.propertyId },
          select: { title: true },
        });
        return {
          id: p.propertyId,
          title: property?.title || 'Unknown',
          views: p._count.id,
        };
      })
    );

    // Get low performing properties (views but no inquiries)
    const propertiesWithViews = await prisma.property.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            views: {
              where: { viewedAt: { gte: start, lte: end } },
            },
            viewingRequests: {
              where: { createdAt: { gte: start, lte: end } },
            },
          },
        },
      },
    });

    type PropertyWithCounts = { id: string; title: string; _count: { views: number; viewingRequests: number } };
    const lowPerforming = propertiesWithViews
      .filter((p: PropertyWithCounts) => p._count.views > 50 && p._count.viewingRequests === 0)
      .map((p: PropertyWithCounts) => ({
        id: p.id,
        title: p.title,
        views: p._count.views,
        conversionRate: 0,
      }))
      .slice(0, 10);

    return {
      total,
      active,
      new: newCount,
      avgViews: Math.round(avgViews * 100) / 100,
      topViewed,
      lowPerforming,
    };
  }

  /**
   * Collect content/blog performance data
   */
  private async collectContentData(start: Date, end: Date) {
    const [totalBlogs, publishedBlogs] = await Promise.all([
      prisma.blog.count(),
      prisma.blog.count({ where: { published: true } }),
    ]);

    // Get blogs with their performance
    // Note: This would ideally track blog views separately
    // For now, we'll return basic stats
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        createdAt: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });

    // Since we don't have blog-specific view tracking yet,
    // we'll mark this as an area for improvement
    type BlogItem = { id: string; title: string; createdAt: Date; publishedAt: Date | null };
    const topBlogs = blogs.slice(0, 5).map((b: BlogItem) => ({
      id: b.id,
      title: b.title,
      views: 0, // Would need blog view tracking
    }));

    const underperformingBlogs = blogs.slice(-5).map((b: BlogItem) => ({
      id: b.id,
      title: b.title,
      views: 0,
    }));

    return {
      totalBlogs,
      publishedBlogs,
      avgBlogViews: 0, // Would need tracking
      topBlogs,
      underperformingBlogs,
    };
  }

  /**
   * Collect system health data with specific property details
   */
  private async collectSystemHealthData() {
    // Get properties with missing images - WITH SPECIFIC DETAILS
    const propertiesNoImages = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        images: { none: {} },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        listingNumber: true,
        address: true,
      },
      take: 20,
    });

    // Get properties with missing location - WITH SPECIFIC DETAILS
    const propertiesNoLocation = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        latitude: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        listingNumber: true,
        address: true,
      },
      take: 20,
    });

    // Build error summary with details
    const errorsByType: Record<string, number> = {
      'missing_images': propertiesNoImages.length,
      'missing_location': propertiesNoLocation.length,
    };

    const errorCount = Object.values(errorsByType).reduce((a, b) => a + b, 0);

    return {
      errorCount,
      errorsByType,
      // NEW: Include specific property details
      propertiesWithIssues: {
        missingImages: propertiesNoImages.map((p: { id: string; title: string | null; slug: string; listingNumber: number | null; address: string | null }) => ({
          id: p.id,
          title: p.title || 'Untitled',
          slug: p.slug,
          listingNumber: p.listingNumber,
          address: p.address || 'No address',
          url: `/properties/${p.slug}`,
        })),
        missingLocation: propertiesNoLocation.map((p: { id: string; title: string | null; slug: string; listingNumber: number | null; address: string | null }) => ({
          id: p.id,
          title: p.title || 'Untitled',
          slug: p.slug,
          listingNumber: p.listingNumber,
          address: p.address || 'No address',
          url: `/properties/${p.slug}`,
        })),
      },
      slowPages: [],
      brokenLinks: [],
    };
  }

  /**
   * Collect SEO-related data
   */
  private async collectSEOData(start: Date, end: Date) {
    // Check for pages missing meta data
    const propertiesNoMeta = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { shortDescription: null },
          { shortDescription: '' },
        ],
      },
      select: { slug: true },
      take: 20,
    });

    const blogsNoMeta = await prisma.blog.findMany({
      where: {
        published: true,
        OR: [
          { metaDescription: null },
          { metaDescription: '' },
        ],
      },
      select: { slug: true },
      take: 20,
    });

    const missingMetaTags = [
      ...propertiesNoMeta.map((p: { slug: string }) => ({
        path: `/properties/${p.slug}`,
        missing: ['description'],
      })),
      ...blogsNoMeta.map((b: { slug: string }) => ({
        path: `/blogs/${b.slug}`,
        missing: ['metaDescription'],
      })),
    ];

    // Content gaps would be identified by comparing search console data
    // with existing content (requires external API integration)
    const contentGaps: Array<{ keyword: string; searchVolume: number }> = [];

    return {
      organicTraffic: null, // Would need Google Search Console API
      topKeywords: [], // Would need GSC API
      missingMetaTags,
      contentGaps,
    };
  }

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats(): Promise<{
    decisionsToday: number;
    opportunitiesFound: number;
    pendingApprovals: number;
    successRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [decisionsToday, pendingApprovals, executedDecisions, successfulDecisions] = await Promise.all([
      prisma.aIDecision.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.aIDecision.count({
        where: { status: 'PENDING' },
      }),
      prisma.aIDecision.count({
        where: { status: 'EXECUTED' },
      }),
      prisma.aIDecision.count({
        where: { status: 'EXECUTED', wasSuccessful: true },
      }),
    ]);

    const opportunitiesFound = await prisma.aIOpportunity.count({
      where: { createdAt: { gte: today } },
    });

    const successRate = executedDecisions > 0
      ? (successfulDecisions / executedDecisions) * 100
      : 100;

    return {
      decisionsToday,
      opportunitiesFound,
      pendingApprovals,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Store a data snapshot in the database
   */
  async storeSnapshot(snapshot: DataSnapshot, type: 'daily' | 'weekly' | 'monthly' | 'triggered' = 'triggered') {
    return prisma.aIDataSnapshot.create({
      data: {
        snapshotType: type,
        totalViews: snapshot.traffic.totalViews,
        uniqueVisitors: snapshot.traffic.uniqueVisitors,
        bounceRate: snapshot.traffic.bounceRate,
        avgSessionDuration: snapshot.traffic.avgSessionDuration,
        totalInquiries: snapshot.leads.totalInquiries,
        viewingRequests: snapshot.leads.viewingRequests,
        investorLeads: snapshot.leads.investorLeads,
        rentalLeads: snapshot.leads.rentalLeads,
        conversionRate: snapshot.leads.conversionRate,
        totalProperties: snapshot.properties.total,
        activeListings: snapshot.properties.active,
        newListings: snapshot.properties.new,
        avgPropertyViews: snapshot.properties.avgViews,
        totalBlogs: snapshot.content.totalBlogs,
        publishedBlogs: snapshot.content.publishedBlogs,
        avgBlogViews: snapshot.content.avgBlogViews,
        organicTraffic: snapshot.seo.organicTraffic,
        topKeywords: snapshot.seo.topKeywords,
        errorCount: snapshot.systemHealth.errorCount,
        slowPages: snapshot.systemHealth.slowPages,
        brokenLinks: snapshot.systemHealth.brokenLinks.length,
        rawData: snapshot as unknown as Record<string, unknown>,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
      },
    });
  }

  /**
   * Get historical snapshots for trend analysis
   */
  async getHistoricalSnapshots(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.aIDataSnapshot.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });
  }
}

// Singleton instance
export const dataCollector = new AIDataCollector();


/**
 * POI Management Dashboard Page
 * 
 * Admin interface for managing Points of Interest:
 * - View POI statistics
 * - Trigger POI sync from OpenStreetMap
 * - Batch analyze properties
 * - View sync job history
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PoiDashboard from './poi-dashboard';

export const metadata: Metadata = {
  title: 'POI Management | Dashboard',
  description: 'Manage Points of Interest data for property listings',
};

async function getPoiStats() {
  const [
    totalPois,
    categoryStats,
    lastSync,
    propertiesWithCoords,
    propertiesWithoutCoords,
    recentJobs,
  ] = await Promise.all([
    prisma.poi.count({ where: { isActive: true } }),
    prisma.poi.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { isActive: true },
    }),
    prisma.poiSyncJob.findFirst({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.count({
      where: { latitude: { not: null }, longitude: { not: null } },
    }),
    prisma.property.count({
      where: { OR: [{ latitude: null }, { longitude: null }] },
    }),
    prisma.poiSyncJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const byCategory: Record<string, number> = {};
  for (const stat of categoryStats) {
    byCategory[stat.category] = stat._count.category;
  }

  return {
    totalPois,
    byCategory,
    lastSync,
    propertiesWithCoords,
    propertiesWithoutCoords,
    recentJobs,
  };
}

export default async function PoiManagementPage() {
  const stats = await getPoiStats();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">POI Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage Points of Interest data for enhanced property listings
        </p>
      </div>

      <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-lg" />}>
        <PoiDashboard initialStats={stats} />
      </Suspense>
    </div>
  );
}


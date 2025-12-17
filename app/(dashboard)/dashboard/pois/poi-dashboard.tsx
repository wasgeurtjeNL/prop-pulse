'use client';

/**
 * POI Dashboard Component
 * 
 * Interactive dashboard for POI management with:
 * - Statistics overview
 * - Sync controls
 * - Batch analysis tools
 * - Job history
 */

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { triggerPoiSync, triggerBatchAnalysis } from '@/lib/actions/poi.actions';
import { formatDistanceToNow } from 'date-fns';

interface PoiSyncJob {
  id: string;
  jobType: string;
  status: string;
  poisFetched: number;
  poisCreated: number;
  poisUpdated: number;
  poisSkipped: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

interface PoiDashboardProps {
  initialStats: {
    totalPois: number;
    byCategory: Record<string, number>;
    lastSync: PoiSyncJob | null;
    propertiesWithCoords: number;
    propertiesWithoutCoords: number;
    recentJobs: PoiSyncJob[];
  };
}

// Category display names and icons
const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  BEACH: { label: 'Beaches', icon: 'ph:waves', color: 'bg-cyan-100 text-cyan-700' },
  PARK: { label: 'Parks', icon: 'ph:tree', color: 'bg-green-100 text-green-700' },
  VIEWPOINT: { label: 'Viewpoints', icon: 'ph:binoculars', color: 'bg-purple-100 text-purple-700' },
  INTERNATIONAL_SCHOOL: { label: 'Int. Schools', icon: 'ph:graduation-cap', color: 'bg-blue-100 text-blue-700' },
  LOCAL_SCHOOL: { label: 'Local Schools', icon: 'ph:student', color: 'bg-blue-100 text-blue-700' },
  HOSPITAL: { label: 'Hospitals', icon: 'ph:first-aid-kit', color: 'bg-red-100 text-red-700' },
  CLINIC: { label: 'Clinics', icon: 'ph:stethoscope', color: 'bg-red-100 text-red-700' },
  SHOPPING_MALL: { label: 'Malls', icon: 'ph:storefront', color: 'bg-pink-100 text-pink-700' },
  SUPERMARKET: { label: 'Supermarkets', icon: 'ph:shopping-cart', color: 'bg-orange-100 text-orange-700' },
  GYM: { label: 'Gyms', icon: 'ph:barbell', color: 'bg-violet-100 text-violet-700' },
  RESTAURANT: { label: 'Restaurants', icon: 'ph:fork-knife', color: 'bg-amber-100 text-amber-700' },
  CAFE: { label: 'Cafés', icon: 'ph:coffee', color: 'bg-amber-100 text-amber-700' },
  AIRPORT: { label: 'Airport', icon: 'ph:airplane-takeoff', color: 'bg-sky-100 text-sky-700' },
};

export default function PoiDashboard({ initialStats }: PoiDashboardProps) {
  const [stats, setStats] = useState(initialStats);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('Starting POI sync from OpenStreetMap...');
    
    try {
      const result = await triggerPoiSync();
      
      if (result.success && result.result) {
        toast.success(
          `Sync complete! Created ${result.result.created}, updated ${result.result.updated} POIs`
        );
        // Refresh the page to show updated stats
        window.location.reload();
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (error) {
      toast.error('Failed to sync POIs');
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBatchAnalysis = async (forceRefresh: boolean = false) => {
    setIsAnalyzing(true);
    toast.info('Geocoding and analyzing properties... This may take a moment.');
    
    try {
      const result = await triggerBatchAnalysis({ forceRefresh, limit: 50 });
      
      if (result.success && result.result) {
        const { geocoded, analyzed, failed } = result.result;
        toast.success(
          `Complete! Geocoded ${geocoded}, analyzed ${analyzed} properties${failed > 0 ? `, ${failed} failed` : ''}`
        );
        window.location.reload();
      } else {
        toast.error(result.error || 'Analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze properties');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      COMPLETED: { variant: 'default', label: 'Completed' },
      RUNNING: { variant: 'secondary', label: 'Running' },
      PENDING: { variant: 'outline', label: 'Pending' },
      FAILED: { variant: 'destructive', label: 'Failed' },
    };
    const config = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total POIs</CardDescription>
            <CardTitle className="text-3xl">{stats.totalPois.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active points of interest in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Properties with Coordinates</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.propertiesWithCoords}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ready for POI analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Properties Missing Coordinates</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {stats.propertiesWithoutCoords}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Need geocoding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Sync</CardDescription>
            <CardTitle className="text-lg">
              {stats.lastSync?.completedAt
                ? formatDistanceToNow(new Date(stats.lastSync.completedAt), { addSuffix: true })
                : 'Never'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lastSync && (
              <p className="text-xs text-muted-foreground">
                {stats.lastSync.poisCreated} created, {stats.lastSync.poisUpdated} updated
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage POI data and property analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <Icon icon="ph:spinner" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon icon="ph:arrows-clockwise" className="w-4 h-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync POIs from OpenStreetMap'}
          </Button>

          <Button 
            onClick={() => handleBatchAnalysis(false)} 
            disabled={isAnalyzing}
            variant="secondary"
            className="gap-2"
          >
            {isAnalyzing ? (
              <Icon icon="ph:spinner" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon icon="ph:chart-bar" className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Properties (Pending)'}
          </Button>

          <Button 
            onClick={() => handleBatchAnalysis(true)} 
            disabled={isAnalyzing}
            variant="outline"
            className="gap-2"
          >
            <Icon icon="ph:arrows-counter-clockwise" className="w-4 h-4" />
            Force Re-analyze All
          </Button>
        </CardContent>
      </Card>

      {/* POIs by Category */}
      <Card>
        <CardHeader>
          <CardTitle>POIs by Category</CardTitle>
          <CardDescription>
            Distribution of points of interest across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => {
                const info = CATEGORY_INFO[category] || {
                  label: category,
                  icon: 'ph:map-pin',
                  color: 'bg-gray-100 text-gray-700',
                };
                return (
                  <div
                    key={category}
                    className={`flex items-center gap-2 p-3 rounded-lg ${info.color}`}
                  >
                    <Icon icon={info.icon} className="w-5 h-5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{info.label}</p>
                      <p className="text-xs opacity-75">{count}</p>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {Object.keys(stats.byCategory).length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No POIs in database. Click "Sync POIs" to fetch from OpenStreetMap.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Sync Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Jobs</CardTitle>
          <CardDescription>
            History of POI synchronization jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentJobs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusBadge(job.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {job.jobType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {job.status === 'COMPLETED' && (
                      <p className="text-green-600">
                        +{job.poisCreated} / ↻{job.poisUpdated}
                      </p>
                    )}
                    {job.status === 'FAILED' && (
                      <p className="text-red-600 text-xs truncate max-w-[200px]">
                        {job.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No sync jobs yet. Click "Sync POIs" to start.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


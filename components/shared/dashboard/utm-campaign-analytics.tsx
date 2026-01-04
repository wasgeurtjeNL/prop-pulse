"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Eye, Users, ArrowRight, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface UTMAnalyticsData {
  summary: {
    trackedViews: number;
    untrackedViews: number;
    trackingRate: number;
  };
  sources: Array<{
    source: string;
    count: number;
    icon: string;
  }>;
  mediums: Array<{
    medium: string;
    count: number;
  }>;
  campaigns: Array<{
    campaign: string;
    count: number;
  }>;
  sourceMediums: Array<{
    combo: string;
    count: number;
  }>;
}

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

export function UtmCampaignAnalytics() {
  const [data, setData] = useState<UTMAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/utm');
      if (!response.ok) {
        throw new Error('Failed to fetch UTM analytics');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>Unable to load analytics data</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchAnalytics}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.trackedViews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
          <CardDescription>
            Track which marketing channels drive the most traffic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No campaign data yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate tracking links above and share them on your marketing channels.
              <br />
              Analytics will appear here once visitors start clicking your links.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Performance
            </CardTitle>
            <CardDescription>
              Traffic from your marketing channels (last 30 days)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/analytics">
              View Full Analytics
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Tracked Views</span>
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary.trackedViews.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-950/20 border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Untracked</span>
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary.untrackedViews.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Tracking Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary.trackingRate}%</p>
          </div>
        </div>

        {/* Top Sources */}
        <div>
          <h4 className="text-sm font-medium mb-3">Top Traffic Sources</h4>
          {data.sources.length > 0 ? (
            <div className="space-y-2">
              {data.sources.slice(0, 5).map((source, index) => {
                const maxCount = data.sources[0]?.count || 1;
                const percentage = Math.round((source.count / maxCount) * 100);
                
                return (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{sourceIcons[source.source] || '🔗'}</span>
                        <span className="capitalize">{source.source}</span>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">Top</Badge>
                        )}
                      </span>
                      <span className="font-medium">{source.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No source data available</p>
          )}
        </div>

        {/* Top Campaigns */}
        {data.campaigns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Active Campaigns</h4>
            <div className="flex flex-wrap gap-2">
              {data.campaigns.slice(0, 5).map((campaign) => (
                <Badge key={campaign.campaign} variant="outline" className="text-sm py-1 px-2">
                  {campaign.campaign}
                  <span className="ml-2 text-muted-foreground">{campaign.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Source/Medium Combos */}
        {data.sourceMediums.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Top Source/Medium Combinations</h4>
            <div className="space-y-1">
              {data.sourceMediums.slice(0, 4).map((combo) => (
                <div key={combo.combo} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground">{combo.combo}</span>
                  <Badge variant="secondary">{combo.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


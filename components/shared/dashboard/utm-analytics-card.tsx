"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link2, TrendingUp, Target } from "lucide-react";

interface UtmSource {
  source: string;
  count: number;
  icon?: string;
}

interface UtmMedium {
  medium: string;
  count: number;
}

interface UtmCampaign {
  campaign: string;
  count: number;
}

interface UtmAnalyticsData {
  summary: {
    trackedViews: number;
    untrackedViews: number;
    trackingRate: number;
  };
  sources: UtmSource[];
  mediums: UtmMedium[];
  campaigns: UtmCampaign[];
  sourceMediums: { combo: string; count: number }[];
}

interface UtmAnalyticsCardProps {
  data?: UtmAnalyticsData;
}

export function UtmAnalyticsCard({ data }: UtmAnalyticsCardProps) {
  if (!data || data.summary.trackedViews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Campaign Tracking
          </CardTitle>
          <CardDescription>
            No campaign data yet. Use tracking links from Marketing Tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Start using UTM tracking links to see where your traffic comes from.
            </p>
            <a 
              href="/dashboard/marketing" 
              className="text-primary text-sm hover:underline mt-2 inline-block"
            >
              → Go to Marketing Tools
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxSourceCount = Math.max(...data.sources.map(s => s.count), 1);
  const maxCampaignCount = Math.max(...data.campaigns.map(c => c.count), 1);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Campaign Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{data.summary.trackedViews}</p>
              <p className="text-xs text-muted-foreground">Tracked Views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{data.summary.untrackedViews}</p>
              <p className="text-xs text-muted-foreground">Organic/Direct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{data.summary.trackingRate}%</p>
              <p className="text-xs text-muted-foreground">Tracking Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources */}
      {data.sources.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.sources.map((source) => (
              <div key={source.source} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{source.icon || "🔗"}</span>
                    <span className="font-medium capitalize">{source.source}</span>
                  </span>
                  <Badge variant="secondary">{source.count}</Badge>
                </div>
                <Progress 
                  value={(source.count / maxSourceCount) * 100} 
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Campaigns */}
      {data.campaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.campaign} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs truncate max-w-[200px]">
                    {campaign.campaign}
                  </span>
                  <Badge variant="outline">{campaign.count} views</Badge>
                </div>
                <Progress 
                  value={(campaign.count / maxCampaignCount) * 100} 
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Source/Medium Combinations */}
      {data.sourceMediums.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Source / Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.sourceMediums.slice(0, 5).map((sm) => (
                <div key={sm.combo} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{sm.combo}</span>
                  <Badge variant="secondary">{sm.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Target,
  TrendingUp,
  Eye,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  ArrowUpRight,
  Filter,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  direct: "🔗",
  organic: "🌿",
};

// Medium colors
const mediumColors: Record<string, string> = {
  social: "#3b82f6",
  marketplace: "#8b5cf6",
  paid: "#ef4444",
  email: "#22c55e",
  organic: "#84cc16",
  referral: "#f59e0b",
  direct: "#6b7280",
  ads: "#ec4899",
  cpc: "#f97316",
};

const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

interface UTMData {
  summary: {
    trackedViews: number;
    untrackedViews: number;
    trackingRate: number;
  };
  sources: Array<{ source: string; count: number; icon: string }>;
  mediums: Array<{ medium: string; count: number }>;
  campaigns: Array<{ campaign: string; count: number }>;
  sourceMediums: Array<{ combo: string; count: number }>;
}

interface TrafficData {
  devices: Array<{ name: string; value: number; color: string }>;
  referrers: Array<{ source: string; count: number; percentage: number }>;
  countries: Array<{ country: string; views: number }>;
}

interface CombinedData {
  utm: UTMData | null;
  traffic: TrafficData | null;
}

export function TrafficSourcesAnalytics() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property") || undefined;
  const fromDate = searchParams.get("from") || undefined;
  const toDate = searchParams.get("to") || undefined;
  
  const [data, setData] = useState<CombinedData>({ utm: null, traffic: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (propertyId && propertyId !== "all") queryParams.set("propertyId", propertyId);
      if (fromDate) queryParams.set("from", fromDate);
      if (toDate) queryParams.set("to", toDate);
      const paramString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      
      const [utmRes, trafficRes] = await Promise.all([
        fetch(`/api/analytics/utm${paramString}`),
        fetch(`/api/analytics/traffic-sources${paramString}`),
      ]);

      const utmData = utmRes.ok ? await utmRes.json() : null;
      const trafficData = trafficRes.ok ? await trafficRes.json() : null;

      setData({ utm: utmData, traffic: trafficData });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [propertyId, fromDate, toDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { utm, traffic } = data;
  const totalViews = (utm?.summary.trackedViews || 0) + (utm?.summary.untrackedViews || 0);
  const maxSourceCount = Math.max(...(utm?.sources.map((s) => s.count) || [1]), 1);
  const maxMediumCount = Math.max(...(utm?.mediums.map((m) => m.count) || [1]), 1);

  // Prepare data for charts
  const sourceChartData = utm?.sources.slice(0, 8).map((s) => ({
    name: s.source,
    views: s.count,
    icon: s.icon,
  })) || [];

  const mediumChartData = utm?.mediums.map((m, i) => ({
    name: m.medium,
    value: m.count,
    color: mediumColors[m.medium] || CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All property views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              Tracked Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {utm?.summary.trackedViews.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Via UTM links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              Direct/Organic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {utm?.summary.untrackedViews.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Untracked visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Tracking Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {utm?.summary.trackingRate || 0}%
            </div>
            <Progress value={utm?.summary.trackingRate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sources Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Traffic by Source
            </CardTitle>
            <CardDescription>Where your visitors are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceChartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), "Views"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="views" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No tracked traffic yet</p>
                  <p className="text-xs mt-1">Use UTM links to track sources</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medium Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Traffic by Medium
            </CardTitle>
            <CardDescription>Channel types breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {mediumChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mediumChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {mediumChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), "Views"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No medium data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Sources List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Sources</CardTitle>
            <CardDescription>Traffic sources ranked by views</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {utm?.sources && utm.sources.length > 0 ? (
                <div className="space-y-3">
                  {utm.sources.map((source, i) => (
                    <div key={source.source} className="flex items-center gap-3">
                      <span className="text-xl">{source.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate capitalize">
                            {source.source}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {source.count.toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={(source.count / maxSourceCount) * 100} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No source data
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Campaigns</CardTitle>
            <CardDescription>Your marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {utm?.campaigns && utm.campaigns.length > 0 ? (
                <div className="space-y-2">
                  {utm.campaigns.map((campaign, i) => (
                    <div
                      key={campaign.campaign}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge 
                          variant="outline" 
                          className="shrink-0"
                          style={{ 
                            borderColor: CHART_COLORS[i % CHART_COLORS.length],
                            color: CHART_COLORS[i % CHART_COLORS.length]
                          }}
                        >
                          #{i + 1}
                        </Badge>
                        <span className="text-sm truncate">{campaign.campaign}</span>
                      </div>
                      <Badge variant="secondary">{campaign.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <p>No campaigns yet</p>
                    <p className="text-xs mt-1">Create UTM links with campaigns</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Source/Medium Combos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Source / Medium</CardTitle>
            <CardDescription>Combined channel breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {utm?.sourceMediums && utm.sourceMediums.length > 0 ? (
                <div className="space-y-2">
                  {utm.sourceMediums.map((sm, i) => (
                    <div
                      key={sm.combo}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <span className="text-sm truncate">{sm.combo}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{sm.count}</Badge>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No data yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Device & Geographic Data */}
      {traffic && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {traffic.devices && traffic.devices.length > 0 ? (
                <div className="space-y-4">
                  {traffic.devices.map((device) => (
                    <div key={device.name} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {device.name === "Mobile" && <Smartphone className="h-5 w-5" />}
                        {device.name === "Desktop" && <Monitor className="h-5 w-5" />}
                        {device.name === "Tablet" && <Tablet className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{device.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {device.value}%
                          </span>
                        </div>
                        <Progress value={device.value} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  No device data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {traffic.countries && traffic.countries.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {traffic.countries.slice(0, 10).map((country, i) => (
                      <div
                        key={country.country}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">#{i + 1}</span>
                          <span className="text-sm">{country.country || "Unknown"}</span>
                        </div>
                        <Badge variant="secondary">{country.views}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  No country data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
}


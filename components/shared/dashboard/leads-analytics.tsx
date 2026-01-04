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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  UserCheck,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Home,
  DollarSign,
  Key,
  RefreshCw,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

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

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PENDING: { bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", icon: <Hourglass className="h-3 w-3" /> },
  CONFIRMED: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", icon: <CheckCircle className="h-3 w-3" /> },
  COMPLETED: { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", icon: <CheckCircle className="h-3 w-3" /> },
  CANCELLED: { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", icon: <XCircle className="h-3 w-3" /> },
  NEW: { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", icon: <AlertCircle className="h-3 w-3" /> },
  CONTACTED: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", icon: <Users className="h-3 w-3" /> },
  QUALIFIED: { bg: "bg-teal-100 dark:bg-teal-900/20", text: "text-teal-700 dark:text-teal-400", icon: <Target className="h-3 w-3" /> },
  CONVERTED: { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", icon: <CheckCircle className="h-3 w-3" /> },
  LOST: { bg: "bg-gray-100 dark:bg-gray-900/20", text: "text-gray-700 dark:text-gray-400", icon: <XCircle className="h-3 w-3" /> },
};

const leadTypeIcons: Record<string, React.ReactNode> = {
  viewing: <Calendar className="h-4 w-4 text-blue-500" />,
  investor: <DollarSign className="h-4 w-4 text-green-500" />,
  rental: <Key className="h-4 w-4 text-amber-500" />,
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

interface LeadsData {
  summary: {
    totalLeads: number;
    last30DaysLeads: number;
    leadsWithUtm: number;
    leadsWithoutUtm: number;
    trackingRate: number;
  };
  leadsByType: Array<{ type: string; count: number; color: string }>;
  viewingStatusBreakdown: Array<{ status: string; count: number }>;
  investorStatusBreakdown: Array<{ status: string; count: number }>;
  leadsOverTime: Array<{
    month: string;
    year: string;
    viewing: number;
    investor: number;
    rental: number;
    total: number;
  }>;
  topUtmSources: Array<{ source: string; count: number }>;
  topUtmCampaigns: Array<{ campaign: string; count: number }>;
  topPropertiesByLeads: Array<{
    id: string;
    title: string;
    listingNumber: string | null;
    count: number;
  }>;
  recentLeads: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
    property: string;
    utmSource: string | null;
  }>;
}

export function LeadsAnalytics() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property") || undefined;
  const fromDate = searchParams.get("from") || undefined;
  const toDate = searchParams.get("to") || undefined;
  
  const [data, setData] = useState<LeadsData | null>(null);
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
      
      const response = await fetch(`/api/analytics/leads${paramString}`);
      if (!response.ok) throw new Error("Failed to fetch leads data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">{error || "No data available"}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxSourceCount = Math.max(...data.topUtmSources.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All lead types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.summary.last30DaysLeads.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Recent leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Tracked Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.summary.leadsWithUtm.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">With UTM attribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Tracking Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {data.summary.trackingRate}%
            </div>
            <Progress value={data.summary.trackingRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leads Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Leads Over Time
            </CardTitle>
            <CardDescription>Last 6 months by lead type</CardDescription>
          </CardHeader>
          <CardContent>
            {data.leadsOverTime.some((d) => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="viewing"
                    name="Viewing"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="investor"
                    name="Investor"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="rental"
                    name="Rental"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No lead data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads by Type
            </CardTitle>
            <CardDescription>Distribution of lead categories</CardDescription>
          </CardHeader>
          <CardContent>
            {data.leadsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.leadsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="type"
                    label={({ type, percent }) =>
                      `${type} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {data.leadsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Leads"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No leads yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attribution & Properties Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Lead Sources */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lead Sources</CardTitle>
            <CardDescription>Where your leads come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data.topUtmSources.length > 0 ? (
                <div className="space-y-3">
                  {data.topUtmSources.map((source) => (
                    <div key={source.source} className="flex items-center gap-3">
                      <span className="text-xl">
                        {sourceIcons[source.source.toLowerCase()] || "🔗"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate capitalize">
                            {source.source}
                          </span>
                          <Badge variant="secondary">{source.count}</Badge>
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
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No tracked sources yet</p>
                    <p className="text-xs mt-1">Use UTM links to track sources</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Campaigns</CardTitle>
            <CardDescription>Campaigns generating leads</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data.topUtmCampaigns.length > 0 ? (
                <div className="space-y-2">
                  {data.topUtmCampaigns.map((campaign, i) => (
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
                            color: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        >
                          #{i + 1}
                        </Badge>
                        <span className="text-sm truncate">{campaign.campaign}</span>
                      </div>
                      <Badge>{campaign.count} leads</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <p>No campaigns yet</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Properties by Leads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Top Properties
            </CardTitle>
            <CardDescription>Most inquired properties</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data.topPropertiesByLeads.length > 0 ? (
                <div className="space-y-2">
                  {data.topPropertiesByLeads.map((property, i) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-muted-foreground w-5">
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {property.listingNumber || property.title.substring(0, 25)}
                          </p>
                          {property.listingNumber && (
                            <p className="text-xs text-muted-foreground truncate">
                              {property.title.substring(0, 30)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">{property.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No property leads yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads & Status */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Leads
            </CardTitle>
            <CardDescription>Latest incoming leads</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data.recentLeads.length > 0 ? (
                <div className="space-y-2">
                  {data.recentLeads.map((lead) => {
                    const statusStyle = statusColors[lead.status] || statusColors["NEW"];
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-2 rounded-lg border"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {leadTypeIcons[lead.type]}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {lead.property}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(lead.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                              {lead.utmSource && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{lead.utmSource}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${statusStyle.bg} ${statusStyle.text} border-0 shrink-0`}
                        >
                          {statusStyle.icon}
                          <span className="ml-1">{lead.status}</span>
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No recent leads
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Overview</CardTitle>
            <CardDescription>Viewing requests by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data.viewingStatusBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {data.viewingStatusBreakdown.map((item) => {
                    const statusStyle = statusColors[item.status] || statusColors["NEW"];
                    const total = data.viewingStatusBreakdown.reduce(
                      (acc, s) => acc + s.count,
                      0
                    );
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

                    return (
                      <div key={item.status} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`${statusStyle.bg} ${statusStyle.text} border-0`}
                          >
                            {statusStyle.icon}
                            <span className="ml-1">{item.status}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No viewing requests yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

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


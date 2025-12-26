"use client";

import { useState, useEffect } from "react";
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
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Users, Eye, ArrowUp, Calendar, Globe } from "lucide-react";

interface PropertiesOverTimeData {
  month: string;
  year: string;
  properties: number;
}

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

interface LeadsOverTimeData {
  month: string;
  year: string;
  leads: number;
}

interface TopPropertyData {
  name: string;
  inquiries: number;
}

interface MostViewedPropertyData {
  name: string;
  views: number;
}

interface ViewsOverTimeData {
  date: string;
  views: number;
}

interface ViewsStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface ViewsByCountryData {
  country: string;
  name: string;
  views: number;
}

interface DashboardChartsProps {
  propertiesOverTime: PropertiesOverTimeData[];
  statusDistribution: DistributionData[];
  typeDistribution: DistributionData[];
  leadsOverTime: LeadsOverTimeData[];
  topProperties: TopPropertyData[];
  mostViewedProperties: MostViewedPropertyData[];
  viewsOverTime: ViewsOverTimeData[];
  viewsStats: ViewsStats;
  viewsByCountry: ViewsByCountryData[];
}

export function DashboardCharts({
  propertiesOverTime,
  statusDistribution,
  typeDistribution,
  leadsOverTime,
  topProperties,
  mostViewedProperties,
  viewsOverTime,
  viewsStats,
  viewsByCountry,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const hasProperties = propertiesOverTime.some((d) => d.properties > 0);
  const hasLeads = leadsOverTime.some((d) => d.leads > 0);
  const hasStatusData = statusDistribution.length > 0;
  const hasTopProperties = topProperties.length > 0;
  const hasMostViewedProperties = mostViewedProperties.length > 0;
  const hasViewsData = viewsOverTime.some((d) => d.views > 0);
  const hasCountryData = viewsByCountry.length > 0;

  // Don't render charts until mounted to avoid SSR dimension issues
  if (!mounted) {
    return <DashboardChartsLoading />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Properties Over Time - Area Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Properties Added</CardTitle>
          </div>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {hasProperties ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={propertiesOverTime}>
                  <defs>
                    <linearGradient id="colorProperties" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="properties"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProperties)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No properties added in the last 6 months
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution - Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </div>
          <CardDescription>Property status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {hasStatusData ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No properties yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Over Time - Area Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Inquiries Received</CardTitle>
          </div>
          <CardDescription>Viewing requests over last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {hasLeads ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={leadsOverTime}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No inquiries received in the last 6 months
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Properties - Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Top Properties</CardTitle>
          </div>
          <CardDescription>By inquiry count</CardDescription>
        </CardHeader>
        <CardContent>
          {hasTopProperties ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={topProperties} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis 
                    type="number" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="inquiries" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-center text-sm">
              No inquiries yet.<br />Properties with inquiries will appear here.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Views Stats Cards */}
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Page Views</CardTitle>
          </div>
          <CardDescription>Property page traffic statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">Total Views</span>
              </div>
              <p className="text-2xl font-bold">{viewsStats.total.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <ArrowUp className="h-4 w-4" />
                <span className="text-xs font-medium">Today</span>
              </div>
              <p className="text-2xl font-bold">{viewsStats.today.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">This Week</span>
              </div>
              <p className="text-2xl font-bold">{viewsStats.thisWeek.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">This Month</span>
              </div>
              <p className="text-2xl font-bold">{viewsStats.thisMonth.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Views Over Time - Line Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Views Over Time</CardTitle>
          </div>
          <CardDescription>Page views in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {hasViewsData ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground" 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No page views recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Viewed Properties - Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Most Viewed</CardTitle>
          </div>
          <CardDescription>Properties with most traffic</CardDescription>
        </CardHeader>
        <CardContent>
          {hasMostViewedProperties ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={mostViewedProperties} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis 
                    type="number" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-center text-sm">
              No views recorded yet.<br />Views will appear when users visit property pages.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Views by Country - Bar Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Visitors by Country</CardTitle>
          </div>
          <CardDescription>Top 10 countries by page views</CardDescription>
        </CardHeader>
        <CardContent>
          {hasCountryData ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={viewsByCountry} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis 
                    type="number" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value, "Views"]}
                  />
                  <Bar dataKey="views" fill="#004aac" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-center text-sm">
              <div>
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No country data yet.</p>
                <p className="text-xs mt-1">Country data will appear when visitors view your properties.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Server component wrapper to fetch data
export function DashboardChartsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
      {/* Views Stats Cards */}
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}


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
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon, 
  BarChart3, 
  Users, 
  Eye, 
  ArrowUp, 
  ArrowDown,
  Calendar, 
  Globe,
  DollarSign,
  Clock,
  Lightbulb,
  Filter,
  Monitor,
  Smartphone,
  Tablet,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

// ============================================
// INTERFACES
// ============================================

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

interface ViewsStatsDefault {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface ViewsStatsRange {
  total: number;
  label: string;
  avgPerDay: number;
  days: number;
}

type ViewsStats = ViewsStatsDefault | ViewsStatsRange;

interface ViewsByCountryData {
  country: string;
  name: string;
  views: number;
}

interface ConversionFunnelData {
  funnel: { stage: string; count: number; rate: number }[];
  rates: {
    viewToInquiry: number;
    inquiryToViewing: number;
    viewingToClose: number;
  };
}

interface RevenueMetricsData {
  activeListings: number;
  activePortfolioValue: number;
  soldProperties: number;
  soldValue: number;
  rentedProperties: number;
  potentialCommission: number;
  earnedCommission: number;
}

interface DaysOnMarketData {
  avgClosedDom: number;
  avgActiveDom: number;
  distribution: { label: string; count: number }[];
}

interface PeriodComparisonData {
  current: { views: number; inquiries: number; period: string };
  previous: { views: number; inquiries: number; period: string };
  changes: { views: number; inquiries: number };
}

interface TrafficSourcesData {
  devices: { name: string; value: number; color: string }[];
  referrers: { source: string; count: number }[];
}

interface PeakTrafficData {
  byHour: { hour: string; views: number }[];
  byDay: { day: string; views: number }[];
  peakHour: string;
  peakDay: string;
}

interface InsightData {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
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
  conversionFunnel: ConversionFunnelData;
  revenueMetrics: RevenueMetricsData;
  daysOnMarket: DaysOnMarketData;
  periodComparison: PeriodComparisonData;
  trafficSources: TrafficSourcesData;
  peakTraffic: PeakTrafficData;
  insights: InsightData[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `฿${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `฿${(value / 1000).toFixed(0)}K`;
  }
  return `฿${value.toLocaleString()}`;
}

function ChangeIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">No change</span>;
  
  const isPositive = value > 0;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value)}{suffix}
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DashboardCharts({
  propertiesOverTime,
  statusDistribution,
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

  if (!mounted) {
    return <DashboardChartsLoading />;
  }

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* ROW 1: KEY METRICS + INSIGHTS */}
      {/* ============================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Portfolio Value */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueMetrics.activePortfolioValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {revenueMetrics.activeListings} active listings
            </p>
          </CardContent>
        </Card>

        {/* Commission Potential */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Commission Potential</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueMetrics.potentialCommission)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(revenueMetrics.earnedCommission)} earned
            </p>
          </CardContent>
        </Card>

        {/* Views This Period */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Views</CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{periodComparison.current.views.toLocaleString()}</span>
              <ChangeIndicator value={periodComparison.changes.views} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
          </CardContent>
        </Card>

        {/* Inquiries This Period */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inquiries</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{periodComparison.current.inquiries}</span>
              <ChangeIndicator value={periodComparison.changes.inquiries} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* ROW 2: AI INSIGHTS */}
      {/* ============================================ */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-base">AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {insights.map((insight, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
                    insight.type === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' :
                    'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                    {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />}
                    {insight.type === 'info' && <Info className="h-4 w-4 text-blue-600 mt-0.5" />}
                    <div>
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* ROW 3: CONVERSION FUNNEL + DAYS ON MARKET */}
      {/* ============================================ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Conversion Funnel</CardTitle>
            </div>
            <CardDescription>From views to closed deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.funnel.map((stage, idx) => {
                const maxCount = conversionFunnel.funnel[0].count || 1;
                const widthPercent = Math.max((stage.count / maxCount) * 100, 10);
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-green-500'];
                
                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                      <div 
                        className={`h-full ${colors[idx]} transition-all duration-500 rounded-lg flex items-center justify-end pr-2`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {idx > 0 && stage.count > 0 && (
                          <span className="text-xs font-medium text-white">
                            {stage.rate.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">{conversionFunnel.rates.viewToInquiry}%</p>
                <p className="text-xs text-muted-foreground">View → Inquiry</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{conversionFunnel.rates.inquiryToViewing}%</p>
                <p className="text-xs text-muted-foreground">Inquiry → Viewing</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{conversionFunnel.rates.viewingToClose}%</p>
                <p className="text-xs text-muted-foreground">Viewing → Close</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Days on Market */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Days on Market</CardTitle>
            </div>
            <CardDescription>Listing age distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{daysOnMarket.avgActiveDom}</p>
                <p className="text-sm text-muted-foreground">Avg Active DOM</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{daysOnMarket.avgClosedDom}</p>
                <p className="text-sm text-muted-foreground">Avg to Close</p>
              </div>
            </div>
            <div className="space-y-2">
              {daysOnMarket.distribution.map((item, idx) => {
                const total = daysOnMarket.distribution.reduce((a, b) => a + b.count, 0) || 1;
                const percent = (item.count / total) * 100;
                const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
                
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm w-20">{item.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[idx]} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* ROW 4: VIEWS OVER TIME + TRAFFIC SOURCES */}
      {/* ============================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Views Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Views Over Time</CardTitle>
            </div>
            <CardDescription>Daily page views</CardDescription>
          </CardHeader>
          <CardContent>
            {hasViewsData ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={viewsOverTime}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No views recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Traffic Sources</CardTitle>
            </div>
            <CardDescription>Device breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {trafficSources.devices.length > 0 ? (
              <>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={trafficSources.devices}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {trafficSources.devices.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {trafficSources.devices.map((device) => (
                    <div key={device.name} className="flex items-center gap-1.5 text-xs">
                      {device.name === 'Desktop' && <Monitor className="h-3 w-3" />}
                      {device.name === 'Mobile' && <Smartphone className="h-3 w-3" />}
                      {device.name === 'Tablet' && <Tablet className="h-3 w-3" />}
                      <span>{device.name}</span>
                      <span className="text-muted-foreground">({device.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                No traffic data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* ROW 5: VIEWS STATS + PEAK TRAFFIC */}
      {/* ============================================ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Views Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Page Views Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {"label" in viewsStats ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-2xl font-bold">{viewsStats.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{viewsStats.label}</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-2xl font-bold">{viewsStats.avgPerDay}</p>
                  <p className="text-xs text-muted-foreground">Avg/Day</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <p className="text-2xl font-bold">{viewsStats.days}</p>
                  <p className="text-xs text-muted-foreground">Days</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-2xl font-bold">{viewsStats.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-2xl font-bold">{viewsStats.today}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <p className="text-2xl font-bold">{viewsStats.thisWeek}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <p className="text-2xl font-bold">{viewsStats.thisMonth}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Traffic */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Peak Traffic</CardTitle>
            </div>
            <CardDescription>Best times for engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{peakTraffic.peakHour}:00</p>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{peakTraffic.peakDay}</p>
                <p className="text-sm text-muted-foreground">Peak Day</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Views by day of week</p>
              <div className="flex gap-1">
                {peakTraffic.byDay.map((day) => {
                  const max = Math.max(...peakTraffic.byDay.map(d => d.views)) || 1;
                  const height = Math.max((day.views / max) * 40, 4);
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* ROW 6: PROPERTIES OVER TIME + STATUS */}
      {/* ============================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Properties Over Time */}
        <Card className="lg:col-span-2">
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

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Status Distribution</CardTitle>
            </div>
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
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-xs">{value}</span>}
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
      </div>

      {/* ============================================ */}
      {/* ROW 7: TOP PROPERTIES + MOST VIEWED + COUNTRY */}
      {/* ============================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Properties by Inquiries */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Top by Inquiries</CardTitle>
            </div>
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
                    <Tooltip />
                    <Bar dataKey="inquiries" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-center text-sm">
                No inquiries yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Viewed Properties */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Most Viewed</CardTitle>
            </div>
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
                    <Tooltip />
                    <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-center text-sm">
                No views recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Views by Country */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">By Country</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {hasCountryData ? (
              <div className="h-[200px]">
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
                      width={80}
                    />
                    <Tooltip />
                    <Bar dataKey="views" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-center text-sm">
                <div>
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No country data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function DashboardChartsLoading() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* More Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] bg-muted/30 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

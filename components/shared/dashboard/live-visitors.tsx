"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Eye, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet,
  Chrome,
  RefreshCw,
  MapPin,
  Clock,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

// Unified page info - supports both property pages and general pages
interface PageInfo {
  id: string;
  title: string;
  listingNumber?: string | null;
  // Property-specific fields
  provinceSlug?: string | null;
  areaSlug?: string | null;
  slug?: string | null;
  // General page fields
  pagePath?: string | null;
  pageType?: string | null; // "property", "tool", "blog", "landing", "static", "contact", etc.
}

interface LiveVisitor {
  visitorId: string;
  visitorCode: string;
  country: string | null;
  city: string | null;
  device: string;
  browser: string;
  pagesViewed: number;
  lastSeen: string;
  currentPage: PageInfo;
  recentPages: PageInfo[];
  isReturning: boolean;
  totalVisits: number;
  visitDays: number;
  firstSeen: string;
}

interface RecentView {
  id: string;
  viewedAt: string;
  page: PageInfo;
  country: string | null;
  city: string | null;
  device: string;
  browser: string;
  referrer: string | null;
  visitorId: string;
  visitorCode: string;
  isLive: boolean;
  isReturning: boolean;
  totalVisits: number;
  visitDays: number;
  firstSeen: string;
}

interface CountryBreakdown {
  country: string;
  uniqueVisitors: number;
  totalViews: number;
  returningVisitors: number;
  newVisitors: number;
}

interface LiveData {
  liveCount: number;
  liveVisitors: LiveVisitor[];
  recentViews: RecentView[];
  countryBreakdown: CountryBreakdown[];
  stats: {
    totalViews24h: number;
    uniqueVisitors24h: number;
    returningVisitors24h: number;
  };
  timestamp: string;
}

const countryNames: Record<string, string> = {
  NL: "Netherlands",
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  TH: "Thailand",
  AU: "Australia",
  CA: "Canada",
  SG: "Singapore",
  HK: "Hong Kong",
  JP: "Japan",
  CN: "China",
  RU: "Russia",
  IN: "India",
  AE: "UAE",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  BE: "Belgium",
  CH: "Switzerland",
};

const countryFlags: Record<string, string> = {
  NL: "🇳🇱", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷",
  TH: "🇹🇭", AU: "🇦🇺", CA: "🇨🇦", SG: "🇸🇬", HK: "🇭🇰",
  JP: "🇯🇵", CN: "🇨🇳", RU: "🇷🇺", IN: "🇮🇳", AE: "🇦🇪",
  SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰", BE: "🇧🇪", CH: "🇨🇭",
};

function getDeviceIcon(device: string) {
  switch (device) {
    case "Mobile":
      return <Smartphone className="h-4 w-4" />;
    case "Tablet":
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

// Get icon for page type
function getPageTypeIcon(pageType?: string | null): string {
  switch (pageType) {
    case "property":
      return "🏠";
    case "tool":
      return "🧮";
    case "blog":
      return "📝";
    case "contact":
      return "📧";
    case "landing":
      return "📄";
    case "docs":
      return "📚";
    case "legal":
      return "⚖️";
    case "static":
    default:
      return "🌐";
  }
}

// Get URL for any page type
function getPageUrl(page: PageInfo): string {
  // If it has a direct page path (non-property pages)
  if (page.pagePath) {
    return page.pagePath;
  }
  
  // Property URL construction
  if (page.provinceSlug && page.areaSlug && page.slug) {
    return `/properties/${page.provinceSlug}/${page.areaSlug}/${page.slug}`;
  }
  
  // Fallback for properties without full slugs
  if (page.id && page.pageType === "property") {
    return `/properties/${page.id}`;
  }
  
  return "#";
}

// Get display name for a page
function getPageDisplayName(page: PageInfo): string {
  // Show listing number for properties
  if (page.listingNumber) {
    return page.listingNumber;
  }
  
  // Show readable path for non-property pages
  if (page.pagePath) {
    // Extract last part of path and make it readable
    const pathParts = page.pagePath.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) {
      // Convert kebab-case to Title Case
      return lastPart
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }
  
  // Fallback to title
  return page.title?.substring(0, 35) || "Unknown page";
}

export function LiveVisitors() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/visitors/live");
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch live visitors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted/30 animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted/30 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with live count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Users className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-2xl font-bold">{data?.liveCount || 0}</span>
            <span className="text-muted-foreground">live visitors</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </Badge>
        </div>
        <button
          onClick={() => {
            setAutoRefresh(!autoRefresh);
            if (!autoRefresh) fetchData();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            autoRefresh 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-muted text-muted-foreground"
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
          {autoRefresh ? "Live" : "Paused"}
        </button>
      </div>

      {/* Stats Summary */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{data.stats.uniqueVisitors24h}</div>
            <div className="text-xs text-muted-foreground">Unique visitors (24h)</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.stats.uniqueVisitors24h - data.stats.returningVisitors24h}</div>
            <div className="text-xs text-muted-foreground">New visitors</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{data.stats.returningVisitors24h}</div>
            <div className="text-xs text-muted-foreground">Returning visitors</div>
          </Card>
        </div>
      )}

      {/* Country Breakdown - Compact Table Layout */}
      {data?.countryBreakdown && data.countryBreakdown.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Visitors by Country (24h)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Country</th>
                  <th className="pb-2 font-medium text-center">Unique</th>
                  <th className="pb-2 font-medium text-center">New</th>
                  <th className="pb-2 font-medium text-center">Returning</th>
                  <th className="pb-2 font-medium text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.countryBreakdown.map((item) => (
                  <tr key={item.country} className="hover:bg-muted/50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {countryFlags[item.country] || "🌍"}
                        </span>
                        <span className="font-medium">
                          {countryNames[item.country] || item.country}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-center font-semibold">
                      {item.uniqueVisitors}
                    </td>
                    <td className="py-2 text-center">
                      {item.newVisitors > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                          {item.newVisitors}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {item.returningVisitors > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium">
                          {item.returningVisitors}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {item.totalViews}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Live Visitors Panel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Eye className="h-4 w-4 text-green-500" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
              </div>
              <CardTitle className="text-base">Live Visitors</CardTitle>
            </div>
            <CardDescription>Currently browsing your properties</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              {data?.liveVisitors && data.liveVisitors.length > 0 ? (
                <div className="space-y-3">
                  {data.liveVisitors.map((visitor) => (
                    <div
                      key={visitor.visitorId}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {visitor.country ? countryFlags[visitor.country] || "🌍" : "🌍"}
                            </span>
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {visitor.visitorCode}
                            </code>
                            <span className="font-medium text-sm truncate">
                              {visitor.city || (visitor.country ? countryNames[visitor.country] : "Unknown")}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            {visitor.isReturning ? (
                              <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Returning
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                New
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {getDeviceIcon(visitor.device)}
                              <span className="ml-1">{visitor.device}</span>
                            </Badge>
                            {visitor.totalVisits > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {visitor.totalVisits} visits / {visitor.visitDays} days
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            {visitor.browser} • {visitor.pagesViewed} page{visitor.pagesViewed !== 1 ? "s" : ""} viewed
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground shrink-0">Viewing:</span>
                            <Link
                              href={getPageUrl(visitor.currentPage)}
                              target="_blank"
                              className="text-xs text-primary hover:underline flex items-center gap-1 min-w-0"
                            >
                              <span className="shrink-0">{getPageTypeIcon(visitor.currentPage.pageType)}</span>
                              <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">
                                {getPageDisplayName(visitor.currentPage)}
                              </span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </Link>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No live visitors at the moment</p>
                    <p className="text-xs mt-1">Visitors will appear here in real-time</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity Panel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </div>
            <CardDescription>Page views in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              {data?.recentViews && data.recentViews.length > 0 ? (
                <div className="space-y-2">
                  {data.recentViews.map((view) => (
                    <div
                      key={view.id}
                      className={`p-2 rounded-lg border text-sm transition-colors ${
                        view.isLive 
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                          : "bg-card hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-base shrink-0">
                            {view.country ? countryFlags[view.country] || "🌍" : "🌍"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded">
                                {view.visitorCode}
                              </code>
                              {view.isReturning ? (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400">↩ Returning</span>
                              ) : (
                                <span className="text-[10px] text-green-600 dark:text-green-400">✦ New</span>
                              )}
                            </div>
                            <Link
                              href={getPageUrl(view.page)}
                              target="_blank"
                              className="font-medium hover:underline flex items-center gap-1 min-w-0 text-xs"
                            >
                              <span className="shrink-0">{getPageTypeIcon(view.page.pageType)}</span>
                              <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
                                {getPageDisplayName(view.page)}
                              </span>
                              <ExternalLink className="h-3 w-3 shrink-0 hidden sm:inline" />
                            </Link>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              {getDeviceIcon(view.device)}
                              <span>{view.city || (view.country ? countryNames[view.country] : "Unknown")}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {view.isLive && (
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-xs mt-1">Page views will appear here</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}










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

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  provinceSlug: string | null;
  areaSlug: string | null;
  slug: string | null;
}

interface LiveVisitor {
  visitorId: string;
  country: string | null;
  city: string | null;
  device: string;
  browser: string;
  pagesViewed: number;
  lastSeen: string;
  currentPage: Property;
  recentPages: Property[];
}

interface RecentView {
  id: string;
  viewedAt: string;
  property: Property;
  country: string | null;
  city: string | null;
  device: string;
  browser: string;
  referrer: string | null;
  visitorId: string;
  isLive: boolean;
}

interface LiveData {
  liveCount: number;
  liveVisitors: LiveVisitor[];
  recentViews: RecentView[];
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

function getPropertyUrl(property: Property) {
  if (property.provinceSlug && property.areaSlug && property.slug) {
    return `/properties/${property.provinceSlug}/${property.areaSlug}/${property.slug}`;
  }
  return `/properties/${property.id}`;
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
                            <span className="font-medium text-sm truncate">
                              {visitor.city || (visitor.country ? countryNames[visitor.country] : "Unknown")}
                            </span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {getDeviceIcon(visitor.device)}
                              <span className="ml-1">{visitor.device}</span>
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            {visitor.browser} • {visitor.pagesViewed} page{visitor.pagesViewed !== 1 ? "s" : ""} viewed
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Viewing:</span>
                            <Link
                              href={getPropertyUrl(visitor.currentPage)}
                              target="_blank"
                              className="text-xs text-primary hover:underline truncate flex items-center gap-1"
                            >
                              {visitor.currentPage.listingNumber || visitor.currentPage.title.substring(0, 30)}
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
                            <Link
                              href={getPropertyUrl(view.property)}
                              target="_blank"
                              className="font-medium hover:underline truncate block text-xs"
                            >
                              {view.property.listingNumber || view.property.title.substring(0, 40)}
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








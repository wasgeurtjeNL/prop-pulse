import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardChartsWrapper } from "@/components/shared/dashboard/dashboard-charts-wrapper";
import { DashboardChartsLoading } from "@/components/shared/dashboard/dashboard-charts";
import { LiveVisitors } from "@/components/shared/dashboard/live-visitors";
import { TrafficSourcesAnalytics } from "@/components/shared/dashboard/traffic-sources-analytics";
import { LeadsAnalytics } from "@/components/shared/dashboard/leads-analytics";
import { AnalyticsTabs } from "@/components/shared/dashboard/analytics-tabs";
import { AnalyticsDateFilter } from "@/components/shared/dashboard/analytics-with-date-filter";
import { AnalyticsPropertyFilter } from "@/components/shared/dashboard/analytics-property-filter";
import { AnalyticsExportButton } from "@/components/shared/dashboard/analytics-export-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = {
  title: "Analytics | Dashboard",
  description: "View property analytics and insights",
};

interface AnalyticsPageProps {
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
    property?: string;
  }>;
}

// Loading fallback for client components
function TabLoadingFallback() {
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

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "analytics";
  
  // Parse date range from URL params with validation
  let dateRange: { from: Date; to: Date } | undefined = undefined;
  if (params.from && params.to) {
    const from = new Date(params.from);
    const to = new Date(params.to);
    // Only use if both dates are valid
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      dateRange = { from, to };
    }
  }

  // Tab titles for dynamic header
  const tabTitles: Record<string, { title: string; description: string }> = {
    analytics: {
      title: "Analytics Overview",
      description: "Property performance, views, and insights",
    },
    traffic: {
      title: "Traffic Sources",
      description: "Where your visitors come from and campaign performance",
    },
    leads: {
      title: "Leads Analytics",
      description: "Lead generation, attribution, and conversion insights",
    },
    visitors: {
      title: "Live Visitors",
      description: "Real-time visitor activity on your properties",
    },
  };

  const currentTitle = tabTitles[currentTab] || tabTitles.analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{currentTitle.title}</h2>
            <p className="text-muted-foreground">
              {currentTitle.description}
            </p>
          </div>
        </div>
        
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-muted/30">
        <AnalyticsPropertyFilter />
        {currentTab !== "visitors" && (
          <div className="flex items-center gap-2 ml-auto">
            <AnalyticsDateFilter />
            <AnalyticsExportButton />
          </div>
        )}
      </div>

      {/* Tabs */}
      <AnalyticsTabs />

      {/* Tab Content */}
      {currentTab === "analytics" && (
        <Suspense fallback={<DashboardChartsLoading />}>
          <DashboardChartsWrapper dateRange={dateRange} />
        </Suspense>
      )}

      {currentTab === "traffic" && (
        <Suspense fallback={<TabLoadingFallback />}>
          <TrafficSourcesAnalytics />
        </Suspense>
      )}

      {currentTab === "leads" && (
        <Suspense fallback={<TabLoadingFallback />}>
          <LeadsAnalytics />
        </Suspense>
      )}

      {currentTab === "visitors" && (
        <LiveVisitors />
      )}
    </div>
  );
}

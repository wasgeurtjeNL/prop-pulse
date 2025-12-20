import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardChartsWrapper } from "@/components/shared/dashboard/dashboard-charts-wrapper";
import { DashboardChartsLoading } from "@/components/shared/dashboard/dashboard-charts";
import { LiveVisitors } from "@/components/shared/dashboard/live-visitors";
import { AnalyticsTabs } from "@/components/shared/dashboard/analytics-tabs";

export const metadata = {
  title: "Analytics | Dashboard",
  description: "View property analytics and insights",
};

interface AnalyticsPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "analytics";

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

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Property performance, views, and lead insights
          </p>
        </div>
      </div>

      {/* Tabs */}
      <AnalyticsTabs />

      {/* Tab Content */}
      {currentTab === "analytics" && (
        <Suspense fallback={<DashboardChartsLoading />}>
          <DashboardChartsWrapper />
        </Suspense>
      )}

      {currentTab === "visitors" && (
        <LiveVisitors />
      )}
    </div>
  );
}

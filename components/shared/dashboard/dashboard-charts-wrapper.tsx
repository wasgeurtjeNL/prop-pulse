import { getDashboardAnalytics, DateRangeFilter } from "@/lib/actions/analytics.actions";
import { DashboardCharts } from "./dashboard-charts";

interface DashboardChartsWrapperProps {
  dateRange?: DateRangeFilter;
}

export async function DashboardChartsWrapper({ dateRange }: DashboardChartsWrapperProps) {
  const analytics = await getDashboardAnalytics(dateRange);

  return (
    <DashboardCharts
      propertiesOverTime={analytics.propertiesOverTime}
      statusDistribution={analytics.statusDistribution}
      typeDistribution={analytics.typeDistribution}
      leadsOverTime={analytics.leadsOverTime}
      topProperties={analytics.topProperties}
      mostViewedProperties={analytics.mostViewedProperties}
      viewsOverTime={analytics.viewsOverTime}
      viewsStats={analytics.viewsStats}
      viewsByCountry={analytics.viewsByCountry}
    />
  );
}


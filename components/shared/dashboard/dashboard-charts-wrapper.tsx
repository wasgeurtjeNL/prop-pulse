import { getDashboardAnalytics } from "@/lib/actions/analytics.actions";
import { DashboardCharts } from "./dashboard-charts";

export async function DashboardChartsWrapper() {
  const analytics = await getDashboardAnalytics();

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


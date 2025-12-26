import { LiveVisitors } from "@/components/shared/dashboard/live-visitors";

export default function VisitorsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Live Visitors</h2>
        <p className="text-muted-foreground">
          Monitor your website visitors in real-time.
        </p>
      </div>

      <LiveVisitors />
    </div>
  );
}









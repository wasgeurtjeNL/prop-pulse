import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ViewingRequestsTable from "@/components/shared/dashboard/viewing-requests-table";
import StatsViewingRequests from "@/components/shared/dashboard/stats-viewing-requests";
import { Calendar } from "lucide-react";

export default function ViewingRequestsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Viewing Requests</h2>
          <p className="text-muted-foreground">
            Manage property viewing requests and offers from potential buyers.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsViewingRequests />

      {/* Viewing Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            All Viewing Requests
          </CardTitle>
          <CardDescription>
            View and manage all incoming viewing requests and property offers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ViewingRequestsTable />
        </CardContent>
      </Card>
    </div>
  );
}







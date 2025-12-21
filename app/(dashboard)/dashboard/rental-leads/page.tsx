import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import StatsRentalLeads from "@/components/shared/dashboard/stats-rental-leads";
import RentalLeadsTable from "@/components/shared/dashboard/rental-leads-table";

export default function RentalLeadsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rental Leads</h2>
          <p className="text-muted-foreground">
            Manage all rental property inquiries and tenant leads
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsRentalLeads />

      {/* Rental Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Rental Leads</CardTitle>
          <CardDescription>
            View and manage all incoming rental property inquiries. Contact potential tenants and track their status throughout the rental process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RentalLeadsTable />
        </CardContent>
      </Card>
    </div>
  );
}







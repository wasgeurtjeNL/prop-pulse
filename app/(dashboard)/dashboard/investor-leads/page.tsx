import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import StatsInvestorLeads from "@/components/shared/dashboard/stats-investor-leads";
import InvestorLeadsTable from "@/components/shared/dashboard/investor-leads-table";

export default function InvestorLeadsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Investor Leads</h2>
          <p className="text-muted-foreground">
            Manage all investment opportunity inquiries and investor leads
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsInvestorLeads />

      {/* Investor Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Investor Leads</CardTitle>
          <CardDescription>
            View and manage all incoming investment inquiries. Contact potential investors and track their status throughout the sales process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvestorLeadsTable />
        </CardContent>
      </Card>
    </div>
  );
}






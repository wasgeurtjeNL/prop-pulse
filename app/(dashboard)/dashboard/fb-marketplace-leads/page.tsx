import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import StatsFbMarketplaceLeads from "@/components/shared/dashboard/stats-fb-marketplace-leads";
import FbMarketplaceLeadsTable from "@/components/shared/dashboard/fb-marketplace-leads-table";

export const metadata = {
  title: "Facebook Marketplace Leads | Dashboard",
  description: "Beheer eigenaren die hun woning te koop zetten op Facebook Marketplace",
};

export default function FbMarketplaceLeadsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facebook Marketplace Leads</h2>
          <p className="text-muted-foreground">
            Beheer eigenaren die hun woning te koop zetten op Facebook Marketplace
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsFbMarketplaceLeads />

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Facebook Marketplace Leads</CardTitle>
          <CardDescription>
            Importeer, bekijk en beheer leads van Facebook Marketplace. Volg het contact proces en converteer naar klanten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FbMarketplaceLeadsTable />
        </CardContent>
      </Card>
    </div>
  );
}

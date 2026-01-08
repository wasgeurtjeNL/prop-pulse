import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsOwnerPortal } from "@/components/shared/dashboard/stats-owner-portal";
import { OwnerInvitesTable } from "@/components/shared/dashboard/owner-invites-table";
import { OwnerPriceRequestsTable } from "@/components/shared/dashboard/owner-price-requests-table";
import { OwnerSessionsTable } from "@/components/shared/dashboard/owner-sessions-table";
import { OwnerActivityFeed } from "@/components/shared/dashboard/owner-activity-feed";
import OwnerMarketingTable from "@/components/shared/dashboard/owner-marketing-table";

export const metadata: Metadata = {
  title: "Owner Portal | Dashboard",
  description: "Beheer eigenaar accounts, prijswijzigingen en activiteit",
};

export default function OwnerPortalDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Owner Portal</h1>
        <p className="text-muted-foreground mt-2">
          Beheer eigenaar accounts, bekijk prijswijzigingen en monitor activiteit
        </p>
      </div>

      {/* Stats */}
      <StatsOwnerPortal />

      {/* Tabs */}
      <Tabs defaultValue="marketing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="marketing" className="relative">
            Marketing
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </TabsTrigger>
          <TabsTrigger value="requests">Prijsverzoeken</TabsTrigger>
          <TabsTrigger value="invites">Uitnodigingen</TabsTrigger>
          <TabsTrigger value="sessions">Sessies</TabsTrigger>
          <TabsTrigger value="activity">Activiteit</TabsTrigger>
        </TabsList>

        <TabsContent value="marketing" className="space-y-4">
          <OwnerMarketingTable />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <OwnerPriceRequestsTable />
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <OwnerInvitesTable />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <OwnerSessionsTable />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <OwnerActivityFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}

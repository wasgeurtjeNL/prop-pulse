import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PropertiesTableWrapper from "@/components/shared/dashboard/properties-table-wrapper";
import { PropertySearch } from "@/components/shared/dashboard/property-search";
import StatsProperties from "@/components/shared/dashboard/stats-properties";
import PropertiesTableSkeleton from "@/components/shared/dashboard/properties-table-skeleton";
import { DashboardTabs } from "@/components/shared/dashboard/dashboard-tabs";
import { MissingContactsTable, getMissingContactsCount } from "@/components/shared/dashboard/missing-contacts-table";
import BookingsTable from "@/components/shared/dashboard/bookings-table";
import PropertySubmissionsTable from "@/components/shared/dashboard/property-submissions-table";
import ViewingRequestsTable from "@/components/shared/dashboard/viewing-requests-table";
import StatsViewingRequests from "@/components/shared/dashboard/stats-viewing-requests";
import RentalLeadsTable from "@/components/shared/dashboard/rental-leads-table";
import StatsRentalLeads from "@/components/shared/dashboard/stats-rental-leads";
import InvestorLeadsTable from "@/components/shared/dashboard/investor-leads-table";
import StatsInvestorLeads from "@/components/shared/dashboard/stats-investor-leads";
import FbMarketplaceLeadsTable from "@/components/shared/dashboard/fb-marketplace-leads-table";
import StatsFbMarketplaceLeads from "@/components/shared/dashboard/stats-fb-marketplace-leads";
import RentalPricingContent from "@/components/shared/dashboard/rental-pricing-content";
import ContactSubmissionsTable from "@/components/shared/dashboard/contact-submissions-table";
import StatsContactSubmissions from "@/components/shared/dashboard/stats-contact-submissions";
import prisma from "@/lib/prisma";

interface DashboardPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    tab?: string;
  }>;
}

// Cached pending bookings count - revalidates every 30 seconds
const getPendingBookingsCount = unstable_cache(
  async () => {
    try {
      return await prisma.rental_booking.count({
        where: { status: "PENDING" },
      });
    } catch {
      return 0;
    }
  },
  ["pending-bookings-count"],
  { revalidate: 30, tags: ["bookings"] }
);

// Cached pending submissions count
const getPendingSubmissionsCount = unstable_cache(
  async () => {
    try {
      return await prisma.propertySubmission.count({
        where: { status: "PENDING" },
      });
    } catch {
      return 0;
    }
  },
  ["pending-submissions-count"],
  { revalidate: 30, tags: ["submissions"] }
);

// Cached pending viewing requests count
const getPendingViewingRequestsCount = unstable_cache(
  async () => {
    try {
      return await prisma.viewingRequest.count({
        where: { status: "PENDING" },
      });
    } catch {
      return 0;
    }
  },
  ["pending-viewing-requests-count"],
  { revalidate: 30, tags: ["viewing-requests"] }
);

// Cached pending rental leads count
const getPendingRentalLeadsCount = unstable_cache(
  async () => {
    try {
      return await prisma.rentalLead.count({
        where: { status: "NEW" },
      });
    } catch {
      return 0;
    }
  },
  ["pending-rental-leads-count"],
  { revalidate: 30, tags: ["rental-leads"] }
);

// Cached pending investor leads count
const getPendingInvestorLeadsCount = unstable_cache(
  async () => {
    try {
      return await prisma.investorLead.count({
        where: { status: "NEW" },
      });
    } catch {
      return 0;
    }
  },
  ["pending-investor-leads-count"],
  { revalidate: 30, tags: ["investor-leads"] }
);

// Cached pending FB Marketplace leads count
const getPendingFbMarketplaceLeadsCount = unstable_cache(
  async () => {
    try {
      return await prisma.fbMarketplaceLead.count({
        where: { status: "NEW" },
      });
    } catch {
      return 0;
    }
  },
  ["pending-fb-marketplace-leads-count"],
  { revalidate: 30, tags: ["fb-marketplace-leads"] }
);

// Cached pending contact submissions count
const getPendingContactSubmissionsCount = unstable_cache(
  async () => {
    try {
      return await prisma.contactSubmission.count({
        where: { status: "NEW" },
      });
    } catch {
      return 0;
    }
  },
  ["pending-contact-submissions-count"],
  { revalidate: 30, tags: ["contact-submissions"] }
);

// Get submissions data
async function getSubmissions() {
  const submissions = await prisma.propertySubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
  return submissions;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "properties";
  
  const [
    missingContactsCount, 
    pendingBookingsCount,
    pendingSubmissionsCount,
    pendingViewingRequestsCount,
    pendingRentalLeadsCount,
    pendingInvestorLeadsCount,
    pendingFbMarketplaceLeadsCount,
    pendingContactSubmissionsCount,
  ] = await Promise.all([
    getMissingContactsCount(),
    getPendingBookingsCount(),
    getPendingSubmissionsCount(),
    getPendingViewingRequestsCount(),
    getPendingRentalLeadsCount(),
    getPendingInvestorLeadsCount(),
    getPendingFbMarketplaceLeadsCount(),
    getPendingContactSubmissionsCount(),
  ]);

  // Fetch submissions data if on submissions tab
  const submissions = currentTab === "submissions" ? await getSubmissions() : [];
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back!</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="justify-center">
            <Link href="/dashboard/analytics">
              <BarChart3 className="mr-2 h-4 w-4" /> Analytics
            </Link>
          </Button>
          <Button asChild className="justify-center">
            <Link href="/dashboard/add">
              <Plus className="mr-2 h-4 w-4" /> Add Property
            </Link>
          </Button>
        </div>
      </div>

      <StatsProperties />

      {/* Tabs */}
      <DashboardTabs 
        missingContactsCount={missingContactsCount} 
        pendingBookingsCount={pendingBookingsCount}
        pendingSubmissionsCount={pendingSubmissionsCount}
        pendingViewingRequestsCount={pendingViewingRequestsCount}
        pendingRentalLeadsCount={pendingRentalLeadsCount}
        pendingInvestorLeadsCount={pendingInvestorLeadsCount}
        pendingFbMarketplaceLeadsCount={pendingFbMarketplaceLeadsCount}
        pendingContactSubmissionsCount={pendingContactSubmissionsCount}
      />

      {/* Tab Content */}
      {currentTab === "properties" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  Manage your property listings.
                </CardDescription>
              </div>
            </div>
            <PropertySearch />
          </CardHeader>
          <CardContent>
            <Suspense 
              key={JSON.stringify(params)} 
              fallback={<PropertiesTableSkeleton />}
            >
              <PropertiesTableWrapper searchParams={params} />
            </Suspense>
          </CardContent>
        </Card>
      )}

      {currentTab === "submissions" && (
        <Card>
          <CardHeader>
            <CardTitle>Property Submissions</CardTitle>
            <CardDescription>
              Review and manage property listings from owners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PropertySubmissionsTable data={submissions} />
          </CardContent>
        </Card>
      )}

      {currentTab === "viewing-requests" && (
        <div className="space-y-6">
          <StatsViewingRequests />
          <Card>
            <CardHeader>
              <CardTitle>All Viewing Requests</CardTitle>
              <CardDescription>
                View and manage all incoming viewing requests and property offers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViewingRequestsTable />
            </CardContent>
          </Card>
        </div>
      )}

      {currentTab === "rental-leads" && (
        <div className="space-y-6">
          <StatsRentalLeads />
          <Card>
            <CardHeader>
              <CardTitle>All Rental Leads</CardTitle>
              <CardDescription>
                View and manage all incoming rental property inquiries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RentalLeadsTable />
            </CardContent>
          </Card>
        </div>
      )}

      {currentTab === "investor-leads" && (
        <div className="space-y-6">
          <StatsInvestorLeads />
          <Card>
            <CardHeader>
              <CardTitle>All Investor Leads</CardTitle>
              <CardDescription>
                View and manage all incoming investment inquiries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvestorLeadsTable />
            </CardContent>
          </Card>
        </div>
      )}

      {currentTab === "fb-marketplace-leads" && (
        <div className="space-y-6">
          <StatsFbMarketplaceLeads />
          <Card>
            <CardHeader>
              <CardTitle>Facebook Marketplace Leads</CardTitle>
              <CardDescription>
                Property owners selling on Facebook Marketplace - potential listing opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FbMarketplaceLeadsTable />
            </CardContent>
          </Card>
        </div>
      )}

      {currentTab === "contact-submissions" && (
        <div className="space-y-6">
          <StatsContactSubmissions />
          <Card>
            <CardHeader>
              <CardTitle>Contact Form Submissions</CardTitle>
              <CardDescription>
                Messages from visitors submitted through the contact form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactSubmissionsTable />
            </CardContent>
          </Card>
        </div>
      )}
      
      {currentTab === "bookings" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Rental Bookings</CardTitle>
                <CardDescription>
                  Manage rental bookings and guest reservations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BookingsTable />
          </CardContent>
        </Card>
      )}

      {currentTab === "rental-pricing" && (
        <RentalPricingContent />
      )}
      
      {currentTab === "missing-contacts" && (
        <Suspense fallback={<PropertiesTableSkeleton />}>
          <MissingContactsTable />
        </Suspense>
      )}
    </div>
  );
}

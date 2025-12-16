import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";
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

interface DashboardPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back!</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/add">
            <Plus className="mr-2 h-4 w-4" /> Add Property
          </Link>
        </Button>
      </div>

      <StatsProperties />

      {/* Properties Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Properties</CardTitle>
              <CardDescription>
                Beheer je vastgoed listings.
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
    </div>
  );
}

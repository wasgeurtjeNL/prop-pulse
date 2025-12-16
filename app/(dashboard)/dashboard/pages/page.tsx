import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LandingPagesTable from "@/components/shared/dashboard/landing-pages-table";

export default async function LandingPagesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Landing Pages</h2>
          <p className="text-muted-foreground mt-1">
            Manage your landing pages (services, guides, locations, FAQ)
          </p>
        </div>
      </div>

      {/* Table */}
      <LandingPagesTable />
    </div>
  );
}


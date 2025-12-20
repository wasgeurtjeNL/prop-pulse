import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import AddPropertyForm from "@/components/shared/forms/add-property-form";
import PropertyImportContent from "@/components/shared/dashboard/property-import-content";
import { AddPropertyTabs } from "@/components/shared/dashboard/add-property-tabs";

interface AddPropertyPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function AddPropertyPage({ searchParams }: AddPropertyPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");

  const params = await searchParams;
  const currentTab = params.tab || "add";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          {currentTab === "add" ? "Add New Property" : "Import Property"}
        </h2>
      </div>

      {/* Tabs */}
      <AddPropertyTabs />

      {/* Tab Content */}
      {currentTab === "add" && (
        <div className="max-w-4xl">
          <AddPropertyForm />
        </div>
      )}

      {currentTab === "import" && (
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <PropertyImportContent />
        </Suspense>
      )}
    </div>
  );
}

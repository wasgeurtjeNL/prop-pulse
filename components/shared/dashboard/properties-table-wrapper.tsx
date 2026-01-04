import { getAgentPropertiesPaginated, DashboardPropertyFilters } from "@/lib/actions/property.actions";
import { AgentPropertiesTable } from "./agent-properties-table";
import { PropertyPagination } from "./property-pagination";
import { Status, PropertyType } from "@prisma/client";

interface PropertiesTableWrapperProps {
  searchParams?: {
    search?: string;
    status?: string;
    type?: string;
    page?: string;
  };
}

async function PropertiesTableWrapper({ searchParams }: PropertiesTableWrapperProps) {
  // Parse search params into filters
  const filters: DashboardPropertyFilters = {
    search: searchParams?.search,
    status: searchParams?.status as Status | "all" | undefined,
    type: searchParams?.type as PropertyType | "all" | undefined,
    page: searchParams?.page ? parseInt(searchParams.page) : 1,
    limit: 10,
  };

  const result = await getAgentPropertiesPaginated(filters);

  return (
    <div className="space-y-4">
      <AgentPropertiesTable data={result.properties} />
      
      <PropertyPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        hasNextPage={result.hasNextPage}
        hasPrevPage={result.hasPrevPage}
      />
    </div>
  );
}

export default PropertiesTableWrapper;

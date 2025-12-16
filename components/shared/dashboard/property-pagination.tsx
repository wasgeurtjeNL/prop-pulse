"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PropertyPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function PropertyPagination({
  currentPage,
  totalPages,
  totalCount,
  hasNextPage,
  hasPrevPage,
}: PropertyPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }
      return params.toString();
    },
    [searchParams]
  );

  const goToPage = (page: number) => {
    startTransition(() => {
      const queryString = createQueryString(page);
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
    });
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showPages = 5; // Number of page buttons to show
    
    if (totalPages <= showPages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("ellipsis");
      }
      
      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div className="text-sm text-muted-foreground">
        {totalCount} {totalCount === 1 ? "property" : "properties"} gevonden
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Pagina {currentPage} van {totalPages} ({totalCount} properties)
      </div>
      
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(1)}
          disabled={!hasPrevPage || isPending}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Eerste pagina</span>
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(currentPage - 1)}
          disabled={!hasPrevPage || isPending}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Vorige pagina</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(page)}
                disabled={isPending}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!hasNextPage || isPending}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Volgende pagina</span>
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(totalPages)}
          disabled={!hasNextPage || isPending}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Laatste pagina</span>
        </Button>
      </div>
    </div>
  );
}



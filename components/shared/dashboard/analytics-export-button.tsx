"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ExportType = "views" | "leads" | "utm";

export function AnalyticsExportButton() {
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set("type", type);
      
      const propertyId = searchParams.get("property");
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      
      if (propertyId && propertyId !== "all") params.set("propertyId", propertyId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/analytics/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `analytics-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${type} data successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!!exporting}>
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export as CSV</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleExport("views")}
          disabled={!!exporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Property Views
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("leads")}
          disabled={!!exporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Leads Data
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("utm")}
          disabled={!!exporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          UTM Analytics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


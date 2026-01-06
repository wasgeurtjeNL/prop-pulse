import { Metadata } from "next";
import AllPagesTable from "@/components/shared/dashboard/all-pages-table";
import { Icon } from "@iconify/react";

export const metadata: Metadata = {
  title: "All Pages | Dashboard",
  description: "View and manage all pages on the website",
};

export default function AllPagesPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Icon icon="ph:globe" className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Pages</h1>
            <p className="text-sm text-muted-foreground">
              View every page on your website - static pages, blogs, properties, and landing pages
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
        <div className="flex items-start gap-3">
          <Icon icon="ph:info" className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Complete Page Overview
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This shows all pages including:
              <strong> Static pages</strong> (Contact, Tools, Legal) with SEO in code,
              <strong> Landing pages</strong> from the database,
              <strong> Blog posts</strong>, and
              <strong> Properties</strong>.
              Database pages can be edited via the dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">In Code = SEO in source code</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-muted-foreground">Auto = Generated automatically</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Good = Title & description set</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Partial = Incomplete SEO</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Missing = No SEO</span>
        </div>
      </div>

      {/* Table */}
      <AllPagesTable />
    </div>
  );
}

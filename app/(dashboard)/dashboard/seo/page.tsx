import { Metadata } from "next";
import { SEOPerformanceWidget } from "@/components/shared/dashboard/seo-performance-widget";
import { URLIndexingWidget } from "@/components/shared/dashboard/url-indexing-widget";
import Link from "next/link";
import { Icon } from "@iconify/react";

export const metadata: Metadata = {
  title: "SEO & Indexing | Dashboard",
  description: "Manage SEO performance and URL indexing for your website",
};

export default function SEODashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <span className="mx-2">/</span>
            <span>SEO & Indexing</span>
          </nav>
          <h1 className="text-2xl font-bold">SEO & Indexing</h1>
          <p className="text-muted-foreground mt-1">
            Monitor search performance and manage Google indexing
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/seo-templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Icon icon="lucide:file-text" className="h-4 w-4" />
            SEO Templates
          </Link>
          <Link
            href="/dashboard/all-pages"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Icon icon="lucide:layout-list" className="h-4 w-4" />
            All Pages
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* URL Indexing Widget - Takes 1 column */}
        <div className="lg:col-span-1">
          <URLIndexingWidget />

          {/* Quick Links Card */}
          <div className="mt-6 p-4 bg-white border rounded-lg">
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <div className="space-y-2">
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="mdi:google" className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Google Search Console</span>
                <Icon icon="lucide:external-link" className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </a>
              <a
                href="https://pagespeed.web.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="lucide:gauge" className="h-5 w-5 text-green-600" />
                <span className="text-sm">PageSpeed Insights</span>
                <Icon icon="lucide:external-link" className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </a>
              <a
                href="https://www.google.com/webmasters/tools/mobile-friendly"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="lucide:smartphone" className="h-5 w-5 text-purple-600" />
                <span className="text-sm">Mobile-Friendly Test</span>
                <Icon icon="lucide:external-link" className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </a>
              <a
                href="https://www.psmphuket.com/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="lucide:map" className="h-5 w-5 text-orange-600" />
                <span className="text-sm">View Sitemap</span>
                <Icon icon="lucide:external-link" className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Icon icon="lucide:settings" className="h-4 w-4" />
              Setup Required
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              To enable Search Console data and instant indexing:
            </p>
            <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
              <li>Create a Google Cloud project</li>
              <li>Enable the Indexing API and Search Console API</li>
              <li>Create a Service Account with proper permissions</li>
              <li>Add the service account email as an owner in Search Console</li>
              <li>Set environment variables in Vercel</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs font-mono text-blue-900">
              GOOGLE_INDEXING_CREDENTIALS
            </div>
          </div>
        </div>

        {/* Performance Widget - Takes 2 columns */}
        <div className="lg:col-span-2">
          <SEOPerformanceWidget />
        </div>
      </div>
    </div>
  );
}

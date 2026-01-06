"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";

interface PerformanceRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PerformanceData {
  rows?: PerformanceRow[];
  totals?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

type ViewType = "pages" | "queries";

export function SEOPerformanceWidget() {
  const [activeView, setActiveView] = useState<ViewType>("queries");
  const [days, setDays] = useState(28);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/google-indexing/performance?type=${activeView}&days=${days}&limit=20`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch performance data");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeView, days]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatCTR = (ctr: number) => {
    return (ctr * 100).toFixed(2) + "%";
  };

  const formatPosition = (pos: number) => {
    return pos.toFixed(1);
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return "text-green-600";
    if (position <= 10) return "text-blue-600";
    if (position <= 20) return "text-yellow-600";
    return "text-red-500";
  };

  const getCTRColor = (ctr: number) => {
    const ctrPercent = ctr * 100;
    if (ctrPercent >= 5) return "text-green-600";
    if (ctrPercent >= 2) return "text-blue-600";
    if (ctrPercent >= 1) return "text-yellow-600";
    return "text-gray-500";
  };

  // Calculate totals from rows if totals not provided
  const totals = data?.totals || {
    clicks: data?.rows?.reduce((sum, r) => sum + r.clicks, 0) || 0,
    impressions: data?.rows?.reduce((sum, r) => sum + r.impressions, 0) || 0,
    ctr:
      (data?.rows?.reduce((sum, r) => sum + r.clicks, 0) || 0) /
        (data?.rows?.reduce((sum, r) => sum + r.impressions, 0) || 1) || 0,
    position:
      (data?.rows?.reduce((sum, r) => sum + r.position, 0) || 0) /
        (data?.rows?.length || 1) || 0,
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon icon="mdi:google" className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              Search Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Google Search Console data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 3 months</option>
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <Icon
              icon="lucide:refresh-cw"
              className={cn("h-4 w-4", loading && "animate-spin")}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Icon icon="lucide:mouse-pointer-click" className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Clicks</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-2xl font-bold text-blue-700">
                {formatNumber(totals.clicks)}
              </span>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Icon icon="lucide:eye" className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-600 font-medium">Impressions</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold text-purple-700">
                {formatNumber(totals.impressions)}
              </span>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Icon icon="lucide:percent" className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Avg. CTR</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-14" />
            ) : (
              <span className="text-2xl font-bold text-green-700">
                {formatCTR(totals.ctr)}
              </span>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Icon icon="lucide:bar-chart-3" className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">Avg. Position</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-2xl font-bold text-orange-700">
                {formatPosition(totals.position)}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon icon="lucide:alert-triangle" className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Search Console Not Connected</p>
                <p className="text-sm text-yellow-700 mt-1">{error}</p>
                <p className="text-xs text-yellow-600 mt-2">
                  To enable this feature, set the <code className="bg-yellow-100 px-1 rounded">GOOGLE_INDEXING_CREDENTIALS</code> environment variable.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Pages/Queries */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ViewType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="queries" className="flex items-center gap-2">
              <Icon icon="lucide:search" className="h-4 w-4" />
              Top Queries
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <Icon icon="lucide:file-text" className="h-4 w-4" />
              Top Pages
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeView}>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.rows && data.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">
                        {activeView === "queries" ? "Search Query" : "Page URL"}
                      </TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.slice(0, 15).map((row, index) => {
                      const key = row.keys[0] || "";
                      const displayKey =
                        activeView === "pages"
                          ? key.replace("https://www.psmphuket.com", "")
                          : key;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <Tooltip content={<p className="max-w-[400px]">{key}</p>}>
                              <span className="truncate block max-w-[300px] cursor-help">
                                {displayKey}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatNumber(row.clicks)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatNumber(row.impressions)}
                          </TableCell>
                          <TableCell className={cn("text-right", getCTRColor(row.ctr))}>
                            {formatCTR(row.ctr)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-medium",
                              getPositionColor(row.position)
                            )}
                          >
                            <Badge
                              variant="outline"
                              className={cn(
                                "tabular-nums",
                                row.position <= 3 && "border-green-300 bg-green-50",
                                row.position > 3 &&
                                  row.position <= 10 &&
                                  "border-blue-300 bg-blue-50",
                                row.position > 10 &&
                                  row.position <= 20 &&
                                  "border-yellow-300 bg-yellow-50",
                                row.position > 20 && "border-red-200 bg-red-50"
                              )}
                            >
                              {formatPosition(row.position)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icon icon="lucide:search-x" className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No data available for this period</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer with link to GSC */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Data from Google Search Console. Last {days} days.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Icon icon="lucide:external-link" className="h-3.5 w-3.5" />
              Open Search Console
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

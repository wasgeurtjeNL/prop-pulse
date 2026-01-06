"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import AllPagesSeoModal from "./all-pages-seo-modal";

interface Page {
  id: string;
  url: string;
  title: string;
  category: string;
  type: "static" | "database";
  source: string;
  metaTitle: string | null;
  metaDescription: string | null;
  seoStatus: "code" | "auto" | "good" | "partial" | "missing";
  published: boolean;
  updatedAt: string | null;
  canEdit: boolean;
}

interface Stats {
  total: number;
  static: number;
  database: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  seoStatus: {
    code: number;
    auto: number;
    good: number;
    partial: number;
    missing: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function AllPagesTable() {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [seoFilter, setSeoFilter] = useState<string>("all");
  
  // SEO Modal state
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  const fetchPages = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/all-pages?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = await response.json();

      if (data.success) {
        setPages(data.data);
        setFilteredPages(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error);
      toast.error("Failed to load pages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages(currentPage);
  }, [fetchPages, currentPage]);

  // Apply filters
  useEffect(() => {
    let result = pages;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.url.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }

    if (seoFilter !== "all") {
      result = result.filter((p) => p.seoStatus === seoFilter);
    }

    setFilteredPages(result);
  }, [pages, searchQuery, categoryFilter, typeFilter, seoFilter]);

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, { bg: string; icon: string }> = {
      main: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "ph:house" },
      auth: { bg: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: "ph:lock" },
      tools: { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: "ph:wrench" },
      docs: { bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: "ph:book" },
      legal: { bg: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400", icon: "ph:scales" },
      service: { bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: "ph:briefcase" },
      guide: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "ph:compass" },
      location: { bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: "ph:map-pin" },
      faq: { bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: "ph:question" },
      blog: { bg: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400", icon: "ph:article" },
      property: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "ph:buildings" },
      content: { bg: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400", icon: "ph:file-text" },
      listings: { bg: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400", icon: "ph:list" },
      user: { bg: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400", icon: "ph:user" },
    };

    const variant = variants[category] || {
      bg: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      icon: "ph:file",
    };

    return (
      <Badge className={`${variant.bg} gap-1 capitalize`}>
        <Icon icon={variant.icon} width={14} height={14} />
        {category}
      </Badge>
    );
  };

  const getSeoStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; icon: string; label: string }> = {
      code: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "ph:code", label: "In Code" },
      auto: { bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: "ph:robot", label: "Auto" },
      good: { bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: "ph:check-circle", label: "Good" },
      partial: { bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: "ph:warning", label: "Partial" },
      missing: { bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: "ph:x-circle", label: "Missing" },
    };

    const cfg = config[status] || config.missing;

    return (
      <Badge className={`${cfg.bg} gap-1`}>
        <Icon icon={cfg.icon} width={14} height={14} />
        {cfg.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string, source: string) => {
    if (type === "static") {
      return (
        <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 gap-1">
          <Icon icon="ph:file-code" width={14} height={14} />
          Static
        </Badge>
      );
    }
    
    const sourceLabels: Record<string, string> = {
      landing_page: "Landing Page",
      blog: "Blog",
      property: "Property",
    };

    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
        <Icon icon="ph:database" width={14} height={14} />
        {sourceLabels[source] || source}
      </Badge>
    );
  };

  const getEditLink = (page: Page) => {
    if (!page.canEdit) return null;
    
    switch (page.source) {
      case "landing_page":
        return `/dashboard/pages/edit/${page.id}`;
      case "blog":
        return `/dashboard/blogs/edit/${page.id}`;
      case "property":
        return `/dashboard/edit/${page.id}`;
      default:
        return null;
    }
  };

  const uniqueCategories = Array.from(new Set(pages.map((p) => p.category))).sort();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                <Icon icon="ph:files" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div 
            className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors"
            onClick={() => setTypeFilter(typeFilter === "static" ? "all" : "static")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-100 dark:bg-slate-900/30 p-2">
                <Icon icon="ph:file-code" className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Static</p>
                <p className="text-2xl font-bold">{stats.static}</p>
              </div>
            </div>
          </div>
          <div 
            className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            onClick={() => setTypeFilter(typeFilter === "database" ? "all" : "database")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
                <Icon icon="ph:database" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="text-2xl font-bold">{stats.database}</p>
              </div>
            </div>
          </div>
          <div 
            className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
            onClick={() => setSeoFilter(seoFilter === "partial" ? "all" : "partial")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-2">
                <Icon icon="ph:warning" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partial SEO</p>
                <p className="text-2xl font-bold">{stats.seoStatus.partial}</p>
              </div>
            </div>
          </div>
          <div 
            className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            onClick={() => setSeoFilter(seoFilter === "missing" ? "all" : "missing")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                <Icon icon="ph:x-circle" className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missing SEO</p>
                <p className="text-2xl font-bold">{stats.seoStatus.missing}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Icon
            icon="ph:magnifying-glass"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="static">Static</SelectItem>
            <SelectItem value="database">Database</SelectItem>
          </SelectContent>
        </Select>
        <Select value={seoFilter} onValueChange={setSeoFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="SEO Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SEO</SelectItem>
            <SelectItem value="code">🔵 In Code</SelectItem>
            <SelectItem value="auto">🔷 Auto</SelectItem>
            <SelectItem value="good">🟢 Good</SelectItem>
            <SelectItem value="partial">🟡 Partial</SelectItem>
            <SelectItem value="missing">🔴 Missing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredPages.length} of {pagination?.total || 0} pages
        {pagination && pagination.totalPages > 1 && ` (Page ${currentPage} of ${pagination.totalPages})`}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Page</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Icon icon="ph:spinner" className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Icon icon="ph:files" className="h-10 w-10" />
                    <p>No pages found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium line-clamp-1">{page.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{page.url}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(page.category)}</TableCell>
                  <TableCell>{getTypeBadge(page.type, page.source)}</TableCell>
                  <TableCell>{getSeoStatusBadge(page.seoStatus)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {page.updatedAt ? format(new Date(page.updatedAt), "dd MMM yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={page.url} target="_blank">
                        <Button variant="ghost" size="icon" title="View Page">
                          <Icon icon="ph:eye" className="h-4 w-4" />
                        </Button>
                      </Link>
                      {page.canEdit && (
                        <Tooltip content="Edit SEO Settings">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Edit SEO"
                            onClick={() => {
                              setSelectedPage(page);
                              setSeoModalOpen(true);
                            }}
                          >
                            <Icon icon="ph:magnifying-glass" className="h-4 w-4 text-purple-600" />
                          </Button>
                        </Tooltip>
                      )}
                      {page.canEdit && getEditLink(page) && (
                        <Link href={getEditLink(page)!}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Icon icon="ph:pencil" className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <Icon icon="ph:caret-double-left" className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              <Icon icon="ph:caret-left" className="h-4 w-4" />
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <Icon icon="ph:caret-right" className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={currentPage === pagination.totalPages}
            >
              <Icon icon="ph:caret-double-right" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* SEO Edit Modal */}
      <AllPagesSeoModal
        open={seoModalOpen}
        onOpenChange={setSeoModalOpen}
        page={selectedPage}
        onSave={() => {
          fetchPages(currentPage);
          setSeoModalOpen(false);
        }}
      />
    </div>
  );
}

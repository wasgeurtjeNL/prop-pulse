"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import ViewLiveButton from "./view-live-button";

interface LandingPage {
  id: string;
  url: string;
  title: string;
  category: string;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  // SEO fields
  seoStatus: "missing" | "partial" | "optimized";
  seoScore: number | null;
  aiGenerated: boolean;
  metaTitleLength: number;
  metaDescriptionLength: number;
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  seo: {
    missing: number;
    partial: number;
    optimized: number;
  };
}

interface SeoTemplate {
  id: string;
  name: string;
  displayName: string;
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

export default function LandingPagesTable() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    published: 0, 
    draft: 0,
    seo: { missing: 0, partial: 0, optimized: 0 }
  });
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [seoFilter, setSeoFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<LandingPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<SeoTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const fetchPages = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (publishedFilter !== "all") params.set("published", publishedFilter);
      if (seoFilter !== "all") params.set("seoStatus", seoFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/landing-pages?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPages(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error);
      toast.error("Failed to load landing pages");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, publishedFilter, seoFilter, searchQuery]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/seo-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        const defaultTemplate = data.find((t: SeoTemplate) => t.name === "default");
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  useEffect(() => {
    fetchPages(currentPage);
  }, [fetchPages, currentPage]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, publishedFilter, seoFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 on search
      fetchPages(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, fetchPages]);

  const handleTogglePublished = async (page: LandingPage) => {
    setTogglingId(page.id);
    try {
      const response = await fetch(`/api/landing-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !page.published }),
      });

      if (response.ok) {
        toast.success(page.published ? "Page unpublished" : "Page published");
        fetchPages();
      } else {
        toast.error("Failed to update page status");
      }
    } catch (error) {
      toast.error("Failed to update page status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteClick = (page: LandingPage) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/landing-pages/${pageToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Page deleted successfully");
        setDeleteDialogOpen(false);
        setPageToDelete(null);
        fetchPages();
      } else {
        toast.error("Failed to delete page");
      }
    } catch (error) {
      toast.error("Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pages.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkOptimize = async () => {
    if (selectedIds.size === 0) {
      toast.error("No pages selected");
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch("/api/landing-pages/bulk-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageIds: Array.from(selectedIds),
          templateId: selectedTemplateId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setOptimizeDialogOpen(false);
        setSelectedIds(new Set());
        fetchPages();
      } else {
        toast.error(data.error || "Optimization failed");
      }
    } catch (error) {
      toast.error("Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, { bg: string; icon: string; label: string }> = {
      service: {
        bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: "ph:briefcase",
        label: "Service",
      },
      guide: {
        bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        icon: "ph:book-open",
        label: "Guide",
      },
      location: {
        bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: "ph:map-pin",
        label: "Location",
      },
      faq: {
        bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        icon: "ph:question",
        label: "FAQ",
      },
    };

    const variant = variants[category] || {
      bg: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      icon: "ph:file",
      label: category,
    };

    return (
      <Badge className={`${variant.bg} gap-1`}>
        <Icon icon={variant.icon} width={14} height={14} />
        {variant.label}
      </Badge>
    );
  };

  const getSeoStatusBadge = (page: LandingPage) => {
    const config = {
      missing: {
        bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: "ph:warning-circle",
        label: "Missing SEO",
      },
      partial: {
        bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: "ph:warning",
        label: "Partial",
      },
      optimized: {
        bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: "ph:check-circle",
        label: "Optimized",
      },
    };

    const status = config[page.seoStatus];

    const tooltipContent = (
      <div className="space-y-1 text-xs">
        <p><strong>Meta Title:</strong> {page.metaTitleLength}/60 chars</p>
        <p><strong>Meta Description:</strong> {page.metaDescriptionLength}/155 chars</p>
        {page.aiGenerated && (
          <p className="text-green-600 dark:text-green-400">
            <Icon icon="ph:robot" className="inline mr-1" />
            AI Generated
          </p>
        )}
      </div>
    );

    return (
      <Tooltip content={tooltipContent} side="top">
        <Badge className={`${status.bg} gap-1 cursor-help`}>
          <Icon icon={status.icon} width={14} height={14} />
          {page.seoScore !== null ? `${page.seoScore}%` : status.label}
        </Badge>
      </Tooltip>
    );
  };

  const getPublishedBadge = (published: boolean) => {
    return published ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
        <Icon icon="ph:check-circle" width={14} height={14} />
        Published
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1">
        <Icon icon="ph:pencil-simple" width={14} height={14} />
        Draft
      </Badge>
    );
  };

  const allSelected = pages.length > 0 && selectedIds.size === pages.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* SEO Health Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <Icon icon="ph:files" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <Icon icon="ph:check-circle" className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{stats.published}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-2">
              <Icon icon="ph:pencil-simple" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
          </div>
        </div>
        {/* SEO Stats */}
        <div 
          className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          onClick={() => setSeoFilter(seoFilter === "missing" ? "all" : "missing")}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <Icon icon="ph:warning-circle" className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missing SEO</p>
              <p className="text-2xl font-bold text-red-600">{stats.seo?.missing || 0}</p>
            </div>
          </div>
        </div>
        <div 
          className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors"
          onClick={() => setSeoFilter(seoFilter === "partial" ? "all" : "partial")}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-2">
              <Icon icon="ph:warning" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Partial SEO</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.seo?.partial || 0}</p>
            </div>
          </div>
        </div>
        <div 
          className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
          onClick={() => setSeoFilter(seoFilter === "optimized" ? "all" : "optimized")}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <Icon icon="ph:check-circle" className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Optimized</p>
              <p className="text-2xl font-bold text-green-600">{stats.seo?.optimized || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {someSelected && (
        <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} page{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            size="sm"
            onClick={() => setOptimizeDialogOpen(true)}
            className="gap-2"
          >
            <Icon icon="ph:magic-wand" className="h-4 w-4" />
            AI Optimize Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear Selection
          </Button>
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
            <SelectItem value="service">Services</SelectItem>
            <SelectItem value="guide">Guides</SelectItem>
            <SelectItem value="location">Locations</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={seoFilter} onValueChange={setSeoFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="SEO Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SEO</SelectItem>
            <SelectItem value="missing">🔴 Missing</SelectItem>
            <SelectItem value="partial">🟡 Partial</SelectItem>
            <SelectItem value="optimized">🟢 Optimized</SelectItem>
          </SelectContent>
        </Select>
        <Select value={publishedFilter} onValueChange={setPublishedFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Published</SelectItem>
            <SelectItem value="false">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[280px]">Page</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>SEO Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Icon
                    icon="ph:spinner"
                    className="h-8 w-8 animate-spin mx-auto text-muted-foreground"
                  />
                </TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Icon icon="ph:files" className="h-10 w-10" />
                    <p>No landing pages found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id} className={selectedIds.has(page.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(page.id)}
                      onCheckedChange={(checked) => handleSelectOne(page.id, !!checked)}
                      aria-label={`Select ${page.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium line-clamp-1">{page.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {page.url}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(page.category)}</TableCell>
                  <TableCell>{getSeoStatusBadge(page)}</TableCell>
                  <TableCell>{getPublishedBadge(page.published)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(page.updatedAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ViewLiveButton href={page.url} variant="icon" />
                      <Link href={`/dashboard/pages/edit/${page.id}`}>
                        <Button variant="ghost" size="icon" title="Edit Page">
                          <Icon icon="ph:pencil" className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Icon icon="ph:dots-three-vertical" className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={page.url} target="_blank">
                              <Icon icon="ph:eye" className="mr-2 h-4 w-4" />
                              View Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/pages/edit/${page.id}`}>
                              <Icon icon="ph:pencil" className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedIds(new Set([page.id]));
                              setOptimizeDialogOpen(true);
                            }}
                          >
                            <Icon icon="ph:magic-wand" className="mr-2 h-4 w-4" />
                            AI Optimize
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTogglePublished(page)}
                            disabled={togglingId === page.id}
                          >
                            <Icon
                              icon={page.published ? "ph:eye-slash" : "ph:eye"}
                              className="mr-2 h-4 w-4"
                            />
                            {page.published ? "Unpublish" : "Publish"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteClick(page)}
                          >
                            <Icon icon="ph:trash" className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            Page {currentPage} of {pagination.totalPages} ({pagination.total} items)
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Landing Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{pageToDelete?.title}&quot;? This action
              cannot be undone. Any internal links pointing to this page will also
              be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Icon icon="ph:spinner" className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Icon icon="ph:trash" className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Optimize Dialog */}
      <Dialog open={optimizeDialogOpen} onOpenChange={setOptimizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="ph:magic-wand" className="h-5 w-5 text-primary" />
              AI Optimize SEO
            </DialogTitle>
            <DialogDescription>
              Generate optimized meta titles and descriptions for {selectedIds.size} selected page{selectedIds.size !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">SEO Template</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The template defines how AI generates SEO content
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                <Icon icon="ph:info" className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Existing meta titles and descriptions will be <strong>replaced</strong> with AI-generated content.
                  Maximum 10 pages can be optimized at once.
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOptimizeDialogOpen(false)}
              disabled={isOptimizing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkOptimize}
              disabled={isOptimizing || selectedIds.size === 0}
              className="gap-2"
            >
              {isOptimizing ? (
                <>
                  <Icon icon="ph:spinner" className="h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Icon icon="ph:magic-wand" className="h-4 w-4" />
                  Optimize {selectedIds.size} Page{selectedIds.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

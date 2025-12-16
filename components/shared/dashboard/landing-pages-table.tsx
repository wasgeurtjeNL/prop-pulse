"use client";

import { useEffect, useState } from "react";
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
}

interface Stats {
  total: number;
  published: number;
  draft: number;
}

export default function LandingPagesTable() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, draft: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<LandingPage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (publishedFilter !== "all") params.set("published", publishedFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/landing-pages?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPages(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error);
      toast.error("Failed to load landing pages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [categoryFilter, publishedFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPages();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleTogglePublished = async (page: LandingPage) => {
    setTogglingId(page.id);
    try {
      const response = await fetch(`/api/landing-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !page.published }),
      });

      if (response.ok) {
        toast.success(
          page.published ? "Page unpublished" : "Page published"
        );
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="service">Services</SelectItem>
            <SelectItem value="guide">Guides</SelectItem>
            <SelectItem value="location">Locations</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={publishedFilter} onValueChange={setPublishedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
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
              <TableHead className="w-[300px]">Page</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Icon
                    icon="ph:spinner"
                    className="h-8 w-8 animate-spin mx-auto text-muted-foreground"
                  />
                </TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Icon icon="ph:files" className="h-10 w-10" />
                    <p>No landing pages found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium line-clamp-1">{page.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {page.url}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(page.category)}</TableCell>
                  <TableCell>{getPublishedBadge(page.published)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(page.updatedAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Direct View Live Button */}
                      <ViewLiveButton href={page.url} variant="icon" />
                      
                      {/* Edit Button */}
                      <Link href={`/dashboard/pages/edit/${page.id}`}>
                        <Button variant="ghost" size="icon" title="Edit Page">
                          <Icon icon="ph:pencil" className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      {/* More Actions Dropdown */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Landing Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{pageToDelete?.title}"? This action
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
    </div>
  );
}


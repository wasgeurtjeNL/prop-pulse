"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { FileText, Eye, EyeOff, Pencil, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BlogDeleteButton from "./blog-delete-button";
import BlogPublishToggle from "./blog-publish-toggle";
import ViewLiveButton from "./view-live-button";
import { toast } from "sonner";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  tag: string | null;
  updatedAt: string;
  author: {
    name: string;
    image: string | null;
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

interface Stats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  newInLast30Days: number;
}

const ITEMS_PER_PAGE = 10;

export default function BlogsList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogs = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/blogs?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = await response.json();

      if (data.success) {
        setBlogs(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast.error("Failed to load blog posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [fetchBlogs, currentPage]);

  const handleRefresh = () => {
    fetchBlogs(currentPage);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Posts</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalBlogs}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.publishedBlogs}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Drafts</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.draftBlogs}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Last 30 Days</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.newInLast30Days}</p>
          </div>
        </div>
      )}

      {/* Blog List */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">All Posts</h3>
          {pagination && (
            <span className="text-sm text-muted-foreground">
              Showing {blogs.length} of {pagination.total} posts
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <Icon icon="ph:spinner" className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first blog post to get started
            </p>
            <Link href="/dashboard/blogs/add">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Cover Image */}
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{blog.title}</h4>
                      {blog.tag && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {blog.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>By {blog.author.name}</span>
                      <span>•</span>
                      <span>
                        Updated {formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <BlogPublishToggle
                    blogId={blog.id}
                    published={blog.published}
                  />
                  
                  {/* View Live Button */}
                  {blog.published && (
                    <ViewLiveButton 
                      href={`/blogs/${blog.slug}`} 
                      variant="icon" 
                    />
                  )}
                  
                  <Link href={`/dashboard/blogs/edit/${blog.id}`}>
                    <Button variant="ghost" size="sm" title="Edit Blog">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <BlogDeleteButton 
                    blogId={blog.id} 
                    title={blog.title} 
                    onDelete={handleRefresh}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  );
}

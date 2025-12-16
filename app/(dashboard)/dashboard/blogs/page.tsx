import { getAllBlogs, getBlogStats } from "@/lib/actions/blog.actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Eye, EyeOff, Pencil, Trash2, Sparkles, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BlogDeleteButton from "@/components/shared/dashboard/blog-delete-button";
import BlogPublishToggle from "@/components/shared/dashboard/blog-publish-toggle";
import ViewLiveButton from "@/components/shared/dashboard/view-live-button";

export default async function BlogsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const [blogs, stats] = await Promise.all([
    getAllBlogs(),
    getBlogStats(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog Posts</h2>
          <p className="text-muted-foreground mt-1">
            Manage your blog posts and articles
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/blogs/generate">
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Sparkles className="h-4 w-4" />
              AI Generator
            </Button>
          </Link>
          <Link href="/dashboard/blogs/smart-generator">
            <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              <Sparkles className="h-4 w-4" />
              Smart AI (Beta)
            </Button>
          </Link>
          <Link href="/dashboard/blogs/add">
            <Button variant="outline" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Handmatig
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
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

      {/* Blog List */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">All Posts</h3>
        </div>
        
        {blogs.length === 0 ? (
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
                  
                  <BlogDeleteButton blogId={blog.id} title={blog.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



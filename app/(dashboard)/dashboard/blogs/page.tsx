import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import BlogsList from "@/components/shared/dashboard/blogs-list";

export default async function BlogsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

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
              Manual
            </Button>
          </Link>
        </div>
      </div>

      {/* Blog List with Pagination */}
      <BlogsList />
    </div>
  );
}



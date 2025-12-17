import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getBlogById } from "@/lib/actions/blog.actions";
import BlogForm from "@/components/shared/forms/blog-form";

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");

  const { id } = await params;
  const blog = await getBlogById(id);

  if (!blog) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Post</h2>
          <p className="text-muted-foreground mt-1">
            Update your blog article
          </p>
        </div>
      </div>
      <BlogForm blog={blog} />
    </div>
  );
}






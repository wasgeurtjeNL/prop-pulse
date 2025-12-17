import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import BlogForm from "@/components/shared/forms/blog-form";

export default async function AddBlogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Post</h2>
          <p className="text-muted-foreground mt-1">
            Write and publish a new blog article
          </p>
        </div>
      </div>
      <BlogForm />
    </div>
  );
}






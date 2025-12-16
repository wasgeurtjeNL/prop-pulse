import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createBlog } from "@/lib/actions/blog.actions";
import { BlogFormData } from "@/lib/validations/blog";

// POST: Create a new blog post
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Transform to match BlogFormData structure
    const blogData: BlogFormData = {
      title: body.title,
      slug: body.slug || "",
      excerpt: body.excerpt || "",
      content: body.content || "",
      coverImage: body.coverImage || null,
      coverImageAlt: body.coverImageAlt || "",
      tag: body.tag || "",
      metaTitle: body.metaTitle || "",
      metaDescription: body.metaDescription || "",
      published: body.isPublished || false,
    };

    // Validate required fields
    if (!blogData.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!blogData.content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const result = await createBlog(blogData);

    return NextResponse.json({
      success: true,
      blog: result.blog,
    });
  } catch (error: any) {
    console.error("Blog creation error:", error);
    const message = error?.message || "Failed to create blog";
    const status =
      typeof message === "string" && message.toLowerCase().includes("already exists")
        ? 409
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}


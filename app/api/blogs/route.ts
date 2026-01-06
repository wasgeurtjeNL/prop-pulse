import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createBlog, getPublishedBlogs } from "@/lib/actions/blog.actions";
import { BlogFormData } from "@/lib/validations/blog";

// GET: List all published blogs
export async function GET() {
  try {
    const blogs = await getPublishedBlogs();
    return NextResponse.json({ blogs });
  } catch (error: any) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// POST: Create a new blog post
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Helper to truncate string to max length (smart truncation at word boundary)
    const truncateString = (str: string, maxLength: number): string => {
      if (!str || str.length <= maxLength) return str;
      // Try to cut at last space before maxLength-3 (for "...")
      const cutPoint = str.lastIndexOf(' ', maxLength - 3);
      if (cutPoint > maxLength * 0.5) {
        return str.substring(0, cutPoint) + '...';
      }
      // Fall back to hard cut
      return str.substring(0, maxLength - 3) + '...';
    };

    // Transform to match BlogFormData structure
    const blogData: BlogFormData = {
      title: body.title,
      slug: body.slug || "",
      excerpt: body.excerpt || "",
      content: body.content || "",
      coverImage: body.coverImage || null,
      coverImageAlt: body.coverImageAlt || "",
      tag: body.tag || "",
      metaTitle: truncateString(body.metaTitle || "", 70), // Truncate to SEO-friendly 70 chars
      metaDescription: truncateString(body.metaDescription || "", 160), // Truncate to 160 chars
      published: body.isPublished || false,
      // NEW: SEO data from AI keyword research
      primaryKeyword: body.primaryKeyword,
      secondaryKeywords: body.secondaryKeywords,
      searchIntent: body.searchIntent,
      researchContent: body.researchContent,
      researchSources: body.researchSources,
      researchProvider: body.researchProvider,
      sourceTopicId: body.sourceTopicId,
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


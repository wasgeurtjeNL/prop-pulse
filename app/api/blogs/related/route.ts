import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/blogs/related?slug=current-blog-slug&limit=3
 * 
 * Returns related blogs based on:
 * 1. Same tag (highest priority)
 * 2. Same category
 * 3. Recent blogs as fallback
 * 
 * This API ensures links are always valid since it returns current slugs from the database.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentSlug = searchParams.get("slug");
    const limit = Math.min(parseInt(searchParams.get("limit") || "3"), 10);

    if (!currentSlug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 }
      );
    }

    // First, get the current blog to find its tag and category
    const currentBlog = await prisma.blog.findUnique({
      where: { slug: currentSlug },
      select: {
        id: true,
        tag: true,
        categoryId: true,
      },
    });

    if (!currentBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Build query conditions for related blogs
    const relatedBlogs = await prisma.blog.findMany({
      where: {
        published: true,
        slug: { not: currentSlug }, // Exclude current blog
        OR: [
          // Same tag (if exists)
          ...(currentBlog.tag ? [{ tag: currentBlog.tag }] : []),
          // Same category (if exists)
          ...(currentBlog.categoryId ? [{ categoryId: currentBlog.categoryId }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        coverImageAlt: true,
        tag: true,
        publishedAt: true,
        content: true, // Needed for read time calculation
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { publishedAt: "desc" },
      ],
      take: limit,
    });

    // If we don't have enough related blogs, fill with recent blogs
    let finalBlogs = relatedBlogs;
    
    if (relatedBlogs.length < limit) {
      const existingIds = relatedBlogs.map(b => b.id);
      existingIds.push(currentBlog.id); // Also exclude current blog
      
      const recentBlogs = await prisma.blog.findMany({
        where: {
          published: true,
          id: { notIn: existingIds },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          coverImageAlt: true,
          tag: true,
          publishedAt: true,
          content: true,
          author: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: limit - relatedBlogs.length,
      });

      finalBlogs = [...relatedBlogs, ...recentBlogs];
    }

    // Calculate read time for each blog and remove full content from response
    const blogsWithReadTime = finalBlogs.map(blog => {
      // Strip HTML and count words
      const plainText = blog.content.replace(/<[^>]*>/g, ' ');
      const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
      const readTime = Math.max(1, Math.ceil(words.length / 200));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content, ...blogWithoutContent } = blog;
      return {
        ...blogWithoutContent,
        readTime,
      };
    });

    return NextResponse.json({
      blogs: blogsWithReadTime,
      total: blogsWithReadTime.length,
    });
  } catch (error) {
    console.error("Error fetching related blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch related blogs" },
      { status: 500 }
    );
  }
}


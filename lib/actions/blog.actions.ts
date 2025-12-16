"use server";

import { revalidatePath } from "next/cache";
import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { slugify } from "../utils";
import { blogSchema, type BlogFormData } from "../validations/blog";
import { withRetry } from "../db-utils";

// Get all published blogs for the frontend
export async function getPublishedBlogs() {
  try {
    return await withRetry(() =>
      prisma.blog.findMany({
        where: {
          published: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
        include: {
          author: {
            select: { name: true, image: true },
          },
        },
      })
    );
  } catch (error) {
    console.error("Error fetching published blogs:", error);
    return [];
  }
}

// Get a single published blog by slug
export async function getPublishedBlogBySlug(slug: string) {
  try {
    return await withRetry(() =>
      prisma.blog.findFirst({
        where: {
          slug: slug,
          published: true,
        },
        include: {
          author: {
            select: { name: true, image: true },
          },
        },
      })
    );
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    return null;
  }
}

// Get all blogs for dashboard (including drafts)
export async function getAllBlogs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const blogs = await prisma.blog.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      author: {
        select: { name: true, image: true },
      },
    },
  });

  return blogs;
}

// Get blogs for the current user (agent)
export async function getAgentBlogs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const blogs = await prisma.blog.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      tag: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return blogs;
}

// Get a single blog by ID (for editing)
export async function getBlogById(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      author: {
        select: { name: true, image: true },
      },
    },
  });

  return blog;
}

// Create a new blog post
export async function createBlog(data: BlogFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Validate data
  const validatedData = blogSchema.parse(data);

  // Use custom slug if provided, otherwise generate from title
  let slug = validatedData.slug?.trim() 
    ? slugify(validatedData.slug) 
    : slugify(validatedData.title);
  
  // Ensure slug is never empty
  if (!slug) {
    slug = `blog-${Date.now()}`;
  }

  // Prevent duplicates (same slug OR same title, case-insensitive)
  const existingBlog = await prisma.blog.findFirst({
    where: {
      OR: [
        { slug },
        { title: { equals: validatedData.title, mode: "insensitive" as const } },
      ],
    },
    select: { id: true, slug: true, title: true },
  });

  if (existingBlog) {
    throw new Error(`A blog with this title/slug already exists: /blogs/${existingBlog.slug}`);
  }

  try {
    const blog = await prisma.blog.create({
      data: {
        title: validatedData.title,
        slug,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        coverImage: validatedData.coverImage as string || null,
        coverImageAlt: validatedData.coverImageAlt || null,
        tag: validatedData.tag || null,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        published: validatedData.published,
        publishedAt: validatedData.published ? new Date() : null,
        authorId: session.user.id,
      },
    });

    revalidatePath("/dashboard/blogs");
    revalidatePath("/blogs");

    return { success: true, blog };
  } catch (error) {
    console.error("Database Error:", error);

    // Check for Prisma unique constraint error
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === "P2002") {
        const target = prismaError.meta?.target?.[0] || "field";
        throw new Error(`A blog with this ${target} already exists`);
      }
    }

    if (error instanceof Error) {
      throw new Error(`Failed to create blog post: ${error.message}`);
    }
    throw new Error("Failed to create blog post");
  }
}

// Update a blog post
export async function updateBlog(id: string, data: BlogFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Validate data
  const validatedData = blogSchema.parse(data);

  try {
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      throw new Error("Blog not found");
    }

    // Check if user has permission (author or admin)
    const isAdmin = session.user.role === "ADMIN";
    const isAuthor = existingBlog.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      throw new Error("You do not have permission to edit this blog post");
    }

    // Prevent duplicates by title (case-insensitive) when changing title
    if (validatedData.title?.trim() && validatedData.title !== existingBlog.title) {
      const titleExists = await prisma.blog.findFirst({
        where: {
          id: { not: id },
          title: { equals: validatedData.title, mode: "insensitive" as const },
        },
        select: { id: true, slug: true },
      });
      if (titleExists) {
        throw new Error(`A blog with this title already exists: /blogs/${titleExists.slug}`);
      }
    }

    // Handle slug: use custom slug if provided, otherwise keep existing or generate from title
    let slug = existingBlog.slug;
    
    // If a custom slug is provided in the form, use it
    if (validatedData.slug?.trim()) {
      const newSlug = slugify(validatedData.slug);
      // Only proceed if slugify produced a valid result
      if (newSlug && newSlug !== existingBlog.slug) {
        // Check if new slug is unique
        const slugExists = await prisma.blog.findFirst({
          where: {
            slug: newSlug,
            id: { not: id },
          },
        });
        slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      } else if (newSlug) {
        // Same slug as before, keep it
        slug = newSlug;
      }
    } else if (existingBlog.title !== validatedData.title) {
      // No custom slug provided but title changed - generate new slug from title
      const newSlug = slugify(validatedData.title);
      if (newSlug) {
        const slugExists = await prisma.blog.findFirst({
          where: {
            slug: newSlug,
            id: { not: id },
          },
        });
        slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }
    
    // Ensure slug is never empty
    if (!slug) {
      slug = `blog-${Date.now()}`;
    }

    // Handle publishedAt
    let publishedAt = existingBlog.publishedAt;
    if (validatedData.published && !existingBlog.published) {
      // Being published for the first time
      publishedAt = new Date();
    } else if (!validatedData.published) {
      // Being unpublished
      publishedAt = null;
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title: validatedData.title,
        slug,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        coverImage: validatedData.coverImage as string || null,
        coverImageAlt: validatedData.coverImageAlt || null,
        tag: validatedData.tag || null,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        published: validatedData.published,
        publishedAt,
      },
    });

    revalidatePath("/dashboard/blogs");
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${blog.slug}`);

    return { success: true, blog };
  } catch (error) {
    console.error("Database Error:", error);
    
    // Check for Prisma unique constraint error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target?.[0] || 'field';
        throw new Error(`A blog with this ${target} already exists`);
      }
    }
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to update blog post: ${error.message}`);
    }
    throw new Error("Failed to update blog post");
  }
}

// Delete a blog post
export async function deleteBlog(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      throw new Error("Blog not found");
    }

    // Check if user has permission (author or admin)
    const isAdmin = session.user.role === "ADMIN";
    const isAuthor = blog.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      throw new Error("You do not have permission to delete this blog post");
    }

    await prisma.blog.delete({
      where: { id },
    });

    revalidatePath("/dashboard/blogs");
    revalidatePath("/blogs");

    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete blog post");
  }
}

// Toggle publish status
export async function toggleBlogPublished(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      throw new Error("Blog not found");
    }

    // Check if user has permission (author or admin)
    const isAdmin = session.user.role === "ADMIN";
    const isAuthor = blog.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      throw new Error("You do not have permission to modify this blog post");
    }

    const newPublishedState = !blog.published;

    await prisma.blog.update({
      where: { id },
      data: {
        published: newPublishedState,
        publishedAt: newPublishedState ? (blog.publishedAt || new Date()) : blog.publishedAt,
      },
    });

    revalidatePath("/dashboard/blogs");
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${blog.slug}`);

    return { success: true, published: newPublishedState };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to toggle blog status");
  }
}

// Get dashboard stats for blogs
export async function getBlogStats(userId?: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const whereClause = userId ? { authorId: userId } : {};

  const [totalBlogs, publishedBlogs, draftBlogs, newInLast30Days] = await Promise.all([
    prisma.blog.count({
      where: whereClause,
    }),

    prisma.blog.count({
      where: {
        ...whereClause,
        published: true,
      },
    }),

    prisma.blog.count({
      where: {
        ...whereClause,
        published: false,
      },
    }),

    prisma.blog.count({
      where: {
        ...whereClause,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  return {
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    newInLast30Days,
  };
}


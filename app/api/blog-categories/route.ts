    import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Fetch all categories (with hierarchy)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBlogs = searchParams.get("includeBlogs") === "true";
    const activeOnly = searchParams.get("activeOnly") !== "false"; // Default true

    const categories = await prisma.blogCategory.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        parent: true,
        children: {
          where: activeOnly ? { isActive: true } : {},
          orderBy: { order: "asc" }
        },
        ...(includeBlogs ? {
          blogs: {
            where: { published: true },
            select: { id: true, title: true, slug: true },
            take: 5,
            orderBy: { publishedAt: "desc" }
          },
          _count: {
            select: { blogs: true }
          }
        } : {})
      },
      orderBy: { order: "asc" }
    });

    // Build tree structure (only root categories with nested children)
    const rootCategories = categories.filter(c => !c.parentId);
    
    return NextResponse.json({
      categories,
      tree: rootCategories,
      total: categories.length
    });

  } catch (error: any) {
    console.error("Categories GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      slug, 
      description, 
      parentId, 
      icon, 
      color,
      metaTitle,
      metaDescription 
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.blogCategory.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 400 }
      );
    }

    // Get highest order number
    const maxOrder = await prisma.blogCategory.aggregate({
      _max: { order: true }
    });

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description,
        parentId,
        icon,
        color,
        metaTitle: metaTitle || name,
        metaDescription: metaDescription || description,
        order: (maxOrder._max.order || 0) + 1
      },
      include: {
        parent: true,
        children: true
      }
    });

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error: any) {
    console.error("Categories POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

// PATCH - Update a category
export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // If updating slug, check for conflicts
    if (updateData.slug) {
      const existing = await prisma.blogCategory.findFirst({
        where: {
          slug: updateData.slug,
          NOT: { id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        parent: true,
        children: true
      }
    });

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error: any) {
    console.error("Categories PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category has blogs
    const blogsCount = await prisma.blog.count({
      where: { categoryId: id }
    });

    if (blogsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${blogsCount} blogs. Move or delete blogs first.` },
        { status: 400 }
      );
    }

    // Check if category has children
    const childrenCount = await prisma.blogCategory.count({
      where: { parentId: id }
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${childrenCount} subcategories. Delete subcategories first.` },
        { status: 400 }
      );
    }

    await prisma.blogCategory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted"
    });

  } catch (error: any) {
    console.error("Categories DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}



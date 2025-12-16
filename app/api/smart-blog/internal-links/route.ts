import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

function normalizeLegacyUrl(inputUrl: string): string {
  const raw = (inputUrl || "").trim();
  let url = raw.startsWith("/") ? raw : `/${raw}`;
  url = url.replace(/^\/diensten\b/i, "/services");
  url = url.replace(/^\/gidsen\b/i, "/guides");
  url = url.replace(/^\/locaties\b/i, "/locations");
  url = url.replace(/\/{2,}/g, "/");
  return url;
}

async function mergeOrUpdateUrl(link: { id: string; url: string }, normalizedUrl: string) {
  if (link.url === normalizedUrl) return;

  const existing = await prisma.internalLink.findUnique({ where: { url: normalizedUrl } });
  if (existing) {
    // Merge the legacy link into the existing one, then remove legacy record.
    await prisma.internalLink.update({
      where: { id: existing.id },
      data: {
        priority: Math.max(existing.priority, 3),
        usageCount: existing.usageCount + 0, // keep existing; usages are tracked separately
        pageExists: existing.pageExists || true,
        isActive: existing.isActive || true,
      },
    });

    // Best-effort: if there are usages pointing at the legacy link id, re-point them.
    try {
      await prisma.linkUsage.updateMany({
        where: { linkId: link.id },
        data: { linkId: existing.id },
      });
    } catch {
      // LinkUsage model might not exist in some environments
    }

    await prisma.internalLink.delete({ where: { id: link.id } });
    return;
  }

  await prisma.internalLink.update({
    where: { id: link.id },
    data: { url: normalizedUrl },
  });
}

// GET - Retrieve all internal links with enhanced data
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const pageExists = searchParams.get("pageExists");
    const includeUsage = searchParams.get("includeUsage") === "true";

    let links: any[] = [];
    try {
      const whereClause: any = {};
      if (category) whereClause.category = category;
      if (pageExists !== null) whereClause.pageExists = pageExists === "true";

      links = await prisma.internalLink.findMany({
        where: whereClause,
        include: includeUsage ? {
          usages: {
            select: {
              id: true,
              anchorText: true,
              blogId: true,
              insertedAt: true,
              blog: {
                select: { title: true, slug: true }
              }
            },
            take: 10,
            orderBy: { insertedAt: 'desc' }
          },
          _count: {
            select: { usages: true }
          }
        } : undefined,
        orderBy: [{ priority: "desc" }, { usageCount: "desc" }, { createdAt: "desc" }]
      });
    } catch (e) {
      console.log("InternalLink model not available, returning empty array");
      return NextResponse.json({ links: [], summary: { total: 0 } });
    }

    // Normalize legacy Dutch URLs -> English (stored data cleanup)
    try {
      const legacyCandidates = links.filter(l => typeof l.url === "string" && /^\/(diensten|gidsen|locaties)\b/i.test(l.url));
      for (const l of legacyCandidates) {
        const normalizedUrl = normalizeLegacyUrl(l.url);
        if (normalizedUrl !== l.url) {
          await mergeOrUpdateUrl({ id: l.id, url: l.url }, normalizedUrl);
        }
      }
      // Re-fetch after cleanup to return canonical data
      if (legacyCandidates.length > 0) {
        const whereClause: any = {};
        if (category) whereClause.category = category;
        if (pageExists !== null) whereClause.pageExists = pageExists === "true";

        links = await prisma.internalLink.findMany({
          where: whereClause,
          include: includeUsage ? {
            usages: {
              select: {
                id: true,
                anchorText: true,
                blogId: true,
                insertedAt: true,
                blog: {
                  select: { title: true, slug: true }
                }
              },
              take: 10,
              orderBy: { insertedAt: 'desc' }
            },
            _count: {
              select: { usages: true }
            }
          } : undefined,
          orderBy: [{ priority: "desc" }, { usageCount: "desc" }, { createdAt: "desc" }]
        });
      }
    } catch (e) {
      console.log("Legacy URL normalization skipped:", e);
    }

    // Calculate summary stats
    const validLinks = links.filter(l => l.pageExists);
    const invalidLinks = links.filter(l => !l.pageExists);
    const categories = [...new Set(links.map(l => l.category).filter(Boolean))];

    return NextResponse.json({
      summary: {
        total: links.length,
        valid: validLinks.length,
        invalid: invalidLinks.length,
        categories,
        totalUsages: links.reduce((sum, l) => sum + (l.usageCount || 0), 0)
      },
      links: links.map(link => ({
        id: link.id,
        url: link.url,
        title: link.title,
        description: link.description || "",
        category: link.category || "page",
        subCategory: link.subCategory || null,
        keywords: link.keywords || "",
        anchorTexts: link.anchorTexts ? JSON.parse(link.anchorTexts) : [],
        priority: link.priority,
        usageCount: link.usageCount,
        isActive: link.isActive,
        pageExists: link.pageExists,
        lastChecked: link.lastChecked?.toISOString() || null,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
        ...(includeUsage && link.usages ? {
          recentUsages: link.usages,
          totalUsages: link._count?.usages || 0
        } : {})
      }))
    });

  } catch (error: any) {
    console.error("Get Internal Links Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get internal links" },
      { status: 500 }
    );
  }
}

// POST - Add new internal link with enhanced fields
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { url, title, description, category, subCategory, keywords, anchorTexts, priority } = data;

    if (!url || !title) {
      return NextResponse.json(
        { error: "URL and title are required" },
        { status: 400 }
      );
    }

    // Normalize URL (legacy dutch -> english + leading slash)
    const normalizedUrl = normalizeLegacyUrl(url);

    // Check if URL already exists
    const existing = await prisma.internalLink.findUnique({
      where: { url: normalizedUrl }
    });

    if (existing) {
      return NextResponse.json(
        { error: "A link with this URL already exists" },
        { status: 400 }
      );
    }

    // Prepare anchor texts as JSON string
    const anchorTextsJson = anchorTexts && Array.isArray(anchorTexts) 
      ? JSON.stringify(anchorTexts) 
      : null;

    const link = await prisma.internalLink.create({
      data: {
        url: normalizedUrl,
        title,
        description: description || "",
        category: category || "page",
        subCategory: subCategory || null,
        keywords: keywords || "",
        anchorTexts: anchorTextsJson,
        priority: priority || 1,
        isActive: true,
        pageExists: true // Assume exists when manually added
      }
    });

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        url: link.url,
        title: link.title,
        description: link.description,
        category: link.category,
        subCategory: link.subCategory,
        keywords: link.keywords,
        anchorTexts: anchorTextsJson ? JSON.parse(anchorTextsJson) : [],
        priority: link.priority,
        usageCount: link.usageCount,
        isActive: link.isActive,
        pageExists: link.pageExists
      }
    });

  } catch (error: any) {
    console.error("Add Internal Link Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add internal link" },
      { status: 500 }
    );
  }
}

// PUT - Update internal link
export async function PUT(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, url, title, description, category, keywords, priority, isActive } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    const link = await prisma.internalLink.update({
      where: { id },
      data: {
        url: url ? normalizeLegacyUrl(url) : undefined,
        title: title || undefined,
        description: description ?? undefined,
        category: category || undefined,
        keywords: keywords ?? undefined,
        priority: priority ?? undefined,
        isActive: isActive ?? undefined
      }
    });

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        url: link.url,
        title: link.title,
        description: link.description,
        category: link.category,
        keywords: link.keywords,
        priority: link.priority,
        usageCount: link.usageCount,
        isActive: link.isActive
      }
    });

  } catch (error: any) {
    console.error("Update Internal Link Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update internal link" },
      { status: 500 }
    );
  }
}

// DELETE - Remove internal link
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
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    await prisma.internalLink.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Link deleted successfully"
    });

  } catch (error: any) {
    console.error("Delete Internal Link Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete internal link" },
      { status: 500 }
    );
  }
}

// PATCH - Sync internal links from existing content (blogs, properties)
export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all published blogs
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      select: { title: true, slug: true, excerpt: true, tag: true }
    });

    // Get all active properties
    const properties = await prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { title: true, slug: true, shortDescription: true, type: true, category: true }
    });

    let addedCount = 0;

    // Try to add internal links - may fail if model not available
    try {
      // Add blog links
      for (const blog of blogs) {
        const url = `/blogs/${blog.slug}`;
        const existing = await prisma.internalLink.findUnique({ where: { url } });
        
        if (!existing) {
          await prisma.internalLink.create({
            data: {
              url,
              title: blog.title,
              description: blog.excerpt?.slice(0, 200) || "",
              category: "blog",
              keywords: blog.tag || "",
              priority: 2,
              isActive: true
            }
          });
          addedCount++;
        }
      }

      // Add property links
      for (const property of properties) {
        const url = `/properties/${property.slug}`;
        const existing = await prisma.internalLink.findUnique({ where: { url } });
        
        if (!existing) {
          await prisma.internalLink.create({
            data: {
              url,
              title: property.title,
              description: property.shortDescription?.slice(0, 200) || "",
              category: "property",
              keywords: `${property.type}, ${property.category}`.toLowerCase(),
              priority: 3,
              isActive: true
            }
          });
          addedCount++;
        }
      }

      // Get updated count
      const totalLinks = await prisma.internalLink.count();

      return NextResponse.json({
        success: true,
        message: `Synced ${addedCount} new links`,
        totalLinks,
        blogsFound: blogs.length,
        propertiesFound: properties.length
      });
    } catch (e) {
      // InternalLink model not available
      console.log("InternalLink model not available for sync");
      return NextResponse.json({
        success: false,
        message: "Internal links feature not available",
        totalLinks: 0,
        blogsFound: blogs.length,
        propertiesFound: properties.length
      });
    }

  } catch (error: any) {
    console.error("Sync Internal Links Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync internal links" },
      { status: 500 }
    );
  }
}


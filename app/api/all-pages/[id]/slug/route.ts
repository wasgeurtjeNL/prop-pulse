import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// Helper to normalize URLs (ensure leading slash, no trailing slash)
function normalizeUrl(url: string): string {
  let normalized = url.trim().toLowerCase();
  
  // Ensure leading slash
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }
  
  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  
  // Replace spaces with hyphens
  normalized = normalized.replace(/\s+/g, "-");
  
  // Remove invalid characters, keep only alphanumeric, hyphens, slashes
  normalized = normalized.replace(/[^a-z0-9\-\/]/g, "");
  
  // Remove consecutive hyphens
  normalized = normalized.replace(/-+/g, "-");
  
  return normalized;
}

// Check if URL already exists
async function urlExists(url: string, excludeId?: string, source?: string): Promise<boolean> {
  const normalizedUrl = normalizeUrl(url);
  
  // Check in different sources based on page type
  if (source === "blog") {
    const existing = await prisma.blog.findFirst({
      where: {
        slug: normalizedUrl.replace(/^\/blogs\//, "").replace(/^\//, ""),
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
    return !!existing;
  }
  
  if (source === "property") {
    const existing = await prisma.property.findFirst({
      where: {
        slug: normalizedUrl.replace(/^\/properties\//, "").replace(/^\//, ""),
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
    return !!existing;
  }
  
  if (source === "landing_page") {
    const existing = await prisma.landingPage.findFirst({
      where: {
        slug: normalizedUrl.replace(/^\//, ""),
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
    return !!existing;
  }
  
  // Check if redirect already points to this URL
  const existingRedirect = await prisma.urlRedirect.findFirst({
    where: { oldUrl: normalizedUrl },
  });
  
  return !!existingRedirect;
}

// Create redirect from old URL to new URL
async function createRedirect(oldUrl: string, newUrl: string, pageType: string): Promise<void> {
  const normalizedOld = normalizeUrl(oldUrl);
  const normalizedNew = normalizeUrl(newUrl);
  
  // Don't create redirect if URLs are the same
  if (normalizedOld === normalizedNew) return;
  
  // Check if redirect already exists
  const existing = await prisma.urlRedirect.findUnique({
    where: { oldUrl: normalizedOld },
  });
  
  if (existing) {
    // Update existing redirect to point to new URL
    await prisma.urlRedirect.update({
      where: { id: existing.id },
      data: { newUrl: normalizedNew, pageType },
    });
  } else {
    // Create new redirect
    await prisma.urlRedirect.create({
      data: {
        oldUrl: normalizedOld,
        newUrl: normalizedNew,
        statusCode: 301,
        pageType,
      },
    });
  }
  
  // Also update any redirects that were pointing to the old URL
  await prisma.urlRedirect.updateMany({
    where: { newUrl: normalizedOld },
    data: { newUrl: normalizedNew },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { source, oldUrl, newUrl } = await request.json();

    if (!source || !oldUrl || !newUrl) {
      return NextResponse.json(
        { error: "Source, oldUrl, and newUrl are required" },
        { status: 400 }
      );
    }

    const normalizedNewUrl = normalizeUrl(newUrl);
    const normalizedOldUrl = normalizeUrl(oldUrl);

    // Check if new URL is valid
    if (normalizedNewUrl.length < 2) {
      return NextResponse.json(
        { error: "URL must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check if new URL already exists (excluding current page)
    const exists = await urlExists(normalizedNewUrl, id, source);
    if (exists) {
      return NextResponse.json(
        { error: "This URL is already in use" },
        { status: 409 }
      );
    }

    // Update the page's slug based on source type
    let updatedSlug: string;
    
    switch (source) {
      case "blog":
        // Extract slug from full URL
        updatedSlug = normalizedNewUrl.replace(/^\/blogs\//, "").replace(/^\//, "");
        await prisma.blog.update({
          where: { id },
          data: { slug: updatedSlug },
        });
        break;

      case "property":
        updatedSlug = normalizedNewUrl.replace(/^\/properties\//, "").replace(/^\//, "");
        await prisma.property.update({
          where: { id },
          data: { slug: updatedSlug },
        });
        break;

      case "landing_page":
        updatedSlug = normalizedNewUrl.replace(/^\//, "");
        await prisma.landingPage.update({
          where: { id },
          data: { slug: updatedSlug },
        });
        break;

      case "nextjs":
        // Static pages can't have their URLs changed in code,
        // but we can create a redirect and update the SEO record
        return NextResponse.json(
          { error: "Static page URLs cannot be changed. They are defined in the code." },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { error: `Unknown source type: ${source}` },
          { status: 400 }
        );
    }

    // Create redirect from old URL to new URL
    await createRedirect(normalizedOldUrl, normalizedNewUrl, source);

    return NextResponse.json({
      success: true,
      oldUrl: normalizedOldUrl,
      newUrl: normalizedNewUrl,
      redirectCreated: normalizedOldUrl !== normalizedNewUrl,
    });
  } catch (error: any) {
    console.error("Slug Update Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update URL" },
      { status: 500 }
    );
  }
}

// GET: Check if a URL is available
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const source = searchParams.get("source");

    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(url);
    const exists = await urlExists(normalizedUrl, id, source || undefined);

    return NextResponse.json({
      url: normalizedUrl,
      available: !exists,
    });
  } catch (error: any) {
    console.error("URL Check Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check URL" },
      { status: 500 }
    );
  }
}

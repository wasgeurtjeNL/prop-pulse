import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper to calculate SEO status
function getSeoStatus(page: { 
  metaTitle: string | null; 
  metaDescription: string | null;
  seoScore?: number | null;
}): "missing" | "partial" | "optimized" {
  const hasTitle = page.metaTitle && page.metaTitle.length >= 30;
  const hasDescription = page.metaDescription && page.metaDescription.length >= 100;
  
  if (!hasTitle && !hasDescription) return "missing";
  if (!hasTitle || !hasDescription) return "partial";
  if (page.seoScore && page.seoScore >= 70) return "optimized";
  return "partial";
}

// GET - Fetch all landing pages with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const published = searchParams.get("published");
    const search = searchParams.get("search");
    const seoStatus = searchParams.get("seoStatus"); // New filter

    const where: any = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (published !== null && published !== "all") {
      where.published = published === "true";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
        { metaDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    // Use raw SQL directly - use only original columns to avoid schema mismatch
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        url,
        title,
        category,
        "metaTitle",
        "metaDescription",
        published,
        "createdAt",
        "updatedAt"
      FROM landing_page
      ORDER BY "updatedAt" DESC
    `);
    const pages = result as any[];

    // Add SEO status to each page - handle optional fields gracefully
    const pagesWithSeoStatus = pages.map((page: any) => ({
      id: page.id,
      url: page.url,
      title: page.title,
      category: page.category,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      published: page.published,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      // SEO fields with fallbacks
      aiGenerated: page.aiGenerated ?? page.ai_generated ?? false,
      seoScore: page.seoScore ?? page.seo_score ?? null,
      targetKeywords: page.targetKeywords ?? page.target_keywords ?? [],
      seoTemplateId: page.seoTemplateId ?? page.seo_template_id ?? null,
      seoStatus: getSeoStatus(page),
      metaTitleLength: page.metaTitle?.length || 0,
      metaDescriptionLength: page.metaDescription?.length || 0,
    }));

    // Filter by SEO status if specified
    let filteredPages = pagesWithSeoStatus;
    if (seoStatus && seoStatus !== "all") {
      filteredPages = pagesWithSeoStatus.filter((p) => p.seoStatus === seoStatus);
    }

    // Calculate SEO stats
    const seoStats = {
      missing: pagesWithSeoStatus.filter((p) => p.seoStatus === "missing").length,
      partial: pagesWithSeoStatus.filter((p) => p.seoStatus === "partial").length,
      optimized: pagesWithSeoStatus.filter((p) => p.seoStatus === "optimized").length,
    };

    // Get general stats
    const totalPages = await prisma.landingPage.count();
    const publishedCount = await prisma.landingPage.count({ where: { published: true } });
    const draftCount = await prisma.landingPage.count({ where: { published: false } });

    return NextResponse.json({
      success: true,
      data: filteredPages,
      stats: {
        total: totalPages,
        published: publishedCount,
        draft: draftCount,
        seo: seoStats,
      },
    });
  } catch (error) {
    console.error("Failed to fetch landing pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing pages" },
      { status: 500 }
    );
  }
}

// PATCH - Update a landing page
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
    }

    const updatedPage = await prisma.landingPage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedPage,
    });
  } catch (error) {
    console.error("Failed to update landing page:", error);
    return NextResponse.json(
      { error: "Failed to update landing page" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a landing page
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
    }

    // First delete any internal links pointing to this page
    const page = await prisma.landingPage.findUnique({
      where: { id },
      select: { url: true },
    });

    if (page) {
      await prisma.internalLink.deleteMany({
        where: { url: page.url },
      });
    }

    await prisma.landingPage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Landing page deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete landing page:", error);
    return NextResponse.json(
      { error: "Failed to delete landing page" },
      { status: 500 }
    );
  }
}




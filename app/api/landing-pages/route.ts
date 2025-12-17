import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    const pages = await prisma.landingPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        url: true,
        title: true,
        category: true,
        metaTitle: true,
        metaDescription: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get stats
    const stats = await prisma.landingPage.groupBy({
      by: ["category", "published"],
      _count: true,
    });

    const totalPages = await prisma.landingPage.count();
    const publishedCount = await prisma.landingPage.count({ where: { published: true } });
    const draftCount = await prisma.landingPage.count({ where: { published: false } });

    return NextResponse.json({
      success: true,
      data: pages,
      stats: {
        total: totalPages,
        published: publishedCount,
        draft: draftCount,
        byCategory: stats,
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




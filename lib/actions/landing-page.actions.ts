"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface LandingPageData {
  id: string;
  url: string;
  title: string;
  category: string;
  metaTitle: string | null;
  metaDescription: string | null;
  content: string;
  faq: any;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPageStats {
  total: number;
  published: number;
  draft: number;
  byCategory: {
    service: number;
    guide: number;
    location: number;
    faq: number;
  };
}

// Get all landing pages
export async function getAllLandingPages(filters?: {
  category?: string;
  published?: boolean;
  search?: string;
}) {
  try {
    const where: any = {};

    if (filters?.category && filters.category !== "all") {
      where.category = filters.category;
    }

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { url: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const pages = await prisma.landingPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: pages };
  } catch (error) {
    console.error("Failed to fetch landing pages:", error);
    return { success: false, error: "Failed to fetch landing pages" };
  }
}

// Get landing page stats
export async function getLandingPageStats(): Promise<LandingPageStats> {
  const [total, published, draft, serviceCount, guideCount, locationCount, faqCount] =
    await Promise.all([
      prisma.landingPage.count(),
      prisma.landingPage.count({ where: { published: true } }),
      prisma.landingPage.count({ where: { published: false } }),
      prisma.landingPage.count({ where: { category: "service" } }),
      prisma.landingPage.count({ where: { category: "guide" } }),
      prisma.landingPage.count({ where: { category: "location" } }),
      prisma.landingPage.count({ where: { category: "faq" } }),
    ]);

  return {
    total,
    published,
    draft,
    byCategory: {
      service: serviceCount,
      guide: guideCount,
      location: locationCount,
      faq: faqCount,
    },
  };
}

// Get single landing page by ID
export async function getLandingPageById(id: string) {
  try {
    const page = await prisma.landingPage.findUnique({
      where: { id },
    });

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    return { success: true, data: page };
  } catch (error) {
    console.error("Failed to fetch landing page:", error);
    return { success: false, error: "Failed to fetch landing page" };
  }
}

// Update landing page
export async function updateLandingPage(
  id: string,
  data: Partial<Omit<LandingPageData, "id" | "createdAt" | "updatedAt">>
) {
  try {
    const updatedPage = await prisma.landingPage.update({
      where: { id },
      data,
    });

    // Revalidate the page
    revalidatePath(updatedPage.url);
    revalidatePath("/dashboard/pages");

    return { success: true, data: updatedPage };
  } catch (error) {
    console.error("Failed to update landing page:", error);
    return { success: false, error: "Failed to update landing page" };
  }
}

// Toggle published status
export async function toggleLandingPagePublished(id: string) {
  try {
    const page = await prisma.landingPage.findUnique({
      where: { id },
      select: { published: true, url: true },
    });

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    const updatedPage = await prisma.landingPage.update({
      where: { id },
      data: { published: !page.published },
    });

    revalidatePath(page.url);
    revalidatePath("/dashboard/pages");

    return { success: true, data: updatedPage };
  } catch (error) {
    console.error("Failed to toggle landing page status:", error);
    return { success: false, error: "Failed to toggle status" };
  }
}

// Delete landing page
export async function deleteLandingPage(id: string) {
  try {
    const page = await prisma.landingPage.findUnique({
      where: { id },
      select: { url: true },
    });

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    // Delete internal links pointing to this page
    await prisma.internalLink.deleteMany({
      where: { url: page.url },
    });

    await prisma.landingPage.delete({
      where: { id },
    });

    revalidatePath("/dashboard/pages");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete landing page:", error);
    return { success: false, error: "Failed to delete landing page" };
  }
}


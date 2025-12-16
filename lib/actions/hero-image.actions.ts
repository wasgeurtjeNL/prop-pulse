"use server";

import prisma from "@/lib/prisma";
import { HeroDeviceType } from "@/lib/generated/prisma";

export interface HeroImageData {
  id: string;
  page: string;
  deviceType: HeroDeviceType;
  imageUrl: string;
  alt: string;
  fileName: string | null;
  originalUrl: string | null;
  width: number | null;
  height: number | null;
  isAiGenerated: boolean;
  aiPrompt: string | null;
  originalSize: number | null;
  optimizedSize: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all hero images for a specific page
 */
export async function getHeroImages(
  page: string = "home"
): Promise<{ success: boolean; data?: HeroImageData[]; error?: string }> {
  try {
    const heroImages = await prisma.heroImage.findMany({
      where: { page, isActive: true },
      orderBy: { deviceType: "asc" },
    });

    return { success: true, data: heroImages };
  } catch (error) {
    console.error("Error fetching hero images:", error);
    return { success: false, error: "Failed to fetch hero images" };
  }
}

/**
 * Get a specific hero image by page and device type
 */
export async function getHeroImageByDevice(
  page: string,
  deviceType: HeroDeviceType
): Promise<{ success: boolean; data?: HeroImageData | null; error?: string }> {
  try {
    const heroImage = await prisma.heroImage.findUnique({
      where: { page_deviceType: { page, deviceType } },
    });

    return { success: true, data: heroImage };
  } catch (error) {
    console.error("Error fetching hero image:", error);
    return { success: false, error: "Failed to fetch hero image" };
  }
}

/**
 * Get all hero images (for dashboard management)
 */
export async function getAllHeroImages(): Promise<{
  success: boolean;
  data?: HeroImageData[];
  error?: string;
}> {
  try {
    const heroImages = await prisma.heroImage.findMany({
      orderBy: [{ page: "asc" }, { deviceType: "asc" }],
    });

    return { success: true, data: heroImages };
  } catch (error) {
    console.error("Error fetching all hero images:", error);
    return { success: false, error: "Failed to fetch hero images" };
  }
}

/**
 * Update hero image alt text
 */
export async function updateHeroImageAlt(
  id: string,
  alt: string
): Promise<{ success: boolean; data?: HeroImageData; error?: string }> {
  try {
    const heroImage = await prisma.heroImage.update({
      where: { id },
      data: { alt },
    });

    return { success: true, data: heroImage };
  } catch (error) {
    console.error("Error updating hero image alt:", error);
    return { success: false, error: "Failed to update hero image" };
  }
}

/**
 * Delete a hero image
 */
export async function deleteHeroImage(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.heroImage.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting hero image:", error);
    return { success: false, error: "Failed to delete hero image" };
  }
}

/**
 * Restore hero image to original
 */
export async function restoreHeroImage(
  id: string
): Promise<{ success: boolean; data?: HeroImageData; error?: string }> {
  try {
    const existing = await prisma.heroImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Hero image not found" };
    }

    if (!existing.originalUrl) {
      return { success: false, error: "No original image to restore" };
    }

    const heroImage = await prisma.heroImage.update({
      where: { id },
      data: {
        imageUrl: existing.originalUrl,
        originalUrl: null,
        isAiGenerated: false,
        aiPrompt: null,
      },
    });

    return { success: true, data: heroImage };
  } catch (error) {
    console.error("Error restoring hero image:", error);
    return { success: false, error: "Failed to restore hero image" };
  }
}

/**
 * Get available pages that can have hero images
 */
export async function getAvailablePages(): Promise<{ value: string; label: string }[]> {
  return [
    { value: "home", label: "Homepage" },
    { value: "properties", label: "Properties Page" },
    { value: "contact", label: "Contact Page" },
    { value: "about", label: "About Page" },
  ];
}

/**
 * Get available device types
 */
export async function getDeviceTypes(): Promise<{ value: HeroDeviceType; label: string }[]> {
  return [
    { value: "DESKTOP", label: "Desktop (1920x1080 - 16:9)" },
    { value: "MOBILE", label: "Mobile (750x1334 - 9:16)" },
    { value: "TABLET", label: "Tablet (1024x1024 - 1:1)" },
  ];
}


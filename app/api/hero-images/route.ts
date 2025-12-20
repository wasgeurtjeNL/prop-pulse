import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { imagekit } from "@/lib/imagekit";
import { convertToWebP } from "@/lib/utils/image-utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API Route: Hero Image Management
 *
 * GET - Get all hero images for a page
 * POST - Upload or generate a new hero image
 */

// Hero image SEO helpers
function generateHeroAlt(page: string, deviceType: string): string {
  const pageNames: Record<string, string> = {
    home: "PSM Phuket - Premium Real Estate Investment",
    properties: "Browse Premium Properties in Thailand",
    contact: "Contact PSM Phuket Real Estate Experts",
    about: "About PSM Phuket - Your Trusted Real Estate Partner",
  };

  const deviceLabels: Record<string, string> = {
    DESKTOP: "desktop view",
    MOBILE: "mobile view",
    TABLET: "tablet view",
  };

  const pageName = pageNames[page] || `${page} page`;
  const deviceLabel = deviceLabels[deviceType] || "";

  return `${pageName} hero image - ${deviceLabel}`;
}

function generateHeroFilename(
  page: string,
  deviceType: string,
  suffix: string = "hero"
): string {
  const cleanPage = page.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const cleanDevice = deviceType.toLowerCase();
  const timestamp = Date.now();
  return `${cleanPage}-${cleanDevice}-${suffix}-${timestamp}.webp`;
}

function buildHeroImagePrompt(
  page: string,
  style: string = "professional"
): string {
  const styleDescriptors: Record<string, string> = {
    professional: "professional, clean, corporate, trustworthy",
    luxury: "luxurious, elegant, premium, sophisticated, golden hour lighting",
    modern: "modern, minimalist, contemporary, sleek design",
    tropical:
      "tropical paradise, palm trees, ocean views, resort-style living",
  };

  const pageContext: Record<string, string> = {
    home: "a stunning tropical real estate hero scene showcasing luxury villas and premium properties in Phuket or Pattaya, Thailand",
    properties:
      "a collection of premium real estate properties, modern architecture, tropical setting",
    contact:
      "a welcoming real estate office or consultation area, professional atmosphere",
    about:
      "a professional real estate team or modern office environment in Thailand",
  };

  const context = pageContext[page] || pageContext.home;
  const styleText = styleDescriptors[style] || styleDescriptors.professional;

  return [
    "Create a photorealistic, editorial-quality hero image for a real estate website.",
    `Scene: ${context}`,
    `Style: ${styleText}`,
    "Technical: Shot on full-frame DSLR, 24mm wide-angle lens, natural lighting",
    "Color mood: Premium warm palette with natural contrast",
    "Composition: Wide landscape format with space for text overlay on the left",
    "REQUIREMENTS:",
    "- NO text, watermarks, logos, or UI elements",
    "- NO people with identifiable faces",
    "- Photorealistic materials and lighting",
    "- High-end luxury real estate publication quality",
    "- Suitable for a hero banner with text overlay",
  ].join("\n");
}

// GET - Fetch hero images
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "home";

    const heroImages = await prisma.heroImage.findMany({
      where: { page },
      orderBy: { deviceType: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: heroImages,
    });
  } catch (error) {
    console.error("Error fetching hero images:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero images" },
      { status: 500 }
    );
  }
}

// POST - Upload or generate hero image
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    // Handle JSON body (AI generation)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const {
        page = "home",
        deviceType = "DESKTOP",
        generateWithAi = false,
        style = "professional",
        customPrompt,
        quality = "standard",
      } = body;

      if (!generateWithAi) {
        return NextResponse.json(
          { error: "Use multipart form for manual upload" },
          { status: 400 }
        );
      }

      // Check OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }

      // Build prompt
      const imagePrompt = customPrompt || buildHeroImagePrompt(page, style);

      console.log(`🎨 Generating hero image for ${page} (${deviceType})`);

      // Generate with GPT Image 1.5
      const startTime = Date.now();

      // Different sizes for different devices (GPT Image 1.5 supported sizes)
      // Mobile uses portrait format for full-screen background
      const sizeMap: Record<string, "1536x1024" | "1024x1536" | "1024x1024"> = {
        DESKTOP: "1536x1024",
        MOBILE: "1024x1536", // Portrait for full-screen mobile background
        TABLET: "1024x1024",
      };

      const response = await openai.images.generate({
        model: "gpt-image-1.5",
        prompt: imagePrompt,
        n: 1,
        size: sizeMap[deviceType] || "1536x1024",
      });

      const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✓ Generated in ${generationTime}s`);

      // GPT Image 1.5 returns base64 data by default
      const imageData = response.data?.[0];
      const b64Data = (imageData as { b64_json?: string })?.b64_json;
      const generatedUrl = imageData?.url;

      let imageBuffer: Buffer;

      if (b64Data) {
        console.log(`   📦 Decoding base64 image data...`);
        imageBuffer = Buffer.from(b64Data, "base64");
      } else if (generatedUrl) {
        const imageResponse = await fetch(generatedUrl);
        if (!imageResponse.ok) {
          throw new Error("Failed to download generated image");
        }
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      } else {
        throw new Error("No image generated by GPT Image 1.5");
      }

      // Get dimensions based on device type
      // Mobile uses 9:16 portrait for full-screen background
      const dimensionMap: Record<string, { width: number; height: number }> = {
        DESKTOP: { width: 1920, height: 1080 },
        MOBILE: { width: 750, height: 1334 }, // iPhone standard resolution (9:16)
        TABLET: { width: 1024, height: 1024 },
      };
      const dimensions = dimensionMap[deviceType] || dimensionMap.DESKTOP;

      // Convert to WebP
      const webpResult = await convertToWebP(imageBuffer, {
        quality: 85,
        maxWidth: dimensions.width,
        maxHeight: dimensions.height,
        effort: 4,
      });

      // Generate SEO filename and alt
      const fileName = generateHeroFilename(page, deviceType, "ai-generated");
      const alt = generateHeroAlt(page, deviceType);

      // Upload to ImageKit
      const uploaded = await imagekit.upload({
        file: webpResult.buffer,
        fileName: fileName,
        folder: "/hero-images",
      });

      // Get existing hero image for this page/device (for backup)
      const existing = await prisma.heroImage.findUnique({
        where: { page_deviceType: { page, deviceType: deviceType as any } },
      });

      // Upsert hero image
      const heroImage = await prisma.heroImage.upsert({
        where: { page_deviceType: { page, deviceType: deviceType as any } },
        update: {
          imageUrl: uploaded.url,
          alt,
          fileName,
          originalUrl: existing?.originalUrl || existing?.imageUrl || null,
          width: dimensions.width,
          height: dimensions.height,
          isAiGenerated: true,
          aiPrompt: imagePrompt,
          originalSize: webpResult.originalSize,
          optimizedSize: webpResult.compressedSize,
          isActive: true,
        },
        create: {
          page,
          deviceType: deviceType as any,
          imageUrl: uploaded.url,
          alt,
          fileName,
          originalUrl: null,
          width: dimensions.width,
          height: dimensions.height,
          isAiGenerated: true,
          aiPrompt: imagePrompt,
          originalSize: webpResult.originalSize,
          optimizedSize: webpResult.compressedSize,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: heroImage,
        stats: {
          generationTime: `${generationTime}s`,
          originalSize: `${(webpResult.originalSize / 1024).toFixed(0)}KB`,
          compressedSize: `${(webpResult.compressedSize / 1024).toFixed(0)}KB`,
          savings: `${webpResult.savingsPercent}%`,
        },
      });
    }

    // Handle FormData (manual upload)
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const page = (formData.get("page") as string) || "home";
    const deviceType = (formData.get("deviceType") as string) || "DESKTOP";
    const customAlt = formData.get("alt") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`📤 Uploading hero image for ${page} (${deviceType})`);

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Get dimensions based on device type
    // Mobile uses 9:16 portrait for full-screen background
    const dimensionMap: Record<string, { width: number; height: number }> = {
      DESKTOP: { width: 1920, height: 1080 },
      MOBILE: { width: 750, height: 1334 }, // iPhone standard resolution (9:16)
      TABLET: { width: 1024, height: 1024 },
    };
    const dimensions = dimensionMap[deviceType] || dimensionMap.DESKTOP;

    // Convert to WebP
    const webpResult = await convertToWebP(inputBuffer, {
      quality: 85,
      maxWidth: dimensions.width,
      maxHeight: dimensions.height,
      effort: 4,
    });

    // Generate SEO filename and alt
    const fileName = generateHeroFilename(page, deviceType, "custom");
    const alt = customAlt || generateHeroAlt(page, deviceType);

    // Upload to ImageKit
    const uploaded = await imagekit.upload({
      file: webpResult.buffer,
      fileName: fileName,
      folder: "/hero-images",
    });

    console.log(`   ✓ Uploaded to: ${uploaded.url}`);

    // Get existing hero image for this page/device (for backup)
    const existing = await prisma.heroImage.findUnique({
      where: { page_deviceType: { page, deviceType: deviceType as any } },
    });

    // Upsert hero image
    const heroImage = await prisma.heroImage.upsert({
      where: { page_deviceType: { page, deviceType: deviceType as any } },
      update: {
        imageUrl: uploaded.url,
        alt,
        fileName,
        originalUrl: existing?.originalUrl || existing?.imageUrl || null,
        width: dimensions.width,
        height: dimensions.height,
        isAiGenerated: false,
        aiPrompt: null,
        originalSize: webpResult.originalSize,
        optimizedSize: webpResult.compressedSize,
        isActive: true,
      },
      create: {
        page,
        deviceType: deviceType as any,
        imageUrl: uploaded.url,
        alt,
        fileName,
        originalUrl: null,
        width: dimensions.width,
        height: dimensions.height,
        isAiGenerated: false,
        aiPrompt: null,
        originalSize: webpResult.originalSize,
        optimizedSize: webpResult.compressedSize,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: heroImage,
      stats: {
        originalSize: `${(webpResult.originalSize / 1024).toFixed(0)}KB`,
        compressedSize: `${(webpResult.compressedSize / 1024).toFixed(0)}KB`,
        savings: `${webpResult.savingsPercent}%`,
      },
    });
  } catch (error) {
    console.error("Error uploading/generating hero image:", error);
    return NextResponse.json(
      {
        error: "Failed to process hero image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


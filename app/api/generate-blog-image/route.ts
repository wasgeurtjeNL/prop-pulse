import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { imagekit } from "@/lib/imagekit";
import {
  convertToWebP,
  generateBlogCoverAlt,
  generateBlogImageFilename,
  buildBlogImagePrompt,
} from "@/lib/utils/image-utils";

/**
 * API Route: Generate AI Blog Cover Image
 * 
 * Uses DALL-E 3 to generate professional blog cover images
 * based on the blog topic, then optimizes to WebP and uploads to ImageKit.
 * 
 * Features:
 * - DALL-E 3 image generation with smart prompts
 * - WebP conversion with Sharp (80% quality, max 1920x1024)
 * - SEO-optimized ALT text generation
 * - ImageKit storage in /blogs/ai-generated folder
 * 
 * Cost: ~$0.04 per image (standard) or ~$0.08 (HD)
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateImageRequest {
  topic: string;
  style?: "professional" | "luxury" | "modern" | "lifestyle";
  quality?: "standard" | "hd";
  variationKey?: string;
}

export async function POST(request: Request) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key niet geconfigureerd. Voeg OPENAI_API_KEY toe aan je .env.local bestand.",
        },
        { status: 500 }
      );
    }

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateImageRequest = await request.json();
    const { topic, style = "professional", quality = "standard", variationKey } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Topic is verplicht" },
        { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      console.log(`🎨 Generating blog cover image for: "${topic}"`);
      console.log(`   Style: ${style}, Quality: ${quality}`);
    }

    // Build optimized prompt for real estate content
    const imagePrompt = buildBlogImagePrompt(topic, style, { variationKey });
    if (isDev) console.log(`   Prompt: ${imagePrompt.substring(0, 100)}...`);

    // Generate image with DALL-E 3
    const startTime = Date.now();
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1792x1024", // Landscape format for blog headers
      quality: quality,
      style: "natural", // More photorealistic
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
    if (isDev) console.log(`   ✓ DALL-E generation completed in ${generationTime}s`);

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error("Geen afbeelding gegenereerd door DALL-E");
    }

    // Download the generated image
    if (isDev) console.log(`   📥 Downloading generated image...`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error("Kon de gegenereerde afbeelding niet downloaden");
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const inputBuffer = Buffer.from(imageArrayBuffer);
    if (isDev) console.log(`   ✓ Downloaded: ${(inputBuffer.length / 1024).toFixed(0)}KB`);

    // Convert to WebP with optimization
    if (isDev) console.log(`   🔄 Converting to WebP...`);
    const webpResult = await convertToWebP(inputBuffer, {
      quality: 85, // Slightly higher for AI-generated images
      maxWidth: 1792,
      maxHeight: 1024,
      effort: 4,
    });

    if (isDev) {
      console.log(
        `   ✓ WebP conversion: ${(webpResult.originalSize / 1024).toFixed(0)}KB → ${(webpResult.compressedSize / 1024).toFixed(0)}KB (${webpResult.savingsPercent}% saved)`
      );
    }

    // Generate SEO-optimized filename
    const fileName = generateBlogImageFilename(topic, "cover");

    // Upload to ImageKit
    if (isDev) console.log(`   ☁️ Uploading to ImageKit...`);
    const uploaded = await imagekit.upload({
      file: webpResult.buffer,
      fileName: fileName,
      folder: "/blogs/ai-generated",
    });

    if (isDev) console.log(`   ✓ Uploaded to: ${uploaded.url}`);

    // Generate SEO-optimized ALT text
    const altText = generateBlogCoverAlt(topic);
    if (isDev) {
      console.log(`   🏷️ ALT text: "${altText}"`);
      console.log(`✅ Blog cover image generated successfully!`);
    }

    return NextResponse.json({
      success: true,
      imageUrl: uploaded.url,
      alt: altText,
      fileName: fileName,
      stats: {
        generationTime: `${generationTime}s`,
        originalSize: `${(webpResult.originalSize / 1024).toFixed(0)}KB`,
        compressedSize: `${(webpResult.compressedSize / 1024).toFixed(0)}KB`,
        savings: `${webpResult.savingsPercent}%`,
      },
      revisedPrompt: revisedPrompt, // DALL-E's enhanced prompt (useful for debugging)
    });
  } catch (error) {
    console.error("❌ Image generation error:", error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 400) {
        return NextResponse.json(
          {
            error: "De afbeelding kon niet worden gegenereerd. Probeer een ander onderwerp.",
            details: error.message,
          },
          { status: 400 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit bereikt. Wacht even en probeer opnieuw.",
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Kon de afbeelding niet genereren",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


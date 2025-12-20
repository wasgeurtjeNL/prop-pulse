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
 * Uses GPT Image 1.5 to generate professional blog cover images
 * based on the blog topic, then optimizes to WebP and uploads to ImageKit.
 * 
 * Features:
 * - GPT Image 1.5 generation with hyperrealistic prompts
 * - WebP conversion with Sharp (80% quality, max 1920x1024)
 * - SEO-optimized ALT text generation
 * - ImageKit storage in /blogs/ai-generated folder
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

    // Generate image with GPT Image 1.5
    const startTime = Date.now();
    const response = await openai.images.generate({
      model: "gpt-image-1.5",
      prompt: imagePrompt,
      n: 1,
      size: "1536x1024", // Landscape format for blog headers (GPT Image 1.5 supported size)
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
    if (isDev) console.log(`   ✓ GPT Image 1.5 generation completed in ${generationTime}s`);

    // GPT Image 1.5 returns base64 data by default
    const imageData = response.data?.[0];
    const b64Data = (imageData as { b64_json?: string })?.b64_json;
    const imageUrl = imageData?.url;
    const revisedPrompt = imageData?.revised_prompt;

    let inputBuffer: Buffer;

    if (b64Data) {
      // Decode base64 data
      if (isDev) console.log(`   📦 Decoding base64 image data...`);
      inputBuffer = Buffer.from(b64Data, "base64");
      if (isDev) console.log(`   ✓ Decoded: ${(inputBuffer.length / 1024).toFixed(0)}KB`);
    } else if (imageUrl) {
      // Fallback to URL download
      if (isDev) console.log(`   📥 Downloading generated image...`);
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error("Kon de gegenereerde afbeelding niet downloaden");
      }

      const imageArrayBuffer = await imageResponse.arrayBuffer();
      inputBuffer = Buffer.from(imageArrayBuffer);
      if (isDev) console.log(`   ✓ Downloaded: ${(inputBuffer.length / 1024).toFixed(0)}KB`);
    } else {
      throw new Error("Geen afbeelding gegenereerd door GPT Image 1.5");
    }

    // Convert to WebP with optimization
    if (isDev) console.log(`   🔄 Converting to WebP...`);
    const webpResult = await convertToWebP(inputBuffer, {
      quality: 85, // Slightly higher for AI-generated images
      maxWidth: 1536,
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
      revisedPrompt: revisedPrompt, // AI's enhanced prompt (useful for debugging)
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


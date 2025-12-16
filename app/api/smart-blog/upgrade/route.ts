import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { imagekit } from "@/lib/imagekit";
import {
  convertToWebP,
  buildSectionImagePrompt,
  generateSectionImageAlt,
  generateSectionImageFilename,
} from "@/lib/utils/image-utils";

interface UpgradeRequest {
  blogId: string;
  regenerateContent?: boolean; // If true, regenerate content from scratch based on title
}

interface StoredSection {
  heading: string;
  content: string;
  imageUrl: string;
  imageAlt: string;
  position: "left" | "right";
}

// POST - Upgrade an existing blog to the new section-based format with images
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpgradeRequest = await request.json();
    const { blogId, regenerateContent = false } = body;

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const isDev = process.env.NODE_ENV !== "production";

    // Get the existing blog
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: { author: true },
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Check if already in new format
    let isAlreadyStructured = false;
    try {
      const parsed = JSON.parse(blog.content);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        isAlreadyStructured = true;
      }
    } catch {
      // Not JSON, it's old format HTML
    }

    if (isAlreadyStructured && !regenerateContent) {
      return NextResponse.json({
        error: "Blog is already in the new structured format. Set regenerateContent=true to regenerate.",
        alreadyUpgraded: true,
      }, { status: 400 });
    }

    if (isDev) console.log(`🔄 Upgrading blog: "${blog.title}"`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Get internal links for the AI to use
    const internalLinks = await prisma.internalLink.findMany({
      where: { isActive: true, pageExists: true },
      orderBy: [{ priority: "desc" }, { usageCount: "asc" }],
      take: 30,
      select: { url: true, title: true, keywords: true },
    });

    const blogLinks = await prisma.blog.findMany({
      where: { published: true, id: { not: blogId } },
      select: { slug: true, title: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const allAvailableLinks = [
      ...internalLinks.map(l => `- href="${l.url}" | title: ${l.title}`),
      ...blogLinks.map(b => `- href="/blogs/${b.slug}" | title: ${b.title}`),
    ].join("\n");

    // Step 1: Convert existing HTML content to structured sections
    if (isDev) console.log("🤖 Analyzing and restructuring content...");

    const restructurePrompt = regenerateContent
      ? `You are restructuring a blog post. Create NEW structured content based on the title and topic.

Title: "${blog.title}"
Original excerpt: "${blog.excerpt}"

Create a fresh, engaging blog post with 4-5 distinct sections.`
      : `You are restructuring an existing blog post into a new format with distinct sections.

Title: "${blog.title}"
Excerpt: "${blog.excerpt}"

EXISTING CONTENT TO RESTRUCTURE:
${blog.content.slice(0, 8000)}

Analyze the existing content and restructure it into distinct sections.
- Preserve the key information and insights
- Improve the flow and organization
- Each section should cover a different aspect`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are an expert content restructurer. Transform blog content into a structured format with distinct sections.

REQUIREMENTS:
1. Create an engaging intro paragraph (2-3 sentences)
2. Create 4-5 distinct sections, each with:
   - A descriptive, visual heading (for AI image generation)
   - Content with proper HTML (<p>, <ul>, <li>, <strong>, <a>)
3. Include 1-2 internal links per section using ACTUAL URLs from the provided list
4. Create a FAQ section with 3-5 questions based on the content
5. All content must be in English

CRITICAL: 
- Section content should NOT include <h2> or <h3> tags - headings are separate
- NEVER use placeholder URLs like "/path" - only use real URLs from the list
- Section headings should be descriptive and visual (they will have images)

Return ONLY valid JSON:
{
  "intro": "<p>Engaging intro...</p>",
  "sections": [
    { "heading": "Descriptive Visual Heading", "content": "<p>Content with <a href=\\"/real-url\\">links</a>...</p>" }
  ],
  "faq": [
    { "question": "Question?", "answer": "Answer" }
  ]
}`,
        },
        {
          role: "user",
          content: `${restructurePrompt}

=== AVAILABLE LINKS (use these EXACT hrefs) ===
${allAvailableLinks || "No links available"}

Restructure into 4-5 sections with visual headings that would work well with AI-generated images.`,
        },
      ],
    });

    const rawResult = completion.choices[0]?.message?.content || "{}";
    
    // Parse the JSON result
    let structuredContent: { intro: string; sections: Array<{ heading: string; content: string }>; faq: Array<{ question: string; answer: string }> };
    try {
      const match = rawResult.match(/\{[\s\S]*\}/);
      structuredContent = JSON.parse(match?.[0] || "{}");
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (!structuredContent.sections || structuredContent.sections.length === 0) {
      return NextResponse.json({ error: "AI failed to generate structured content" }, { status: 500 });
    }

    if (isDev) console.log(`✓ Content restructured: ${structuredContent.sections.length} sections`);

    // Step 2: Generate images for the first 3 sections
    const processedSections: StoredSection[] = [];
    const imageSectionsCount = Math.min(3, structuredContent.sections.length);

    for (let i = 0; i < structuredContent.sections.length; i++) {
      const section = structuredContent.sections[i];
      const position: "left" | "right" = i % 2 === 0 ? "left" : "right";
      const shouldGenerateImage = i < imageSectionsCount;

      if (shouldGenerateImage) {
        if (isDev) console.log(`🎨 Generating image ${i + 1}/${imageSectionsCount}: "${section.heading}"`);

        try {
          const imagePrompt = buildSectionImagePrompt(section.heading, blog.title, i);

          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural",
          });

          const generatedImageUrl = imageResponse.data[0]?.url;
          if (!generatedImageUrl) throw new Error("No image URL returned");

          // Download and compress
          const imgResponse = await fetch(generatedImageUrl);
          if (!imgResponse.ok) throw new Error("Failed to download image");

          const imageArrayBuffer = await imgResponse.arrayBuffer();
          const inputBuffer = Buffer.from(imageArrayBuffer);

          const webpResult = await convertToWebP(inputBuffer, {
            quality: 80,
            maxWidth: 800,
            maxHeight: 600,
            effort: 4,
          });

          if (isDev) {
            console.log(`   ✓ Compressed: ${(webpResult.originalSize / 1024).toFixed(0)}KB → ${(webpResult.compressedSize / 1024).toFixed(0)}KB`);
          }

          // Upload to ImageKit
          const fileName = generateSectionImageFilename(blog.slug, i);
          const uploaded = await imagekit.upload({
            file: webpResult.buffer,
            fileName: fileName,
            folder: "/blogs/section-images/upgraded",
          });

          if (isDev) console.log(`   ☁️ Uploaded: ${uploaded.url}`);

          const altText = generateSectionImageAlt(section.heading, blog.title);

          processedSections.push({
            heading: section.heading,
            content: section.content,
            imageUrl: uploaded.url,
            imageAlt: altText,
            position,
          });
        } catch (imgError: any) {
          console.error(`Failed to generate image for section ${i + 1}:`, imgError.message);
          processedSections.push({
            heading: section.heading,
            content: section.content,
            imageUrl: "",
            imageAlt: "",
            position,
          });
        }
      } else {
        processedSections.push({
          heading: section.heading,
          content: section.content,
          imageUrl: "",
          imageAlt: "",
          position,
        });
      }
    }

    // Step 3: Save the upgraded content
    const newContent = JSON.stringify({
      intro: structuredContent.intro,
      sections: processedSections,
      faq: structuredContent.faq,
    });

    // Backup original content if not already backed up
    const updateData: any = {
      content: newContent,
      updatedAt: new Date(),
    };

    if (!blog.originalContent) {
      updateData.originalContent = blog.content;
    }

    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: updateData,
    });

    if (isDev) console.log(`✅ Blog upgraded successfully: "${blog.title}"`);

    return NextResponse.json({
      success: true,
      blog: {
        id: updatedBlog.id,
        title: updatedBlog.title,
        slug: updatedBlog.slug,
      },
      stats: {
        sectionsCreated: processedSections.length,
        imagesGenerated: processedSections.filter(s => s.imageUrl).length,
        faqCount: structuredContent.faq?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Blog Upgrade Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upgrade blog" },
      { status: 500 }
    );
  }
}

// GET - Get list of blogs that can be upgraded
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blogs = await prisma.blog.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        coverImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Check which blogs are already upgraded
    const blogsWithStatus = blogs.map(blog => {
      let isUpgraded = false;
      let sectionCount = 0;
      let imageCount = 0;

      try {
        const parsed = JSON.parse(blog.content);
        if (parsed.sections && Array.isArray(parsed.sections)) {
          isUpgraded = true;
          sectionCount = parsed.sections.length;
          imageCount = parsed.sections.filter((s: any) => s.imageUrl).length;
        }
      } catch {
        // Not JSON, it's old format
      }

      return {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        coverImage: blog.coverImage,
        createdAt: blog.createdAt,
        isUpgraded,
        sectionCount,
        imageCount,
      };
    });

    const upgradeable = blogsWithStatus.filter(b => !b.isUpgraded);
    const upgraded = blogsWithStatus.filter(b => b.isUpgraded);

    return NextResponse.json({
      total: blogs.length,
      upgradeable: upgradeable.length,
      upgraded: upgraded.length,
      blogs: blogsWithStatus,
    });
  } catch (error: any) {
    console.error("Get Upgradeable Blogs Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get blogs" },
      { status: 500 }
    );
  }
}


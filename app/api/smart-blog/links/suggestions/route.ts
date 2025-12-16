import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { imagekit } from "@/lib/imagekit";
import {
  convertToWebP,
  buildSectionImagePrompt,
  generateSectionImageAlt,
  generateSectionImageFilename,
  type LandingPageSection,
} from "@/lib/utils/image-utils";

interface GeneratedSection {
  heading: string;
  content: string;
}

interface GeneratedLandingPage {
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: GeneratedSection[];
  faq?: Array<{ question: string; answer: string }>;
}

interface StoredSection {
  heading: string;
  content: string;
  imageUrl: string;
  imageAlt: string;
  position: "left" | "right";
}

function normalizeSuggestedUrl(inputUrl: string, category?: string): string {
  const raw = (inputUrl || "").trim();
  let url = raw.startsWith("/") ? raw : `/${raw}`;

  // Normalize Dutch -> English prefixes (legacy data)
  url = url.replace(/^\/diensten\b/i, "/services");
  url = url.replace(/^\/gidsen\b/i, "/guides");
  url = url.replace(/^\/locaties\b/i, "/locations");

  // If category is provided, ensure it uses an English base path
  const cat = (category || "").toLowerCase();
  if (cat === "service" && !url.startsWith("/services/")) url = `/services${url}`.replace("/services/services", "/services");
  if (cat === "guide" && !url.startsWith("/guides/")) url = `/guides${url}`.replace("/guides/guides", "/guides");
  if (cat === "location" && !url.startsWith("/locations/")) url = `/locations${url}`.replace("/locations/locations", "/locations");
  if (cat === "faq" && !url.startsWith("/faq/")) url = `/faq${url}`.replace("/faq/faq", "/faq");

  // Collapse double slashes
  url = url.replace(/\/{2,}/g, "/");
  return url;
}

// GET - Retrieve all landing page suggestions
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let suggestions: any[] = [];
    try {
      suggestions = await prisma.landingPageSuggestion.findMany({
        orderBy: [
          { status: 'asc' }, // PENDING first
          { mentionCount: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (e) {
      console.log("LandingPageSuggestion model not available yet");
      return NextResponse.json({
        summary: { total: 0, pending: 0, approved: 0, created: 0, dismissed: 0 },
        suggestions: { pending: [], approved: [], created: [], dismissed: [] }
      });
    }

    const pending = suggestions.filter(s => s.status === 'PENDING');
    const approved = suggestions.filter(s => s.status === 'APPROVED');
    const created = suggestions.filter(s => s.status === 'CREATED');
    const dismissed = suggestions.filter(s => s.status === 'DISMISSED');

    return NextResponse.json({
      summary: {
        total: suggestions.length,
        pending: pending.length,
        approved: approved.length,
        created: created.length,
        dismissed: dismissed.length
      },
      suggestions: {
        pending,
        approved,
        created,
        dismissed
      }
    });

  } catch (error: any) {
    console.error("Get Suggestions Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get suggestions" },
      { status: 500 }
    );
  }
}

// POST - Analyze blogs and generate suggestions for missing landing pages
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get existing internal links
    const existingLinks = await prisma.internalLink.findMany({
      select: { url: true, category: true, keywords: true, title: true }
    });
    
    // Get published blogs
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      select: { id: true, title: true, content: true, tag: true, excerpt: true },
      take: 30,
      orderBy: { createdAt: 'desc' }
    });

    // Get company profile for context
    let profile;
    try {
      profile = await prisma.companyProfile.findUnique({
        where: { id: "default" }
      });
    } catch (e) {
      console.log("CompanyProfile not available");
    }

    // Get existing suggestions to avoid duplicates
    const existingSuggestions = await prisma.landingPageSuggestion.findMany({
      select: { suggestedUrl: true }
    });
    const existingSuggestionUrls = existingSuggestions.map(s => s.suggestedUrl);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Compile context for AI
    const existingUrlList = existingLinks.map(l => 
      `- ${l.url} (${l.category || 'page'}): ${l.title}`
    ).join("\n");
    
    const blogSummaries = blogs.map(b => 
      `- "${b.title}" [${b.tag || 'general'}]: ${b.excerpt?.slice(0, 100) || b.content.slice(0, 100)}...`
    ).join("\n");

    const parseJsonArray = (str: string | null | undefined): string[] => {
      if (!str) return [];
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return str.split(",").map(s => s.trim()).filter(Boolean);
      }
    };

    const expertise = profile?.expertise ? parseJsonArray(profile.expertise).join(", ") : "";
    const themes = profile?.contentThemes ? parseJsonArray(profile.contentThemes).join(", ") : "";
    const locations = profile?.targetLocations ? parseJsonArray(profile.targetLocations).join(", ") : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an SEO strategist for a real estate company. Analyze existing content and identify missing landing pages that would improve internal linking and SEO.

Focus on:
1) Services often mentioned but missing dedicated pages
2) Locations/areas relevant to the content but missing pages
3) Guides/how-to pages for high-intent topics
4) FAQ pages for recurring questions

CRITICAL REQUIREMENTS:
- All URLs MUST be in ENGLISH and MUST use one of these prefixes only:
  - /services/...
  - /guides/...
  - /locations/...
  - /faq/...
- All titles/descriptions MUST be in ENGLISH.
- Only suggest pages that DO NOT already exist in the current URL list.

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "url": "/services/suggested-url-path",
      "title": "Descriptive Page Title",
      "description": "Short description (2-3 sentences) of what the page should contain",
      "category": "service|guide|location|faq",
      "reason": "Why this page matters for SEO and conversion"
    }
  ]
}`
        },
        {
          role: "user",
          content: `## Existing Pages/Links:
${existingUrlList || "Geen links geconfigureerd"}

## Recent Blogs (analyze for missing link targets):
${blogSummaries}

## Company Expertise:
${expertise || "Niet gespecificeerd"}

## Content Themes:
${themes || "Niet gespecificeerd"}

## Target Locations:
${locations || "Niet gespecificeerd"}

## Already Suggested URLs (do not suggest again):
${existingSuggestionUrls.join(", ") || "Geen"}

Generate 5-10 high-value landing page suggestions that:
1) Do not already exist
2) Are highly relevant to the blog content
3) Would be strong internal link targets
4) Improve SEO and conversion`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const result = completion.choices[0]?.message?.content || "{}";
    
    // Parse AI response
    let parsed: { suggestions: any[] };
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || '{"suggestions": []}');
    } catch {
      console.log("Failed to parse AI response:", result);
      parsed = { suggestions: [] };
    }

    // Save new suggestions to database
    const newSuggestions = [];
    const updatedSuggestions = [];
    
    for (const suggestion of parsed.suggestions || []) {
      if (!suggestion.url || !suggestion.title) continue;
      
      // Normalize URL (force English prefixes)
      const normalizedUrl = normalizeSuggestedUrl(suggestion.url, suggestion.category);
      
      // Skip if URL already exists as internal link
      if (existingLinks.some(l => l.url === normalizedUrl)) continue;
      
      // Check if suggestion already exists
      const existing = await prisma.landingPageSuggestion.findUnique({
        where: { suggestedUrl: normalizedUrl }
      });

      if (existing) {
        // Update mention count
        const updated = await prisma.landingPageSuggestion.update({
          where: { id: existing.id },
          data: { mentionCount: { increment: 1 } }
        });
        updatedSuggestions.push(updated);
      } else {
        // Create new suggestion
        try {
          const created = await prisma.landingPageSuggestion.create({
            data: {
              suggestedUrl: normalizedUrl,
              suggestedTitle: suggestion.title,
              description: suggestion.description || "",
              category: suggestion.category || "service",
              reason: suggestion.reason || "",
              status: "PENDING"
            }
          });
          newSuggestions.push(created);
        } catch (e: any) {
          console.log("Failed to create suggestion:", e.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      analyzed: {
        blogsCount: blogs.length,
        existingLinksCount: existingLinks.length
      },
      results: {
        newSuggestions: newSuggestions.length,
        updatedSuggestions: updatedSuggestions.length,
        rawSuggestions: parsed.suggestions
      }
    });

  } catch (error: any) {
    console.error("Generate Suggestions Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

// PATCH - Update suggestion status
export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, createdPageUrl } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "Suggestion ID is required" }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'CREATED', 'DISMISSED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (createdPageUrl) updateData.createdPageUrl = normalizeSuggestedUrl(createdPageUrl);

    const updated = await prisma.landingPageSuggestion.update({
      where: { id },
      data: updateData
    });

    // If status is CREATED, automatically create an InternalLink
    if (status === 'CREATED') {
      try {
        await prisma.internalLink.create({
          data: {
            url: normalizeSuggestedUrl(updated.createdPageUrl || updated.suggestedUrl, updated.category),
            title: updated.suggestedTitle,
            description: updated.description || "",
            category: updated.category,
            priority: 3,
            pageExists: true,
            isActive: true
          }
        });
      } catch (e: any) {
        // Link might already exist
        console.log("Could not create internal link:", e.message);
      }
    }

    return NextResponse.json({
      success: true,
      suggestion: updated
    });

  } catch (error: any) {
    console.error("Update Suggestion Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update suggestion" },
      { status: 500 }
    );
  }
}

// PUT - Create a landing page from a suggestion (AI-generated with images)
export async function PUT(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Suggestion ID is required" }, { status: 400 });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const suggestion = await prisma.landingPageSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const url = normalizeSuggestedUrl(suggestion.createdPageUrl || suggestion.suggestedUrl, suggestion.category);
    const pageSlug = url.split("/").pop() || "landing-page";

    // If already exists, just mark as created and ensure internal link exists
    const existingPage = await prisma.landingPage.findUnique({ where: { url } });
    if (existingPage) {
      const updated = await prisma.landingPageSuggestion.update({
        where: { id },
        data: { status: "CREATED", createdPageUrl: url },
      });

      await prisma.internalLink.upsert({
        where: { url },
        create: {
          url,
          title: suggestion.suggestedTitle,
          description: suggestion.description || "",
          category: suggestion.category,
          priority: 3,
          pageExists: true,
          isActive: true,
        },
        update: {
          title: suggestion.suggestedTitle,
          description: suggestion.description || "",
          category: suggestion.category,
          priority: 3,
          pageExists: true,
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, suggestion: updated, landingPage: existingPage, alreadyExisted: true });
    }

    // Gather context from profile + internal links + recent blogs
    let profile: any = null;
    try {
      profile = await prisma.companyProfile.findUnique({ where: { id: "default" } });
    } catch {
      profile = null;
    }

    const internalLinks = await prisma.internalLink.findMany({
      where: { isActive: true, pageExists: true },
      orderBy: [{ priority: "desc" }, { usageCount: "asc" }],
      take: 50,
      select: { url: true, title: true, category: true, keywords: true },
    });

    const profileContext = profile
      ? {
          companyName: profile.companyName,
          tagline: profile.tagline,
          description: profile.description,
          tone: profile.tone,
          targetAudience: profile.targetAudience,
          targetLocations: safeJsonArray(profile.targetLocations),
          usps: safeJsonArray(profile.usps),
          expertise: safeJsonArray(profile.expertise),
          contentThemes: safeJsonArray(profile.contentThemes),
          brandKeywords: safeJsonArray(profile.brandKeywords),
        }
      : null;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build a combined list of linkable pages: internal links + published blogs
    const blogLinks = await prisma.blog.findMany({
      where: { published: true },
      select: { slug: true, title: true, excerpt: true },
      take: 30,
      orderBy: { createdAt: "desc" },
    });

    const allAvailableLinks = [
      ...internalLinks.map((l) => `- href="${l.url}" | title: ${l.title} | keywords: ${l.keywords || "none"}`),
      ...blogLinks.map((b) => `- href="/blogs/${b.slug}" | title: ${b.title}`),
    ].join("\n");

    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) console.log(`🚀 Generating landing page: ${url}`);

    // Step 1: Generate structured content with sections
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content:
            `You are an expert SEO landing page writer for a luxury real estate website.\n\n` +
            `Write a high-quality landing page in ENGLISH with STRUCTURED SECTIONS.\n\n` +
            `CRITICAL REQUIREMENTS:\n` +
            `- Output MUST be valid JSON only.\n` +
            `- The page must have an intro paragraph and 3-4 distinct sections.\n` +
            `- Each section should cover a different aspect of the topic.\n` +
            `- Include 1-2 internal links per section using ACTUAL URLs from the provided list.\n` +
            `- NEVER use placeholder URLs like "/path" or "#" - ONLY use real URLs from the list.\n` +
            `- Section content MUST be HTML (using <p>, <ul><li>, <a>). No <h2> or <h3> in content - headings are separate.\n` +
            `- If category is "faq", include an FAQ array with 6-10 Q/A.\n\n` +
            `Return JSON with this EXACT shape:\n` +
            `{\n` +
            `  "title": "Page title",\n` +
            `  "metaTitle": "Meta title for SEO",\n` +
            `  "metaDescription": "Meta description (<= 160 chars)",\n` +
            `  "intro": "<p>Engaging intro paragraph about the topic...</p>",\n` +
            `  "sections": [\n` +
            `    { "heading": "First Topic Heading", "content": "<p>Content with <a href=\\"/blogs/slug\\">links</a>...</p>" },\n` +
            `    { "heading": "Second Topic Heading", "content": "<p>More content...</p>" },\n` +
            `    { "heading": "Third Topic Heading", "content": "<p>Additional content...</p>" }\n` +
            `  ],\n` +
            `  "faq": [{"question":"...","answer":"..."}]\n` +
            `}`,
        },
        {
          role: "user",
          content: [
            `URL: ${url}`,
            `Category: ${suggestion.category}`,
            `Suggested Title: ${suggestion.suggestedTitle}`,
            `Description: ${suggestion.description}`,
            `Reason: ${suggestion.reason}`,
            ``,
            `Company profile context (JSON):`,
            JSON.stringify(profileContext),
            ``,
            `=== AVAILABLE LINKS (use these EXACT hrefs) ===`,
            allAvailableLinks || "No links available yet",
            ``,
            `Generate 3-4 sections that each cover a different aspect of "${suggestion.suggestedTitle}".`,
            `Each section will have an AI-generated image, so make the headings descriptive and visual.`,
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = safeJsonParse<GeneratedLandingPage>(raw);

    if (!parsed?.title || !parsed?.sections || parsed.sections.length === 0) {
      return NextResponse.json({ error: "AI generation failed to return valid structured content" }, { status: 500 });
    }

    if (isDev) console.log(`✓ Content generated: ${parsed.sections.length} sections`);

    // Step 2: Generate images for each section (limit to 3 to control costs)
    const sectionsToProcess = parsed.sections.slice(0, 3);
    const processedSections: StoredSection[] = [];

    for (let i = 0; i < sectionsToProcess.length; i++) {
      const section = sectionsToProcess[i];
      const position: "left" | "right" = i % 2 === 0 ? "left" : "right";

      if (isDev) console.log(`🎨 Generating image ${i + 1}/${sectionsToProcess.length}: "${section.heading}"`);

      try {
        // Build the image prompt
        const imagePrompt = buildSectionImagePrompt(section.heading, parsed.title, i);

        // Generate image with DALL-E 3
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024", // Square format, will be cropped/displayed appropriately
          quality: "standard",
          style: "natural",
        });

        const generatedImageUrl = imageResponse.data[0]?.url;
        if (!generatedImageUrl) {
          throw new Error("No image URL returned");
        }

        // Download the image
        const imgResponse = await fetch(generatedImageUrl);
        if (!imgResponse.ok) throw new Error("Failed to download image");

        const imageArrayBuffer = await imgResponse.arrayBuffer();
        const inputBuffer = Buffer.from(imageArrayBuffer);

        // Convert to WebP
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
        const fileName = generateSectionImageFilename(pageSlug, i);
        const uploaded = await imagekit.upload({
          file: webpResult.buffer,
          fileName: fileName,
          folder: "/landing-pages/ai-generated",
        });

        if (isDev) console.log(`   ☁️ Uploaded: ${uploaded.url}`);

        // Generate ALT text
        const altText = generateSectionImageAlt(section.heading, parsed.title);

        processedSections.push({
          heading: section.heading,
          content: section.content,
          imageUrl: uploaded.url,
          imageAlt: altText,
          position,
        });
      } catch (imgError: any) {
        console.error(`Failed to generate image for section ${i + 1}:`, imgError.message);
        // Still include the section, but without an image
        processedSections.push({
          heading: section.heading,
          content: section.content,
          imageUrl: "",
          imageAlt: "",
          position,
        });
      }
    }

    // Add any remaining sections without images
    for (let i = sectionsToProcess.length; i < parsed.sections.length; i++) {
      const section = parsed.sections[i];
      processedSections.push({
        heading: section.heading,
        content: section.content,
        imageUrl: "",
        imageAlt: "",
        position: i % 2 === 0 ? "left" : "right",
      });
    }

    if (isDev) console.log(`✓ All sections processed. Saving to database...`);

    // Step 3: Save to database with structured content
    const contentJson = {
      intro: parsed.intro,
      sections: processedSections,
    };

    const createdPage = await prisma.landingPage.create({
      data: {
        url,
        title: parsed.title,
        category: suggestion.category,
        metaTitle: parsed.metaTitle || parsed.title,
        metaDescription: parsed.metaDescription || suggestion.description || null,
        content: JSON.stringify(contentJson), // Store as JSON string
        faq: parsed.faq ? (parsed.faq as any) : null,
        published: true,
      },
    });

    const updatedSuggestion = await prisma.landingPageSuggestion.update({
      where: { id },
      data: { status: "CREATED", createdPageUrl: url },
    });

    await prisma.internalLink.upsert({
      where: { url },
      create: {
        url,
        title: createdPage.title,
        description: createdPage.metaDescription || suggestion.description || "",
        category: suggestion.category,
        priority: 3,
        pageExists: true,
        isActive: true,
      },
      update: {
        title: createdPage.title,
        description: createdPage.metaDescription || suggestion.description || "",
        category: suggestion.category,
        priority: 3,
        pageExists: true,
        isActive: true,
      },
    });

    if (isDev) console.log(`✅ Landing page created successfully: ${url}`);

    return NextResponse.json({
      success: true,
      suggestion: updatedSuggestion,
      landingPage: createdPage,
      stats: {
        sectionsGenerated: processedSections.length,
        imagesGenerated: processedSections.filter((s) => s.imageUrl).length,
      },
    });
  } catch (error: any) {
    console.error("Create Landing Page Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create landing page" }, { status: 500 });
  }
}

function safeJsonArray(str: unknown): string[] {
  if (!str || typeof str !== "string") return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match?.[0] || "{}") as T;
  } catch {
    return null;
  }
}

// DELETE - Remove a suggestion
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
      return NextResponse.json({ error: "Suggestion ID is required" }, { status: 400 });
    }

    await prisma.landingPageSuggestion.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Suggestion deleted"
    });

  } catch (error: any) {
    console.error("Delete Suggestion Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete suggestion" },
      { status: 500 }
    );
  }
}


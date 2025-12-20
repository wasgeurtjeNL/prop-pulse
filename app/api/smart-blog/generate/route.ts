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

interface GenerateRequest {
  topic: string;
  language?: "en" | "nl";
  length?: "short" | "medium" | "long";
  tone?: "professional" | "friendly" | "luxury" | "educational";
  includeResearch?: boolean;
  generateImages?: boolean; // New: enable/disable section image generation
}

interface GeneratedSection {
  heading: string;
  content: string;
}

interface StoredSection {
  heading: string;
  content: string;
  imageUrl: string;
  imageAlt: string;
  position: "left" | "right";
}

// Perform web research using Perplexity or OpenAI
async function performResearch(topic: string, language: string): Promise<{ research: string; sources: string[] }> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  
  if (perplexityKey) {
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${perplexityKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: `You are a real estate market research expert specializing in Thailand/Phuket property market.
Research the topic and provide factual, current information including statistics, trends, and expert insights.
${language === "nl" ? "Respond in Dutch." : "Respond in English."}`
            },
            {
              role: "user",
              content: `Research: "${topic}" - Provide key facts, statistics, market trends, and expert insights for a professional blog post about Thailand/Phuket real estate.`
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          research: data.choices[0]?.message?.content || "",
          sources: data.citations || []
        };
      }
    } catch (error) {
      console.error("Perplexity research failed, falling back to OpenAI:", error);
    }
  }

  // Fallback to OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a real estate market research expert with deep knowledge of Thailand/Phuket property market.
${language === "nl" ? "Respond in Dutch." : "Respond in English."}`
      },
      {
        role: "user",
        content: `Provide research on: "${topic}" - Include key facts, statistics, market trends for Thailand/Phuket real estate.`
      }
    ],
    max_tokens: 1500,
    temperature: 0.3,
  });

  return {
    research: completion.choices[0]?.message?.content || "",
    sources: []
  };
}

// One-click blog generation with optional section images
export async function POST(request: Request) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { 
      topic, 
      language = "en", 
      length = "medium",
      tone = "professional",
      includeResearch = true,
      generateImages = true // Default to generating images
    } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) console.log(`🚀 Generating blog: "${topic}" with images: ${generateImages}`);

    // Get company profile (new model) with fallback
    let companyProfile = null;
    try {
      companyProfile = await prisma.companyProfile.findUnique({
        where: { id: "default" }
      });
    } catch (e) {
      console.log("CompanyProfile not available, using settings fallback");
    }

    // Fallback to site settings for backward compatibility
    const settings = await prisma.siteSettings.findFirst();
    
    // Get internal links for integration
    let internalLinks: any[] = [];
    try {
      internalLinks = await prisma.internalLink.findMany({
        where: { isActive: true },
        orderBy: [{ priority: "desc" }, { usageCount: "desc" }],
        take: 20
      });
    } catch (e) {
      console.log("InternalLink not available");
    }

    // Also get blog links for internal linking
    const blogLinks = await prisma.blog.findMany({
      where: { published: true },
      select: { slug: true, title: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON arrays safely
    const parseJsonArray = (str: string | null | undefined): string[] => {
      if (!str) return [];
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return str.split(",").map(s => s.trim()).filter(Boolean);
      }
    };

    // Build company context from profile or settings
    const usps = companyProfile?.usps 
      ? parseJsonArray(companyProfile.usps)
      : settings?.companyUSPs 
        ? parseJsonArray(settings.companyUSPs)
        : ["Expert local knowledge", "premium properties", "personalized service"];
    
    const brandKeywords = companyProfile?.brandKeywords
      ? parseJsonArray(companyProfile.brandKeywords)
      : settings?.brandKeywords
        ? parseJsonArray(settings.brandKeywords)
        : ["Phuket", "luxury", "investment", "villa", "property"];

    const contentThemes = companyProfile?.contentThemes
      ? parseJsonArray(companyProfile.contentThemes)
      : [];

    const avoidTopics = companyProfile?.avoidTopics
      ? parseJsonArray(companyProfile.avoidTopics)
      : settings?.avoidTopics
        ? parseJsonArray(settings.avoidTopics)
        : [];

    const companyName = companyProfile?.companyName || settings?.siteName || "Real Estate Pulse";
    const companyDescription = companyProfile?.description || settings?.companyDescription || "Premium real estate company in Phuket, Thailand";
    const companyTone = companyProfile?.tone || settings?.companyTone || tone;
    const targetAudience = companyProfile?.targetAudience || settings?.targetAudience || "International investors, expats, high-net-worth individuals";
    
    // Format all available links for AI
    const allAvailableLinks = [
      ...internalLinks.map(l => `- href="${l.url}" | title: ${l.title} | keywords: ${l.keywords || "none"}`),
      ...blogLinks.map(b => `- href="/blogs/${b.slug}" | title: ${b.title}`),
    ].join("\n");

    const companyContext = `
Company Profile:
- Company: ${companyName}
- Tagline: ${companyProfile?.tagline || "Premium real estate services"}
- Description: ${companyDescription}
- Tone: ${companyTone}
- Writing Style: ${companyProfile?.writingStyle || "Professional and authoritative"}
- USPs: ${usps.join(", ")}
- Target Audience: ${targetAudience}
- Brand Keywords: ${brandKeywords.join(", ")}
- Content Themes: ${contentThemes.length > 0 ? contentThemes.join(", ") : "Real estate, investment, lifestyle"}
- Topics to Avoid: ${avoidTopics.length > 0 ? avoidTopics.join(", ") : "None specified"}
- Expertise Areas: ${companyProfile?.expertise ? parseJsonArray(companyProfile.expertise).join(", ") : "Phuket real estate, property investment"}
`;

    // Word count and section targets based on length
    const lengthConfig = {
      short: { min: 800, max: 1200, sections: 3, imageSections: 2 },
      medium: { min: 1500, max: 2000, sections: 5, imageSections: 3 },
      long: { min: 2500, max: 3500, sections: 7, imageSections: 4 }
    }[length];

    const languageInstruction = language === "nl"
      ? "Schrijf alles in het Nederlands. Alle koppen, paragrafen en content moeten in het Nederlands zijn."
      : "Write everything in English. All headings, paragraphs, and content must be in English.";

    // Step 1: Perform research if enabled
    let researchData = { research: "", sources: [] as string[] };
    if (includeResearch) {
      if (isDev) console.log("📚 Performing research...");
      researchData = await performResearch(topic, language);
    }

    // Step 2: Generate structured blog content with sections
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an elite content strategist and SEO specialist for a premium real estate company.

${companyContext}

Your task is to create a STRUCTURED blog post with distinct sections for visual enhancement.

${languageInstruction}

CRITICAL REQUIREMENTS:
1. Write a compelling, SEO-optimized title (50-65 characters)
2. Write a meta description (150-160 characters)
3. Write an engaging excerpt (2-3 sentences)
4. Create an intro paragraph that hooks the reader
5. Create ${lengthConfig.sections} distinct sections, each with a clear heading
6. Each section should cover a different aspect of the topic
7. Section headings should be descriptive and visual (they will have images)
8. Include 1-2 internal links per section using ACTUAL URLs from the provided list
9. Include a FAQ section with 3-5 questions at the end

SECTION CONTENT RULES:
- Section content should be HTML (using <p>, <ul><li>, <a>, <strong>)
- DO NOT include <h2> or <h3> in section content - headings are separate
- Each section should be 150-300 words
- Include practical, actionable information
- Add statistics and data points where relevant

INTERNAL LINKING (CRITICAL):
- NEVER use placeholder URLs like "/path" or "#"
- ONLY use real URLs from the available links list
- Format links as: <a href="/blogs/actual-slug">descriptive anchor text</a>

Return ONLY valid JSON in this EXACT format:
{
  "title": "Blog title here",
  "metaTitle": "SEO title (50-65 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "excerpt": "2-3 sentence excerpt",
  "intro": "<p>Engaging intro paragraph...</p>",
  "sections": [
    { "heading": "First Section Heading", "content": "<p>Section content with <a href=\\"/blogs/slug\\">links</a>...</p>" },
    { "heading": "Second Section Heading", "content": "<p>More content...</p>" }
  ],
  "faq": [
    { "question": "Question 1?", "answer": "Answer 1" },
    { "question": "Question 2?", "answer": "Answer 2" }
  ],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedSlug": "url-friendly-slug"
}`;

    const userPrompt = `Create a complete, professional blog post about: "${topic}"

${researchData.research ? `
RESEARCH DATA TO INCORPORATE:
${researchData.research}

Use this research to include accurate facts, statistics, and current market information.
` : ""}

=== AVAILABLE LINKS (use these EXACT hrefs) ===
${allAvailableLinks || "No links available yet"}

Generate ${lengthConfig.sections} sections that each cover a different aspect of "${topic}".
Each section will have an AI-generated image, so make the headings descriptive and visual.`;

    if (isDev) console.log("🤖 Generating structured content...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 6000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    const blogData = JSON.parse(result);

    if (!blogData.title || !blogData.sections || blogData.sections.length === 0) {
      throw new Error("AI failed to generate valid structured content");
    }

    if (isDev) console.log(`✓ Content generated: ${blogData.sections.length} sections`);

    // Step 3: Generate images for sections (if enabled)
    let processedSections: StoredSection[] = [];
    
    if (generateImages) {
      const sectionsToProcess = blogData.sections.slice(0, lengthConfig.imageSections);
      
      for (let i = 0; i < blogData.sections.length; i++) {
        const section = blogData.sections[i] as GeneratedSection;
        const position: "left" | "right" = i % 2 === 0 ? "left" : "right";
        const shouldGenerateImage = i < lengthConfig.imageSections;

        if (shouldGenerateImage) {
          if (isDev) console.log(`🎨 Generating image ${i + 1}/${lengthConfig.imageSections}: "${section.heading}"`);

          try {
            // Build the image prompt
            const imagePrompt = buildSectionImagePrompt(section.heading, blogData.title, i);

            // Generate image with GPT Image 1.5
            const imageResponse = await openai.images.generate({
              model: "gpt-image-1.5",
              prompt: imagePrompt,
              n: 1,
              size: "1024x1024",
            });

            // GPT Image 1.5 returns base64 data by default
            const imageData = imageResponse.data?.[0];
            const b64Data = (imageData as { b64_json?: string })?.b64_json;
            const generatedImageUrl = imageData?.url;

            let inputBuffer: Buffer;

            if (b64Data) {
              inputBuffer = Buffer.from(b64Data, "base64");
            } else if (generatedImageUrl) {
              const imgResponse = await fetch(generatedImageUrl);
              if (!imgResponse.ok) throw new Error("Failed to download image");
              const imageArrayBuffer = await imgResponse.arrayBuffer();
              inputBuffer = Buffer.from(imageArrayBuffer);
            } else {
              throw new Error("No image data returned");
            }

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
            const fileName = generateSectionImageFilename(blogData.suggestedSlug || "blog", i);
            const uploaded = await imagekit.upload({
              file: webpResult.buffer,
              fileName: fileName,
              folder: "/blogs/section-images",
            });

            if (isDev) console.log(`   ☁️ Uploaded: ${uploaded.url}`);

            // Generate ALT text
            const altText = generateSectionImageAlt(section.heading, blogData.title);

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
        } else {
          // Add section without image
          processedSections.push({
            heading: section.heading,
            content: section.content,
            imageUrl: "",
            imageAlt: "",
            position,
          });
        }
      }
    } else {
      // No image generation - just convert sections to stored format
      processedSections = blogData.sections.map((section: GeneratedSection, i: number) => ({
        heading: section.heading,
        content: section.content,
        imageUrl: "",
        imageAlt: "",
        position: i % 2 === 0 ? "left" : "right" as "left" | "right",
      }));
    }

    if (isDev) console.log(`✅ Blog generation complete`);

    // Build the structured content
    const structuredContent = {
      intro: blogData.intro,
      sections: processedSections,
      faq: blogData.faq,
    };

    // Add sources if available
    if (researchData.sources.length > 0) {
      blogData.sources = researchData.sources;
    }

    return NextResponse.json({
      success: true,
      blog: {
        title: blogData.title,
        metaTitle: blogData.metaTitle,
        metaDescription: blogData.metaDescription,
        excerpt: blogData.excerpt,
        content: JSON.stringify(structuredContent), // Structured content as JSON string
        suggestedTags: blogData.suggestedTags,
        suggestedSlug: blogData.suggestedSlug,
        sources: blogData.sources,
      },
      stats: {
        sectionsGenerated: processedSections.length,
        imagesGenerated: processedSections.filter(s => s.imageUrl).length,
      },
      researchUsed: includeResearch,
      provider: researchData.sources.length > 0 ? "perplexity" : "openai"
    });

  } catch (error: any) {
    console.error("Smart Blog Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate blog" },
      { status: 500 }
    );
  }
}


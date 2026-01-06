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
  topicId?: string; // Optional: Link to existing TopicSuggestion
  language?: "en" | "nl";
  length?: "short" | "medium" | "long";
  tone?: "professional" | "friendly" | "luxury" | "educational";
  includeResearch?: boolean;
  generateImages?: boolean; // New: enable/disable section image generation
}

interface ResearchResult {
  research: string;
  sources: string[];
  provider: "perplexity" | "openai";
}

interface KeywordResearch {
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: "informational" | "transactional" | "navigational" | "commercial";
  suggestedH2s: string[];
  keywordDensityTarget: number; // percentage
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

// AI-driven keyword research - understands context and search intent
async function performKeywordResearch(
  topic: string, 
  research: string, 
  language: string
): Promise<KeywordResearch> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const languageContext = language === "nl" 
    ? "Focus on Dutch/Netherlands real estate terms where relevant."
    : "Focus on English search terms for international investors.";
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert SEO keyword researcher specializing in Thailand/Phuket real estate market.

Your task is to analyze the topic and research data to identify the BEST keywords for Google ranking.

${languageContext}

RULES FOR PRIMARY KEYWORD:
- Must be 2-4 words that someone would actually type in Google
- Include high-intent real estate terms: "buy", "invest", "luxury", "villa", "condo", "property", "market"
- Include location if mentioned: "Phuket", "Thailand", "Bangkok", etc.
- Should have search potential (people actually search for this)
- Example good keywords: "phuket luxury villa investment", "buy condo phuket foreigner", "thailand property market 2026"
- Example BAD keywords: "potential how infrastructure", "unlocking market", "real estate trends"

RULES FOR SECONDARY KEYWORDS (LSI - Latent Semantic Indexing):
- 5-7 related terms that support the primary keyword
- Include long-tail variations
- Include related concepts people also search for

SEARCH INTENT:
- informational: user wants to learn (how to, guide, tips)
- transactional: user wants to buy/invest
- navigational: user looking for specific place/company
- commercial: user researching before purchase

Return ONLY valid JSON.`
      },
      {
        role: "user",
        content: `Analyze this topic and research to determine the best SEO keywords:

TOPIC: "${topic}"

RESEARCH DATA:
${research.slice(0, 2500)}

Return JSON:
{
  "primaryKeyword": "2-4 word search term",
  "secondaryKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "searchIntent": "informational|transactional|navigational|commercial",
  "suggestedH2s": [
    "H2 heading that includes the primary keyword",
    "Another H2 with secondary keyword",
    "Third H2 variation"
  ],
  "keywordDensityTarget": 1.5
}`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 800
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
  
  // Fallback values if AI fails
  return {
    primaryKeyword: result.primaryKeyword || topic.toLowerCase().slice(0, 50),
    secondaryKeywords: result.secondaryKeywords || [],
    searchIntent: result.searchIntent || "informational",
    suggestedH2s: result.suggestedH2s || [],
    keywordDensityTarget: result.keywordDensityTarget || 1.5
  };
}

// Perform web research using Perplexity or OpenAI
async function performResearch(topic: string, language: string): Promise<ResearchResult> {
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
          sources: data.citations || [],
          provider: "perplexity"
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
    sources: [],
    provider: "openai"
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
      topicId,
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
    let researchData: ResearchResult = { 
      research: "", 
      sources: [], 
      provider: "openai"
    };
    
    if (includeResearch) {
      if (isDev) console.log("📚 Performing research...");
      researchData = await performResearch(topic, language);
    }

    // Step 2: AI-driven keyword research (ALWAYS run, uses research if available)
    if (isDev) console.log("🔍 Performing AI keyword research...");
    const keywordResearch = await performKeywordResearch(
      topic, 
      researchData.research || topic, 
      language
    );
    if (isDev) console.log(`🎯 Primary keyword: "${keywordResearch.primaryKeyword}"`);
    if (isDev) console.log(`📝 Secondary keywords: ${keywordResearch.secondaryKeywords.join(", ")}`);
    
    // Save research data to TopicSuggestion if topicId provided
    if (topicId) {
      try {
        await prisma.topicSuggestion.update({
          where: { id: topicId },
          data: {
            researchContent: researchData.research || null,
            researchSources: researchData.sources,
            researchProvider: researchData.provider,
            researchedAt: researchData.research ? new Date() : null,
            primaryKeyword: keywordResearch.primaryKeyword,
            secondaryKeywords: keywordResearch.secondaryKeywords,
            targetSearchIntent: keywordResearch.searchIntent,
          }
        });
        if (isDev) console.log("💾 Research & keywords saved to TopicSuggestion");
      } catch (e) {
        console.error("Failed to save research to topic:", e);
      }
    }

    // Step 3: Generate structured blog content with sections
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build keyword placement instructions
    const keywordInstructions = `
═══════════════════════════════════════════════════════════════
🎯 MANDATORY KEYWORD PLACEMENT (CRITICAL FOR SEO)
═══════════════════════════════════════════════════════════════

PRIMARY KEYWORD: "${keywordResearch.primaryKeyword}"
This MUST appear in:
✓ Title (near the beginning)
✓ Meta title (near the beginning)  
✓ Meta description (first half)
✓ First paragraph/intro (first sentence, bold it)
✓ At least 2 H2 section headings
✓ 4-6 times naturally in the body (${keywordResearch.keywordDensityTarget}% density target)
✓ URL slug

SECONDARY KEYWORDS (distribute throughout):
${keywordResearch.secondaryKeywords.map((kw, i) => `- "${kw}" → Use in section ${i + 1} or FAQ`).join('\n')}

SEARCH INTENT: ${keywordResearch.searchIntent}
${keywordResearch.searchIntent === 'transactional' ? '→ Focus on buying, investing, pricing, ROI' : ''}
${keywordResearch.searchIntent === 'informational' ? '→ Focus on explaining, guiding, teaching' : ''}
${keywordResearch.searchIntent === 'commercial' ? '→ Focus on comparisons, reviews, best options' : ''}

SUGGESTED H2 HEADINGS (use or adapt these):
${keywordResearch.suggestedH2s.map(h2 => `- "${h2}"`).join('\n')}
`;

    const systemPrompt = `You are an elite content strategist and SEO specialist for a premium real estate company.

${companyContext}

Your task is to create a STRUCTURED blog post optimized for Google Featured Snippets and EEAT signals.

${languageInstruction}

${keywordInstructions}

═══════════════════════════════════════════════════════════════
CONTENT STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════

1. TITLE (50-65 characters):
   - MUST include "${keywordResearch.primaryKeyword}" near the beginning
   - Make it compelling and click-worthy

2. META DESCRIPTION (150-160 characters):
   - MUST include "${keywordResearch.primaryKeyword}" in first half
   - Add a clear value proposition
   - Include a soft call-to-action

3. INTRO PARAGRAPH - FEATURED SNIPPET READY:
   - Start with: "<p><strong>${keywordResearch.primaryKeyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</strong>"
   - Direct answer in 40-60 words
   - This is what Google shows in featured snippets

4. SECTIONS (${lengthConfig.sections} total):
   - At least 2 H2 headings MUST contain "${keywordResearch.primaryKeyword}" or close variant
   - Use action words: "How to", "Why", "Best", "Guide to"
   - Each section: 200-350 words

5. CONTENT FORMATTING:
   - Use <h3> tags for sub-topics
   - Use <ul> or <ol> for lists (Google loves lists)
   - Bold (<strong>) important terms including keywords
   - Add "Pro Tip:" callouts: <div class="pro-tip"><strong>Pro Tip:</strong> ...</div>

6. FAQ SECTION (4-6 questions):
   - Include secondary keywords in questions
   - Answers: 2-3 sentences, direct and factual

7. INTERNAL LINKING:
   - 2-3 internal links per section
   - Descriptive anchor text (not "click here")
   - ONLY use URLs from the provided list

═══════════════════════════════════════════════════════════════
JSON OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON:
{
  "title": "Title with ${keywordResearch.primaryKeyword} (50-65 chars)",
  "metaTitle": "SEO title with keyword | Brand (50-65 chars)",
  "metaDescription": "${keywordResearch.primaryKeyword} + value prop (150-160 chars)",
  "excerpt": "2-3 sentence excerpt",
  "intro": "<p><strong>${keywordResearch.primaryKeyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</strong> direct answer...</p>",
  "sections": [
    { 
      "heading": "H2 with keyword or variant", 
      "content": "<p>Content...</p>"
    }
  ],
  "faq": [
    { "question": "Question with secondary keyword?", "answer": "Answer." }
  ],
  "suggestedTags": ["${keywordResearch.primaryKeyword.replace(/\s+/g, '-')}", ...],
  "suggestedSlug": "${keywordResearch.primaryKeyword.replace(/\s+/g, '-')}-guide"
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

    // Format external sources for storage (with usage tracking)
    const externalSources = researchData.sources.map((url, index) => ({
      url,
      title: `Source ${index + 1}`,
      usedCount: 0,
      placement: null as string | null,
      addedAt: new Date().toISOString()
    }));

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
        // SEO data from AI keyword research
        primaryKeyword: keywordResearch.primaryKeyword,
        secondaryKeywords: keywordResearch.secondaryKeywords,
        searchIntent: keywordResearch.searchIntent,
        suggestedH2s: keywordResearch.suggestedH2s,
        keywordDensityTarget: keywordResearch.keywordDensityTarget,
        externalSources,
        sourceTopicId: topicId,
      },
      // Full research data for storage/display
      research: {
        content: researchData.research,
        sources: researchData.sources,
        provider: researchData.provider,
      },
      // Full keyword research for storage/display
      keywordResearch: keywordResearch,
      stats: {
        sectionsGenerated: processedSections.length,
        imagesGenerated: processedSections.filter(s => s.imageUrl).length,
      },
      researchUsed: includeResearch,
      provider: researchData.provider
    });

  } catch (error: any) {
    console.error("Smart Blog Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate blog" },
      { status: 500 }
    );
  }
}


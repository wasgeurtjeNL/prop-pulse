import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

// Get AI-powered topic suggestions
export async function GET(request: Request) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") || "en";
    const category = searchParams.get("category") || "all";
    const refresh = searchParams.get("refresh") === "true";
    const storedOnly = searchParams.get("stored") === "true";

    // Try to use stored topics (with graceful fallback if table doesn't exist yet)
    try {
      // If requesting stored topics only, return ALL stored topics from database
      if (storedOnly) {
        const storedTopics = await prisma.topicSuggestion.findMany({
          where: {
            language,
            ...(category !== "all" ? { category } : {}),
            // Exclude SKIPPED topics
            status: { not: "SKIPPED" }
          },
          orderBy: [
            { status: "asc" }, // AVAILABLE first, then SCHEDULED, then USED
            { createdAt: "desc" }
          ],
          take: 100 // Increased limit to show more topics
        });

        // Also get existing blog titles for matching
        const existingBlogs = await prisma.blog.findMany({
          select: { title: true, id: true, slug: true, published: true },
          take: 200
        });

        // Get scheduled blogs to mark topics as scheduled
        const scheduledBlogs = await prisma.scheduledBlog.findMany({
          where: {
            status: { in: ["SCHEDULED", "PROCESSING"] }
          },
          select: { topicId: true, topicTitle: true, scheduledFor: true }
        });

        // Mark topics with their real status
        const topicsWithStatus = storedTopics.map((topic: any) => {
          // Check if this topic matches an existing blog
          const matchingBlog = existingBlogs.find((b: any) => 
            b.title.toLowerCase().includes(topic.title.toLowerCase().slice(0, 30)) ||
            topic.title.toLowerCase().includes(b.title.toLowerCase().slice(0, 30))
          );
          
          // Check if this topic is scheduled
          const scheduledBlog = scheduledBlogs.find((sb: any) => 
            sb.topicId === topic.id || 
            sb.topicTitle.toLowerCase() === topic.title.toLowerCase()
          );

          // Determine the real status
          let effectiveStatus = topic.status;
          if (matchingBlog) {
            effectiveStatus = "USED";
          } else if (scheduledBlog) {
            effectiveStatus = "SCHEDULED";
          }
          
          return {
            ...topic,
            status: effectiveStatus,
            matchesExistingBlog: !!matchingBlog,
            existingBlogId: matchingBlog?.id,
            existingBlogSlug: matchingBlog?.slug,
            existingBlogPublished: matchingBlog?.published,
            isScheduled: !!scheduledBlog,
            scheduledFor: scheduledBlog?.scheduledFor
          };
        });

        return NextResponse.json({
          topics: topicsWithStatus,
          fromDatabase: true,
          totalCount: storedTopics.length,
          availableCount: topicsWithStatus.filter((t: any) => t.status === "AVAILABLE").length,
          scheduledCount: topicsWithStatus.filter((t: any) => t.status === "SCHEDULED").length,
          usedCount: topicsWithStatus.filter((t: any) => t.status === "USED").length,
          generatedAt: storedTopics[0]?.createdAt?.toISOString() || null
        });
      }

      // If not refreshing, check if we have any stored topics (not just recent ones)
      if (!refresh) {
        const storedTopicsCount = await prisma.topicSuggestion.count({
          where: {
            language,
            status: { not: "SKIPPED" }
          }
        });

        // If we have stored topics, the frontend should use stored=true
        // This path is for when stored=true wasn't passed but we have data
        if (storedTopicsCount >= 5) {
          // Redirect to stored topics logic
          const storedTopics = await prisma.topicSuggestion.findMany({
            where: {
              language,
              status: { not: "SKIPPED" }
            },
            orderBy: [
              { status: "asc" },
              { createdAt: "desc" }
            ],
            take: 100
          });

          const existingBlogs = await prisma.blog.findMany({
            select: { title: true, id: true, slug: true, published: true },
            take: 200
          });

          const scheduledBlogs = await prisma.scheduledBlog.findMany({
            where: {
              status: { in: ["SCHEDULED", "PROCESSING"] }
            },
            select: { topicId: true, topicTitle: true, scheduledFor: true }
          });

          const topicsWithStatus = storedTopics.map((topic: any) => {
            const matchingBlog = existingBlogs.find((b: any) => 
              b.title.toLowerCase().includes(topic.title.toLowerCase().slice(0, 30)) ||
              topic.title.toLowerCase().includes(b.title.toLowerCase().slice(0, 30))
            );
            
            const scheduledBlog = scheduledBlogs.find((sb: any) => 
              sb.topicId === topic.id || 
              sb.topicTitle.toLowerCase() === topic.title.toLowerCase()
            );

            let effectiveStatus = topic.status;
            if (matchingBlog) {
              effectiveStatus = "USED";
            } else if (scheduledBlog) {
              effectiveStatus = "SCHEDULED";
            }
            
            return {
              ...topic,
              status: effectiveStatus,
              matchesExistingBlog: !!matchingBlog,
              existingBlogId: matchingBlog?.id,
              existingBlogSlug: matchingBlog?.slug,
              existingBlogPublished: matchingBlog?.published,
              isScheduled: !!scheduledBlog,
              scheduledFor: scheduledBlog?.scheduledFor
            };
          });

          return NextResponse.json({
            topics: topicsWithStatus,
            fromDatabase: true,
            generatedAt: storedTopics[0]?.createdAt?.toISOString()
          });
        }
      }
    } catch (dbError) {
      // TopicSuggestion table might not exist yet - continue to generate fresh
      console.log("TopicSuggestion table not available, generating fresh topics:", dbError);
    }

    // Get company profile (new model) with fallback to settings
    let companyProfile = null;
    try {
      companyProfile = await prisma.companyProfile.findUnique({
        where: { id: "default" }
      });
    } catch (e) {
      // Model might not exist yet, continue with settings fallback
      console.log("CompanyProfile not available, using settings fallback");
    }
    const settings = await prisma.siteSettings.findFirst();
    
    // Get existing blog titles to avoid duplicates
    const existingBlogs = await prisma.blog.findMany({
      select: { title: true },
      take: 20,
      orderBy: { createdAt: "desc" }
    });
    const existingTitles = existingBlogs.map((b: any) => b.title).join(", ");

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

    const brandKeywords = companyProfile?.brandKeywords
      ? parseJsonArray(companyProfile.brandKeywords)
      : settings?.brandKeywords
        ? parseJsonArray(settings.brandKeywords)
        : ["Phuket", "villa", "investment", "property"];

    const contentThemes = companyProfile?.contentThemes
      ? parseJsonArray(companyProfile.contentThemes)
      : [];

    const companyName = companyProfile?.companyName || settings?.siteName || "Real Estate Pulse";
    const companyDescription = companyProfile?.description || settings?.companyDescription || "Premium real estate in Phuket, Thailand";
    const targetAudience = companyProfile?.targetAudience || settings?.targetAudience || "International investors, expats";

    const companyContext = `
Company Focus:
- Company: ${companyName}
- ${companyDescription}
- Target Audience: ${targetAudience}
- Keywords: ${brandKeywords.join(", ")}
- Content Themes: ${contentThemes.length > 0 ? contentThemes.join(", ") : "Investment, lifestyle, legal, market analysis"}
- USPs: ${companyProfile?.usps ? parseJsonArray(companyProfile.usps).join(", ") : "Local expertise, premium properties"}
`;

    // Use Perplexity for trending topics if available
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    let trendingContext = "";

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
                content: "You are a real estate market analyst. Provide brief, current trending topics in Thailand/Phuket real estate."
              },
              {
                role: "user",
                content: "What are the current trending topics, news, and developments in Thailand and Phuket real estate market? List 5 current trends or news items."
              }
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          trendingContext = `\n\nCURRENT TRENDING TOPICS:\n${data.choices[0]?.message?.content || ""}`;
        }
      } catch (error) {
        console.error("Perplexity trending fetch failed:", error);
      }
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key niet geconfigureerd. Voeg OPENAI_API_KEY toe aan .env.local" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const languageInstruction = language === "nl" 
      ? "Genereer alle titels en beschrijvingen in het Nederlands."
      : "Generate all titles and descriptions in English.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a content strategist for a premium real estate company.
${companyContext}
${trendingContext}

${languageInstruction}

EXISTING BLOGS TO AVOID DUPLICATING:
${existingTitles}

Generate unique, high-potential blog topic suggestions that:
1. Are relevant to the company's focus
2. Have SEO potential
3. Would interest the target audience
4. Are different from existing content`
        },
        {
          role: "user",
          content: `Generate 10 blog topic suggestions for a real estate blog.

For each topic, provide:
- title: A compelling blog title
- description: 1 sentence about what the blog would cover
- category: One of [investment, lifestyle, legal, market, guide, news]
- priority: "trending", "evergreen", or "seasonal"
- difficulty: "easy", "medium", or "hard" (research required)
- estimatedImpact: "high", "medium", or "low"

Return as JSON array.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Failed to parse OpenAI response as JSON");
    }
    
    // Try multiple possible keys for the topics array (OpenAI can return various key names)
    const topics = parsed.topics || parsed.blogTopics || parsed.suggestions || 
                   parsed.topic_suggestions || parsed.blog_topics || parsed.topicSuggestions ||
                   (Array.isArray(parsed) ? parsed : []);

    // Filter by category if specified
    const filteredTopics = category === "all" 
      ? topics 
      : Array.isArray(topics) 
        ? topics.filter((t: any) => t.category === category)
        : topics;

    // Try to save topics to database for persistence (with fallback)
    const batchId = randomUUID();
    const now = new Date();
    let savedTopics: any[] = [];
    
    try {
      savedTopics = await Promise.all(
        (Array.isArray(filteredTopics) ? filteredTopics : []).map(async (topic: any) => {
          try {
            const saved = await prisma.topicSuggestion.create({
              data: {
                id: randomUUID(),
                title: topic.title,
                description: topic.description,
                category: topic.category,
                priority: topic.priority,
                difficulty: topic.difficulty,
                estimatedImpact: topic.estimatedImpact,
                language,
                status: "AVAILABLE",
                batchId,
                createdAt: now,
                updatedAt: now
              }
            });
            return saved;
          } catch (e) {
            // If save fails (e.g., duplicate), return the topic as-is
            console.error("Failed to save topic:", e);
            return { ...topic, id: randomUUID(), status: "AVAILABLE" };
          }
        })
      );
    } catch (saveError) {
      // If saving fails entirely, just use the generated topics with IDs
      console.error("Failed to save topics to database:", saveError);
      savedTopics = (Array.isArray(filteredTopics) ? filteredTopics : []).map((topic: any) => ({
        ...topic,
        id: randomUUID(),
        status: "AVAILABLE"
      }));
    }

    // Get existing blog titles for matching
    const existingBlogsForMatch = await prisma.blog.findMany({
      select: { title: true, id: true },
      take: 100
    });

    const topicsWithStatus = savedTopics.map((topic: any) => {
      const matchingBlog = existingBlogsForMatch.find((b: any) => 
        b.title.toLowerCase().includes(topic.title.toLowerCase().slice(0, 30)) ||
        topic.title.toLowerCase().includes(b.title.toLowerCase().slice(0, 30))
      );
      
      return {
        ...topic,
        matchesExistingBlog: !!matchingBlog,
        existingBlogId: matchingBlog?.id
      };
    });

    return NextResponse.json({
      topics: topicsWithStatus,
      hasTrendingData: !!trendingContext,
      generatedAt: now.toISOString(),
      batchId,
      fromDatabase: false
    });

  } catch (error: any) {
    console.error("Topic Discovery Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate topics" },
      { status: 500 }
    );
  }
}

// PATCH - Update topic status
export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Topic ID and status are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.topicSuggestion.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date(),
        ...(status === "USED" ? { usedAt: new Date() } : {})
      }
    });

    return NextResponse.json({
      success: true,
      topic: updated
    });

  } catch (error: any) {
    console.error("Topic PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update topic" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to safely parse JSON arrays from database
function parseJsonArray(str: string | null | undefined): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // If not JSON, try splitting by newlines or commas
    return str.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
  }
}

// Get full company profile from database
async function getCompanyProfile() {
  try {
    // @ts-expect-error - companyProfile exists in Prisma schema as CompanyProfile with @@map
    const profile = await prisma.companyProfile.findUnique({
      where: { id: "default" }
    });
    
    return {
      companyName: profile?.companyName || "PSM Phuket",
      description: profile?.description || "Premium real estate services in Phuket, Thailand",
      targetAudience: profile?.targetAudience || "International investors, expats, high-net-worth individuals",
      tone: profile?.tone || "professional",
      writingStyle: profile?.writingStyle || "Professional and authoritative",
      usps: parseJsonArray(profile?.usps),
      brandKeywords: parseJsonArray(profile?.brandKeywords),
      avoidTopics: parseJsonArray(profile?.avoidTopics),
      contentThemes: parseJsonArray(profile?.contentThemes),
      expertise: parseJsonArray(profile?.expertise),
    };
  } catch (e) {
    // Fallback if table doesn't exist
    return {
      companyName: "PSM Phuket",
      description: "Premium real estate services in Phuket, Thailand",
      targetAudience: "International investors, expats, high-net-worth individuals",
      tone: "professional",
      writingStyle: "Professional and authoritative",
      usps: [],
      brandKeywords: ["luxury", "premium", "Phuket", "Thailand", "villa", "investment"],
      avoidTopics: [],
      contentThemes: [],
      expertise: ["Phuket real estate", "property investment"],
    };
  }
}

// Strip HTML tags from content
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Extract primary keyword from blog title
function extractKeywordFromTitle(title: string): string {
  const stopWords = [
    "the", "a", "an", "in", "on", "at", "for", "to", "of", "and", "or", "&", "|", "-",
    "how", "what", "why", "when", "where", "who", "which", "your", "our", "their",
    "guide", "tips", "ways", "best", "top", "ultimate", "complete", "essential"
  ];
  
  const words = title.toLowerCase().split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  
  // Return first 2-3 significant words as keyword phrase
  return words.slice(0, 3).join(" ");
}

// Calculate SEO score based on generated content
function calculateSeoScore(
  content: string,
  type: "title" | "description",
  primaryKeyword: string
): number {
  let score = 100;
  const length = content.length;
  const lowerContent = content.toLowerCase();
  const lowerKeyword = primaryKeyword.toLowerCase();

  if (type === "title") {
    // Check length (50-60 is ideal)
    if (length < 40) score -= 20;
    else if (length < 50) score -= 10;
    else if (length > 60) score -= 15;
    
    // Check if keyword is in first 30 chars
    if (primaryKeyword && !lowerContent.slice(0, 30).includes(lowerKeyword)) {
      score -= 15;
    }
    
    // Check for power words
    const powerWords = ["guide", "tips", "best", "ultimate", "essential", "expert", "complete", "top", "how", "why"];
    if (!powerWords.some(word => lowerContent.includes(word))) {
      score -= 5;
    }
  } else {
    // Meta description
    // Check length (145-155 is ideal)
    if (length < 120) score -= 20;
    else if (length < 145) score -= 10;
    else if (length > 160) score -= 15;
    
    // Check if keyword is in first 50 chars
    if (primaryKeyword && !lowerContent.slice(0, 50).includes(lowerKeyword)) {
      score -= 15;
    }
    
    // Check for call-to-action words
    const ctaWords = ["discover", "learn", "find", "explore", "get", "contact", "start", "read", "see"];
    if (!ctaWords.some(word => lowerContent.includes(word))) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title, excerpt, content, type, targetKeyword, url } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Detect if this is the homepage
    const isHomepage = url === "/" || url === "" || url?.toLowerCase() === "home" || title?.toLowerCase() === "home";

    // Get company profile for branding context
    const companyProfile = await getCompanyProfile();
    
    // Clean content for context (limit to 1500 chars to keep tokens low)
    const cleanContent = stripHtml(content || "").slice(0, 1500);
    const cleanExcerpt = stripHtml(excerpt || "").slice(0, 300);
    
    // Extract or use provided keyword
    const primaryKeyword = targetKeyword || extractKeywordFromTitle(title);

    // Build company context with all available data
    const uspsText = companyProfile.usps.length > 0 
      ? `- Unique Selling Points: ${companyProfile.usps.join(", ")}`
      : "";
    const brandKeywordsText = companyProfile.brandKeywords.length > 0
      ? `- Brand Keywords to naturally include: ${companyProfile.brandKeywords.join(", ")}`
      : "";
    const avoidTopicsText = companyProfile.avoidTopics.length > 0
      ? `- Topics to NEVER mention: ${companyProfile.avoidTopics.join(", ")}`
      : "";
    const expertiseText = companyProfile.expertise.length > 0
      ? `- Expertise Areas: ${companyProfile.expertise.join(", ")}`
      : "";

    // Build enhanced system prompt with keyword enforcement and company context
    let systemPrompt: string;
    
    if (type === "title") {
      // Different title format for homepage vs other pages
      const titleRules = isHomepage 
        ? `HOMEPAGE SEO TITLE RULES (BRAND FIRST):
1. MAXIMUM 60 CHARACTERS TOTAL - count carefully!
2. Start with the brand name: "${companyProfile.companyName}"
3. Format: "${companyProfile.companyName} | [Primary Value Proposition]"
4. Example: "${companyProfile.companyName} | Luxury Real Estate in Phuket"
5. Include the main benefit/keywords AFTER the brand name
6. Make it compelling and click-worthy
7. Match the ${companyProfile.tone} tone of voice`
        : `PAGE SEO TITLE RULES (KEYWORD FIRST, BRAND LAST):
1. MAXIMUM 60 CHARACTERS TOTAL - count carefully!
2. Start with the primary keyword "${primaryKeyword}" in the first 25 characters
3. End with "| ${companyProfile.companyName}" if room allows
4. Format: "[Keyword/Topic] | ${companyProfile.companyName}"
5. Use one power word if space allows (Guide, Tips, Best, How, etc.)
6. Make it compelling and click-worthy
7. Match the ${companyProfile.tone} tone of voice`;

      systemPrompt = `You are an SEO expert for ${companyProfile.companyName}, a premium real estate company in Phuket, Thailand.

COMPANY PROFILE (Note: Some text may be in Dutch - translate to English):
- Company: ${companyProfile.companyName}
- Description: ${companyProfile.description}
- Target Audience: ${companyProfile.targetAudience}
- Tone of Voice: ${companyProfile.tone}
- Writing Style: ${companyProfile.writingStyle}
${uspsText}
${brandKeywordsText}
${expertiseText}
${avoidTopicsText}

Your task is to create an optimized SEO title for ${isHomepage ? "the HOMEPAGE" : "a page"} on the ${companyProfile.companyName} website.

${titleRules}

ADDITIONAL RULES:
- Try to naturally include one brand keyword if it fits
- LANGUAGE: ENGLISH ONLY - Never output Dutch or other languages!
- IMPORTANT: The title MUST be under 60 characters. If your output is longer, shorten it.

OUTPUT: Only the SEO title in English, nothing else. No quotes, no explanation.`;
    } else {
      // Different description rules for homepage vs other pages
      const descriptionRules = isHomepage
        ? `HOMEPAGE META DESCRIPTION RULES:
1. Length: 145-160 characters exactly (very important!)
2. Mention "${companyProfile.companyName}" within the first 30 characters
3. Describe the main value proposition of the company
4. Include location (Phuket, Thailand) and main services
5. Create trust and credibility
6. End with a compelling call-to-action
7. Target audience: ${companyProfile.targetAudience}`
        : `PAGE META DESCRIPTION RULES:
1. The primary keyword "${primaryKeyword}" MUST appear within the first 50 characters
2. Length: 145-160 characters exactly (very important!)
3. Start with an action verb or compelling hook
4. Include the main benefit for the reader
5. Create urgency or curiosity
6. End with a subtle call-to-action (Discover, Learn, Explore, Find, etc.)
7. Mention ${companyProfile.companyName} naturally if space allows`;

      systemPrompt = `You are an SEO expert for ${companyProfile.companyName}, a premium real estate company in Phuket, Thailand.

COMPANY PROFILE (Note: Some text may be in Dutch - translate to English):
- Company: ${companyProfile.companyName}
- Description: ${companyProfile.description}
- Target Audience: ${companyProfile.targetAudience}
- Tone of Voice: ${companyProfile.tone}
- Writing Style: ${companyProfile.writingStyle}
${uspsText}
${brandKeywordsText}
${expertiseText}
${avoidTopicsText}

Your task is to create an optimized meta description for ${isHomepage ? "the HOMEPAGE" : "a page"} on the ${companyProfile.companyName} website.

${descriptionRules}

ADDITIONAL RULES:
- Match the ${companyProfile.tone} tone of voice
- Try to naturally include brand keywords: ${companyProfile.brandKeywords.slice(0, 5).join(", ")}
- LANGUAGE: ENGLISH ONLY - Never output Dutch or other languages!

OUTPUT: Only the meta description in English, nothing else. No quotes, no explanation.`;
    }

    const pageTypeInfo = isHomepage 
      ? `Page Type: HOMEPAGE (main landing page)
Format: Brand name FIRST - "${companyProfile.companyName} | [Value Proposition]"`
      : `Page Type: Internal page
Format: Keyword FIRST, brand LAST - "[Topic] | ${companyProfile.companyName}"`;

    const userPrompt = `${pageTypeInfo}

Page Title: ${title}
Page URL: ${url || "/"}
Company: ${companyProfile.companyName}
Primary Keyword: ${primaryKeyword}
${cleanExcerpt ? `Page Summary: ${cleanExcerpt}` : ""}
${cleanContent ? `Content Preview: ${cleanContent}` : ""}

Generate the ${type === "title" ? "SEO title (max 60 chars)" : "meta description (145-155 chars)"} for ${companyProfile.companyName}'s website.

CRITICAL REMINDERS:
- Output in ENGLISH only
${isHomepage ? `- HOMEPAGE: Start with "${companyProfile.companyName} |"` : `- Keyword "${primaryKeyword}" must appear early, end with "| ${companyProfile.companyName}"`}
- Match the ${companyProfile.tone} tone
- Be compelling and SEO-optimized`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content?.trim() || "";

    // Remove quotes if present
    const cleanResult = result.replace(/^["']|["']$/g, "").trim();
    
    // Calculate SEO score
    const seoScore = calculateSeoScore(cleanResult, type, primaryKeyword);

    return NextResponse.json({ 
      result: cleanResult,
      seoScore,
      characterCount: cleanResult.length,
      primaryKeyword,
    });
  } catch (error: any) {
    console.error("SEO Generation Error:", error);
    
    // Check for specific OpenAI errors
    if (error?.code === "insufficient_quota" || error?.type === "insufficient_quota") {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded. Please check your billing at platform.openai.com" },
        { status: 402 }
      );
    }
    
    if (error?.code === "rate_limit_exceeded") {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }
      
      if (error.message.includes("insufficient_quota")) {
        return NextResponse.json(
          { error: "OpenAI API quota exceeded. Please add credits at platform.openai.com" },
          { status: 402 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate SEO content" },
      { status: 500 }
    );
  }
}





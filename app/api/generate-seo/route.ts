import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const { title, excerpt, content, type, targetKeyword } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Clean content for context (limit to 1500 chars to keep tokens low)
    const cleanContent = stripHtml(content || "").slice(0, 1500);
    const cleanExcerpt = stripHtml(excerpt || "").slice(0, 300);
    
    // Extract or use provided keyword
    const primaryKeyword = targetKeyword || extractKeywordFromTitle(title);

    // Build enhanced system prompt with keyword enforcement
    let systemPrompt: string;
    
    if (type === "title") {
      systemPrompt = `You are an SEO expert specializing in real estate content for Thailand/Phuket properties.

Your task is to create an optimized SEO title for a blog article.

CRITICAL SEO RULES - FOLLOW EXACTLY:
1. MAXIMUM 55 CHARACTERS TOTAL - this is STRICT, count carefully!
2. The keyword "${primaryKeyword}" MUST appear in the first 25 characters
3. Do NOT add brand suffix like "| Real Estate Pulse" - keep it short
4. Use one power word if space allows (Guide, Tips, Best, How, etc.)
5. Make it compelling and click-worthy
6. Target audience: International property investors
7. Language: English

IMPORTANT: The title MUST be under 55 characters. If your output is longer, shorten it.

OUTPUT: Only the SEO title, nothing else. No quotes, no explanation.`;
    } else {
      systemPrompt = `You are an SEO expert specializing in real estate content for Thailand/Phuket properties.

Your task is to create an optimized meta description for a blog article.

CRITICAL SEO RULES:
1. The primary keyword "${primaryKeyword}" MUST appear within the first 50 characters - this is MANDATORY
2. Length: 145-155 characters exactly (very important!)
3. Start with an action verb or compelling hook
4. Include the main benefit for the reader
5. Create urgency or curiosity
6. End with a subtle call-to-action (Discover, Learn, Explore, Find, etc.)
7. Target audience: International property investors and expats
8. Language: English

OUTPUT: Only the meta description, nothing else. No quotes, no explanation.`;
    }

    const userPrompt = `Blog Title: ${title}
Primary Keyword: ${primaryKeyword}
${cleanExcerpt ? `Excerpt: ${cleanExcerpt}` : ""}
${cleanContent ? `Content Preview: ${cleanContent}` : ""}

Generate the ${type === "title" ? "SEO title" : "meta description"} now. Remember: the keyword "${primaryKeyword}" must appear early in the output!`;

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
  } catch (error) {
    console.error("SEO Generation Error:", error);
    
    if (error instanceof Error) {
      // Check for specific OpenAI errors
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate SEO content" },
      { status: 500 }
    );
  }
}





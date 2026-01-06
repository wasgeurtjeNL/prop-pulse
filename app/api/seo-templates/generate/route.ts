import { NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateRequest {
  templateId?: string;
  type: "metaTitle" | "metaDescription" | "urlSlug" | "content" | "faq";
  variables: Record<string, string>;
}

// Replace variables in prompt
function replaceVariables(prompt: string, variables: Record<string, string>): string {
  let result = prompt;
  
  // Normalize variable names (primaryKeyword -> keyword)
  const normalizedVars: Record<string, string> = { ...variables };
  if (variables.primaryKeyword && !variables.keyword) {
    normalizedVars.keyword = variables.primaryKeyword;
  }
  
  // Replace all {{variable}} patterns
  for (const [key, value] of Object.entries(normalizedVars)) {
    const pattern = new RegExp(`{{${key}}}`, "g");
    result = result.replace(pattern, value || "");
  }
  
  // Add current year
  result = result.replace(/{{year}}/g, new Date().getFullYear().toString());
  
  // Add brand default
  if (!variables.brand) {
    result = result.replace(/{{brand}}/g, "PSM Phuket");
  }
  
  return result;
}

// Calculate SEO score based on rules
function calculateSeoScore(
  content: string,
  type: string,
  rules: Record<string, unknown>
): number {
  let score = 100;
  const typeRules = rules[type === "metaTitle" ? "metaTitle" : 
                          type === "metaDescription" ? "metaDescription" : 
                          "urlSlug"] as Record<string, unknown> | undefined;
  
  if (!typeRules) return score;

  // Check length
  if (typeRules.minLength && content.length < (typeRules.minLength as number)) {
    score -= 20;
  }
  if (typeRules.maxLength && content.length > (typeRules.maxLength as number)) {
    score -= 30;
  }

  // Check for power words (for title)
  if (type === "metaTitle" && typeRules.powerWords) {
    const powerWords = typeRules.powerWords as string[];
    const hasPoweWord = powerWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );
    if (!hasPoweWord) {
      score -= 10;
    }
  }

  // Check for CTA (for description)
  if (type === "metaDescription" && typeRules.ctaOptions) {
    const ctaOptions = typeRules.ctaOptions as string[];
    const hasCta = ctaOptions.some(cta => 
      content.toLowerCase().includes(cta.toLowerCase())
    );
    if (!hasCta) {
      score -= 15;
    }
  }

  return Math.max(0, score);
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, type, variables } = await request.json() as GenerateRequest;

    // Get template (use default if not specified)
    let template;
    if (templateId) {
      template = await prisma.seoTemplate.findUnique({
        where: { id: templateId },
      });
    } else {
      // Get default template
      template = await prisma.seoTemplate.findFirst({
        where: { isDefault: true, isActive: true },
      });
    }

    if (!template) {
      // Fallback to any active template
      template = await prisma.seoTemplate.findFirst({
        where: { isActive: true },
      });
    }

    if (!template) {
      return NextResponse.json(
        { error: "No SEO template found" },
        { status: 404 }
      );
    }

    // Get the appropriate prompt based on type
    let promptTemplate: string;
    switch (type) {
      case "metaTitle":
        promptTemplate = template.metaTitlePrompt;
        break;
      case "metaDescription":
        promptTemplate = template.metaDescriptionPrompt;
        break;
      case "urlSlug":
        promptTemplate = template.urlSlugRules;
        break;
      case "content":
        if (!template.contentPrompt) {
          return NextResponse.json(
            { error: "Content generation not configured for this template" },
            { status: 400 }
          );
        }
        promptTemplate = template.contentPrompt;
        break;
      case "faq":
        if (!template.faqPrompt) {
          return NextResponse.json(
            { error: "FAQ generation not configured for this template" },
            { status: 400 }
          );
        }
        promptTemplate = template.faqPrompt;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid generation type" },
          { status: 400 }
        );
    }

    // Replace variables in the prompt
    const prompt = replaceVariables(promptTemplate, variables);

    // Build enhanced system prompt with keyword enforcement
    const primaryKeyword = variables.primaryKeyword || variables.keyword || "";
    const secondaryKeywords = variables.secondaryKeywords || "";
    
    let systemPrompt = `You are an expert SEO specialist for real estate websites in Thailand/Phuket.
Follow the rules EXACTLY as specified. Pay special attention to character length limits.
Output ONLY what is requested - no explanations, no quotes, no markdown formatting.`;

    // Add keyword enforcement rules based on type
    if (type === "metaTitle" && primaryKeyword) {
      systemPrompt += `

CRITICAL SEO RULES FOR META TITLE:
1. The primary keyword "${primaryKeyword}" MUST appear in the first 30 characters of the title
2. Title length MUST be between 50-60 characters
3. Include brand "PSM Phuket" at the end with separator "|"
4. Make it compelling and click-worthy`;
    } else if (type === "metaDescription" && primaryKeyword) {
      systemPrompt += `

CRITICAL SEO RULES FOR META DESCRIPTION:
1. The primary keyword "${primaryKeyword}" MUST appear within the first 50 characters - this is MANDATORY
2. Description length MUST be between 145-155 characters
3. Include a clear call-to-action (Explore, Discover, Find, Contact, etc.)
4. Make it compelling to encourage clicks
${secondaryKeywords ? `5. Try to include secondary keywords naturally: ${secondaryKeywords}` : ""}`;
    } else if (type === "urlSlug" && primaryKeyword) {
      systemPrompt += `

CRITICAL SEO RULES FOR URL SLUG:
1. Include the primary keyword "${primaryKeyword}" at the start
2. Use lowercase with hyphens only
3. Maximum 50 characters
4. Remove stop words (the, a, an, and, or)
5. Output ONLY the slug part, no domain or slashes`;
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: type === "content" ? 2000 : type === "faq" ? 1000 : 200,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content?.trim() || "";

    // Clean up the result
    let cleanResult = result.replace(/^["']|["']$/g, "").trim();

    // For URL slug, ensure it's properly formatted
    if (type === "urlSlug") {
      cleanResult = cleanResult
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    // Calculate SEO score
    const seoRules = template.seoRules as Record<string, unknown>;
    const seoScore = calculateSeoScore(cleanResult, type, seoRules);

    // Parse FAQ if applicable
    let parsedResult: unknown = cleanResult;
    if (type === "faq") {
      try {
        // Try to extract JSON from the response
        const jsonMatch = cleanResult.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Keep as string if parsing fails
        parsedResult = cleanResult;
      }
    }

    return NextResponse.json({
      result: parsedResult,
      seoScore,
      characterCount: cleanResult.length,
      template: {
        id: template.id,
        name: template.name,
        displayName: template.displayName,
      },
    });
  } catch (error) {
    console.error("SEO Generation Error:", error);

    if (error instanceof Error) {
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

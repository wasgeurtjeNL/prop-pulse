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
  
  // Replace all {{variable}} patterns
  for (const [key, value] of Object.entries(variables)) {
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

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert SEO specialist for real estate websites in Thailand/Phuket.
Follow the rules EXACTLY as specified. Pay special attention to character length limits.
Output ONLY what is requested - no explanations, no quotes, no markdown formatting.`,
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

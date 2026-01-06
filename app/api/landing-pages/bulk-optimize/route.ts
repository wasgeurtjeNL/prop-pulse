import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Replace variables in prompt
function replaceVariables(prompt: string, variables: Record<string, string>): string {
  let result = prompt;
  
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, "g");
    result = result.replace(pattern, value || "");
  }
  
  result = result.replace(/{{year}}/g, new Date().getFullYear().toString());
  result = result.replace(/{{brand}}/g, "PSM Phuket");
  
  return result;
}

// Extract location from title
function extractLocation(title: string): string {
  const locationMatch = title.match(/(Kamala|Patong|Rawai|Kata|Karon|Bang Tao|Surin|Nai Harn|Chalong|Mai Khao|Phuket)/i);
  return locationMatch ? locationMatch[0] : "Phuket";
}

// Calculate SEO score
function calculateSeoScore(
  metaTitle: string,
  metaDescription: string
): number {
  let score = 100;
  
  // Title checks
  if (metaTitle.length < 50) score -= 15;
  if (metaTitle.length > 60) score -= 20;
  
  // Description checks
  if (metaDescription.length < 145) score -= 15;
  if (metaDescription.length > 160) score -= 20;
  
  // Power word check
  const powerWords = ["exclusive", "luxury", "premier", "guide", "expert", "ultimate", "best"];
  const hasPowerWord = powerWords.some(word => 
    metaTitle.toLowerCase().includes(word)
  );
  if (!hasPowerWord) score -= 10;
  
  return Math.max(0, score);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageIds, templateId } = await request.json();

    if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
      return NextResponse.json(
        { error: "No pages selected" },
        { status: 400 }
      );
    }

    // Limit to 10 pages at a time to prevent timeout
    if (pageIds.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 pages can be optimized at once" },
        { status: 400 }
      );
    }

    // Get template
    let template;
    if (templateId) {
      template = await prisma.seoTemplate.findUnique({
        where: { id: templateId },
      });
    } else {
      template = await prisma.seoTemplate.findFirst({
        where: { isDefault: true, isActive: true },
      });
    }

    if (!template) {
      return NextResponse.json(
        { error: "No SEO template found" },
        { status: 404 }
      );
    }

    // Get pages to optimize
    const pages = await prisma.landingPage.findMany({
      where: { id: { in: pageIds } },
      select: {
        id: true,
        title: true,
        category: true,
        metaTitle: true,
        metaDescription: true,
      },
    });

    const results: Array<{
      id: string;
      title: string;
      success: boolean;
      metaTitle?: string;
      metaDescription?: string;
      seoScore?: number;
      error?: string;
    }> = [];

    // Process each page
    for (const page of pages) {
      try {
        const location = extractLocation(page.title);
        const variables = {
          title: page.title,
          location,
          category: page.category,
          primaryKeyword: page.title.toLowerCase(),
          secondaryKeywords: "",
          brand: "PSM Phuket",
          usp: "Expert guidance for foreign buyers",
        };

        // Generate meta title
        const titlePrompt = replaceVariables(template.metaTitlePrompt, variables);
        const titleCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an SEO expert. Follow the rules EXACTLY. Output ONLY what is requested.",
            },
            { role: "user", content: titlePrompt },
          ],
          max_tokens: 100,
          temperature: 0.7,
        });
        const metaTitle = titleCompletion.choices[0]?.message?.content?.trim()
          .replace(/^["']|["']$/g, "") || "";

        // Generate meta description
        const descPrompt = replaceVariables(template.metaDescriptionPrompt, variables);
        const descCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an SEO expert. Follow the rules EXACTLY. Output ONLY what is requested.",
            },
            { role: "user", content: descPrompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        });
        const metaDescription = descCompletion.choices[0]?.message?.content?.trim()
          .replace(/^["']|["']$/g, "") || "";

        const seoScore = calculateSeoScore(metaTitle, metaDescription);

        // Update page in database
        await prisma.landingPage.update({
          where: { id: page.id },
          data: {
            metaTitle,
            metaDescription,
            seoScore,
            aiGenerated: true,
            aiGeneratedAt: new Date(),
            seoTemplateId: template.id,
          },
        });

        results.push({
          id: page.id,
          title: page.title,
          success: true,
          metaTitle,
          metaDescription,
          seoScore,
        });
      } catch (error) {
        console.error(`Failed to optimize page ${page.id}:`, error);
        results.push({
          id: page.id,
          title: page.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Optimized ${successCount} pages${failCount > 0 ? `, ${failCount} failed` : ""}`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Bulk optimization failed:", error);
    return NextResponse.json(
      { error: "Bulk optimization failed" },
      { status: 500 }
    );
  }
}

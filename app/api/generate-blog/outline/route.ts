import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key niet geconfigureerd. Voeg OPENAI_API_KEY toe aan je .env.local bestand." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, language, targetAudience: customAudience, blogLength } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    // Get company settings for context
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    // Build company context
    const companyContext = settings?.companyDescription 
      ? `
Company Information:
- Description: ${settings.companyDescription}
- Tone of voice: ${settings.companyTone || "professional"}
- Unique Selling Points: ${settings.companyUSPs || "Premium real estate services"}
- Target Audience: ${customAudience || settings.targetAudience || "International property investors and expats"}
- Brand Keywords to include: ${settings.brandKeywords || ""}
- Topics to AVOID: ${settings.avoidTopics || ""}
`
      : `
Company Information:
- A professional real estate agency
- Tone of voice: professional
- Target Audience: ${customAudience || "International property investors and expats"}
`;

    // Determine word count based on length
    const wordCounts: Record<string, { min: number; max: number; sections: number }> = {
      short: { min: 600, max: 800, sections: 3 },
      medium: { min: 1200, max: 1500, sections: 5 },
      long: { min: 2000, max: 2500, sections: 7 },
    };

    const lengthConfig = wordCounts[blogLength] || wordCounts.medium;

    const languageInstruction = language === "nl" 
      ? "Write everything in Dutch (Nederlands). All headings, descriptions, and content must be in Dutch."
      : "Write everything in English. All headings, descriptions, and content must be in English.";

    const systemPrompt = `You are an elite content strategist and SEO specialist for a premium real estate company competing in a high-stakes market.

${companyContext}

Your task is to create a WINNING blog outline that will outperform competitors and rank on Google.

${languageInstruction}

═══════════════════════════════════════════════════════════════
OUTLINE REQUIREMENTS
═══════════════════════════════════════════════════════════════

1. TITLE: Create a compelling, click-worthy title that:
   - Includes the main keyword
   - Uses power words (Ultimate, Essential, Complete, Expert, etc.)
   - Creates curiosity or promises value
   - Is 50-65 characters for optimal display

2. EXCERPT: Write a hook that:
   - Addresses a pain point or desire
   - Promises a specific benefit
   - Is max 150 characters

3. SECTIONS: Create ${lengthConfig.sections} main sections (H2) that:
   - Flow logically from introduction to conclusion
   - Each provides unique, actionable value
   - Include the section types: intro hook, main content, practical tips, and CTA
   - First H2 should contain the main keyword

4. SUBSECTIONS: Add 2-3 H3s per section for:
   - Better readability
   - Featured snippet opportunities
   - Comprehensive coverage

5. INCLUDE THESE SECTION TYPES:
   - A "Key Benefits" or "Why This Matters" section
   - A "Step-by-Step" or "How To" section if relevant
   - A "Pro Tips" or "Expert Insights" section
   - An FAQ section (3-5 questions) at the end

6. KEYWORDS: Suggest 8-10 relevant keywords including:
   - Main keyword
   - Long-tail variations
   - Related terms
   - Location-based keywords (Thailand, Phuket)

Target word count: ${lengthConfig.min}-${lengthConfig.max} words

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════

{
  "title": "Compelling blog title with keyword",
  "excerpt": "Hook that creates curiosity (max 150 chars)",
  "sections": [
    {
      "heading": "H2 Section Title",
      "description": "What this section covers and why it matters",
      "keyPoints": ["Specific point 1", "Specific point 2", "Specific point 3"],
      "subsections": [
        {
          "heading": "H3 Subsection Title",
          "description": "Specific angle or detail covered"
        }
      ]
    }
  ],
  "suggestedKeywords": ["main keyword", "long-tail 1", "long-tail 2", "related term", "location keyword"],
  "estimatedWordCount": ${lengthConfig.min}
}

Return ONLY valid JSON. No markdown, no explanation, no code blocks.`;

    const userPrompt = `Create a detailed blog outline for: "${keyword}"

Target audience: ${customAudience || settings?.targetAudience || "International property investors and expats"}
Blog length: ${blogLength} (${lengthConfig.min}-${lengthConfig.max} words)
Language: ${language === "nl" ? "Dutch" : "English"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      throw new Error("No response from OpenAI");
    }

    const outline = JSON.parse(result);

    return NextResponse.json({ 
      outline,
      settings: {
        language,
        blogLength,
        targetAudience: customAudience || settings?.targetAudience,
      }
    });
  } catch (error: unknown) {
    console.error("Outline Generation Error:", error);

    // Handle OpenAI specific errors
    if (error && typeof error === "object" && "code" in error) {
      const openAIError = error as { code: string; message?: string };
      
      if (openAIError.code === "invalid_api_key") {
        return NextResponse.json(
          { error: "Ongeldige OpenAI API key. Controleer of je key correct is gekopieerd en nog geldig is. Ga naar https://platform.openai.com/api-keys om een nieuwe key te maken." },
          { status: 401 }
        );
      }
      
      if (openAIError.code === "insufficient_quota") {
        return NextResponse.json(
          { error: "OpenAI account heeft onvoldoende credits. Voeg een betaalmethode toe of koop credits op https://platform.openai.com/account/billing" },
          { status: 402 }
        );
      }

      if (openAIError.code === "rate_limit_exceeded") {
        return NextResponse.json(
          { error: "Te veel requests. Wacht even en probeer opnieuw." },
          { status: 429 }
        );
      }
    }

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key probleem. Controleer je configuratie." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Fout: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Er ging iets mis bij het genereren van de outline." },
      { status: 500 }
    );
  }
}


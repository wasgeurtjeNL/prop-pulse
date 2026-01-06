import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface OptimizeRequest {
  type: 'h2' | 'content' | 'meta';
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  primaryKeyword: string;
  secondaryKeywords?: string[];
}

interface StructuredContent {
  intro: string;
  sections: Array<{
    heading: string;
    content: string;
    imageUrl?: string;
    imageAlt?: string;
    position?: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

// Helper to check if content is structured JSON
function parseStructuredContent(content: string): StructuredContent | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed.sections && Array.isArray(parsed.sections)) {
      return parsed as StructuredContent;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: OptimizeRequest = await request.json();
    const { type, title, content, metaTitle, metaDescription, primaryKeyword, secondaryKeywords = [] } = body;

    if (!type || !primaryKeyword) {
      return NextResponse.json({ error: "Type and primaryKeyword are required" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let systemPrompt = "";
    let userPrompt = "";
    let optimized = "";

    // Check if content is structured JSON format
    const structuredContent = parseStructuredContent(content);

    switch (type) {
      case 'h2':
        let h2s: string[] = [];
        
        if (structuredContent) {
          // Extract H2s from structured JSON content
          h2s = structuredContent.sections.map(s => s.heading);
        } else {
          // Fallback: Extract H2s from HTML content
          const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
          let match;
          while ((match = h2Regex.exec(content)) !== null) {
            h2s.push(match[1].replace(/<[^>]+>/g, '').trim());
          }
        }

        if (h2s.length === 0) {
          return NextResponse.json({ error: "No H2 headings found in content" }, { status: 400 });
        }

        systemPrompt = `You are an SEO expert. Rewrite H2 headings to include the primary keyword naturally while keeping them engaging and readable. 

Rules:
- Include the primary keyword "${primaryKeyword}" in at least 50% of headings
- Use secondary keywords where natural: ${secondaryKeywords.join(", ") || "none"}
- Keep headings concise (5-10 words)
- Make them action-oriented or question-based
- Maintain the original meaning and topic
- Return JSON with "headings" array containing the rewritten headings in the same order`;

        userPrompt = `Rewrite these H2 headings for better SEO:
${h2s.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ") || "none"}

Return as JSON: { "headings": ["heading1", "heading2", ...] }`;

        const h2Completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const h2Result = JSON.parse(h2Completion.choices[0]?.message?.content || "{}");
        const newH2s = h2Result.headings || h2Result.h2s || (Array.isArray(h2Result) ? h2Result : []);

        if (structuredContent) {
          // Update headings in structured content
          const updatedStructured = { ...structuredContent };
          updatedStructured.sections = structuredContent.sections.map((section, i) => ({
            ...section,
            heading: newH2s[i] || section.heading
          }));
          optimized = JSON.stringify(updatedStructured);
        } else {
          // Fallback: Replace H2s in HTML content
          const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
          let updatedContent = content;
          let h2Index = 0;
          updatedContent = updatedContent.replace(h2Regex, (match, originalText) => {
            const newHeading = newH2s[h2Index] || originalText.replace(/<[^>]+>/g, '').trim();
            h2Index++;
            return `<h2>${newHeading}</h2>`;
          });
          optimized = updatedContent;
        }
        break;

      case 'meta':
        systemPrompt = `You are an SEO expert. Optimize meta title and description for search engines.

Rules for Meta Title:
- 50-65 characters
- Include primary keyword "${primaryKeyword}" near the beginning
- Compelling and click-worthy
- Include brand name at end if space allows

Rules for Meta Description:
- 150-160 characters
- Include primary keyword naturally
- Clear value proposition
- Soft call-to-action
- Use secondary keywords if natural: ${secondaryKeywords.join(", ") || "none"}

Return JSON: { "metaTitle": "...", "metaDescription": "..." }`;

        userPrompt = `Optimize these for SEO:

Current Title: ${title}
Current Meta Title: ${metaTitle || title}
Current Meta Description: ${metaDescription || "Not set"}

Primary keyword: "${primaryKeyword}"`;

        const metaCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.6,
          response_format: { type: "json_object" }
        });

        optimized = metaCompletion.choices[0]?.message?.content || "{}";
        break;

      case 'content':
        // Optimize intro paragraph to include keyword
        let introText = "";
        
        if (structuredContent) {
          // Get intro from structured content (strip HTML)
          introText = structuredContent.intro.replace(/<[^>]+>/g, '').trim();
        } else {
          // Fallback: Extract from HTML
          const introMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
          introText = introMatch ? introMatch[1].replace(/<[^>]+>/g, '') : "";
        }

        if (!introText) {
          return NextResponse.json({ error: "No intro paragraph found in content" }, { status: 400 });
        }

        systemPrompt = `You are an SEO expert. Rewrite the intro paragraph to:
1. Start with the primary keyword "${primaryKeyword}" (bold it with <strong> tags)
2. Directly answer/address the topic in the first sentence
3. Keep it 40-60 words for featured snippet optimization
4. Include a secondary keyword if natural
5. Be engaging and informative

Return ONLY the optimized paragraph text (can include <strong> for bold, but no <p> tags).`;

        userPrompt = `Current intro: ${introText}

Title: ${title}
Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ") || "none"}

Return ONLY the optimized intro text.`;

        const contentCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.6,
        });

        let newIntro = contentCompletion.choices[0]?.message?.content || "";
        // Clean up any markdown formatting
        newIntro = newIntro.replace(/^\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        if (structuredContent) {
          // Update intro in structured content
          const updatedStructured = { ...structuredContent, intro: newIntro };
          optimized = JSON.stringify(updatedStructured);
        } else {
          // Fallback: Replace intro in HTML content
          const introMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
          if (introMatch) {
            optimized = content.replace(introMatch[0], `<p>${newIntro}</p>`);
          } else {
            optimized = content;
          }
        }
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      optimized
    });

  } catch (error: any) {
    console.error("Content Optimization Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to optimize content" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

interface Subsection {
  heading: string;
  description: string;
}

interface Section {
  heading: string;
  description: string;
  keyPoints: string[];
  subsections?: Subsection[];
}

interface Outline {
  title: string;
  excerpt: string;
  sections: Section[];
  suggestedKeywords: string[];
  estimatedWordCount: number;
}

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

    const { outline, language, blogLength } = await request.json() as {
      outline: Outline;
      language: string;
      blogLength: string;
    };

    if (!outline || !outline.sections) {
      return NextResponse.json({ error: "Valid outline is required" }, { status: 400 });
    }

    // Get company settings for context
    const settings = await prisma.siteSettings.findFirst();

    // Get existing published blogs for internal linking
    const existingBlogs = await prisma.blog.findMany({
      where: { published: true },
      select: { 
        id: true,
        title: true, 
        slug: true, 
        excerpt: true,
        tag: true 
      },
      orderBy: { publishedAt: "desc" },
      take: 20
    });

    // Build internal linking context
    const internalLinksContext = existingBlogs.length > 0 
      ? `
INTERNAL LINKING (CRITICAL FOR SEO):
You MUST include 2-4 internal links to these related blog posts where contextually relevant.
Use this exact format: <a href="/blogs/[slug]" class="internal-link">[anchor text]</a>

Available blog posts to link to:
${existingBlogs.map(blog => `- "${blog.title}" → /blogs/${blog.slug} (Topic: ${blog.tag || 'General'})`).join('\n')}

INTERNAL LINKING BEST PRACTICES:
- Use descriptive anchor text (NOT "click here" or "read more")
- Place links naturally within the content flow
- Link to relevant, related content only
- Spread links throughout the article, not just at the end
- Use keyword-rich but natural anchor text
`
      : "";

    // Build company context
    const companyContext = settings?.companyDescription
      ? `
Company Information:
- Company: ${settings.siteName || "Real Estate Agency"}
- Description: ${settings.companyDescription}
- Tone of voice: ${settings.companyTone || "professional"} - IMPORTANT: Maintain this tone throughout
- Unique Selling Points (weave these in naturally): ${settings.companyUSPs || ""}
- Brand Keywords (include where natural): ${settings.brandKeywords || ""}
- Topics to NEVER mention: ${settings.avoidTopics || "none"}
`
      : `
Company Information:
- A professional real estate agency
- Tone of voice: professional
`;

    // Determine word count based on length
    const wordCounts: Record<string, { min: number; max: number }> = {
      short: { min: 600, max: 800 },
      medium: { min: 1200, max: 1500 },
      long: { min: 2000, max: 2500 },
    };

    const lengthConfig = wordCounts[blogLength] || wordCounts.medium;

    const languageInstruction = language === "nl"
      ? "Write ALL content in Dutch (Nederlands). Every word must be in Dutch."
      : "Write ALL content in English. Every word must be in English.";

    // Build the outline structure for the prompt
    const outlineText = outline.sections.map((section, idx) => {
      let sectionText = `
## ${idx + 1}. ${section.heading}
Description: ${section.description}
Key points to cover: ${section.keyPoints.join(", ")}`;

      if (section.subsections && section.subsections.length > 0) {
        sectionText += "\nSubsections:";
        section.subsections.forEach((sub, subIdx) => {
          sectionText += `\n  ### ${idx + 1}.${subIdx + 1}. ${sub.heading}: ${sub.description}`;
        });
      }

      return sectionText;
    }).join("\n");

    const systemPrompt = `You are an elite content strategist and copywriter for a premium real estate company. You create magazine-quality, SEO-optimized blog posts that outperform competitors and rank #1 on Google.

${companyContext}

${languageInstruction}

═══════════════════════════════════════════════════════════════
SEO KING STANDARDS - DOMINATE SEARCH RANKINGS
═══════════════════════════════════════════════════════════════

1. HEADING HIERARCHY (Critical for SEO):
   - Use <h2> for main sections (include target keyword in first H2)
   - Use <h3> for subsections within H2s
   - Never skip heading levels (no H2 → H4)
   - Include LSI keywords in headings naturally

2. ENGAGING INTRODUCTION (First 100 words are crucial for SEO):
   - Start with a hook: statistic, question, or bold statement
   - Include primary keyword in first paragraph
   - Address the reader's pain point immediately
   - Preview what they'll learn (creates anticipation)

3. RICH FORMATTING ELEMENTS (Use these throughout):

   a) HIGHLIGHT BOXES for key insights:
   <div class="highlight-box">
     <strong>💡 Key Insight:</strong> Important takeaway or tip here.
   </div>

   b) PRO TIPS in styled callouts:
   <div class="pro-tip">
     <strong>Pro Tip:</strong> Expert advice that adds unique value.
   </div>

   c) WARNING/IMPORTANT boxes:
   <div class="warning-box">
     <strong>⚠️ Important:</strong> Critical information readers must know.
   </div>

   d) STATISTICS with visual emphasis:
   <div class="stat-highlight">
     <span class="stat-number">85%</span>
     <span class="stat-text">of investors see positive ROI within 3 years</span>
   </div>

4. CONTENT FORMATTING:
   - <p> paragraphs: 2-4 sentences max (scannable)
   - <strong> for key terms and important phrases
   - <em> for emphasis and foreign terms
   - Use <blockquote> for expert quotes or important statements

5. LISTS (Use strategically):
   - <ul> with <li> for feature lists, benefits, tips
   - <ol> for step-by-step processes, rankings
   - Add context before and after lists

6. VISUAL BREAKS:
   - Add <hr class="section-divider"> between major sections
   - Use spacing to create visual breathing room

${internalLinksContext}

═══════════════════════════════════════════════════════════════
EXTERNAL SOURCES & CREDIBILITY (E-E-A-T)
═══════════════════════════════════════════════════════════════

Add a SOURCES section at the end of the article for credibility:
<div class="sources-section">
  <h3>📚 Sources & References</h3>
  <ul class="sources-list">
    <li><a href="[URL]" target="_blank" rel="noopener noreferrer">[Source Title]</a> - [Brief description]</li>
  </ul>
</div>

Include 3-5 credible sources like:
- Government websites (BOI Thailand, Land Department)
- Industry reports (CBRE, JLL, Knight Frank)
- News sources (Bangkok Post, The Nation)
- Official statistics (Bank of Thailand, NSO)

═══════════════════════════════════════════════════════════════
CALL-TO-ACTION & FAQ SECTIONS
═══════════════════════════════════════════════════════════════

7. CALL-TO-ACTION (End every post with):
   <div class="cta-box">
     <h3>Ready to Take the Next Step?</h3>
     <p>Compelling CTA text that relates to the blog topic...</p>
   </div>

8. FAQ SECTION (For featured snippets - ALWAYS include 3-5 questions):
   <div class="faq-section">
     <h2>Frequently Asked Questions</h2>
     <div class="faq-item">
       <h3>Question here?</h3>
       <p>Concise, direct answer (40-60 words optimal for snippets).</p>
     </div>
   </div>

═══════════════════════════════════════════════════════════════
WRITING QUALITY STANDARDS - BE THE BEST
═══════════════════════════════════════════════════════════════

1. TONE: ${settings?.companyTone || "professional"} but never boring
2. Every paragraph must provide VALUE - no fluff or filler
3. Use power words: exclusive, proven, essential, strategic, premium
4. Include specific numbers and data where possible
5. Write for SKIMMERS: key info should be scannable
6. Target word count: ${lengthConfig.min}-${lengthConfig.max} words
7. Use transition words for flow (Furthermore, Additionally, However)
8. Include the primary keyword 3-5 times naturally throughout

SEO KEYWORDS TO INTEGRATE NATURALLY:
${outline.suggestedKeywords?.join(", ") || "real estate, property investment, Thailand"}

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY clean HTML content. NO markdown, NO code blocks, NO explanations.
Do NOT include <html>, <head>, <body>, or the main title (H1).
Start directly with engaging intro paragraph, then first <h2>.
MUST include: internal links, external sources section, FAQ section.`;

    const userPrompt = `Write the complete blog post following this outline:

TITLE: ${outline.title}

OUTLINE:
${outlineText}

Keywords to incorporate: ${outline.suggestedKeywords?.join(", ") || ""}

Remember: 
- Write in ${language === "nl" ? "Dutch" : "English"}
- Target ${lengthConfig.min}-${lengthConfig.max} words
- Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li>, <strong>
- Make it engaging and valuable for readers`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Clean up the content if it has any markdown artifacts
    let cleanContent = content
      .replace(/```html\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Generate SEO title and meta description
    const seoCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert. Generate an optimized SEO title and meta description.
${languageInstruction}

Return JSON with this structure:
{
  "seoTitle": "SEO optimized title (50-60 chars)",
  "metaDescription": "Compelling meta description (145-155 chars)"
}

Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Blog title: ${outline.title}
Excerpt: ${outline.excerpt}
Keywords: ${outline.suggestedKeywords?.join(", ") || ""}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const seoResult = seoCompletion.choices[0]?.message?.content;
    let seoData = { seoTitle: outline.title, metaDescription: outline.excerpt };

    if (seoResult) {
      try {
        seoData = JSON.parse(seoResult);
      } catch {
        // Use defaults if parsing fails
      }
    }

    return NextResponse.json({
      title: outline.title,
      excerpt: outline.excerpt,
      content: cleanContent,
      seoTitle: seoData.seoTitle,
      metaDescription: seoData.metaDescription,
      suggestedKeywords: outline.suggestedKeywords,
    });
  } catch (error) {
    console.error("Content Generation Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}


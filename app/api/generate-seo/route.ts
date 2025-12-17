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

    const { title, excerpt, content, type } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Clean content for context (limit to 1500 chars to keep tokens low)
    const cleanContent = stripHtml(content || "").slice(0, 1500);
    const cleanExcerpt = stripHtml(excerpt || "").slice(0, 300);

    const systemPrompt = type === "title"
      ? `You are an SEO expert specializing in real estate content for Thailand/Phuket properties.

Your task is to create an optimized SEO title for a blog article.

RULES:
- Length: 50-60 characters maximum (very important!)
- Use power words that drive clicks (Ultimate, Essential, Expert, Guide, Tips, etc.)
- Include the main topic/keyword naturally
- Make it compelling and click-worthy
- Target audience: International property investors and expats
- Language: English

OUTPUT: Only the SEO title, nothing else. No quotes, no explanation.`
      : `You are an SEO expert specializing in real estate content for Thailand/Phuket properties.

Your task is to create an optimized meta description for a blog article.

RULES:
- Length: 145-155 characters exactly (very important!)
- Start with an action verb or compelling hook
- Include the main benefit for the reader
- Create urgency or curiosity
- End with a subtle call-to-action if space allows
- Target audience: International property investors and expats
- Language: English

OUTPUT: Only the meta description, nothing else. No quotes, no explanation.`;

    const userPrompt = `Blog Title: ${title}
${cleanExcerpt ? `Excerpt: ${cleanExcerpt}` : ""}
${cleanContent ? `Content Preview: ${cleanContent}` : ""}

Generate the ${type === "title" ? "SEO title" : "meta description"} now:`;

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

    return NextResponse.json({ result: cleanResult });
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





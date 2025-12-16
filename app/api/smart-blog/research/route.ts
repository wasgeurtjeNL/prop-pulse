import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Research API using Perplexity or OpenAI fallback
export async function POST(request: Request) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, language = "en" } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Try Perplexity first, fall back to OpenAI
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    
    if (perplexityKey) {
      // Use Perplexity API for better research
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
              content: `You are a real estate market research expert. Research the given topic and provide:
1. Current market data and statistics
2. Recent news and developments
3. Expert opinions and trends
4. Specific facts and figures
5. Relevant comparisons

Focus on Thailand/Phuket real estate market. Provide accurate, up-to-date information with sources where possible.
${language === "nl" ? "Respond in Dutch." : "Respond in English."}`
            },
            {
              role: "user",
              content: `Research this topic for a professional real estate blog: "${topic}"

Provide comprehensive research including:
- Key statistics and data points
- Current market trends
- Recent developments or news
- Expert insights
- Actionable information for investors

Format the response as structured research that can be used to write a blog post.`
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const research = data.choices[0]?.message?.content || "";
        const citations = data.citations || [];
        
        return NextResponse.json({
          research,
          sources: citations,
          provider: "perplexity"
        });
      }
    }

    // Fallback to OpenAI (without web search, but still useful)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a real estate market research expert with deep knowledge of the Thailand/Phuket property market.
Provide detailed, factual information based on your training data. Include:
- Market statistics and trends
- Investment insights
- Legal considerations
- Practical advice

${language === "nl" ? "Respond in Dutch." : "Respond in English."}`
        },
        {
          role: "user",
          content: `Provide comprehensive research on: "${topic}"

Include:
- Key facts and statistics about this topic
- Current trends and market conditions
- Expert-level insights
- Practical information for property investors
- Any relevant legal or regulatory considerations

Format as structured research that can be used for a professional blog post.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const research = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      research,
      sources: [],
      provider: "openai"
    });

  } catch (error: any) {
    console.error("Research API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform research" },
      { status: 500 }
    );
  }
}



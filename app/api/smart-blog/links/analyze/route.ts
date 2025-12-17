import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import OpenAI from "openai";

interface LinkOpportunity {
  linkId: string;
  url: string;
  title: string;
  suggestedAnchorText: string;
  contextSnippet: string;
  relevanceScore: number;
  insertPosition?: number;
}

interface MissingTopic {
  topic: string;
  suggestedUrl: string;
  reason: string;
}

interface AnalysisResult {
  blogId: string;
  blogTitle: string;
  currentLinkCount: number;
  opportunities: LinkOpportunity[];
  missingTopics: MissingTopic[];
  optimizationScore: number; // 0-100
}

// POST - Analyze a specific blog for link opportunities
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blogId } = await request.json();

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
    }

    // Get the blog
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        linkUsages: {
          include: { link: true }
        }
      }
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Get available internal links
    const availableLinks = await prisma.internalLink.findMany({
      where: { isActive: true, pageExists: true },
      orderBy: [{ priority: 'desc' }, { usageCount: 'asc' }]
    });

    // Get already used links in this blog
    const usedLinkIds = blog.linkUsages.map(u => u.linkId);
    const unusedLinks = availableLinks.filter(l => !usedLinkIds.includes(l.id));

    // Check OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Prepare links context
    const linksContext = unusedLinks.map(l => 
      `ID: ${l.id} | URL: ${l.url} | Title: "${l.title}" | Keywords: ${l.keywords || 'general'} | Category: ${l.category || 'page'} | Priority: ${l.priority}`
    ).join("\n");

    // Count existing internal links in content
    const existingLinkMatches = blog.content.match(/<a[^>]+href=["'][^"']*["'][^>]*class=["'][^"']*internal-link/gi);
    const currentLinkCount = existingLinkMatches?.length || 0;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Je bent een SEO-expert gespecialiseerd in internal linking voor vastgoed content. 
Analyseer de blog content en identificeer:
1. Waar bestaande internal links NATUURLIJK passen (niet geforceerd)
2. Topics die worden besproken maar geen matching link hebben

REGELS:
- Maximum 4-5 link suggesties per blog
- Links moeten contexteel relevant zijn
- Nooit linken in citaten, cijfers, of technische termen
- Verdeel links door de hele content
- Anchor text moet natuurlijk lezen, niet "klik hier"
- Geef een relevance score (0-1) voor elke suggestie

Antwoord ALLEEN in dit JSON formaat:
{
  "opportunities": [
    {
      "linkId": "exact-id-from-list",
      "suggestedAnchorText": "natuurlijke anchor tekst",
      "contextSnippet": "...zin waarin de link past...",
      "relevanceScore": 0.95
    }
  ],
  "missingTopics": [
    {
      "topic": "Topic zonder matching link",
      "suggestedUrl": "/suggested/path",
      "reason": "Waarom dit een goede landingspagina zou zijn"
    }
  ],
  "optimizationScore": 75
}`
        },
        {
          role: "user",
          content: `## Blog: "${blog.title}"

## Huidige Internal Links: ${currentLinkCount}

## Content:
${blog.content.slice(0, 6000)}

## Beschikbare Links (nog niet gebruikt in deze blog):
${linksContext || "Geen beschikbare links"}

Analyseer de content en geef link suggesties. Geef een optimizationScore (0-100) gebaseerd op hoe goed de blog al geoptimaliseerd is voor internal linking.`
        }
      ],
      temperature: 0.4,
      max_tokens: 2000
    });

    const result = completion.choices[0]?.message?.content || "{}";
    
    let analysis: { opportunities: any[]; missingTopics: any[]; optimizationScore: number };
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch?.[0] || '{"opportunities":[],"missingTopics":[],"optimizationScore":50}');
    } catch {
      analysis = { opportunities: [], missingTopics: [], optimizationScore: 50 };
    }

    // Enrich opportunities with full link data
    const enrichedOpportunities = (analysis.opportunities || []).map((opp: any) => {
      const link = availableLinks.find(l => l.id === opp.linkId);
      if (!link) return null;
      
      return {
        linkId: opp.linkId,
        url: link.url,
        title: link.title,
        suggestedAnchorText: opp.suggestedAnchorText || link.title,
        contextSnippet: opp.contextSnippet || "",
        relevanceScore: opp.relevanceScore || 0.5
      };
    }).filter(Boolean);

    const response: AnalysisResult = {
      blogId: blog.id,
      blogTitle: blog.title,
      currentLinkCount,
      opportunities: enrichedOpportunities,
      missingTopics: analysis.missingTopics || [],
      optimizationScore: analysis.optimizationScore || 50
    };

    return NextResponse.json({
      success: true,
      analysis: response
    });

  } catch (error: any) {
    console.error("Blog Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze blog" },
      { status: 500 }
    );
  }
}

// GET - Analyze all blogs and return optimization summary
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all published blogs with their link counts
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        internalLinkCount: true,
        linkOptimizedAt: true,
        createdAt: true,
        publishedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count internal links in each blog
    const blogsWithCounts = blogs.map(blog => {
      // Count actual internal links in HTML
      const internalLinkMatches = blog.content.match(/<a[^>]+class=["'][^"']*internal-link/gi);
      const actualLinkCount = internalLinkMatches?.length || 0;
      
      // Calculate word count
      const textContent = blog.content.replace(/<[^>]+>/g, ' ');
      const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
      
      // Ideal: 1 link per 300-500 words, max 5-7 per post
      const idealMinLinks = Math.min(Math.floor(wordCount / 500), 3);
      const idealMaxLinks = Math.min(Math.ceil(wordCount / 300), 7);
      
      let status: 'good' | 'needs_optimization' | 'over_optimized';
      if (actualLinkCount >= idealMinLinks && actualLinkCount <= idealMaxLinks) {
        status = 'good';
      } else if (actualLinkCount < idealMinLinks) {
        status = 'needs_optimization';
      } else {
        status = 'over_optimized';
      }

      return {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        wordCount,
        actualLinkCount,
        idealRange: { min: idealMinLinks, max: idealMaxLinks },
        status,
        lastOptimized: blog.linkOptimizedAt,
        publishedAt: blog.publishedAt || blog.createdAt
      };
    });

    const needsOptimization = blogsWithCounts.filter(b => b.status === 'needs_optimization');
    const goodBlogs = blogsWithCounts.filter(b => b.status === 'good');
    const overOptimized = blogsWithCounts.filter(b => b.status === 'over_optimized');

    return NextResponse.json({
      summary: {
        total: blogs.length,
        needsOptimization: needsOptimization.length,
        good: goodBlogs.length,
        overOptimized: overOptimized.length
      },
      blogs: {
        needsOptimization: needsOptimization.slice(0, 20),
        good: goodBlogs.slice(0, 10),
        overOptimized
      }
    });

  } catch (error: any) {
    console.error("Get Blog Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get blog analysis" },
      { status: 500 }
    );
  }
}





import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import OpenAI from "openai";

interface BatchResult {
  blogId: string;
  blogTitle: string;
  status: 'success' | 'skipped' | 'error';
  linksInjected?: number;
  error?: string;
}

// Helper: Find injection point
function findInjectionPoint(content: string, anchorText: string, avoidPositions: number[]): { start: number; end: number } | null {
  const lowerContent = content.toLowerCase();
  const lowerAnchor = anchorText.toLowerCase();
  
  let searchStart = 0;
  
  while (searchStart < content.length) {
    const position = lowerContent.indexOf(lowerAnchor, searchStart);
    
    if (position === -1) break;
    
    // Check if position is valid
    const isTooClose = avoidPositions.some(pos => Math.abs(pos - position) < 200);
    
    // Check if inside tag
    const beforePos = content.slice(0, position);
    const lastOpenTag = beforePos.lastIndexOf('<');
    const lastCloseTag = beforePos.lastIndexOf('>');
    const isInsideTag = lastOpenTag > lastCloseTag;
    
    // Check if inside link
    const lastAOpen = beforePos.lastIndexOf('<a ');
    const lastAClose = beforePos.lastIndexOf('</a>');
    const isInsideLink = lastAOpen > lastAClose;
    
    if (!isTooClose && !isInsideTag && !isInsideLink) {
      return {
        start: position,
        end: position + anchorText.length
      };
    }
    
    searchStart = position + 1;
  }
  
  return null;
}

// POST - Batch process multiple blogs for link optimization
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blogIds, limit = 10, preview = true, forceApprove = false } = await request.json();

    // Check OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get blogs to process
    let blogs;
    if (blogIds && Array.isArray(blogIds) && blogIds.length > 0) {
      blogs = await prisma.blog.findMany({
        where: { 
          id: { in: blogIds },
          published: true
        },
        select: {
          id: true,
          title: true,
          content: true,
          originalContent: true,
          internalLinkCount: true,
          linkOptimizedAt: true
        }
      });
    } else {
      // Get blogs that need optimization (not optimized yet, or optimized more than 30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      blogs = await prisma.blog.findMany({
        where: {
          published: true,
          OR: [
            { linkOptimizedAt: null },
            { linkOptimizedAt: { lt: thirtyDaysAgo } }
          ]
        },
        select: {
          id: true,
          title: true,
          content: true,
          originalContent: true,
          internalLinkCount: true,
          linkOptimizedAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    }

    if (blogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No blogs to process",
        results: []
      });
    }

    // Get available internal links
    const availableLinks = await prisma.internalLink.findMany({
      where: { isActive: true, pageExists: true },
      orderBy: [{ priority: 'desc' }, { usageCount: 'asc' }]
    });

    if (availableLinks.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No internal links available. Add some links first."
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const results: BatchResult[] = [];
    const allPreviews: any[] = [];

    // Process each blog
    for (const blog of blogs) {
      try {
        // Get already used links in this blog
        const usedLinks = await prisma.linkUsage.findMany({
          where: { blogId: blog.id },
          select: { linkId: true }
        });
        const usedLinkIds = usedLinks.map(u => u.linkId);
        const unusedLinks = availableLinks.filter(l => !usedLinkIds.includes(l.id));

        if (unusedLinks.length === 0) {
          results.push({
            blogId: blog.id,
            blogTitle: blog.title,
            status: 'skipped',
            error: 'All available links already used'
          });
          continue;
        }

        // AI analysis for this blog
        const linksContext = unusedLinks.slice(0, 10).map(l => 
          `ID: ${l.id}\nURL: ${l.url}\nTitle: ${l.title}\nKeywords: ${l.keywords || 'general'}`
        ).join("\n---\n");

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Je bent een SEO-expert. Analyseer de blog content en bepaal waar internal links moeten worden geplaatst.

REGELS:
1. De anchor text MOET EXACT voorkomen in de content (case-insensitive)
2. Maximum 3 links per blog
3. Nooit in H1, H2, H3 tags of bestaande links
4. Minimaal 200 karakters tussen links

Antwoord ALLEEN in JSON:
{
  "injections": [
    {
      "linkId": "exact-link-id",
      "anchorText": "exacte tekst uit content"
    }
  ]
}`
            },
            {
              role: "user",
              content: `## Blog: "${blog.title}"

## Content (first 5000 chars):
${blog.content.slice(0, 5000)}

## Beschikbare Links:
${linksContext}

Vind 2-3 perfecte plekken voor links.`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        });

        const result = completion.choices[0]?.message?.content || "{}";
        
        let aiSuggestions: { injections: any[] };
        try {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          aiSuggestions = JSON.parse(jsonMatch?.[0] || '{"injections":[]}');
        } catch {
          aiSuggestions = { injections: [] };
        }

        // Validate injections
        const validInjections: any[] = [];
        let workingContent = blog.content;
        const usedPositions: number[] = [];

        for (const suggestion of aiSuggestions.injections || []) {
          const link = unusedLinks.find(l => l.id === suggestion.linkId);
          if (!link) continue;

          const anchorText = suggestion.anchorText;
          if (!anchorText || anchorText.length < 3) continue;

          const injection = findInjectionPoint(workingContent, anchorText, usedPositions);
          
          if (injection) {
            const originalText = workingContent.slice(injection.start, injection.end);
            const newHtml = `<a href="${link.url}" class="internal-link">${originalText}</a>`;
            
            validInjections.push({
              linkId: link.id,
              originalText,
              newHtml,
              anchorText: originalText,
              position: injection.start
            });
            
            usedPositions.push(injection.start);
          }
        }

        if (validInjections.length === 0) {
          results.push({
            blogId: blog.id,
            blogTitle: blog.title,
            status: 'skipped',
            error: 'No valid injection points found'
          });
          continue;
        }

        // Generate new content
        let newContent = blog.content;
        const sortedInjections = [...validInjections].sort((a, b) => b.position - a.position);
        
        for (const inj of sortedInjections) {
          const before = newContent.slice(0, inj.position);
          const after = newContent.slice(inj.position + inj.originalText.length);
          newContent = before + inj.newHtml + after;
        }

        if (preview && !forceApprove) {
          allPreviews.push({
            blogId: blog.id,
            blogTitle: blog.title,
            injections: validInjections,
            previewSnippets: validInjections.map(inj => ({
              before: inj.originalText,
              after: inj.newHtml
            }))
          });
          
          results.push({
            blogId: blog.id,
            blogTitle: blog.title,
            status: 'success',
            linksInjected: validInjections.length
          });
        } else {
          // Apply changes
          const originalContent = blog.originalContent || blog.content;
          
          await prisma.blog.update({
            where: { id: blog.id },
            data: {
              content: newContent,
              originalContent,
              linkOptimizedAt: new Date(),
              internalLinkCount: blog.internalLinkCount + validInjections.length
            }
          });

          // Create usage records
          for (const inj of validInjections) {
            try {
              await prisma.linkUsage.create({
                data: {
                  linkId: inj.linkId,
                  blogId: blog.id,
                  anchorText: inj.anchorText,
                  context: inj.originalText.slice(0, 200),
                  position: inj.position,
                  wasAutoInserted: true
                }
              });

              await prisma.internalLink.update({
                where: { id: inj.linkId },
                data: { usageCount: { increment: 1 } }
              });
            } catch (e: any) {
              console.log("Failed to create usage record:", e.message);
            }
          }

          results.push({
            blogId: blog.id,
            blogTitle: blog.title,
            status: 'success',
            linksInjected: validInjections.length
          });
        }

      } catch (error: any) {
        results.push({
          blogId: blog.id,
          blogTitle: blog.title,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const totalLinksInjected = results.reduce((sum, r) => sum + (r.linksInjected || 0), 0);

    return NextResponse.json({
      success: true,
      preview: preview && !forceApprove,
      summary: {
        processed: blogs.length,
        success: successCount,
        skipped: skippedCount,
        errors: errorCount,
        totalLinksInjected
      },
      results,
      ...(preview && !forceApprove ? { previews: allPreviews } : {})
    });

  } catch (error: any) {
    console.error("Batch Process Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process blogs" },
      { status: 500 }
    );
  }
}

// GET - Get batch processing status and candidates
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stats
    const totalBlogs = await prisma.blog.count({ where: { published: true } });
    const optimizedBlogs = await prisma.blog.count({ 
      where: { 
        published: true, 
        linkOptimizedAt: { not: null } 
      } 
    });
    const totalLinks = await prisma.internalLink.count({ where: { isActive: true } });
    const totalUsages = await prisma.linkUsage.count();

    // Get candidates for optimization
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const candidates = await prisma.blog.findMany({
      where: {
        published: true,
        OR: [
          { linkOptimizedAt: null },
          { linkOptimizedAt: { lt: thirtyDaysAgo } }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        linkOptimizedAt: true,
        internalLinkCount: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      stats: {
        totalBlogs,
        optimizedBlogs,
        needsOptimization: totalBlogs - optimizedBlogs,
        totalLinks,
        totalUsages,
        optimizationRate: totalBlogs > 0 ? Math.round((optimizedBlogs / totalBlogs) * 100) : 0
      },
      candidates
    });

  } catch (error: any) {
    console.error("Get Batch Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get batch status" },
      { status: 500 }
    );
  }
}



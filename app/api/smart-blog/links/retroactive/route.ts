import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import OpenAI from "openai";

interface InjectionPoint {
  linkId: string;
  originalText: string;
  newHtml: string;
  anchorText: string;
  position: number;
}

interface InjectionResult {
  blogId: string;
  blogTitle: string;
  linksInjected: number;
  injectionPoints: InjectionPoint[];
  previewContent?: string;
}

// Helper: Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: Check if position is inside an HTML tag or existing link
function isInsideTagOrLink(content: string, position: number): boolean {
  // Check if we're inside an HTML tag
  const beforePos = content.slice(0, position);
  const lastOpenTag = beforePos.lastIndexOf('<');
  const lastCloseTag = beforePos.lastIndexOf('>');
  
  if (lastOpenTag > lastCloseTag) {
    // We're inside a tag
    return true;
  }
  
  // Check if we're inside an <a> tag
  const lastAOpen = beforePos.lastIndexOf('<a ');
  const lastAClose = beforePos.lastIndexOf('</a>');
  
  if (lastAOpen > lastAClose) {
    return true;
  }
  
  return false;
}

// Helper: Find best injection point for anchor text
function findInjectionPoint(content: string, anchorText: string, avoidPositions: number[]): { start: number; end: number } | null {
  const lowerContent = content.toLowerCase();
  const lowerAnchor = anchorText.toLowerCase();
  
  let searchStart = 0;
  
  while (searchStart < content.length) {
    const position = lowerContent.indexOf(lowerAnchor, searchStart);
    
    if (position === -1) break;
    
    // Check if this position is valid
    const isTooClose = avoidPositions.some(pos => Math.abs(pos - position) < 200);
    const isInsideTag = isInsideTagOrLink(content, position);
    
    if (!isTooClose && !isInsideTag) {
      // Found a valid position
      return {
        start: position,
        end: position + anchorText.length
      };
    }
    
    searchStart = position + 1;
  }
  
  return null;
}

// POST - Inject links into a specific blog (with preview option)
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blogId, injections, preview = true, forceApprove = false } = await request.json();

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
    }

    // Get the blog
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // If no injections provided, analyze and suggest
    if (!injections || injections.length === 0) {
      // Check OpenAI
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }

      // Get available internal links
      const availableLinks = await prisma.internalLink.findMany({
        where: { isActive: true, pageExists: true },
        orderBy: [{ priority: 'desc' }, { usageCount: 'asc' }]
      });

      // Get already used links
      const usedLinks = await prisma.linkUsage.findMany({
        where: { blogId },
        select: { linkId: true }
      });
      const usedLinkIds = usedLinks.map(u => u.linkId);
      const unusedLinks = availableLinks.filter(l => !usedLinkIds.includes(l.id));

      if (unusedLinks.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No new links available to inject",
          injections: []
        });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const linksContext = unusedLinks.slice(0, 15).map(l => 
        `ID: ${l.id}\nURL: ${l.url}\nTitle: ${l.title}\nKeywords: ${l.keywords || 'general'}`
      ).join("\n---\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Je bent een SEO-expert. Analyseer de blog content en bepaal waar internal links PRECIES moeten worden geplaatst.

KRITIEKE REGELS:
1. Geef EXACTE tekst fragmenten uit de content die vervangen moeten worden
2. De anchor text moet LETTERLIJK in de content voorkomen (case-insensitive match is ok)
3. Nooit linken in H1, H2, H3 tags
4. Nooit linken in bestaande links
5. Nooit linken in citaten of statistieken
6. Maximum 4 links per blog
7. Minimaal 200 karakters tussen links
8. Kies de EERSTE relevante voorkomen van de anchor text

Antwoord in dit EXACTE JSON formaat:
{
  "injections": [
    {
      "linkId": "exact-link-id",
      "anchorText": "exacte tekst uit content die gelinkt moet worden",
      "reason": "waarom deze link hier past"
    }
  ]
}`
          },
          {
            role: "user",
            content: `## Blog Content:
${blog.content.slice(0, 8000)}

## Beschikbare Links:
${linksContext}

Vind 2-4 perfecte plekken om links te injecteren. De anchorText MOET exact voorkomen in de content.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const result = completion.choices[0]?.message?.content || "{}";
      
      let aiSuggestions: { injections: any[] };
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        aiSuggestions = JSON.parse(jsonMatch?.[0] || '{"injections":[]}');
      } catch {
        aiSuggestions = { injections: [] };
      }

      // Validate and prepare injections
      const validInjections: InjectionPoint[] = [];
      let workingContent = blog.content;
      const usedPositions: number[] = [];

      for (const suggestion of aiSuggestions.injections || []) {
        const link = unusedLinks.find(l => l.id === suggestion.linkId);
        if (!link) continue;

        const anchorText = suggestion.anchorText;
        if (!anchorText || anchorText.length < 3) continue;

        // Find the anchor text in content
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
        return NextResponse.json({
          success: true,
          message: "No valid injection points found",
          injections: [],
          aiSuggestions: aiSuggestions.injections
        });
      }

      // Generate preview
      let previewContent = blog.content;
      // Sort by position descending to not mess up positions when replacing
      const sortedInjections = [...validInjections].sort((a, b) => b.position - a.position);
      
      for (const inj of sortedInjections) {
        const before = previewContent.slice(0, inj.position);
        const after = previewContent.slice(inj.position + inj.originalText.length);
        previewContent = before + inj.newHtml + after;
      }

      if (preview && !forceApprove) {
        return NextResponse.json({
          success: true,
          preview: true,
          blogId: blog.id,
          blogTitle: blog.title,
          injections: validInjections,
          previewContent,
          message: `Found ${validInjections.length} injection points. Call with forceApprove=true to apply.`
        });
      }

      // Apply the injections
      return await applyInjections(blog, validInjections, previewContent);
    }

    // Injections were provided directly
    const validInjections = injections.filter((inj: InjectionPoint) => 
      inj.linkId && inj.originalText && inj.newHtml
    );

    if (validInjections.length === 0) {
      return NextResponse.json({ error: "No valid injections provided" }, { status: 400 });
    }

    // Generate the new content
    let newContent = blog.content;
    const sortedInjections = [...validInjections].sort((a: InjectionPoint, b: InjectionPoint) => 
      (b.position || 0) - (a.position || 0)
    );
    
    for (const inj of sortedInjections) {
      newContent = newContent.replace(inj.originalText, inj.newHtml);
    }

    if (preview && !forceApprove) {
      return NextResponse.json({
        success: true,
        preview: true,
        blogId: blog.id,
        blogTitle: blog.title,
        injections: validInjections,
        previewContent: newContent,
        message: `Preview of ${validInjections.length} injections. Call with forceApprove=true to apply.`
      });
    }

    return await applyInjections(blog, validInjections, newContent);

  } catch (error: any) {
    console.error("Retroactive Injection Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to inject links" },
      { status: 500 }
    );
  }
}

// Helper function to apply injections and save
async function applyInjections(
  blog: { id: string; title: string; content: string; originalContent: string | null; internalLinkCount: number },
  injections: InjectionPoint[],
  newContent: string
) {
  // Backup original content if not already backed up
  const originalContent = blog.originalContent || blog.content;

  // Update the blog
  await prisma.blog.update({
    where: { id: blog.id },
    data: {
      content: newContent,
      originalContent,
      linkOptimizedAt: new Date(),
      internalLinkCount: blog.internalLinkCount + injections.length
    }
  });

  // Create link usage records
  for (const inj of injections) {
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

      // Increment usage count on the link
      await prisma.internalLink.update({
        where: { id: inj.linkId },
        data: { usageCount: { increment: 1 } }
      });
    } catch (e: any) {
      console.log("Failed to create usage record:", e.message);
    }
  }

  return NextResponse.json({
    success: true,
    applied: true,
    blogId: blog.id,
    blogTitle: blog.title,
    linksInjected: injections.length,
    message: `Successfully injected ${injections.length} links`
  });
}

// PUT - Rollback to original content
export async function PUT(request: Request) {
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

    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    if (!blog.originalContent) {
      return NextResponse.json({ error: "No original content backup available" }, { status: 400 });
    }

    // Delete link usages for this blog
    await prisma.linkUsage.deleteMany({
      where: { blogId, wasAutoInserted: true }
    });

    // Restore original content
    await prisma.blog.update({
      where: { id: blogId },
      data: {
        content: blog.originalContent,
        originalContent: null,
        linkOptimizedAt: null,
        internalLinkCount: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: "Content rolled back to original",
      blogId
    });

  } catch (error: any) {
    console.error("Rollback Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rollback" },
      { status: 500 }
    );
  }
}

// GET - Get all blogs with their optimization status
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // optimized, needs_optimization, all

    const blogs = await prisma.blog.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        internalLinkCount: true,
        linkOptimizedAt: true,
        originalContent: true,
        createdAt: true,
        _count: {
          select: { linkUsages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedBlogs = blogs.map(blog => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      linkCount: blog.internalLinkCount,
      usageCount: blog._count.linkUsages,
      optimizedAt: blog.linkOptimizedAt,
      canRollback: !!blog.originalContent,
      isOptimized: !!blog.linkOptimizedAt,
      createdAt: blog.createdAt
    }));

    let filteredBlogs = enrichedBlogs;
    if (status === 'optimized') {
      filteredBlogs = enrichedBlogs.filter(b => b.isOptimized);
    } else if (status === 'needs_optimization') {
      filteredBlogs = enrichedBlogs.filter(b => !b.isOptimized);
    }

    return NextResponse.json({
      summary: {
        total: blogs.length,
        optimized: enrichedBlogs.filter(b => b.isOptimized).length,
        needsOptimization: enrichedBlogs.filter(b => !b.isOptimized).length
      },
      blogs: filteredBlogs
    });

  } catch (error: any) {
    console.error("Get Retroactive Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get status" },
      { status: 500 }
    );
  }
}

// DELETE - Remove all auto-inserted links from a blog (but keep manual ones)
export async function DELETE(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("blogId");

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
    }

    // Get auto-inserted links
    const autoLinks = await prisma.linkUsage.findMany({
      where: { blogId, wasAutoInserted: true },
      include: { link: true }
    });

    if (autoLinks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No auto-inserted links to remove"
      });
    }

    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Remove the links from content
    let newContent = blog.content;
    for (const usage of autoLinks) {
      // Create a regex to find the link
      const linkPattern = new RegExp(
        `<a[^>]+href=["']${escapeRegex(usage.link.url)}["'][^>]*class=["'][^"']*internal-link[^"']*["'][^>]*>([^<]*)</a>`,
        'gi'
      );
      
      newContent = newContent.replace(linkPattern, '$1');
    }

    // Update blog
    await prisma.blog.update({
      where: { id: blogId },
      data: {
        content: newContent,
        internalLinkCount: { decrement: autoLinks.length }
      }
    });

    // Delete usage records
    await prisma.linkUsage.deleteMany({
      where: { blogId, wasAutoInserted: true }
    });

    // Decrement usage counts
    for (const usage of autoLinks) {
      await prisma.internalLink.update({
        where: { id: usage.linkId },
        data: { usageCount: { decrement: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      removed: autoLinks.length,
      message: `Removed ${autoLinks.length} auto-inserted links`
    });

  } catch (error: any) {
    console.error("Remove Links Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove links" },
      { status: 500 }
    );
  }
}





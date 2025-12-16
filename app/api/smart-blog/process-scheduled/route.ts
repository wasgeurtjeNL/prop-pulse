import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This endpoint processes scheduled blogs that are due
// Should be called by a cron job (e.g., every 5-15 minutes)
// Vercel Cron: Add to vercel.json
// Alternative: Supabase Edge Functions, GitHub Actions, etc.

export async function POST(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Find scheduled blogs that are due
    const dueBlogs = await prisma.scheduledBlog.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          lte: now
        }
      },
      orderBy: { scheduledFor: "asc" },
      take: 5 // Process max 5 at a time to avoid timeout
    });

    if (dueBlogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled blogs due",
        processed: 0
      });
    }

    const results = [];

    for (const scheduledBlog of dueBlogs) {
      try {
        // Mark as processing
        await prisma.scheduledBlog.update({
          where: { id: scheduledBlog.id },
          data: {
            status: "PROCESSING",
            processingStartedAt: new Date()
          }
        });

        // Generate the blog using the existing generate API logic
        const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/smart-blog/generate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            // Pass internal auth header
            "x-internal-request": "true"
          },
          body: JSON.stringify({
            topic: scheduledBlog.topicTitle,
            language: scheduledBlog.language,
            length: scheduledBlog.length,
            tone: scheduledBlog.tone,
            includeResearch: scheduledBlog.includeResearch
          })
        });

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(errorData.error || "Failed to generate blog content");
        }

        const { blog: generatedContent } = await generateResponse.json();

        // Prevent duplicates (same slug OR same title, case-insensitive)
        const existingBlog = await prisma.blog.findFirst({
          where: {
            OR: [
              { slug: generatedContent.suggestedSlug },
              { title: { equals: generatedContent.title, mode: "insensitive" as const } },
            ],
          },
          select: { id: true, slug: true },
        });

        if (existingBlog) {
          // Treat as completed and link the scheduled item to the existing blog
          await prisma.scheduledBlog.update({
            where: { id: scheduledBlog.id },
            data: {
              status: "COMPLETED",
              generatedBlogId: existingBlog.id,
              processedAt: new Date(),
              errorMessage: null,
            },
          });

          if (scheduledBlog.topicId) {
            await prisma.topicSuggestion.update({
              where: { id: scheduledBlog.topicId },
              data: {
                status: "USED",
                usedAt: new Date(),
                generatedBlogId: existingBlog.id,
              },
            });
          }

          results.push({
            id: scheduledBlog.id,
            title: scheduledBlog.topicTitle,
            status: "COMPLETED",
            blogId: existingBlog.id,
            blogSlug: existingBlog.slug,
            note: "Already existed; linked to existing blog",
          });

          continue;
        }

        // Create the actual blog post and publish it
        const newBlog = await prisma.blog.create({
          data: {
            title: generatedContent.title,
            slug: generatedContent.suggestedSlug,
            excerpt: generatedContent.excerpt,
            content: generatedContent.content,
            metaTitle: generatedContent.metaTitle,
            metaDescription: generatedContent.metaDescription,
            tag: generatedContent.suggestedTags?.[0] || null,
            published: true,
            publishedAt: new Date(),
            authorId: scheduledBlog.scheduledBy
          }
        });

        // Update scheduled blog as completed
        await prisma.scheduledBlog.update({
          where: { id: scheduledBlog.id },
          data: {
            status: "COMPLETED",
            generatedBlogId: newBlog.id,
            processedAt: new Date()
          }
        });

        // Update topic status if linked
        if (scheduledBlog.topicId) {
          await prisma.topicSuggestion.update({
            where: { id: scheduledBlog.topicId },
            data: {
              status: "USED",
              usedAt: new Date(),
              generatedBlogId: newBlog.id
            }
          });
        }

        results.push({
          id: scheduledBlog.id,
          title: scheduledBlog.topicTitle,
          status: "COMPLETED",
          blogId: newBlog.id,
          blogSlug: newBlog.slug
        });

      } catch (error: any) {
        console.error(`Failed to process scheduled blog ${scheduledBlog.id}:`, error);
        
        // Mark as failed
        await prisma.scheduledBlog.update({
          where: { id: scheduledBlog.id },
          data: {
            status: "FAILED",
            errorMessage: error.message || "Unknown error",
            processedAt: new Date()
          }
        });

        // Reset topic status if linked
        if (scheduledBlog.topicId) {
          await prisma.topicSuggestion.update({
            where: { id: scheduledBlog.topicId },
            data: { status: "AVAILABLE" }
          });
        }

        results.push({
          id: scheduledBlog.id,
          title: scheduledBlog.topicTitle,
          status: "FAILED",
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} scheduled blogs`,
      processed: results.length,
      results
    });

  } catch (error: any) {
    console.error("Process Scheduled Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process scheduled blogs" },
      { status: 500 }
    );
  }
}

// GET endpoint to check status (for debugging)
export async function GET() {
  try {
    const now = new Date();
    
    const stats = (await prisma.scheduledBlog.groupBy({
      by: ["status"],
      _count: { id: true }
    })) as Array<{ status: string; _count: { id: number } }>;

    const upcoming = await prisma.scheduledBlog.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          gte: now
        }
      },
      orderBy: { scheduledFor: "asc" },
      take: 10,
      select: {
        id: true,
        topicTitle: true,
        scheduledFor: true
      }
    });

    const overdue = await prisma.scheduledBlog.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          lt: now
        }
      },
      orderBy: { scheduledFor: "asc" },
      select: {
        id: true,
        topicTitle: true,
        scheduledFor: true
      }
    });

    return NextResponse.json({
      currentTime: now.toISOString(),
      stats: stats.reduce<Record<string, number>>((acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {}),
      upcoming,
      overdue,
      overdueCount: overdue.length
    });

  } catch (error: any) {
    console.error("Status Check Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}


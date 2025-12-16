import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Cleanup Script: Remove static "Explore More Properties" sections from existing properties
 * These were embedded during import but are now replaced by a dynamic component
 */

// Pattern to match the static related properties section
const STATIC_LINK_PATTERNS = [
  // English patterns
  /<h3>🏘️ Explore More Properties<\/h3>[\s\S]*?<\/ul>/gi,
  /<h3>🏘️ Explore More Rentals<\/h3>[\s\S]*?<\/ul>/gi,
  /<h3>🔗 Learn More:<\/h3>[\s\S]*?<\/ul>/gi,
  // Dutch patterns (legacy)
  /<h3>🏘️ Bekijk Ook Deze Properties<\/h3>[\s\S]*?<\/ul>/gi,
  /<h3>🔗 Meer informatie:<\/h3>[\s\S]*?<\/ul>/gi,
  // Generic patterns
  /\n*<h3>[🏘️🔗].*?(?:Explore More|Bekijk Ook|Learn More|Discover more).*?<\/h3>\s*<p>.*?<\/p>\s*<ul>[\s\S]*?<\/ul>/gi,
];

function cleanContentHtml(content: string | null): string | null {
  if (!content) return content;
  
  let cleaned = content;
  
  for (const pattern of STATIC_LINK_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // Clean up any trailing whitespace or empty lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - only admins can run this
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dryRun = true } = await request.json().catch(() => ({ dryRun: true }));

    // Get all properties with content
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    const results: Array<{
      id: string;
      title: string;
      hasStaticLinks: boolean;
      cleaned: boolean;
    }> = [];

    let cleanedCount = 0;

    for (const property of properties) {
      const originalContent = property.content;
      const cleanedContent = cleanContentHtml(originalContent);
      
      const hasStaticLinks = originalContent !== cleanedContent;
      
      if (hasStaticLinks && !dryRun) {
        // Actually update the database
        await prisma.property.update({
          where: { id: property.id },
          data: { content: cleanedContent },
        });
        cleanedCount++;
      }

      results.push({
        id: property.id,
        title: property.title,
        hasStaticLinks,
        cleaned: hasStaticLinks && !dryRun,
      });
    }

    const affectedProperties = results.filter(r => r.hasStaticLinks);

    return NextResponse.json({
      success: true,
      dryRun,
      message: dryRun 
        ? `Dry run complete. Found ${affectedProperties.length} properties with static links.`
        : `Cleanup complete. Removed static links from ${cleanedCount} properties.`,
      summary: {
        totalProperties: properties.length,
        propertiesWithStaticLinks: affectedProperties.length,
        propertiesCleaned: cleanedCount,
      },
      affectedProperties: affectedProperties.map(p => ({
        id: p.id,
        title: p.title,
        wouldBeCleaned: p.hasStaticLinks,
        wasCleaned: p.cleaned,
      })),
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for easy testing (dry run only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sample property to show what would be cleaned
    const property = await prisma.property.findFirst({
      where: {
        content: { contains: "Explore More" },
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!property) {
      return NextResponse.json({
        message: "No properties found with static links",
        example: null,
      });
    }

    const cleanedContent = cleanContentHtml(property.content);

    return NextResponse.json({
      message: "Example of what would be cleaned (dry run)",
      example: {
        id: property.id,
        title: property.title,
        originalContentLength: property.content?.length || 0,
        cleanedContentLength: cleanedContent?.length || 0,
        bytesRemoved: (property.content?.length || 0) - (cleanedContent?.length || 0),
      },
      instructions: {
        dryRun: "POST with { dryRun: true } to see all affected properties",
        execute: "POST with { dryRun: false } to actually clean the properties",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


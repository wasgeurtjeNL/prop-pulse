import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

interface ValidationResult {
  id: string;
  url: string;
  title: string;
  status?: number;
  error?: string;
}

function normalizeLegacyUrl(inputUrl: string): string {
  const raw = (inputUrl || "").trim();
  let url = raw.startsWith("/") ? raw : `/${raw}`;
  url = url.replace(/^\/diensten\b/i, "/services");
  url = url.replace(/^\/gidsen\b/i, "/guides");
  url = url.replace(/^\/locaties\b/i, "/locations");
  url = url.replace(/\/{2,}/g, "/");
  return url;
}

// POST - Validate all internal links to check if pages exist
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let links = await prisma.internalLink.findMany({
      where: { isActive: true }
    });

    // Cleanup legacy stored URLs before validating (Dutch -> English)
    const legacyLinks = links.filter(l => typeof l.url === "string" && /^\/(diensten|gidsen|locaties)\b/i.test(l.url));
    for (const link of legacyLinks) {
      const normalizedUrl = normalizeLegacyUrl(link.url);
      if (normalizedUrl !== link.url) {
        const existing = await prisma.internalLink.findUnique({ where: { url: normalizedUrl } });
        if (existing) {
          // Merge: re-point usages and delete legacy record
          try {
            await prisma.linkUsage.updateMany({
              where: { linkId: link.id },
              data: { linkId: existing.id },
            });
          } catch {
            // ignore if LinkUsage not available
          }
          await prisma.internalLink.delete({ where: { id: link.id } });
        } else {
          await prisma.internalLink.update({
            where: { id: link.id },
            data: { url: normalizedUrl },
          });
        }
      }
    }

    if (legacyLinks.length > 0) {
      links = await prisma.internalLink.findMany({ where: { isActive: true } });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const results: {
      valid: ValidationResult[];
      invalid: ValidationResult[];
      errors: ValidationResult[];
    } = { valid: [], invalid: [], errors: [] };

    // Validate each link in parallel (batch of 5 at a time)
    const batchSize = 5;
    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (link) => {
        try {
          const fullUrl = link.url.startsWith("http") 
            ? link.url 
            : `${baseUrl}${link.url}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(fullUrl, {
            method: "HEAD",
            signal: controller.signal,
            headers: { 
              "User-Agent": "PropPulse Link Validator/1.0",
              "Accept": "text/html"
            }
          });
          
          clearTimeout(timeoutId);

          if (response.ok || response.status === 304) {
            results.valid.push({ 
              id: link.id, 
              url: link.url, 
              title: link.title,
              status: response.status
            });
            
            // Update database
            await prisma.internalLink.update({
              where: { id: link.id },
              data: { pageExists: true, lastChecked: new Date() }
            });
          } else {
            results.invalid.push({ 
              id: link.id, 
              url: link.url, 
              title: link.title,
              status: response.status 
            });
            
            await prisma.internalLink.update({
              where: { id: link.id },
              data: { pageExists: false, lastChecked: new Date() }
            });
          }
        } catch (error: any) {
          // AbortError means timeout
          const errorMessage = error.name === 'AbortError' 
            ? 'Request timeout (5s)'
            : error.message || 'Unknown error';
            
          results.errors.push({
            id: link.id,
            url: link.url,
            title: link.title,
            error: errorMessage
          });
          
          // Mark as not existing if we can't reach it
          await prisma.internalLink.update({
            where: { id: link.id },
            data: { pageExists: false, lastChecked: new Date() }
          });
        }
      }));
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: links.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        errors: results.errors.length
      },
      results
    });

  } catch (error: any) {
    console.error("Link Validation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate links" },
      { status: 500 }
    );
  }
}

// GET - Get validation status of all links
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await prisma.internalLink.findMany({
      where: { isActive: true },
      select: {
        id: true,
        url: true,
        title: true,
        category: true,
        pageExists: true,
        lastChecked: true,
        priority: true,
        usageCount: true
      },
      orderBy: [
        { pageExists: 'asc' }, // Invalid first
        { priority: 'desc' },
        { usageCount: 'desc' }
      ]
    });

    const validLinks = links.filter(l => l.pageExists);
    const invalidLinks = links.filter(l => !l.pageExists);
    const neverChecked = links.filter(l => !l.lastChecked);

    return NextResponse.json({
      summary: {
        total: links.length,
        valid: validLinks.length,
        invalid: invalidLinks.length,
        neverChecked: neverChecked.length
      },
      links: {
        valid: validLinks,
        invalid: invalidLinks,
        neverChecked
      }
    });

  } catch (error: any) {
    console.error("Get Link Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get link status" },
      { status: 500 }
    );
  }
}


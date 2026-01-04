import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createHash } from "crypto";

// Rate limiting - prevent spam
const viewCache = new Map<string, number>();
const VIEW_COOLDOWN_MS = 60000; // 1 minute between views from same session

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;

    // Validate property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Get request data
    const body = await request.json().catch(() => ({}));
    // Prioritize visitorId (persistent localStorage) over sessionId (sessionStorage)
    const visitorId = body.visitorId || null;
    const sessionId = body.sessionId || null;
    // Use visitorId as the primary identifier, fall back to sessionId for backwards compatibility
    const effectiveVisitorId = visitorId || sessionId || null;
    const referrer = request.headers.get("referer") || null;
    const userAgent = request.headers.get("user-agent") || null;
    
    // Get geo data from Vercel headers
    const country = request.headers.get("x-vercel-ip-country") || null;
    const city = request.headers.get("x-vercel-ip-city") || null;
    
    // Extract UTM parameters from body (passed from client-side URL)
    const utmSource = body.utm_source || null;
    const utmMedium = body.utm_medium || null;
    const utmCampaign = body.utm_campaign || null;
    const utmTerm = body.utm_term || null;
    const utmContent = body.utm_content || null;
    
    // Hash IP for privacy
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").substring(0, 16);

    // Rate limiting check - use visitorId as primary key for accurate deduplication
    const cacheKey = `${propertyId}-${effectiveVisitorId || ipHash}`;
    const lastView = viewCache.get(cacheKey);
    const now = Date.now();

    if (lastView && now - lastView < VIEW_COOLDOWN_MS) {
      // View already recorded recently, skip
      return NextResponse.json({ success: true, cached: true });
    }

    // Record the view with UTM tracking
    // Store visitorId in sessionId field (reusing existing schema field)
    await prisma.propertyView.create({
      data: {
        propertyId,
        userAgent,
        ipHash,
        referrer,
        sessionId: effectiveVisitorId, // Store persistent visitorId here
        country,
        city,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      },
    });

    // Update cache
    viewCache.set(cacheKey, now);

    // Clean old cache entries periodically
    if (viewCache.size > 10000) {
      const cutoff = now - VIEW_COOLDOWN_MS * 2;
      for (const [key, timestamp] of viewCache.entries()) {
        if (timestamp < cutoff) {
          viewCache.delete(key);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording property view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}


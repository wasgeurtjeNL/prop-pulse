import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This endpoint checks if a URL should be redirected
// Called by middleware to handle 301 redirects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ redirect: null });
    }

    // Normalize URL
    let normalizedUrl = url.trim().toLowerCase();
    if (!normalizedUrl.startsWith("/")) {
      normalizedUrl = "/" + normalizedUrl;
    }
    if (normalizedUrl.length > 1 && normalizedUrl.endsWith("/")) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    // Look up redirect
    const redirect = await prisma.urlRedirect.findUnique({
      where: { oldUrl: normalizedUrl },
      select: {
        newUrl: true,
        statusCode: true,
      },
    });

    if (redirect) {
      // Increment hit counter asynchronously
      prisma.urlRedirect.update({
        where: { oldUrl: normalizedUrl },
        data: { hits: { increment: 1 } },
      }).catch(() => {}); // Ignore errors

      return NextResponse.json({
        redirect: {
          url: redirect.newUrl,
          statusCode: redirect.statusCode,
        },
      });
    }

    return NextResponse.json({ redirect: null });
  } catch (error) {
    console.error("Redirect Check Error:", error);
    return NextResponse.json({ redirect: null });
  }
}

// GET all redirects (for caching in middleware or admin view)
export async function POST(request: Request) {
  try {
    const redirects = await prisma.urlRedirect.findMany({
      select: {
        oldUrl: true,
        newUrl: true,
        statusCode: true,
      },
    });

    // Convert to a map for fast lookup
    const redirectMap: Record<string, { url: string; statusCode: number }> = {};
    for (const r of redirects) {
      redirectMap[r.oldUrl] = { url: r.newUrl, statusCode: r.statusCode };
    }

    return NextResponse.json({ redirects: redirectMap });
  } catch (error) {
    console.error("Redirects Fetch Error:", error);
    return NextResponse.json({ redirects: {} });
  }
}

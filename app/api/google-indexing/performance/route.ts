/**
 * Google Search Console - Performance Data Endpoint
 * 
 * Fetches search performance data from Google Search Console.
 * 
 * GET /api/google-indexing/performance?type=pages|queries|page&days=28&limit=20&pageUrl=...
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { 
  getTopPages,
  getTopQueries,
  getPagePerformance,
} from "@/lib/services/google-indexing";

export async function GET(request: Request) {
  try {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pages';
    const days = parseInt(searchParams.get('days') || '28', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const pageUrl = searchParams.get('pageUrl');

    let data;

    switch (type) {
      case 'pages':
        data = await getTopPages(days, limit);
        break;
      case 'queries':
        data = await getTopQueries(days, limit);
        break;
      case 'page':
        if (!pageUrl) {
          return NextResponse.json(
            { error: "pageUrl parameter required for type=page" },
            { status: 400 }
          );
        }
        data = await getPagePerformance(pageUrl, days);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type. Must be: pages, queries, or page" },
          { status: 400 }
        );
    }

    if (!data) {
      return NextResponse.json(
        { 
          error: "Failed to fetch performance data. Check if Search Console credentials are configured.",
          message: "Set GOOGLE_INDEXING_CREDENTIALS environment variable with your service account JSON."
        },
        { status: 503 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Search Console API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}

/**
 * Google Indexing API - Submit URL Endpoint
 * 
 * Submits URLs to Google for instant indexing.
 * 
 * POST /api/google-indexing/submit
 * Body: { urls: string[], action?: 'URL_UPDATED' | 'URL_DELETED' }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { 
  submitUrlForIndexing, 
  submitUrlsForIndexing,
  type IndexingAction 
} from "@/lib/services/google-indexing";

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { urls, url, action = 'URL_UPDATED' } = body;

    // Validate action
    const validActions: IndexingAction[] = ['URL_UPDATED', 'URL_DELETED'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Single URL
    if (url && typeof url === 'string') {
      const result = await submitUrlForIndexing(url, action);
      return NextResponse.json(result);
    }

    // Multiple URLs
    if (urls && Array.isArray(urls) && urls.length > 0) {
      // Limit to 50 URLs per request to avoid timeout
      if (urls.length > 50) {
        return NextResponse.json(
          { error: "Maximum 50 URLs per request" },
          { status: 400 }
        );
      }

      const result = await submitUrlsForIndexing(urls, action);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Please provide 'url' or 'urls' in the request body" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Google Indexing API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit URL(s)" },
      { status: 500 }
    );
  }
}

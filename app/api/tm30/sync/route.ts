/**
 * TM30 Sync API
 * Triggers GitHub Actions to fetch latest TM30 accommodations from Thailand Immigration
 * 
 * POST /api/tm30/sync
 * Triggers the self-hosted runner to fetch accommodations
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_TM30_REPO = process.env.GITHUB_TM30_REPO || "wasgeurtjeNL/tm30-automation";

export async function POST(request: Request) {
  try {
    // Auth check - only admin/agent can sync
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    if (!session || !["ADMIN", "AGENT"].includes(userRole)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if GITHUB_TOKEN is configured
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { 
          error: "GitHub token not configured",
          message: "Add GITHUB_TOKEN to your Vercel environment variables to enable TM30 sync",
        },
        { status: 500 }
      );
    }

    console.log(`[TM30 Sync] Triggering GitHub Actions workflow for ${GITHUB_TM30_REPO}`);

    // Trigger GitHub Actions workflow via repository dispatch
    const githubResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_TM30_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          event_type: "tm30-action",
          client_payload: {
            action: "fetch_accommodations",
            data: {},
            triggeredBy: session.user.email || session.user.name,
            triggeredAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error("[TM30 Sync] GitHub API error:", errorText);
      
      if (githubResponse.status === 404) {
        return NextResponse.json(
          { 
            error: "Repository not found",
            message: `Cannot find ${GITHUB_TM30_REPO}. Check GITHUB_TM30_REPO env variable.`,
          },
          { status: 404 }
        );
      }
      
      if (githubResponse.status === 401 || githubResponse.status === 403) {
        return NextResponse.json(
          { 
            error: "GitHub authentication failed",
            message: "Your GITHUB_TOKEN may be invalid or lack the 'repo' scope.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Failed to trigger sync", details: errorText },
        { status: 500 }
      );
    }

    console.log("[TM30 Sync] GitHub Actions workflow triggered successfully");

    return NextResponse.json({
      success: true,
      message: "TM30 sync triggered! The self-hosted runner will fetch the latest accommodations.",
      note: "Make sure your self-hosted runner is active. Refresh the page in ~30 seconds to see new data.",
      triggeredAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[TM30 Sync] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check sync status
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    if (!session || !["ADMIN", "AGENT"].includes(userRole)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isConfigured = !!GITHUB_TOKEN;

    let latestRun = null;
    if (GITHUB_TOKEN) {
      try {
        const runsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_TM30_REPO}/actions/runs?per_page=1`,
          {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (runsResponse.ok) {
          const runsData = await runsResponse.json();
          if (runsData.workflow_runs?.length > 0) {
            const run = runsData.workflow_runs[0];
            latestRun = {
              id: run.id,
              status: run.status,
              conclusion: run.conclusion,
              createdAt: run.created_at,
              updatedAt: run.updated_at,
              url: run.html_url,
            };
          }
        }
      } catch (e) {
        console.error("[TM30 Sync] Error fetching workflow runs:", e);
      }
    }

    return NextResponse.json({
      isConfigured,
      repository: GITHUB_TM30_REPO,
      latestRun,
      note: isConfigured 
        ? "GitHub integration is configured. You can trigger a sync."
        : "Add GITHUB_TOKEN to Vercel env to enable sync.",
    });

  } catch (error: any) {
    console.error("[TM30 Sync] Status check error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

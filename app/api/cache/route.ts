/**
 * Cache Management API
 * 
 * Handles cache purging/revalidation for Next.js and Vercel
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Common paths that can be revalidated
const COMMON_PATHS = [
  { path: "/", label: "Homepage" },
  { path: "/properties", label: "Properties Overview" },
  { path: "/blogs", label: "Blogs Overview" },
  { path: "/about", label: "About Page" },
  { path: "/contact", label: "Contact Page" },
  { path: "/services", label: "Services Page" },
  { path: "/locations", label: "Locations Page" },
  { path: "/guides", label: "Guides Page" },
  { path: "/faq", label: "FAQ Page" },
];

// Common cache tags
const COMMON_TAGS = [
  { tag: "featured-properties", label: "Featured Properties" },
  { tag: "properties", label: "All Properties" },
  { tag: "blogs", label: "All Blogs" },
  { tag: "landing-pages", label: "Landing Pages" },
];

// GET - Return available paths and tags for UI
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    paths: COMMON_PATHS,
    tags: COMMON_TAGS,
    vercelConfigured: !!(process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID && process.env.VERCEL_API_TOKEN),
  });
}

// POST - Perform cache operations
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, paths, tags, customPath, customTag } = body;

    const results: { success: string[]; failed: string[] } = {
      success: [],
      failed: [],
    };

    switch (action) {
      case "revalidate-paths": {
        // Revalidate specific paths
        const pathsToRevalidate = paths || [];
        if (customPath) pathsToRevalidate.push(customPath);

        for (const path of pathsToRevalidate) {
          try {
            revalidatePath(path);
            results.success.push(`Path: ${path}`);
          } catch (error) {
            console.error(`Failed to revalidate path ${path}:`, error);
            results.failed.push(`Path: ${path}`);
          }
        }
        break;
      }

      case "revalidate-tags": {
        // Revalidate specific cache tags
        const tagsToRevalidate = tags || [];
        if (customTag) tagsToRevalidate.push(customTag);

        for (const tag of tagsToRevalidate) {
          try {
            revalidateTag(tag);
            results.success.push(`Tag: ${tag}`);
          } catch (error) {
            console.error(`Failed to revalidate tag ${tag}:`, error);
            results.failed.push(`Tag: ${tag}`);
          }
        }
        break;
      }

      case "revalidate-all": {
        // Revalidate all common paths and tags
        for (const { path } of COMMON_PATHS) {
          try {
            revalidatePath(path);
            results.success.push(`Path: ${path}`);
          } catch (error) {
            results.failed.push(`Path: ${path}`);
          }
        }

        for (const { tag } of COMMON_TAGS) {
          try {
            revalidateTag(tag);
            results.success.push(`Tag: ${tag}`);
          } catch (error) {
            results.failed.push(`Tag: ${tag}`);
          }
        }

        // Also revalidate the layout to clear any cached layout data
        try {
          revalidatePath("/", "layout");
          results.success.push("Layout: /");
        } catch (error) {
          results.failed.push("Layout: /");
        }
        break;
      }

      case "purge-vercel-cache": {
        // Use Vercel API to purge edge cache (requires API token)
        const token = process.env.VERCEL_API_TOKEN;
        const teamId = process.env.VERCEL_TEAM_ID;
        const projectId = process.env.VERCEL_PROJECT_ID;

        if (!token || !projectId) {
          return NextResponse.json({
            success: false,
            error: "Vercel API niet geconfigureerd. Voeg VERCEL_API_TOKEN en VERCEL_PROJECT_ID toe aan je environment variables.",
          });
        }

        try {
          // Vercel API endpoint for purging cache
          const url = new URL(`https://api.vercel.com/v1/projects/${projectId}/cache`);
          if (teamId) {
            url.searchParams.set("teamId", teamId);
          }

          const response = await fetch(url.toString(), {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            results.success.push("Vercel Edge Cache");
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Vercel cache purge failed:", errorData);
            results.failed.push("Vercel Edge Cache");
          }
        } catch (error) {
          console.error("Vercel API error:", error);
          results.failed.push("Vercel Edge Cache");
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      results,
      message: results.failed.length === 0
        ? `Cache succesvol geleegd (${results.success.length} items)`
        : `Gedeeltelijk gelukt: ${results.success.length} succes, ${results.failed.length} mislukt`,
    });
  } catch (error) {
    console.error("Cache operation error:", error);
    return NextResponse.json(
      { error: "Cache operatie mislukt" },
      { status: 500 }
    );
  }
}


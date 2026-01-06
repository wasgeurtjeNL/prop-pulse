import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { analyzeSeoContent, type ContentAnalysisInput } from "@/lib/seo/content-analyzer";

export async function POST(request: Request) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ContentAnalysisInput = await request.json();

    if (!body.content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Perform SEO analysis
    const analysis = analyzeSeoContent(body);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error("SEO Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze content" },
      { status: 500 }
    );
  }
}

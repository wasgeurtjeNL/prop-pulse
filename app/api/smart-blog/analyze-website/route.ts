import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

interface PageContent {
  url: string;
  title: string;
  content: string;
  metaDescription?: string;
  headings: string[];
}

// Common page paths to scan
const SCAN_PATHS = [
  "/",
  "/about", "/about-us", "/over-ons", "/over",
  "/services", "/diensten",
  "/properties", "/vastgoed", "/listings",
  "/contact",
  "/team",
  "/blog", "/blogs", "/news"
];

// Fetch and parse a single page
async function fetchPage(baseUrl: string, path: string): Promise<PageContent | null> {
  try {
    const url = new URL(path, baseUrl).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PropPulse/1.0; Website Analyzer)",
        "Accept": "text/html,application/xhtml+xml",
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Extract basic content using regex (simple parsing without external deps)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "";
    
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const metaDescription = metaDescMatch?.[1]?.trim();
    
    // Extract headings
    const headingMatches = html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
    const headings = Array.from(headingMatches).map(m => m[1].trim()).filter(h => h.length > 0);
    
    // Extract visible text (simplified)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let bodyContent = bodyMatch?.[1] || html;
    
    // Remove scripts, styles, and HTML tags
    bodyContent = bodyContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // Limit content length
    const content = bodyContent.slice(0, 5000);
    
    return { url, title, content, metaDescription, headings };
  } catch (error) {
    console.log(`Failed to fetch ${path}:`, error);
    return null;
  }
}

// Discover navigation links from homepage
function extractNavLinks(html: string, baseUrl: string): string[] {
  const links: Set<string> = new Set();
  
  // Look for nav links
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi);
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/gi);
  const content = (navMatch?.join(" ") || "") + (headerMatch?.join(" ") || "");
  
  const linkMatches = content.matchAll(/href=["']([^"']+)["']/gi);
  
  for (const match of linkMatches) {
    try {
      const href = match[1];
      if (href.startsWith("/") && !href.includes("#") && !href.startsWith("//")) {
        links.add(href);
      } else if (href.startsWith(baseUrl)) {
        links.add(new URL(href).pathname);
      }
    } catch {}
  }
  
  return Array.from(links).slice(0, 15);
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { websiteUrl } = await request.json();
    
    if (!websiteUrl) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
    }

    // Validate URL
    let baseUrl: string;
    try {
      const url = new URL(websiteUrl);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Step 1: Fetch homepage first
    const homepage = await fetchPage(baseUrl, "/");
    
    if (!homepage) {
      return NextResponse.json(
        { error: "Could not fetch website. Please check the URL is accessible." },
        { status: 400 }
      );
    }

    // Step 2: Discover navigation links + use default paths
    const homepageHtml = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PropPulse/1.0)" }
    }).then(r => r.text()).catch(() => "");
    
    const discoveredPaths = extractNavLinks(homepageHtml, baseUrl);
    const allPaths = [...new Set([...discoveredPaths, ...SCAN_PATHS])];

    // Step 3: Fetch additional pages in parallel (max 8)
    const pagesToFetch = allPaths.slice(0, 8);
    const pagePromises = pagesToFetch.map(path => fetchPage(baseUrl, path));
    const pageResults = await Promise.all(pagePromises);
    
    const fetchedPages = [homepage, ...pageResults.filter((p): p is PageContent => p !== null && p.url !== homepage.url)];
    const uniquePages = fetchedPages.filter((page, index, self) => 
      index === self.findIndex(p => p.url === page.url)
    );

    // Step 4: Compile content for AI analysis
    const compiledContent = uniquePages.map(page => `
=== PAGE: ${page.url} ===
Title: ${page.title}
Meta Description: ${page.metaDescription || "N/A"}
Headings: ${page.headings.slice(0, 10).join(" | ")}
Content Preview: ${page.content.slice(0, 2000)}
`).join("\n\n");

    // Step 5: AI Analysis with GPT-4o
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert brand analyst and content strategist. Analyze website content to create a comprehensive company profile for AI content generation.

Your analysis should be thorough, professional, and actionable. Extract all relevant information about the company's identity, voice, and target market.

Return a JSON object with this exact structure:
{
  "companyName": "Detected company name",
  "tagline": "Company tagline or slogan if found",
  "description": "2-3 sentence professional description of the company",
  "tone": "One of: professional, luxury, friendly, educational, casual",
  "writingStyle": "Description of the writing style observed",
  "targetAudience": "Detailed description of who they serve",
  "targetLocations": ["Array of geographic areas they focus on"],
  "usps": ["Array of 3-5 unique selling points"],
  "expertise": ["Array of areas of expertise"],
  "contentThemes": ["Array of main content themes/topics"],
  "brandKeywords": ["Array of 10-15 important keywords"],
  "avoidTopics": ["Topics to avoid based on positioning"],
  "competitors": ["Any competitors mentioned or implied"],
  "suggestedInternalLinks": [
    {
      "url": "/path-found",
      "title": "Suggested anchor text",
      "category": "property|service|page|blog",
      "keywords": ["relevant", "keywords"]
    }
  ],
  "confidence": 0.85,
  "analysisNotes": "Any additional observations"
}`
        },
        {
          role: "user",
          content: `Analyze this website content and create a comprehensive company profile:

Website URL: ${baseUrl}
Pages Analyzed: ${uniquePages.length}

${compiledContent}`
        }
      ],
      max_tokens: 2500,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error("No response from AI analysis");
    }

    const analysis = JSON.parse(result);

    // Return analysis results for user review
    return NextResponse.json({
      success: true,
      websiteUrl: baseUrl,
      pagesAnalyzed: uniquePages.length,
      pagesScanned: uniquePages.map(p => p.url),
      analysis: {
        companyName: analysis.companyName || "",
        tagline: analysis.tagline || "",
        description: analysis.description || "",
        tone: analysis.tone || "professional",
        writingStyle: analysis.writingStyle || "",
        targetAudience: analysis.targetAudience || "",
        targetLocations: analysis.targetLocations || [],
        usps: analysis.usps || [],
        expertise: analysis.expertise || [],
        contentThemes: analysis.contentThemes || [],
        brandKeywords: analysis.brandKeywords || [],
        avoidTopics: analysis.avoidTopics || [],
        competitors: analysis.competitors || [],
        suggestedInternalLinks: analysis.suggestedInternalLinks || [],
        confidence: analysis.confidence || 0.5,
        analysisNotes: analysis.analysisNotes || ""
      },
      analyzedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Website Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze website" },
      { status: 500 }
    );
  }
}





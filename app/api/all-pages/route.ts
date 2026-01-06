import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Define all static pages in the app
const STATIC_PAGES = [
  // Main pages
  { url: "/", title: "Home", category: "main", type: "static" },
  { url: "/about", title: "About Us", category: "main", type: "static" },
  { url: "/contact", title: "Contact", category: "main", type: "static" },
  { url: "/contactus", title: "Contact Us (Alt)", category: "main", type: "static" },
  
  // Auth pages
  { url: "/sign-in", title: "Sign In", category: "auth", type: "static" },
  { url: "/sign-up", title: "Sign Up", category: "auth", type: "static" },
  { url: "/forgot-password", title: "Forgot Password", category: "auth", type: "static" },
  
  // Tools
  { url: "/tools", title: "Tools Overview", category: "tools", type: "static" },
  { url: "/tools/property-transfer-calculator", title: "Property Transfer Fee Calculator", category: "tools", type: "static" },
  
  // Documentation
  { url: "/documentation", title: "Documentation", category: "docs", type: "static" },
  { url: "/docs/property-transfer-calculator", title: "Calculator Documentation", category: "docs", type: "static" },
  
  // Legal
  { url: "/privacy-policy", title: "Privacy Policy", category: "legal", type: "static" },
  { url: "/terms-and-conditions", title: "Terms and Conditions", category: "legal", type: "static" },
  { url: "/legal/tm30-privacy", title: "TM30 Privacy Policy", category: "legal", type: "static" },
  
  // Services
  { url: "/list-your-property", title: "List Your Property", category: "service", type: "static" },
  { url: "/rental-services", title: "Rental Services", category: "service", type: "static" },
  { url: "/renovation-projects", title: "Renovation Projects", category: "service", type: "static" },
  
  // Listings
  { url: "/properties", title: "Properties Overview", category: "listings", type: "static" },
  { url: "/blogs", title: "Blog Overview", category: "content", type: "static" },
  { url: "/my-bookings", title: "My Bookings", category: "user", type: "static" },
];

// Dynamic page patterns (these have [slug] routes)
const DYNAMIC_PATTERNS = [
  { pattern: "/blogs/[slug]", category: "blog", source: "blog" },
  { pattern: "/properties/[province]/[area]/[slug]", category: "property", source: "property" },
  { pattern: "/listings/[slug]", category: "listing", source: "property" },
  { pattern: "/guides/[slug]", category: "guide", source: "landing_page" },
  { pattern: "/services/[slug]", category: "service", source: "landing_page" },
  { pattern: "/locations/[slug]", category: "location", source: "landing_page" },
  { pattern: "/faq/[slug]", category: "faq", source: "landing_page" },
];

function getSeoStatus(page: { 
  metaTitle?: string | null; 
  metaDescription?: string | null;
}): "missing" | "partial" | "good" {
  const hasTitle = page.metaTitle && page.metaTitle.length >= 30;
  const hasDescription = page.metaDescription && page.metaDescription.length >= 100;
  
  if (!hasTitle && !hasDescription) return "missing";
  if (!hasTitle || !hasDescription) return "partial";
  return "good";
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allPages: any[] = [];

    // 1. Add static pages
    for (const page of STATIC_PAGES) {
      allPages.push({
        id: `static-${page.url.replace(/\//g, "-")}`,
        url: page.url,
        title: page.title,
        category: page.category,
        type: "static",
        source: "nextjs",
        metaTitle: null, // Static pages have metadata in code
        metaDescription: null,
        seoStatus: "code", // SEO is in the code
        published: true,
        updatedAt: null,
        canEdit: false, // Can't edit static pages via dashboard
      });
    }

    // 2. Fetch landing pages from database
    const landingPages = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        url,
        title,
        category,
        "metaTitle",
        "metaDescription",
        published,
        "updatedAt"
      FROM landing_page
      ORDER BY "updatedAt" DESC
    `) as any[];

    for (const page of landingPages) {
      allPages.push({
        id: page.id,
        url: page.url,
        title: page.title,
        category: page.category,
        type: "database",
        source: "landing_page",
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        seoStatus: getSeoStatus(page),
        published: page.published,
        updatedAt: page.updatedAt,
        canEdit: true,
      });
    }

    // 3. Fetch blog posts
    const blogs = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        slug,
        title,
        "metaTitle",
        "metaDescription",
        published,
        "updatedAt"
      FROM blog
      WHERE published = true
      ORDER BY "updatedAt" DESC
      LIMIT 100
    `) as any[];

    for (const blog of blogs) {
      allPages.push({
        id: blog.id,
        url: `/blogs/${blog.slug}`,
        title: blog.title,
        category: "blog",
        type: "database",
        source: "blog",
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        seoStatus: getSeoStatus(blog),
        published: blog.published,
        updatedAt: blog.updatedAt,
        canEdit: true,
      });
    }

    // 4. Fetch properties (limit to recent ones)
    const properties = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        slug,
        "provinceSlug",
        "areaSlug",
        title,
        "updatedAt"
      FROM property
      WHERE status = 'ACTIVE' AND slug IS NOT NULL
      ORDER BY "updatedAt" DESC
      LIMIT 50
    `) as any[];

    for (const prop of properties) {
      // Build URL from province/area/slug
      const url = prop.provinceSlug && prop.areaSlug
        ? `/properties/${prop.provinceSlug}/${prop.areaSlug}/${prop.slug}`
        : `/listings/${prop.slug}`;
        
      allPages.push({
        id: prop.id,
        url,
        title: prop.title,
        category: "property",
        type: "database",
        source: "property",
        metaTitle: null,
        metaDescription: null,
        seoStatus: "auto", // Properties generate SEO automatically
        published: true,
        updatedAt: prop.updatedAt,
        canEdit: true,
      });
    }

    // Calculate stats
    const stats = {
      total: allPages.length,
      static: allPages.filter(p => p.type === "static").length,
      database: allPages.filter(p => p.type === "database").length,
      byCategory: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      seoStatus: {
        code: allPages.filter(p => p.seoStatus === "code").length,
        auto: allPages.filter(p => p.seoStatus === "auto").length,
        good: allPages.filter(p => p.seoStatus === "good").length,
        partial: allPages.filter(p => p.seoStatus === "partial").length,
        missing: allPages.filter(p => p.seoStatus === "missing").length,
      },
    };

    // Count by category
    for (const page of allPages) {
      stats.byCategory[page.category] = (stats.byCategory[page.category] || 0) + 1;
      stats.bySource[page.source] = (stats.bySource[page.source] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: allPages,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch all pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

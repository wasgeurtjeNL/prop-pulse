import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET all SEO templates
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use raw SQL to bypass Prisma caching issues
    console.log("[SEO Templates API] Starting raw SQL query...");
    
    const templates = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        name,
        display_name as "displayName",
        description,
        category,
        meta_title_prompt as "metaTitlePrompt",
        meta_description_prompt as "metaDescriptionPrompt",
        url_slug_rules as "urlSlugRules",
        content_prompt as "contentPrompt",
        faq_prompt as "faqPrompt",
        seo_rules as "seoRules",
        available_variables as "availableVariables",
        is_active as "isActive",
        is_default as "isDefault",
        version,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM seo_template
      WHERE is_active = true
      ORDER BY is_default DESC, display_name ASC
    `;

    console.log(`[SEO Templates API] Raw query returned ${templates?.length || 0} templates`);

    // Add _count for landing pages
    const templatesWithCount = await Promise.all(
      templates.map(async (template) => {
        const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM landing_page WHERE seo_template_id = ${template.id}
        `;
        return {
          ...template,
          _count: { landingPages: Number(countResult[0]?.count || 0) },
        };
      })
    );

    console.log(`[SEO Templates API] After mapping: ${templatesWithCount.length} templates`);

    // If no templates exist, return default fallback
    if (templatesWithCount.length === 0) {
      console.log("[SEO Templates API] No templates found, returning fallback");
      return NextResponse.json([{
        id: "default",
        name: "default",
        displayName: "Default SEO Template",
        description: "Standard SEO optimization template",
        category: null,
        metaTitlePrompt: "Create an SEO-optimized title for: {{title}}",
        metaDescriptionPrompt: "Create an SEO-optimized meta description for: {{title}}",
        urlSlugRules: "Use lowercase, hyphens, max 60 chars",
        isActive: true,
        isDefault: true,
        _count: { landingPages: 0 },
      }]);
    }

    return NextResponse.json(templatesWithCount);
  } catch (error) {
    console.error("Error fetching SEO templates:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
    
    // Try simple raw query as last resort
    try {
      const fallbackTemplates = await prisma.$queryRaw<any[]>`
        SELECT id, name, display_name, description, category, is_active, is_default, version
        FROM seo_template
        ORDER BY is_default DESC
      `;
      
      return NextResponse.json(fallbackTemplates.map((t: any) => ({
        id: t.id,
        name: t.name,
        displayName: t.display_name,
        description: t.description,
        category: t.category,
        isActive: t.is_active,
        isDefault: t.is_default,
        version: t.version,
        _count: { landingPages: 0 },
      })));
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError);
      // Return default template on error
      return NextResponse.json([{
        id: "default",
        name: "default",
        displayName: "Default SEO Template",
        description: "Standard SEO optimization template (fallback)",
        category: null,
        isActive: true,
        isDefault: true,
        _count: { landingPages: 0 },
      }]);
    }
  }
}

// POST - Create new SEO template
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.displayName || !data.metaTitlePrompt || 
        !data.metaDescriptionPrompt || !data.urlSlugRules) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await prisma.seoTemplate.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      );
    }

    // If setting as default, remove default from other templates
    if (data.isDefault) {
      await prisma.seoTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.seoTemplate.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        category: data.category,
        metaTitlePrompt: data.metaTitlePrompt,
        metaDescriptionPrompt: data.metaDescriptionPrompt,
        urlSlugRules: data.urlSlugRules,
        contentPrompt: data.contentPrompt,
        faqPrompt: data.faqPrompt,
        seoRules: data.seoRules || {},
        availableVariables: data.availableVariables || [],
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating SEO template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

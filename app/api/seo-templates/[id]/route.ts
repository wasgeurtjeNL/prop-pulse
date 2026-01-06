import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single SEO template
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use raw SQL to bypass Prisma caching issues
    // Try to find by id first, then by name
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
      WHERE id = ${id} OR name = ${id}
      LIMIT 1
    `;

    if (!templates || templates.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const template = templates[0];
    
    // Get landing page count
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM landing_page WHERE seo_template_id = ${template.id}
    `;
    
    return NextResponse.json({
      ...template,
      _count: { landingPages: Number(countResult[0]?.count || 0) },
    });
  } catch (error) {
    console.error("Error fetching SEO template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PATCH - Update SEO template
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Check if template exists using raw SQL
    const existingTemplates = await prisma.$queryRaw<any[]>`
      SELECT * FROM seo_template WHERE id = ${id} OR name = ${id} LIMIT 1
    `;

    if (!existingTemplates || existingTemplates.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const existing = existingTemplates[0];
    const templateId = existing.id;

    // If changing name, check for conflicts
    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.$queryRaw<any[]>`
        SELECT id FROM seo_template WHERE name = ${data.name} LIMIT 1
      `;
      if (nameConflict && nameConflict.length > 0) {
        return NextResponse.json(
          { error: "Template with this name already exists" },
          { status: 400 }
        );
      }
    }

    // If setting as default, remove default from other templates
    if (data.isDefault && !existing.is_default) {
      await prisma.$executeRaw`UPDATE seo_template SET is_default = false WHERE is_default = true`;
    }

    // Create new version if significant changes
    const isSignificantChange = 
      data.metaTitlePrompt !== existing.meta_title_prompt ||
      data.metaDescriptionPrompt !== existing.meta_description_prompt ||
      data.urlSlugRules !== existing.url_slug_rules;

    const newVersion = isSignificantChange ? existing.version + 1 : existing.version;

    // Update template using raw SQL
    await prisma.$executeRaw`
      UPDATE seo_template SET
        name = COALESCE(${data.name}, name),
        display_name = COALESCE(${data.displayName}, display_name),
        description = COALESCE(${data.description}, description),
        category = COALESCE(${data.category}, category),
        meta_title_prompt = COALESCE(${data.metaTitlePrompt}, meta_title_prompt),
        meta_description_prompt = COALESCE(${data.metaDescriptionPrompt}, meta_description_prompt),
        url_slug_rules = COALESCE(${data.urlSlugRules}, url_slug_rules),
        content_prompt = COALESCE(${data.contentPrompt}, content_prompt),
        faq_prompt = COALESCE(${data.faqPrompt}, faq_prompt),
        seo_rules = COALESCE(${data.seoRules ? JSON.stringify(data.seoRules) : null}::jsonb, seo_rules),
        available_variables = COALESCE(${data.availableVariables ? JSON.stringify(data.availableVariables) : null}::jsonb, available_variables),
        is_active = COALESCE(${data.isActive}, is_active),
        is_default = COALESCE(${data.isDefault}, is_default),
        version = ${newVersion},
        updated_at = NOW()
      WHERE id = ${templateId}
    `;

    // Fetch updated template
    const updatedTemplates = await prisma.$queryRaw<any[]>`
      SELECT 
        id, name, display_name as "displayName", description, category,
        meta_title_prompt as "metaTitlePrompt", meta_description_prompt as "metaDescriptionPrompt",
        url_slug_rules as "urlSlugRules", content_prompt as "contentPrompt", faq_prompt as "faqPrompt",
        seo_rules as "seoRules", available_variables as "availableVariables",
        is_active as "isActive", is_default as "isDefault", version
      FROM seo_template WHERE id = ${templateId}
    `;

    return NextResponse.json(updatedTemplates[0] || { success: true });
  } catch (error) {
    console.error("Error updating SEO template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete SEO template
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find template using raw SQL
    const templates = await prisma.$queryRaw<any[]>`
      SELECT id, is_default FROM seo_template WHERE id = ${id} OR name = ${id} LIMIT 1
    `;

    if (!templates || templates.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const template = templates[0];

    // Prevent deleting default template
    if (template.is_default) {
      return NextResponse.json(
        { error: "Cannot delete the default template" },
        { status: 400 }
      );
    }

    // Check if template is in use
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM landing_page WHERE seo_template_id = ${template.id}
    `;
    const landingPageCount = Number(countResult[0]?.count || 0);

    if (landingPageCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete template. It is used by ${landingPageCount} landing pages.` },
        { status: 400 }
      );
    }

    await prisma.$executeRaw`DELETE FROM seo_template WHERE id = ${template.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting SEO template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

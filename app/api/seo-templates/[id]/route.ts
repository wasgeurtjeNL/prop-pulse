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

    const template = await prisma.seoTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { landingPages: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
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

    // Check if template exists
    const existing = await prisma.seoTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // If changing name, check for conflicts
    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.seoTemplate.findUnique({
        where: { name: data.name },
      });
      if (nameConflict) {
        return NextResponse.json(
          { error: "Template with this name already exists" },
          { status: 400 }
        );
      }
    }

    // If setting as default, remove default from other templates
    if (data.isDefault && !existing.isDefault) {
      await prisma.seoTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new version if significant changes
    const isSignificantChange = 
      data.metaTitlePrompt !== existing.metaTitlePrompt ||
      data.metaDescriptionPrompt !== existing.metaDescriptionPrompt ||
      data.urlSlugRules !== existing.urlSlugRules;

    const template = await prisma.seoTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.metaTitlePrompt && { metaTitlePrompt: data.metaTitlePrompt }),
        ...(data.metaDescriptionPrompt && { metaDescriptionPrompt: data.metaDescriptionPrompt }),
        ...(data.urlSlugRules && { urlSlugRules: data.urlSlugRules }),
        ...(data.contentPrompt !== undefined && { contentPrompt: data.contentPrompt }),
        ...(data.faqPrompt !== undefined && { faqPrompt: data.faqPrompt }),
        ...(data.seoRules && { seoRules: data.seoRules }),
        ...(data.availableVariables && { availableVariables: data.availableVariables }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        // Increment version if significant changes
        ...(isSignificantChange && { 
          version: existing.version + 1,
          previousVersionId: existing.id,
        }),
      },
    });

    return NextResponse.json(template);
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

    const template = await prisma.seoTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { landingPages: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Prevent deleting default template
    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default template" },
        { status: 400 }
      );
    }

    // Check if template is in use
    if (template._count.landingPages > 0) {
      return NextResponse.json(
        { error: `Cannot delete template. It is used by ${template._count.landingPages} landing pages.` },
        { status: 400 }
      );
    }

    await prisma.seoTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting SEO template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

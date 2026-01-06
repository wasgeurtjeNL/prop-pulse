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

    const templates = await prisma.seoTemplate.findMany({
      orderBy: [
        { isDefault: "desc" },
        { displayName: "asc" },
      ],
      include: {
        _count: {
          select: { landingPages: true },
        },
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching SEO templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
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

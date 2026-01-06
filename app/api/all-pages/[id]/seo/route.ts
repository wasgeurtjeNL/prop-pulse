import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH - Update SEO fields for any page type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { source, metaTitle, metaDescription, url } = await request.json();

    if (!source) {
      return NextResponse.json(
        { error: "Source type is required" },
        { status: 400 }
      );
    }

    let updatedRecord;

    switch (source) {
      case "nextjs":
        // Static pages - upsert into StaticPageSeo table using URL
        if (!url) {
          return NextResponse.json(
            { error: "URL is required for static pages" },
            { status: 400 }
          );
        }
        updatedRecord = await prisma.staticPageSeo.upsert({
          where: { url },
          create: {
            url,
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
          },
          update: {
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
          },
        });
        break;

      case "landing_page":
        updatedRecord = await prisma.landingPage.update({
          where: { id },
          data: {
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
          },
        });
        break;

      case "blog":
        updatedRecord = await prisma.blog.update({
          where: { id },
          data: {
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
          },
        });
        break;

      case "property":
        updatedRecord = await prisma.property.update({
          where: { id },
          data: {
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported source type: ${source}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Failed to update SEO:", error);
    
    // Handle not found errors
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}

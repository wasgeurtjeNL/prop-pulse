import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch a single landing page by ID
export async function GET(
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

    const page = await prisma.landingPage.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Failed to fetch landing page:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing page" },
      { status: 500 }
    );
  }
}

// PATCH - Update a landing page
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
    const body = await request.json();

    // Remove id from body if present to avoid prisma error
    const { id: _, ...updateData } = body;

    const updatedPage = await prisma.landingPage.update({
      where: { id },
      data: updateData,
    });

    // Update internal link if URL changed
    if (body.url) {
      const existingLink = await prisma.internalLink.findFirst({
        where: { url: body.url },
      });

      if (existingLink) {
        await prisma.internalLink.update({
          where: { id: existingLink.id },
          data: {
            title: updatedPage.title,
            description: updatedPage.metaDescription,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPage,
    });
  } catch (error) {
    console.error("Failed to update landing page:", error);
    return NextResponse.json(
      { error: "Failed to update landing page" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a landing page
export async function DELETE(
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

    // First get the page to find its URL
    const page = await prisma.landingPage.findUnique({
      where: { id },
      select: { url: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Delete any internal links pointing to this page
    await prisma.internalLink.deleteMany({
      where: { url: page.url },
    });

    // Delete the page
    await prisma.landingPage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Landing page deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete landing page:", error);
    return NextResponse.json(
      { error: "Failed to delete landing page" },
      { status: 500 }
    );
  }
}




import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * API Route: Hero Image by ID
 *
 * PATCH - Update hero image (alt text, active status)
 * DELETE - Restore to original image or delete
 */

// PATCH - Update hero image
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { alt, isActive } = body;

    // Check if hero image exists
    const existing = await prisma.heroImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Hero image not found" },
        { status: 404 }
      );
    }

    // Update hero image
    const heroImage = await prisma.heroImage.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: heroImage,
    });
  } catch (error) {
    console.error("Error updating hero image:", error);
    return NextResponse.json(
      {
        error: "Failed to update hero image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Restore to original or delete hero image
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "delete"; // "restore" or "delete"

    // Check if hero image exists
    const existing = await prisma.heroImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Hero image not found" },
        { status: 404 }
      );
    }

    // Handle restore action
    if (action === "restore") {
      if (!existing.originalUrl) {
        return NextResponse.json(
          { error: "No original image to restore to" },
          { status: 400 }
        );
      }

      // Restore to original image
      const heroImage = await prisma.heroImage.update({
        where: { id },
        data: {
          imageUrl: existing.originalUrl,
          originalUrl: null,
          isAiGenerated: false,
          aiPrompt: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Hero image restored to original",
        data: heroImage,
      });
    }

    // Handle delete action (soft delete by setting isActive to false)
    if (action === "soft-delete") {
      const heroImage = await prisma.heroImage.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "Hero image deactivated",
        data: heroImage,
      });
    }

    // Hard delete
    await prisma.heroImage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Hero image deleted",
    });
  } catch (error) {
    console.error("Error deleting/restoring hero image:", error);
    return NextResponse.json(
      {
        error: "Failed to process hero image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


/**
 * Property Image Management API
 * 
 * DELETE - Delete a property image from database and ImageKit
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { deleteFromImageKit } from "@/lib/actions/upload.actions";

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

    // Find the image
    const image = await prisma.propertyImage.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Check if user owns this property (or is admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (image.property.userId !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized to delete this image" },
        { status: 403 }
      );
    }

    // Delete from ImageKit (best effort - don't fail if this fails)
    if (image.url) {
      try {
        await deleteFromImageKit(image.url);
      } catch (error) {
        console.error("Failed to delete from ImageKit (continuing):", error);
      }
    }

    // Delete from database
    await prisma.propertyImage.delete({
      where: { id },
    });

    // Reorder remaining images to fill the gap
    const remainingImages = await prisma.propertyImage.findMany({
      where: { propertyId: image.propertyId },
      orderBy: { position: "asc" },
    });

    // Update positions to be sequential
    for (let i = 0; i < remainingImages.length; i++) {
      if (remainingImages[i].position !== i + 1) {
        await prisma.propertyImage.update({
          where: { id: remainingImages[i].id },
          data: { position: i + 1 },
        });
      }
    }

    // Update the property's main image if the deleted image was the hero
    if (image.position === 1) {
      const newHero = remainingImages[0];
      if (newHero) {
        await prisma.property.update({
          where: { id: image.propertyId },
          data: { image: newHero.url },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property image:", error);
    return NextResponse.json(
      {
        error: "Failed to delete image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}




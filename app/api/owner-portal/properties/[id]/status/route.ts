/**
 * Owner Portal - Update Property Status
 * Allows owners to mark property as sold/rented
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";

const ALLOWED_STATUS_CHANGES = ["SOLD", "RENTED", "INACTIVE"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Access denied. Owner account required." },
        { status: 403 }
      );
    }

    const { id: propertyId } = await params;
    const body = await request.json();
    const { newStatus } = body;

    if (!newStatus || !ALLOWED_STATUS_CHANGES.includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values: SOLD, RENTED, INACTIVE" },
        { status: 400 }
      );
    }

    // Verify property belongs to this owner
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerUserId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    const previousStatus = property.status;

    // Update property status
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: newStatus as Status },
    });

    // Log status change
    await prisma.owner_status_change_log.create({
      data: {
        propertyId,
        ownerUserId: session.user.id,
        previousStatus,
        newStatus,
      },
    });

    // Log activity
    await prisma.owner_activity_log.create({
      data: {
        userId: session.user.id,
        propertyId,
        action: "STATUS_CHANGE",
        description: `Property status changed from ${previousStatus} to ${newStatus}`,
        metadata: {
          previousStatus,
          newStatus,
        },
      },
    });

    // Revalidate property pages
    revalidatePath(`/properties/${property.slug}`);
    if (property.provinceSlug && property.areaSlug) {
      revalidatePath(`/properties/${property.provinceSlug}/${property.areaSlug}/${property.slug}`);
    }

    return NextResponse.json({
      success: true,
      message: `Property marked as ${newStatus.toLowerCase()}`,
      previousStatus,
      newStatus,
    });
  } catch (error) {
    console.error("[Owner Status Update Error]:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

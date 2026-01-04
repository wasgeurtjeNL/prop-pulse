/**
 * Individual Owner API
 * 
 * GET /api/owners/[ownerId] - Get owner details
 * PATCH /api/owners/[ownerId] - Update owner
 * DELETE /api/owners/[ownerId] - Delete owner
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { transformPropertyOwner } from "@/lib/transforms";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ownerId } = await params;

    const owner = await prisma.property_owner.findUnique({
      where: { id: ownerId },
      include: {
        owner_document: {
          orderBy: { created_at: "desc" },
        },
        property: {
          include: {
            images: {
              where: { position: 1 },
              take: 1,
            },
          },
        },
        tm30_accommodation_request: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    return NextResponse.json({ owner: transformPropertyOwner(owner) });
  } catch (error: any) {
    console.error("[Owner API] Get error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ownerId } = await params;
    const body = await request.json();
    
    // Transform camelCase input to snake_case for Prisma
    const updateData: any = {
      updated_at: new Date(),
    };
    if (body.firstName !== undefined) updateData.first_name = body.firstName;
    if (body.lastName !== undefined) updateData.last_name = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.thaiIdNumber !== undefined) updateData.thai_id_number = body.thaiIdNumber;
    if (body.idCardUrl !== undefined) updateData.id_card_url = body.idCardUrl;
    if (body.idCardPath !== undefined) updateData.id_card_path = body.idCardPath;
    if (body.idCardOcrData !== undefined) updateData.id_card_ocr_data = body.idCardOcrData;
    if (body.idCardVerified !== undefined) updateData.id_card_verified = body.idCardVerified;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.isVerified !== undefined) updateData.is_verified = body.isVerified;

    const owner = await prisma.property_owner.update({
      where: { id: ownerId },
      data: updateData,
    });

    return NextResponse.json({ owner: transformPropertyOwner(owner) });
  } catch (error: any) {
    console.error("[Owner API] Update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ownerId } = await params;

    await prisma.property_owner.delete({
      where: { id: ownerId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Owner API] Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}







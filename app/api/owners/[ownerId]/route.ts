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

    const owner = await prisma.propertyOwner.findUnique({
      where: { id: ownerId },
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
        },
        properties: {
          include: {
            images: {
              where: { position: 1 },
              take: 1,
            },
          },
        },
        tm30Requests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    return NextResponse.json({ owner });
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

    const owner = await prisma.propertyOwner.update({
      where: { id: ownerId },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ owner });
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

    await prisma.propertyOwner.delete({
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


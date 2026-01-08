/**
 * Owner Invite Detail API
 * Manage individual owner invites
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Get invite details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invite = await prisma.owner_invite.findUnique({
      where: { id },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Fetch properties
    const properties = await prisma.property.findMany({
      where: { id: { in: invite.propertyIds } },
      select: {
        id: true,
        title: true,
        listingNumber: true,
        location: true,
        price: true,
        status: true,
      },
    });

    return NextResponse.json({ invite: { ...invite, properties } });
  } catch (error) {
    console.error("[Owner Invite GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}

// PATCH - Update invite (deactivate, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive, note } = body;

    const invite = await prisma.owner_invite.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error("[Owner Invite PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update invite" },
      { status: 500 }
    );
  }
}

// DELETE - Delete invite
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.owner_invite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Owner Invite DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete invite" },
      { status: 500 }
    );
  }
}

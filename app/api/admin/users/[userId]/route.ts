/**
 * Admin Individual User API
 * 
 * GET /api/admin/users/[userId] - Get user details
 * PATCH /api/admin/users/[userId] - Update user (email, name, role)
 * DELETE /api/admin/users/[userId] - Delete user (preserves properties)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can manage users" }, { status: 403 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        banned: true,
        banReason: true,
        banExpires: true,
        emailVerified: true,
        properties: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        ownedProperties: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("[Admin User API] Get error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can manage users" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();

    // Prevent admin from demoting themselves
    if (userId === session.user.id && body.role && body.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) {
      // Check if email is already in use by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: "Email is already in use by another user" },
          { status: 409 }
        );
      }
      updateData.email = body.email;
    }
    if (body.role !== undefined) updateData.role = body.role;
    if (body.banned !== undefined) updateData.banned = body.banned;
    if (body.banReason !== undefined) updateData.banReason = body.banReason;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("[Admin User API] Update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete users" }, { status: 403 });
    }

    const { userId } = await params;

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Get user first to check if they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Unlink properties from user (set userId to null) instead of deleting them
    await prisma.property.updateMany({
      where: { userId: userId },
      data: { userId: null as any },
    });

    // Unlink owned properties
    await prisma.property.updateMany({
      where: { ownerUserId: userId },
      data: { ownerUserId: null },
    });

    // Delete associated sessions first
    await prisma.session.deleteMany({
      where: { userId: userId },
    });

    // Delete associated accounts (OAuth links)
    await prisma.account.deleteMany({
      where: { userId: userId },
    });

    // Now delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ 
      success: true, 
      message: `User ${user.email} deleted. Properties have been preserved.`,
      deletedUser: user,
    });
  } catch (error: any) {
    console.error("[Admin User API] Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Owner Registration Completion API
 * Links properties to owner account and sets OWNER role
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Code and userId are required" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await prisma.owner_invite.findUnique({
      where: { code },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Validate invite
    if (!invite.isActive) {
      return NextResponse.json(
        { error: "This invite has been deactivated" },
        { status: 400 }
      );
    }

    if (invite.usedCount >= invite.maxUses) {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      );
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    // Start a transaction to update everything
    await prisma.$transaction(async (tx) => {
      // 1. Update user role to OWNER
      await tx.user.update({
        where: { id: userId },
        data: { role: "OWNER" },
      });

      // 2. Link all properties to this owner user
      await tx.property.updateMany({
        where: { id: { in: invite.propertyIds } },
        data: { ownerUserId: userId },
      });

      // 3. Mark invite as used
      await tx.owner_invite.update({
        where: { id: invite.id },
        data: {
          usedCount: { increment: 1 },
          usedBy: userId,
          usedAt: new Date(),
        },
      });

      // 4. Log the registration activity
      await tx.owner_activity_log.create({
        data: {
          userId,
          action: "ACCOUNT_CREATED",
          description: `Owner account created with ${invite.propertyIds.length} property(ies) linked`,
          metadata: {
            inviteCode: code,
            propertyIds: invite.propertyIds,
            listingNumbers: invite.listingNumbers,
          },
        },
      });
    });

    // Fetch linked properties for response
    const properties = await prisma.property.findMany({
      where: { id: { in: invite.propertyIds } },
      select: {
        id: true,
        title: true,
        listingNumber: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Owner account created successfully",
      properties,
    });
  } catch (error) {
    console.error("[Owner Registration Error]:", error);
    return NextResponse.json(
      { error: "Failed to complete registration" },
      { status: 500 }
    );
  }
}

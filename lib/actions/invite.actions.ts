"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

/**
 * Validate an invite code for agent registration
 * Returns the role if valid, null if invalid
 */
export async function validateInviteCode(code: string, email?: string): Promise<{
  valid: boolean;
  role?: string;
  error?: string;
}> {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: "No invite code provided" };
  }

  const invite = await prisma.agentInvite.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!invite) {
    return { valid: false, error: "Invalid invite code" };
  }

  if (!invite.isActive) {
    return { valid: false, error: "This invite code has been deactivated" };
  }

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return { valid: false, error: "This invite code has expired" };
  }

  if (invite.usedCount >= invite.maxUses) {
    return { valid: false, error: "This invite code has reached its usage limit" };
  }

  // If invite is restricted to specific email, check it
  if (invite.email && email && invite.email.toLowerCase() !== email.toLowerCase()) {
    return { valid: false, error: "This invite code is not valid for your email address" };
  }

  return { valid: true, role: invite.role };
}

/**
 * Use an invite code (mark as used)
 * Called after successful registration
 */
export async function useInviteCode(code: string, userId: string): Promise<boolean> {
  try {
    const invite = await prisma.agentInvite.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!invite || !invite.isActive) {
      return false;
    }

    await prisma.agentInvite.update({
      where: { code: code.toUpperCase().trim() },
      data: {
        usedCount: { increment: 1 },
        usedBy: invite.maxUses === 1 ? userId : undefined,
        usedAt: invite.maxUses === 1 ? new Date() : undefined,
        isActive: invite.usedCount + 1 >= invite.maxUses ? false : true,
      },
    });

    return true;
  } catch (error) {
    console.error("Error using invite code:", error);
    return false;
  }
}

/**
 * Generate a new invite code (admin only)
 */
export async function generateInviteCode(options: {
  email?: string;
  role?: "AGENT" | "ADMIN";
  maxUses?: number;
  expiresInDays?: number;
  note?: string;
}): Promise<{ success: boolean; code?: string; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Only admins can generate invite codes
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Only admins can generate invite codes" };
  }

  try {
    // Generate a unique code
    const code = `${options.role || "AGENT"}-${nanoid(8).toUpperCase()}`;

    const expiresAt = options.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.agentInvite.create({
      data: {
        code,
        email: options.email?.toLowerCase().trim() || null,
        role: options.role || "AGENT",
        maxUses: options.maxUses || 1,
        expiresAt,
        note: options.note || null,
        createdBy: session.user.id,
      },
    });

    return { success: true, code };
  } catch (error) {
    console.error("Error generating invite code:", error);
    return { success: false, error: "Failed to generate invite code" };
  }
}

/**
 * Get all invite codes (admin only)
 */
export async function getInviteCodes(): Promise<{
  invites: Array<{
    id: string;
    code: string;
    email: string | null;
    role: string;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
    expiresAt: Date | null;
    note: string | null;
    createdAt: Date;
  }>;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { invites: [], error: "Unauthorized" };
  }

  if (session.user.role !== "ADMIN") {
    return { invites: [], error: "Only admins can view invite codes" };
  }

  try {
    const invites = await prisma.agentInvite.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        email: true,
        role: true,
        maxUses: true,
        usedCount: true,
        isActive: true,
        expiresAt: true,
        note: true,
        createdAt: true,
      },
    });

    return { invites };
  } catch (error) {
    console.error("Error fetching invite codes:", error);
    return { invites: [], error: "Failed to fetch invite codes" };
  }
}

/**
 * Deactivate an invite code (admin only)
 */
export async function deactivateInviteCode(codeId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Only admins can deactivate invite codes" };
  }

  try {
    await prisma.agentInvite.update({
      where: { id: codeId },
      data: { isActive: false },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deactivating invite code:", error);
    return { success: false, error: "Failed to deactivate invite code" };
  }
}



/**
 * Owner Invites API
 * Manage invitations for property owners to access the owner portal
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

// GET - List all owner invites (admin/agent only)
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, used, expired
    const search = searchParams.get("search");

    const where: any = {};

    if (status === "active") {
      where.isActive = true;
      where.usedCount = { lt: prisma.raw("max_uses") };
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    } else if (status === "used") {
      where.usedCount = { gt: 0 };
    } else if (status === "expired") {
      where.expiresAt = { lt: new Date() };
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { code: { contains: search, mode: "insensitive" } },
        { listingNumbers: { has: search } },
      ];
    }

    const invites = await prisma.owner_invite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Fetch property details for each invite
    const invitesWithProperties = await Promise.all(
      invites.map(async (invite) => {
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
        return { ...invite, properties };
      })
    );

    return NextResponse.json({ invites: invitesWithProperties });
  } catch (error) {
    console.error("[Owner Invites GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST - Create a new owner invite
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !["ADMIN", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyIds, email, phone, expiresInDays, note } = body;

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { error: "At least one property must be selected" },
        { status: 400 }
      );
    }

    // Verify properties exist and get their listing numbers
    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, listingNumber: true, title: true },
    });

    if (properties.length !== propertyIds.length) {
      return NextResponse.json(
        { error: "One or more properties not found" },
        { status: 400 }
      );
    }

    // Check if properties already have an owner user linked
    const propertiesWithOwner = await prisma.property.findMany({
      where: {
        id: { in: propertyIds },
        ownerUserId: { not: null },
      },
      select: { id: true, title: true, listingNumber: true },
    });

    if (propertiesWithOwner.length > 0) {
      return NextResponse.json(
        {
          error: "Some properties already have an owner account linked",
          properties: propertiesWithOwner,
        },
        { status: 400 }
      );
    }

    const listingNumbers = properties
      .map((p) => p.listingNumber)
      .filter(Boolean) as string[];

    // Generate unique invite code
    const code = `OWNER-${nanoid(8).toUpperCase()}`;

    // Calculate expiration date
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const invite = await prisma.owner_invite.create({
      data: {
        code,
        email: email || null,
        phone: phone || null,
        propertyIds,
        listingNumbers,
        expiresAt,
        createdBy: session.user.id,
        createdByName: session.user.name,
        note: note || null,
      },
    });

    // Generate registration URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://psmphuket.com";
    const registrationUrl = `${baseUrl}/sign-up/owner?code=${code}`;

    return NextResponse.json({
      success: true,
      invite: {
        ...invite,
        properties,
        registrationUrl,
      },
    });
  } catch (error) {
    console.error("[Owner Invites POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

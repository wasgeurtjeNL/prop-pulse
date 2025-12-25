/**
 * Property Owners API
 * CRUD operations for property owners
 * 
 * GET /api/owners - List all owners with their properties and documents
 * POST /api/owners - Create a new owner
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const phone = searchParams.get("phone");

    // If specific phone lookup
    if (phone) {
      const owner = await prisma.propertyOwner.findUnique({
        where: { phone },
        include: {
          documents: {
            orderBy: { createdAt: "desc" },
          },
          properties: {
            select: {
              id: true,
              title: true,
              location: true,
              tm30AccommodationId: true,
              tm30AccommodationName: true,
              bluebookUrl: true,
              bluebookHouseId: true,
            },
          },
          tm30Requests: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      return NextResponse.json({ owner });
    }

    // List all owners
    const owners = await prisma.propertyOwner.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { thaiIdNumber: { contains: search } },
            ],
          }
        : undefined,
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
        },
        properties: {
          select: {
            id: true,
            title: true,
            location: true,
            tm30AccommodationId: true,
            tm30AccommodationName: true,
            bluebookUrl: true,
            bluebookHouseId: true,
          },
        },
        _count: {
          select: {
            properties: true,
            documents: true,
            tm30Requests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      owners,
      total: owners.length,
    });
  } catch (error: any) {
    console.error("[Owners API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      gender,
      thaiIdNumber,
      idCardUrl,
      idCardPath,
      idCardOcrData,
    } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "firstName, lastName, and phone are required" },
        { status: 400 }
      );
    }

    // Check if owner already exists
    const existing = await prisma.propertyOwner.findUnique({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Owner with this phone number already exists", owner: existing },
        { status: 409 }
      );
    }

    const owner = await prisma.propertyOwner.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        gender,
        thaiIdNumber,
        idCardUrl,
        idCardPath,
        idCardOcrData,
        idCardUploadedAt: idCardUrl ? new Date() : undefined,
      },
    });

    return NextResponse.json({ owner }, { status: 201 });
  } catch (error: any) {
    console.error("[Owners API] Create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





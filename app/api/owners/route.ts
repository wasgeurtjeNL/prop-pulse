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
import { transformPropertyOwner, transformOwnerDocument, transformPropertyWithRentalFields } from "@/lib/transforms";

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
      const owner = await prisma.property_owner.findUnique({
        where: { phone },
        include: {
          owner_document: {
            orderBy: { created_at: "desc" },
          },
          property: {
            select: {
              id: true,
              title: true,
              location: true,
              tm30_accommodation_id: true,
              tm30_accommodation_name: true,
              bluebookUrl: true,
              bluebook_house_id: true,
            },
          },
          tm30_accommodation_request: {
            orderBy: { created_at: "desc" },
            take: 5,
          },
        },
      });

      return NextResponse.json({ owner: owner ? transformPropertyOwner(owner) : null });
    }

    // List all owners
    const owners = await prisma.property_owner.findMany({
      where: search
        ? {
            OR: [
              { first_name: { contains: search, mode: "insensitive" } },
              { last_name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { thai_id_number: { contains: search } },
            ],
          }
        : undefined,
      include: {
        owner_document: {
          orderBy: { created_at: "desc" },
        },
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            tm30_accommodation_id: true,
            tm30_accommodation_name: true,
            bluebookUrl: true,
            bluebook_house_id: true,
          },
        },
        _count: {
          select: {
            property: true,
            owner_document: true,
            tm30_accommodation_request: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      owners: owners.map(transformPropertyOwner),
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
    const existing = await prisma.property_owner.findUnique({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Owner with this phone number already exists", owner: transformPropertyOwner(existing) },
        { status: 409 }
      );
    }

    const owner = await prisma.property_owner.create({
      data: {
        id: crypto.randomUUID(),
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        gender,
        thai_id_number: thaiIdNumber,
        id_card_url: idCardUrl,
        id_card_path: idCardPath,
        id_card_ocr_data: idCardOcrData,
        id_card_uploaded_at: idCardUrl ? new Date() : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ owner: transformPropertyOwner(owner) }, { status: 201 });
  } catch (error: any) {
    console.error("[Owners API] Create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}







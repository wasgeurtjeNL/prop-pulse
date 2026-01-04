/**
 * Owner Documents API
 * 
 * GET /api/owners/[ownerId]/documents - List documents for owner
 * POST /api/owners/[ownerId]/documents - Add document to owner
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { transformOwnerDocument } from "@/lib/transforms";

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

    const documents = await prisma.owner_document.findMany({
      where: { owner_id: ownerId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ documents: documents.map(transformOwnerDocument) });
  } catch (error: any) {
    console.error("[Owner Documents API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const {
      documentType,
      imageUrl,
      imagePath,
      fileName,
      ocrData,
      propertyId,
      houseId,
      extractedAddress,
    } = body;

    if (!documentType || !imageUrl || !imagePath) {
      return NextResponse.json(
        { error: "documentType, imageUrl, and imagePath are required" },
        { status: 400 }
      );
    }

    // Verify owner exists
    const owner = await prisma.property_owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    const document = await prisma.owner_document.create({
      data: {
        id: crypto.randomUUID(),
        owner_id: ownerId,
        document_type: documentType,
        image_url: imageUrl,
        image_path: imagePath,
        file_name: fileName,
        ocr_data: ocrData,
        ocr_processed_at: ocrData ? new Date() : undefined,
        property_id: propertyId,
        house_id: houseId,
        extracted_address: extractedAddress,
        updated_at: new Date(),
      },
    });

    // If this is a bluebook linked to a property, update the property
    if (documentType === "BLUEBOOK" && propertyId) {
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          bluebook_url: imageUrl,
          bluebook_house_id: houseId,
          property_owner_id: ownerId,
        },
      });
    }

    return NextResponse.json({ document: transformOwnerDocument(document) }, { status: 201 });
  } catch (error: any) {
    console.error("[Owner Documents API] Create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}







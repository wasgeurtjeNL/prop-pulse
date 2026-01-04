import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FbLeadStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single lead
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const lead = await prisma.fbMarketplaceLead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Error fetching FB Marketplace lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PATCH - Update lead
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      sellerName,
      sellerPhone,
      sellerEmail,
      sellerFacebookUrl,
      propertyTitle,
      price,
      location,
      description,
      images,
      propertyType,
      bedrooms,
      bathrooms,
      sqm,
      status,
      priority,
      score,
      contactedAt,
      contactMethod,
      contactNotes,
      followUpDate,
      contactHistory,
      assignedToId,
      convertedToPropertyId,
      convertedAt,
    } = body;

    // Build update data object
    const updateData: any = {};

    if (sellerName !== undefined) updateData.sellerName = sellerName;
    if (sellerPhone !== undefined) updateData.sellerPhone = sellerPhone;
    if (sellerEmail !== undefined) updateData.sellerEmail = sellerEmail;
    if (sellerFacebookUrl !== undefined) updateData.sellerFacebookUrl = sellerFacebookUrl;
    if (propertyTitle !== undefined) updateData.propertyTitle = propertyTitle;
    if (price !== undefined) updateData.price = price;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms ? parseInt(bedrooms) : null;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms ? parseInt(bathrooms) : null;
    if (sqm !== undefined) updateData.sqm = sqm ? parseInt(sqm) : null;
    if (status !== undefined) updateData.status = status as FbLeadStatus;
    if (priority !== undefined) updateData.priority = priority;
    if (score !== undefined) updateData.score = score;
    if (contactedAt !== undefined) updateData.contactedAt = contactedAt ? new Date(contactedAt) : null;
    if (contactMethod !== undefined) updateData.contactMethod = contactMethod;
    if (contactNotes !== undefined) updateData.contactNotes = contactNotes;
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (contactHistory !== undefined) updateData.contactHistory = contactHistory;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (convertedToPropertyId !== undefined) updateData.convertedToPropertyId = convertedToPropertyId;
    if (convertedAt !== undefined) updateData.convertedAt = convertedAt ? new Date(convertedAt) : null;

    const lead = await prisma.fbMarketplaceLead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    console.error("Error updating FB Marketplace lead:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE lead
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.fbMarketplaceLead.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting FB Marketplace lead:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}

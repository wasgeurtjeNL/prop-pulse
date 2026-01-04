import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Add contact attempt to lead
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { method, notes, outcome, followUpDate } = body;

    // Validate required fields
    if (!method) {
      return NextResponse.json(
        { success: false, error: "Contact method is required" },
        { status: 400 }
      );
    }

    // Get current lead
    const lead = await prisma.fbMarketplaceLead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    // Build new contact entry
    const contactEntry = {
      date: new Date().toISOString(),
      method, // phone, email, whatsapp, messenger
      notes: notes || "",
      outcome: outcome || "pending", // pending, answered, no_answer, voicemail, interested, not_interested
    };

    // Get existing contact history or initialize empty array
    const existingHistory = (lead.contactHistory as any[]) || [];
    const newHistory = [...existingHistory, contactEntry];

    // Determine new status based on outcome
    let newStatus = lead.status;
    if (outcome === "interested") {
      newStatus = "INTERESTED";
    } else if (outcome === "not_interested") {
      newStatus = "NOT_INTERESTED";
    } else if (outcome === "answered" || outcome === "pending") {
      if (lead.status === "NEW") {
        newStatus = "CONTACTED";
      }
    }

    // Update lead with new contact info
    const updatedLead = await prisma.fbMarketplaceLead.update({
      where: { id },
      data: {
        contactHistory: newHistory,
        contactedAt: new Date(),
        contactMethod: method,
        contactNotes: notes || lead.contactNotes,
        status: newStatus,
        followUpDate: followUpDate ? new Date(followUpDate) : lead.followUpDate,
      },
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
      data: updatedLead,
    });
  } catch (error) {
    console.error("Error adding contact to FB Marketplace lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add contact" },
      { status: 500 }
    );
  }
}

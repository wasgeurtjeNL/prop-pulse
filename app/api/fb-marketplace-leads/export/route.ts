import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Export leads as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const format = searchParams.get("format") || "csv";

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    const leads = await prisma.fbMarketplaceLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (format === "json") {
      return NextResponse.json({
        success: true,
        data: leads,
        count: leads.length,
      });
    }

    // Generate CSV
    const headers = [
      "ID",
      "Seller Name",
      "Seller Phone",
      "Seller Email",
      "Property Title",
      "Price",
      "Location",
      "Property Type",
      "Bedrooms",
      "Bathrooms",
      "Sqm",
      "Status",
      "Listing URL",
      "Contact Method",
      "Contacted At",
      "Follow Up Date",
      "Assigned To",
      "Created At",
      "Notes",
    ];

    const rows = leads.map((lead) => [
      lead.id,
      lead.sellerName,
      lead.sellerPhone || "",
      lead.sellerEmail || "",
      lead.propertyTitle,
      lead.price || "",
      lead.location || "",
      lead.propertyType || "",
      lead.bedrooms?.toString() || "",
      lead.bathrooms?.toString() || "",
      lead.sqm?.toString() || "",
      lead.status,
      lead.listingUrl,
      lead.contactMethod || "",
      lead.contactedAt ? lead.contactedAt.toISOString() : "",
      lead.followUpDate ? lead.followUpDate.toISOString() : "",
      lead.assignedTo?.name || "",
      lead.createdAt.toISOString(),
      lead.contactNotes?.replace(/[\n\r,]/g, " ") || "",
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => escapeCSV(cell)).join(",")),
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fb-marketplace-leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting FB Marketplace leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export leads" },
      { status: 500 }
    );
  }
}

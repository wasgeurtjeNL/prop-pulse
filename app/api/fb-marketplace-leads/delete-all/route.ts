import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE all FB Marketplace leads
export async function DELETE() {
  try {
    // Count before deletion
    const countBefore = await prisma.fbMarketplaceLead.count();
    
    // Delete all
    const result = await prisma.fbMarketplaceLead.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} leads`,
      deletedCount: result.count,
      previousCount: countBefore,
    });
  } catch (error) {
    console.error("Error deleting all FB Marketplace leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete leads" },
      { status: 500 }
    );
  }
}

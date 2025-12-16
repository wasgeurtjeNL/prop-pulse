import { NextResponse } from "next/server";
import { backfillListingNumbers } from "@/lib/actions/property.actions";

async function handleBackfill() {
  try {
    const result = await backfillListingNumbers();
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.updated} of ${result.total} properties with listing numbers`,
      ...result,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to backfill listing numbers",
      },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}

// Support both GET and POST for easy testing
export async function GET() {
  return handleBackfill();
}

export async function POST() {
  return handleBackfill();
}


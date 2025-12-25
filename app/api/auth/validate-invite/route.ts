/**
 * Validate invite code API
 * Used by signup form to check if an invite code is valid
 */

import { validateInviteCode } from "@/lib/actions/invite.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "No invite code provided" },
        { status: 400 }
      );
    }

    const result = await validateInviteCode(code, email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate invite code" },
      { status: 500 }
    );
  }
}






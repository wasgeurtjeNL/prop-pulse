"use server";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch minimal property list for dropdowns
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        listingNumber: true,
      },
      orderBy: [
        { listingNumber: "asc" },
        { title: "asc" },
      ],
      take: 500, // Limit for performance
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Error fetching properties list:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

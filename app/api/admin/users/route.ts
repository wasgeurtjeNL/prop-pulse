/**
 * Admin Users API
 * Manage user accounts (list, search users)
 * 
 * GET /api/admin/users - List all users with optional filters
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

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can manage users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can manage users" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    // Build where clause dynamically
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        banned: true,
        banReason: true,
        emailVerified: true,
        _count: {
          select: {
            properties: true,
            ownedProperties: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      users,
      total: users.length,
    });
  } catch (error: any) {
    console.error("[Admin Users API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { PricingConfig } from "@/lib/services/rental-pricing";

// GET - Retrieve pricing configuration
// Public endpoint - pricing config is needed for frontend booking widget
export async function GET() {
  try {
    // Get the singleton config (id = "default")
    let config = await prisma.rentalPricingConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      // Create default config with surcharges (extra costs for shorter stays)
      const defaultConfig: PricingConfig = {
        peakSeasonMonths: [12, 1, 2],
        peakSeasonSurcharges: [
          { minDays: 1, maxDays: 7, surchargePercent: 30 },
          { minDays: 8, maxDays: 14, surchargePercent: 20 },
          { minDays: 15, maxDays: 19, surchargePercent: 15 },
          { minDays: 20, maxDays: 30, surchargePercent: 0 },
        ],
        lowSeasonSurcharges: [
          { minDays: 1, maxDays: 7, surchargePercent: 20 },
          { minDays: 8, maxDays: 14, surchargePercent: 17 },
          { minDays: 15, maxDays: 19, surchargePercent: 13 },
          { minDays: 20, maxDays: 30, surchargePercent: 0 },
        ],
        minimumStayDays: 1,
        maximumStayDays: 30,
      };

      config = await prisma.rentalPricingConfig.create({
        data: {
          id: "default",
          peakSeasonMonths: defaultConfig.peakSeasonMonths,
          peakSeasonSurcharges: defaultConfig.peakSeasonSurcharges as any,
          lowSeasonSurcharges: defaultConfig.lowSeasonSurcharges as any,
          minimumStayDays: defaultConfig.minimumStayDays,
          maximumStayDays: defaultConfig.maximumStayDays,
        },
      });
    }

    // Parse JSON fields
    const peakSurcharges = config.peakSeasonSurcharges as any[];
    const lowSurcharges = config.lowSeasonSurcharges as any[];

    return NextResponse.json({
      config: {
        peakSeasonMonths: config.peakSeasonMonths as number[],
        peakSeasonSurcharges: peakSurcharges.map((s: any) => ({
          minDays: s.minDays,
          maxDays: s.maxDays,
          surchargePercent: s.surchargePercent ?? s.discountPercent ?? 0,
        })),
        lowSeasonSurcharges: lowSurcharges.map((s: any) => ({
          minDays: s.minDays,
          maxDays: s.maxDays,
          surchargePercent: s.surchargePercent ?? s.discountPercent ?? 0,
        })),
        minimumStayDays: config.minimumStayDays,
        maximumStayDays: config.maximumStayDays,
      },
    });
  } catch (error) {
    console.error("Error fetching pricing config:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

// PATCH - Update pricing configuration
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const config: PricingConfig = body;

    // Upsert the singleton config
    const updatedConfig = await prisma.rentalPricingConfig.upsert({
      where: { id: "default" },
      update: {
        peakSeasonMonths: config.peakSeasonMonths,
        peakSeasonSurcharges: config.peakSeasonSurcharges as any,
        lowSeasonSurcharges: config.lowSeasonSurcharges as any,
        minimumStayDays: config.minimumStayDays,
        maximumStayDays: config.maximumStayDays,
      },
      create: {
        id: "default",
        peakSeasonMonths: config.peakSeasonMonths,
        peakSeasonSurcharges: config.peakSeasonSurcharges as any,
        lowSeasonSurcharges: config.lowSeasonSurcharges as any,
        minimumStayDays: config.minimumStayDays,
        maximumStayDays: config.maximumStayDays,
      },
    });

    return NextResponse.json({
      config: {
        peakSeasonMonths: updatedConfig.peakSeasonMonths as number[],
        peakSeasonSurcharges: updatedConfig.peakSeasonSurcharges as any,
        lowSeasonSurcharges: updatedConfig.lowSeasonSurcharges as any,
        minimumStayDays: updatedConfig.minimumStayDays,
        maximumStayDays: updatedConfig.maximumStayDays,
      },
    });
  } catch (error) {
    console.error("Error updating pricing config:", error);
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
  }
}

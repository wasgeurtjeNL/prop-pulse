import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { PricingConfig } from "@/lib/services/rental-pricing";

// GET - Retrieve pricing configuration
// Public endpoint - pricing config is needed for frontend booking widget
export async function GET() {
  try {
    let config = await prisma.rentalPricingConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
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
          peakSeasonMonths: defaultConfig.peakSeasonMonths as any,
          peakSeasonDiscounts: defaultConfig.peakSeasonSurcharges as any, // Using old field name for DB compatibility
          lowSeasonDiscounts: defaultConfig.lowSeasonSurcharges as any,
          minimumStayDays: defaultConfig.minimumStayDays,
          maximumStayDays: defaultConfig.maximumStayDays,
        },
      });
    }

    // Convert DB format (using old field names) to new API format
    const peakSurcharges = config.peakSeasonDiscounts as any[];
    const lowSurcharges = config.lowSeasonDiscounts as any[];

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

    // Deactivate old configs
    await prisma.rentalPricingConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active config (storing surcharges in the old field names for DB compatibility)
    const newConfig = await prisma.rentalPricingConfig.create({
      data: {
        peakSeasonMonths: config.peakSeasonMonths as any,
        peakSeasonDiscounts: config.peakSeasonSurcharges as any,
        lowSeasonDiscounts: config.lowSeasonSurcharges as any,
        minimumStayDays: config.minimumStayDays,
        maximumStayDays: config.maximumStayDays,
        isActive: true,
      },
    });

    return NextResponse.json({
      config: {
        peakSeasonMonths: newConfig.peakSeasonMonths as number[],
        peakSeasonSurcharges: newConfig.peakSeasonDiscounts as any,
        lowSeasonSurcharges: newConfig.lowSeasonDiscounts as any,
        minimumStayDays: newConfig.minimumStayDays,
        maximumStayDays: newConfig.maximumStayDays,
      },
    });
  } catch (error) {
    console.error("Error updating pricing config:", error);
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
  }
}

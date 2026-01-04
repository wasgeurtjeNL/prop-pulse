import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Label mapping for display - fallback to slug if not found
const AREA_LABELS: Record<string, string> = {
  "rawai": "Rawai",
  "kata": "Kata",
  "karon": "Karon",
  "patong": "Patong",
  "kamala": "Kamala",
  "surin": "Surin",
  "bang-tao": "Bang Tao",
  "laguna": "Laguna",
  "layan": "Layan",
  "nai-harn": "Nai Harn",
  "nai-yang": "Nai Yang",
  "mai-khao": "Mai Khao",
  "chalong": "Chalong",
  "kathu": "Kathu",
  "phuket-town": "Phuket Town",
  "thalang": "Thalang",
  "cherngtalay": "Cherngtalay",
  "cape-panwa": "Cape Panwa",
  "ao-po": "Ao Po",
  "koh-kaew": "Koh Kaew",
  "other": "Other Areas",
};

// Capitalize first letter of each word as fallback
function formatAreaLabel(slug: string): string {
  if (AREA_LABELS[slug]) return AREA_LABELS[slug];
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const getAreasWithCounts = unstable_cache(
  async () => {
    const areas = await prisma.property.groupBy({
      by: ["areaSlug"],
      where: {
        areaSlug: { not: null },
        status: "ACTIVE",
      },
      _count: { areaSlug: true },
      orderBy: { _count: { areaSlug: "desc" } },
    });

    return areas
      .filter((a) => a.areaSlug !== null && a.areaSlug !== "")
      .map((a) => ({
        slug: a.areaSlug!,
        label: formatAreaLabel(a.areaSlug!),
        count: a._count.areaSlug,
      }));
  },
  ["property-areas"],
  { revalidate: 300 } // Cache for 5 minutes
);

export async function GET() {
  try {
    const areas = await getAreasWithCounts();
    
    return NextResponse.json({ 
      success: true,
      areas,
      total: areas.reduce((sum, a) => sum + a.count, 0)
    });
  } catch (error) {
    console.error("[API] Error fetching areas:", error);
    return NextResponse.json(
      { success: false, areas: [], error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}

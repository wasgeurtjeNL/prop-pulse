/**
 * Admin API to delete seeded demo properties
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Slugs of seeded demo properties to delete
const SEED_PROPERTY_SLUGS = [
  "luxury-beachfront-villa-kamala",
  "modern-sea-view-condo",
  "tropical-pool-villa-rawai",
  "pattaya-beach-condo",
  "bang-tao-luxury-residence",
  "pratumnak-hill-penthouse",
];

export async function POST() {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const deleted: string[] = [];
    const notFound: string[] = [];
    const errors: string[] = [];

    for (const slug of SEED_PROPERTY_SLUGS) {
      try {
        const property = await prisma.property.findUnique({
          where: { slug },
        });

        if (property) {
          // Delete related images first
          await prisma.propertyImage.deleteMany({
            where: { propertyId: property.id },
          });

          // Delete the property
          await prisma.property.delete({
            where: { slug },
          });
          deleted.push(property.title);
        } else {
          notFound.push(slug);
        }
      } catch (error) {
        errors.push(`${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo properties cleanup completed",
      deleted,
      notFound,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error deleting seed properties:", error);
    return NextResponse.json(
      { error: "Failed to delete properties" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current seed properties status
    const seedProperties = await prisma.property.findMany({
      where: {
        slug: { in: SEED_PROPERTY_SLUGS },
      },
      select: {
        title: true,
        slug: true,
      },
    });

    // Get all properties count
    const allProperties = await prisma.property.findMany({
      select: {
        title: true,
        slug: true,
      },
    });

    return NextResponse.json({
      seedPropertiesFound: seedProperties,
      seedPropertyCount: seedProperties.length,
      allProperties: allProperties,
      totalPropertyCount: allProperties.length,
    });
  } catch (error) {
    console.error("Error checking seed properties:", error);
    return NextResponse.json(
      { error: "Failed to check properties" },
      { status: 500 }
    );
  }
}






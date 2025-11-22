"use server";

import { unstable_cache } from "next/cache";
import prisma from "../prisma";
import { PropertyType, Status } from "../generated/prisma/enums";

export interface PropertyFilterParams {
  query?: string;
  type?: string;
  beds?: string;
  baths?: string;
  amenities?: string | string[];
}

export const getFeaturedProperties = unstable_cache(
  async () => {
    return await prisma.property.findMany({
      where: {
        tag: "Featured",
        status: "ACTIVE",
      },
      take: 4,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
        beds: true,
        baths: true,
        sqft: true,
        image: true,
        type: true,
        tag: true,
        slug: true,
      },
    });
  },
  ["featured-properties"],
  { revalidate: 3600 }
);

export async function getPropertyDetails(slug: string) {
  const property = await prisma.property.findUnique({
    where: {
      slug: slug,
    },
    include: {
      user: {
        select: { name: true, email: true, image: true },
      },
    },
  });

  return property;
}

export async function getProperties(params: PropertyFilterParams) {
  try {
    const { query, type, beds, baths, amenities } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: Status.ACTIVE,
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ];
    }

    if (type && type !== "all") {
      where.type =
        type === "buy" ? PropertyType.FOR_SALE : PropertyType.FOR_RENT;
    }

    if (beds && beds !== "Any") {
      const bedsNum = parseInt(beds);
      where.beds = { gte: bedsNum };
    }

    if (baths && baths !== "Any") {
      const bathsNum = parseInt(baths);
      where.baths = { gte: bathsNum };
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities
        : amenities.split(",");
      if (amenitiesList.length > 0) {
        where.amenities = {
          hasEvery: amenitiesList,
        };
      }
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return properties;
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

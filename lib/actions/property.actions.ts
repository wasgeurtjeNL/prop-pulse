"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import prisma from "../prisma";
import { PropertyType, Status, PropertyCategory } from "../generated/prisma/client";
import { auth } from "../auth";
import { headers } from "next/headers";
import { slugify } from "../utils";
import { z } from "zod";
import { propertySchema } from "../validations";
import { withRetry } from "../db-utils";

export interface PropertyFilterParams {
  query?: string;
  type?: string;
  category?: string;
  beds?: string;
  baths?: string;
  amenities?: string | string[];
}

// Slugs of seeded demo properties to exclude from public listings
const SEED_PROPERTY_SLUGS = [
  "luxury-beachfront-villa-kamala",
  "modern-sea-view-condo",
  "tropical-pool-villa-rawai",
  "pattaya-beach-condo",
  "bang-tao-luxury-residence",
  "pratumnak-hill-penthouse",
];

export const getFeaturedProperties = unstable_cache(
  async () => {
    try {
      return await withRetry(() =>
        prisma.property.findMany({
          where: {
            tag: "Featured",
            status: "ACTIVE",
            // Exclude seeded demo properties
            slug: {
              notIn: SEED_PROPERTY_SLUGS,
            },
          },
          take: 4,
          include: {
            images: {
              orderBy: { position: "asc" },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      return [];
    }
  },
  ["featured-properties-key"],
  { revalidate: 3600, tags: ["featured-properties"] }
);

export async function getPropertyDetails(slug: string) {
  try {
    return await withRetry(() =>
      prisma.property.findUnique({
        where: {
          slug: slug,
        },
        include: {
          user: {
            select: { name: true, email: true, image: true },
          },
          images: {
            orderBy: { position: "asc" },
          },
        },
      })
    );
  } catch (error) {
    console.error("Error fetching property details:", error);
    return null;
  }
}

export async function getProperties(params: PropertyFilterParams) {
  try {
    const { query, type, category, beds, baths, amenities } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: Status.ACTIVE,
      // Exclude seeded demo properties
      slug: {
        notIn: SEED_PROPERTY_SLUGS,
      },
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

    // Category filter - convert slug to database enum
    if (category && category !== "all") {
      const categoryMap: Record<string, PropertyCategory> = {
        "luxury-villa": PropertyCategory.LUXURY_VILLA,
        "apartment": PropertyCategory.APARTMENT,
        "residential-home": PropertyCategory.RESIDENTIAL_HOME,
        "office-spaces": PropertyCategory.OFFICE_SPACES,
      };
      
      const dbCategory = categoryMap[category];
      if (dbCategory) {
        where.category = dbCategory;
      }
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

    const properties = await withRetry(() =>
      prisma.property.findMany({
        where,
        include: {
          images: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return properties;
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export interface DashboardPropertyFilters {
  search?: string;
  status?: Status | "all";
  type?: PropertyType | "all";
  page?: number;
  limit?: number;
}

export interface PaginatedPropertiesResult {
  properties: {
    id: string;
    title: string;
    slug: string;
    location: string;
    price: string;
    status: Status;
    type: PropertyType;
    image: string;
    createdAt: Date;
  }[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export async function getAgentProperties(): Promise<PaginatedPropertiesResult["properties"]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const currentUserId = session?.user?.id;

  try {
    const properties = await prisma.property.findMany({
      where: {
        userId: currentUserId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        price: true,
        status: true,
        type: true,
        image: true,
        createdAt: true,
      },
    });

    return properties;
  } catch (error) {
    console.error("Failed to fetch agent properties:", error);
    throw new Error("Failed to load properties");
  }
}

export async function getAgentPropertiesPaginated(
  filters: DashboardPropertyFilters = {}
): Promise<PaginatedPropertiesResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const currentUserId = session?.user?.id;
  const { search, status, type, page = 1, limit = 10 } = filters;

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId: currentUserId,
  };

  // Search filter - title or location
  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { location: { contains: search.trim(), mode: "insensitive" } },
      { slug: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  // Status filter
  if (status && status !== "all") {
    where.status = status;
  }

  // Type filter
  if (type && type !== "all") {
    where.type = type;
  }

  try {
    // Get total count for pagination
    const totalCount = await prisma.property.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.min(Math.max(1, page), Math.max(1, totalPages));
    const skip = (currentPage - 1) * limit;

    // Get paginated properties
    const properties = await prisma.property.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        price: true,
        status: true,
        type: true,
        image: true,
        createdAt: true,
      },
      skip,
      take: limit,
    });

    return {
      properties,
      totalCount,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  } catch (error) {
    console.error("Failed to fetch agent properties:", error);
    throw new Error("Failed to load properties");
  }
}

export async function getDashboardStats(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalListings, activeListings, newInLast30Days] = await Promise.all([
    prisma.property.count({
      where: { userId },
    }),

    prisma.property.count({
      where: {
        userId,
        status: Status.ACTIVE,
      },
    }),

    prisma.property.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  return {
    totalListings,
    activeListings,
    newInLast30Days,
  };
}

type CreatePropertyArgs = z.infer<typeof propertySchema> & { 
  imageUrl: string;
  imageUrls?: string[]; // Array of 4 images for gallery
  shortDescription?: string;
  descriptionParagraphs?: string[];
  propertyFeatures?: Array<{ title: string; description: string; icon: string }>;
  amenitiesWithIcons?: Array<{ name: string; icon: string }>;
  yearBuilt?: number;
  mapUrl?: string;
};

export async function createProperty(data: CreatePropertyArgs) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const property = await prisma.property.create({
      data: {
        title: data.title,
        slug: slugify(data.title),
        location: data.location,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: data.sqft,
        type: data.type,
        category: (data.category as PropertyCategory) || PropertyCategory.RESIDENTIAL_HOME,
        tag: data.tag || "",
        image: data.imageUrl,
        content: data.content,
        amenities: data.amenities,
        status: data.status,
        userId: session.user.id,
        
        // New fields
        shortDescription: data.shortDescription,
        descriptionParagraphs: data.descriptionParagraphs as any,
        propertyFeatures: data.propertyFeatures as any,
        amenitiesWithIcons: data.amenitiesWithIcons as any,
        yearBuilt: data.yearBuilt,
        mapUrl: data.mapUrl,
      },
    });

    // Create image slots for all uploaded images
    if (data.imageUrls && data.imageUrls.length > 0) {
      // Filter out null/empty URLs and create image records
      const imageSlots = data.imageUrls
        .filter((url) => url && url.trim() !== '')
        .map((imageUrl, index) => ({
          propertyId: property.id,
          url: imageUrl,
          position: index + 1, // Position starts at 1
          alt: `${data.title} - Image ${index + 1}`,
        }));

      if (imageSlots.length > 0) {
        await prisma.propertyImage.createMany({
          data: imageSlots,
        });
      }
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create property listing");
  }

  revalidatePath("/dashboard");
  revalidatePath("/properties");
  revalidateTag("featured-properties", { expire: 0 });
}

export async function deleteProperty(propertyId: string, userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  if (property.userId !== userId) {
    throw new Error("You do not have permission to delete this property");
  }

  await prisma.property.delete({
    where: { id: propertyId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/properties");
  revalidateTag("featured-properties", { expire: 0 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProperty(id: string, data: any) {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    await prisma.property.update({
      where: { id: property.id },
      data: {
        title: data.title,
        slug:
          property.title !== data.title ? slugify(data.title) : property.slug,
        location: data.location,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: data.sqft,
        type: data.type,
        category: data.category,
        tag: data.tag || "",
        image: data.imageUrl,
        content: data.content,
        amenities: data.amenities,
        status: data.status,
        
        // New fields
        shortDescription: data.shortDescription,
        descriptionParagraphs: data.descriptionParagraphs as any,
        propertyFeatures: data.propertyFeatures as any,
        amenitiesWithIcons: data.amenitiesWithIcons as any,
        yearBuilt: data.yearBuilt,
        mapUrl: data.mapUrl,
      },
    });

    // Update images - create slots for all uploaded images
    if (data.imageUrls !== undefined) {
      // Delete existing images
      await prisma.propertyImage.deleteMany({
        where: { propertyId: id },
      });
      
      // Create image slots for all uploaded images
      if (data.imageUrls.length > 0) {
        // Filter out null/empty URLs
        const imageSlots = data.imageUrls
          .filter((url: string) => url && url.trim() !== '')
          .map((imageUrl: string, index: number) => ({
            propertyId: id,
            url: imageUrl,
            position: index + 1,
            alt: `${data.title} - Image ${index + 1}`,
          }));

        if (imageSlots.length > 0) {
          await prisma.propertyImage.createMany({
            data: imageSlots,
          });
        }
      }
    }

    revalidatePath("/dashboard");
    revalidatePath(`/listings/${property.slug}`);
    revalidateTag("featured-properties", { expire: 0 });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update property listing");
  }
}

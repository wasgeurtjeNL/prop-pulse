"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import prisma from "../prisma";
import { PropertyType, Status, PropertyCategory, Property, PropertyImage, OwnershipType } from "@prisma/client";
import { auth } from "../auth";
import { headers } from "next/headers";
import { slugify } from "../utils";
import { z } from "zod";
import { propertySchema } from "../validations";
import { withRetry } from "../db-utils";
import { geocodePropertyLocation } from "../services/poi/geocoding";
import { analyzeProperty } from "../services/poi/sync";
import { getOptimizedImageUrl } from "../imagekit";
import { parseLocationToSlugs } from "../property-url";

/**
 * Generate the next unique listing number in format "PP-XXXX"
 * PP = PSM Phuket prefix, XXXX = zero-padded sequential number
 */
export async function generateListingNumber(): Promise<string> {
  const PREFIX = "PP";
  
  // Find the highest existing listing number
  const lastProperty = await prisma.property.findFirst({
    where: {
      listingNumber: {
        startsWith: PREFIX,
      },
    },
    orderBy: {
      listingNumber: "desc",
    },
    select: {
      listingNumber: true,
    },
  });
  
  let nextNumber = 1;
  
  if (lastProperty?.listingNumber) {
    // Extract the number part (e.g., "PP-0042" -> 42)
    const match = lastProperty.listingNumber.match(/PP-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  
  // Format as PP-XXXX (4 digits, zero-padded)
  return `${PREFIX}-${nextNumber.toString().padStart(4, "0")}`;
}

export interface PropertyFilterParams {
  query?: string;
  type?: string;
  category?: string;
  beds?: string;
  baths?: string;
  amenities?: string | string[];
  shortStay?: string | boolean; // Filter for daily rental properties (< 30 days)
  includeUnavailable?: boolean; // Include SOLD/RENTED properties (for "Recently Sold" section)
  status?: string; // Filter by specific status (ACTIVE, SOLD, RENTED, etc.)
  // New filters
  minPrice?: string; // Minimum price in millions THB
  maxPrice?: string; // Maximum price in millions THB
  minArea?: string; // Minimum area in sqm
  maxArea?: string; // Maximum area in sqm
  hasSeaView?: string | boolean; // Sea view filter
  allowPets?: string | boolean; // Pet friendly filter
  ownershipType?: string; // FREEHOLD or LEASEHOLD
  isResale?: string | boolean; // New development (false) or resale (true)
}

// Type for highlighted property with images
export type HighlightedProperty = (Property & { images: PropertyImage[] }) | null;

export const getFeaturedProperties = unstable_cache(
  async () => {
    try {
      return await withRetry(() =>
        prisma.property.findMany({
          where: {
            tag: "Featured",
            status: "ACTIVE",
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

// Get the highlighted property for the hero section
export async function getHighlightedProperty(): Promise<HighlightedProperty> {
  const fetchHighlighted = unstable_cache(
    async (): Promise<HighlightedProperty> => {
      try {
        return await withRetry(() =>
          prisma.property.findFirst({
            where: {
              isHighlighted: true,
              status: "ACTIVE",
            },
            include: {
              images: {
                orderBy: { position: "asc" },
              },
            },
            orderBy: {
              updatedAt: "desc", // Most recently updated highlighted property
            },
          })
        );
      } catch (error) {
        console.error("Error fetching highlighted property:", error);
        return null;
      }
    },
    ["highlighted-property-key"],
    { revalidate: 3600, tags: ["highlighted-property"] }
  );
  
  return fetchHighlighted();
}

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

/**
 * Get property by full hierarchical slug: /properties/{province}/{area}/{slug}
 */
export async function getPropertyByFullSlug(province: string, area: string, slug: string) {
  try {
    return await withRetry(() =>
      prisma.property.findFirst({
        where: {
          slug: slug,
          provinceSlug: province,
          areaSlug: area,
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
    console.error("Error fetching property by full slug:", error);
    return null;
  }
}

/**
 * Get all property slugs for Static Site Generation (SSG)
 * Returns minimal data needed for generateStaticParams
 */
export async function getAllPropertySlugs(): Promise<{ slug: string; provinceSlug: string | null; areaSlug: string | null }[]> {
  try {
    const properties = await prisma.property.findMany({
      where: {
        status: Status.ACTIVE,
      },
      select: {
        slug: true,
        provinceSlug: true,
        areaSlug: true,
      },
    });
    return properties;
  } catch (error) {
    console.error("Error fetching property slugs for SSG:", error);
    return [];
  }
}


export async function getProperties(params: PropertyFilterParams) {
  try {
    const { 
      query, type, category, beds, baths, amenities, shortStay, 
      includeUnavailable, status,
      // New filters
      minPrice, maxPrice, minArea, maxArea, hasSeaView, allowPets, ownershipType, isResale
    } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    // Status filtering logic:
    // 1. If specific status is provided, use that
    // 2. If includeUnavailable is true, include ACTIVE, SOLD, and RENTED
    // 3. Default to ACTIVE only
    if (status && status !== 'all') {
      where.status = status as Status;
    } else if (includeUnavailable) {
      where.status = { in: [Status.ACTIVE, Status.SOLD, Status.RENTED] };
    } else {
      where.status = Status.ACTIVE;
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        { listingNumber: { contains: query, mode: "insensitive" } },
      ];
    }

    if (type && type !== "all") {
      // Support both enum values (FOR_SALE, FOR_RENT) and legacy values (buy, rent)
      if (type === "FOR_SALE" || type === "buy") {
        where.type = PropertyType.FOR_SALE;
      } else if (type === "FOR_RENT" || type === "rent") {
        where.type = PropertyType.FOR_RENT;
      }
    }

    // Short Stay filter - properties with daily rental enabled (< 30 days)
    if (shortStay === true || shortStay === "true") {
      where.enableDailyRental = true;
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

    // Price filter - prices are stored as strings like "฿15,000,000" or "15000000"
    // We need to filter based on numeric comparison
    // For now, we'll use a raw query approach or filter in memory
    // Since price is stored as string, we filter after fetching
    const hasPriceFilter = minPrice || maxPrice;
    const minPriceNum = minPrice ? parseInt(minPrice) * 1000000 : null; // Convert from millions
    const maxPriceNum = maxPrice ? parseInt(maxPrice) * 1000000 : null;

    // Area filter (sqft in database)
    if (minArea) {
      const minAreaNum = parseInt(minArea);
      if (!isNaN(minAreaNum) && minAreaNum > 0) {
        where.sqft = { ...where.sqft, gte: minAreaNum };
      }
    }
    if (maxArea && parseInt(maxArea) < 1000) {
      const maxAreaNum = parseInt(maxArea);
      if (!isNaN(maxAreaNum)) {
        where.sqft = { ...where.sqft, lte: maxAreaNum };
      }
    }

    // Sea View filter
    if (hasSeaView === true || hasSeaView === "true") {
      where.hasSeaView = true;
    }

    // Pet Friendly filter
    if (allowPets === true || allowPets === "true") {
      where.allowPets = true;
    }

    // Ownership Type filter
    if (ownershipType && ownershipType !== "all") {
      where.ownershipType = ownershipType;
    }

    // New Development / Resale filter
    if (isResale === "true") {
      where.isResale = true;
    } else if (isResale === "false") {
      where.isResale = false;
    }

    const fetchedProperties = await withRetry(() =>
      prisma.property.findMany({
        where,
        include: {
          images: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    ) as (Property & { images: PropertyImage[] })[];

    // Filter by price in memory (since price is stored as string)
    if (hasPriceFilter && fetchedProperties.length > 0) {
      return fetchedProperties.filter((property) => {
        // Parse price string to number (remove currency symbols, commas, etc.)
        const priceStr = property.price || "0";
        const priceNum = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
        
        if (minPriceNum && priceNum < minPriceNum) return false;
        if (maxPriceNum && maxPriceNum < 100000000 && priceNum > maxPriceNum) return false;
        
        return true;
      });
    }

    return fetchedProperties;
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
    listingNumber: string | null;
    title: string;
    slug: string;
    location: string;
    price: string;
    status: Status;
    type: PropertyType;
    image: string;
    createdAt: Date;
    isHighlighted: boolean;
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

  // Search filter - title, location, slug, or listing number
  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { location: { contains: search.trim(), mode: "insensitive" } },
      { slug: { contains: search.trim(), mode: "insensitive" } },
      { listingNumber: { contains: search.trim(), mode: "insensitive" } },
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
        listingNumber: true,
        title: true,
        slug: true,
        provinceSlug: true,
        areaSlug: true,
        location: true,
        price: true,
        status: true,
        type: true,
        image: true,
        createdAt: true,
        isHighlighted: true,
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

// Cached dashboard stats - revalidates every 60 seconds
export async function getDashboardStats(userId: string) {
  const getCachedStats = unstable_cache(
    async (uid: string) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalListings, activeListings, newInLast30Days] = await Promise.all([
        prisma.property.count({
          where: { userId: uid },
        }),

        prisma.property.count({
          where: {
            userId: uid,
            status: Status.ACTIVE,
          },
        }),

        prisma.property.count({
          where: {
            userId: uid,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      return {
        totalListings,
        activeListings,
        newInLast30Days,
      };
    },
    [`dashboard-stats-${userId}`],
    { revalidate: 60, tags: ["dashboard-stats"] }
  );

  return getCachedStats(userId);
}

type CreatePropertyArgs = z.infer<typeof propertySchema> & { 
  imageUrl: string;
  imageUrls?: string[]; // Array of 4 images for gallery
  shortDescription?: string;
  descriptionParagraphs?: string[];
  propertyFeatures?: Array<{ title: string; description: string; icon: string }>;
  amenitiesWithIcons?: Array<{ name: string; icon: string }>;
  yearBuilt?: number;
  plotSize?: number; // Land/plot size in m²
  mapUrl?: string;
  // Ownership details (only for FOR_SALE properties)
  ownershipType?: OwnershipType | null;
  isResale?: boolean | null;
  // Daily rental configuration (only for FOR_RENT properties)
  enableDailyRental?: boolean;
  monthlyRentalPrice?: number | null;
  maxGuests?: number | null;
  allowPets?: boolean;
};

export async function createProperty(data: CreatePropertyArgs) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    // Generate unique listing number
    const listingNumber = await generateListingNumber();
    
    // Parse location to get URL slugs for hierarchical URLs
    const { provinceSlug, areaSlug } = parseLocationToSlugs(data.location);
    
    const property = await prisma.property.create({
      data: {
        listingNumber,
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
        plotSize: data.plotSize || null,
        mapUrl: data.mapUrl,
        
        // Ownership details (only relevant for FOR_SALE)
        ownershipType: data.type === "FOR_SALE" ? data.ownershipType : null,
        isResale: data.type === "FOR_SALE" ? data.isResale : null,
        
        // Daily rental configuration (only relevant for FOR_RENT)
        enableDailyRental: data.type === "FOR_RENT" ? (data.enableDailyRental || false) : false,
        monthlyRentalPrice: data.type === "FOR_RENT" && data.enableDailyRental ? data.monthlyRentalPrice : null,
        maxGuests: data.type === "FOR_RENT" && data.enableDailyRental ? data.maxGuests : null,
        allowPets: data.type === "FOR_RENT" && data.enableDailyRental ? (data.allowPets || false) : false,
        
        // Owner/Agency contact details
        ownerName: data.ownerName || null,
        ownerEmail: data.ownerEmail || null,
        ownerPhone: data.ownerPhone || null,
        ownerCountryCode: data.ownerCountryCode || "+66",
        ownerCompany: data.ownerCompany || null,
        ownerNotes: data.ownerNotes || null,
        commissionRate: data.commissionRate || null,
        
        // Property Access Details (for daily rentals)
        defaultCheckInTime: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultCheckInTime || "14:00") : null,
        defaultCheckOutTime: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultCheckOutTime || "11:00") : null,
        defaultPropertyAddress: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultPropertyAddress || null) : null,
        defaultWifiName: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultWifiName || null) : null,
        defaultWifiPassword: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultWifiPassword || null) : null,
        defaultAccessCode: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultAccessCode || null) : null,
        defaultEmergencyContact: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultEmergencyContact || null) : null,
        defaultPropertyInstructions: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultPropertyInstructions || null) : null,
        defaultHouseRules: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultHouseRules || null) : null,
        
        // URL structure slugs for hierarchical URLs
        provinceSlug,
        areaSlug,
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

    // Geocode property location and analyze POIs (async, non-blocking)
    geocodeAndAnalyzeProperty(property.id, data.location, data.mapUrl).catch(err => {
      console.error("Background geocoding/POI analysis error:", err);
    });
    
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create property listing");
  }

  revalidatePath("/dashboard");
  revalidatePath("/properties");
  revalidatePath("/"); // Revalidate home for hero
  revalidateTag("featured-properties");
  revalidateTag("highlighted-property");
}

/**
 * Background geocoding and POI analysis for a property
 * This runs asynchronously after property creation/update
 */
async function geocodeAndAnalyzeProperty(
  propertyId: string, 
  location: string, 
  mapUrl?: string
): Promise<void> {
  try {
    // Step 1: Geocode the location
    const coords = await geocodePropertyLocation(location, mapUrl);
    
    if (coords) {
      // Update property with coordinates
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          district: coords.district,
        },
      });
      
      // Step 2: Analyze POIs (calculate distances and scores)
      await analyzeProperty(propertyId);
      
      console.log(`Property ${propertyId} geocoded and analyzed successfully`);
    } else {
      console.warn(`Could not geocode location for property ${propertyId}: ${location}`);
    }
  } catch (error) {
    console.error(`Error in geocodeAndAnalyzeProperty for ${propertyId}:`, error);
  }
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
  revalidatePath("/"); // Revalidate home for hero
  revalidateTag("featured-properties");
  revalidateTag("highlighted-property");
}

/**
 * Bulk delete multiple properties
 */
export async function bulkDeleteProperties(propertyIds: string[]): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, deletedCount: 0, error: "Unauthorized" };
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  try {
    // For admins, allow deleting any property
    // For agents, only allow deleting their own properties
    const whereClause = userRole === "ADMIN" 
      ? { id: { in: propertyIds } }
      : { id: { in: propertyIds }, userId };

    // Get properties to verify they exist
    const properties = await prisma.property.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (properties.length === 0) {
      return { success: false, deletedCount: 0, error: "No properties found to delete" };
    }

    const idsToDelete = properties.map(p => p.id);

    // Delete related PropertyPoiDistances first (foreign key constraint)
    await prisma.propertyPoiDistance.deleteMany({
      where: { propertyId: { in: idsToDelete } },
    });

    // Delete related PropertyImages
    await prisma.propertyImage.deleteMany({
      where: { propertyId: { in: idsToDelete } },
    });

    // Delete the properties
    const result = await prisma.property.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("featured-properties");
    revalidateTag("highlighted-property");

    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error("Error bulk deleting properties:", error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : "Failed to delete properties" 
    };
  }
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

    // Parse location to get URL slugs for hierarchical URLs
    const { provinceSlug, areaSlug } = parseLocationToSlugs(data.location);

    // Build update data object, handling undefined values properly
    const updateData: any = {
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
      plotSize: data.plotSize !== undefined ? (data.plotSize || null) : undefined,
      mapUrl: data.mapUrl,
      
      // Ownership details (only relevant for FOR_SALE)
      ownershipType: data.type === "FOR_SALE" ? (data.ownershipType || null) : null,
      isResale: data.type === "FOR_SALE" ? (data.isResale !== undefined ? data.isResale : null) : null,
      
      // Daily rental configuration (only relevant for FOR_RENT)
      enableDailyRental: data.type === "FOR_RENT" ? (data.enableDailyRental || false) : false,
      monthlyRentalPrice: data.type === "FOR_RENT" && data.enableDailyRental 
        ? (data.monthlyRentalPrice !== undefined ? data.monthlyRentalPrice : null)
        : null,
      maxGuests: data.type === "FOR_RENT" && data.enableDailyRental 
        ? (data.maxGuests !== undefined ? data.maxGuests : null)
        : null,
      allowPets: data.type === "FOR_RENT" && data.enableDailyRental 
        ? (data.allowPets || false) 
        : false,
      
      // Owner/Agency contact details
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined,
      ownerEmail: data.ownerEmail !== undefined ? (data.ownerEmail || null) : undefined,
      ownerPhone: data.ownerPhone !== undefined ? (data.ownerPhone || null) : undefined,
      ownerCountryCode: data.ownerCountryCode || "+66",
      ownerCompany: data.ownerCompany !== undefined ? (data.ownerCompany || null) : undefined,
      ownerNotes: data.ownerNotes !== undefined ? (data.ownerNotes || null) : undefined,
      commissionRate: data.commissionRate !== undefined ? data.commissionRate : null,
      
      // Property Access Details (for daily rentals) - using snake_case to match Prisma schema
      default_check_in_time: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultCheckInTime || "14:00") : null,
      default_check_out_time: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultCheckOutTime || "11:00") : null,
      default_property_address: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultPropertyAddress || null) : null,
      default_wifi_name: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultWifiName || null) : null,
      default_wifi_password: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultWifiPassword || null) : null,
      default_access_code: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultAccessCode || null) : null,
      default_emergency_contact: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultEmergencyContact || null) : null,
      default_property_instructions: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultPropertyInstructions || null) : null,
      default_house_rules: data.type === "FOR_RENT" && data.enableDailyRental ? (data.defaultHouseRules || null) : null,
      
      // URL structure slugs for hierarchical URLs
      provinceSlug,
      areaSlug,
    };

    // Remove undefined values to avoid Prisma errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await prisma.property.update({
      where: { id: property.id },
      data: updateData,
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

    // Re-geocode if location or mapUrl changed
    const locationChanged = property.location !== data.location;
    const mapUrlChanged = property.mapUrl !== data.mapUrl;
    
    if (locationChanged || mapUrlChanged) {
      // Trigger background geocoding and POI re-analysis
      geocodeAndAnalyzeProperty(id, data.location, data.mapUrl).catch(err => {
        console.error("Background geocoding/POI analysis error:", err);
      });
    }

    revalidatePath("/dashboard");
    revalidatePath(`/listings/${property.slug}`);
    revalidatePath("/"); // Revalidate home for hero
    revalidateTag("featured-properties");
    revalidateTag("highlighted-property");
  } catch (error) {
    console.error("Error updating property:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to update property listing: ${errorMessage}`);
  }
}

// Update image positions for a property
export async function updateImagePositions(propertyId: string, imagePositions: { id: string; position: number }[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    // Use raw SQL for efficient batch position updates
    // This avoids the 2N individual updates that can cause transaction timeouts
    if (imagePositions.length === 0) {
      return { success: true };
    }

    // Build a single UPDATE query using CASE WHEN for efficiency
    // First, set all to temporary negative values to avoid unique constraint conflicts
    const tempUpdateCases = imagePositions
      .map(({ id }, index) => `WHEN id = '${id}' THEN ${-(index + 1000)}`)
      .join(' ');
    const ids = imagePositions.map(({ id }) => `'${id}'`).join(', ');

    // Step 1: Set to temporary negative positions
    await prisma.$executeRawUnsafe(`
      UPDATE "property_image" 
      SET position = CASE ${tempUpdateCases} END 
      WHERE id IN (${ids})
    `);

    // Step 2: Set to final positions
    const finalUpdateCases = imagePositions
      .map(({ id, position }) => `WHEN id = '${id}' THEN ${position}`)
      .join(' ');

    await prisma.$executeRawUnsafe(`
      UPDATE "property_image" 
      SET position = CASE ${finalUpdateCases} END 
      WHERE id IN (${ids})
    `);

    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidateTag("highlighted-property");

    return { success: true };
  } catch (error) {
    console.error("Error updating image positions:", error);
    throw new Error(`Failed to update image positions: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Toggle highlighted status for a property (only one property can be highlighted at a time)
export async function togglePropertyHighlight(propertyId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    // If setting this property as highlighted, unhighlight all others first
    if (!property.isHighlighted) {
      await prisma.property.updateMany({
        where: { isHighlighted: true },
        data: { isHighlighted: false },
      });
    }

    // Toggle the current property
    await prisma.property.update({
      where: { id: propertyId },
      data: { isHighlighted: !property.isHighlighted },
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidateTag("highlighted-property");

    return { success: true, isHighlighted: !property.isHighlighted };
  } catch (error) {
    console.error("Error toggling property highlight:", error);
    // Re-throw with more details for debugging
    throw new Error(`Failed to toggle property highlight: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get related properties based on type, location, and category
 * Used for server-side rendering to improve LCP
 */
export async function getRelatedProperties(
  currentSlug: string,
  propertyType: string,
  location: string,
  category?: string | null,
  limit: number = 3
) {
  try {
    const properties = await prisma.property.findMany({
      where: {
        slug: { not: currentSlug },
        type: propertyType as PropertyType,
        status: 'ACTIVE',
        OR: [
          // Same category (highest priority)
          ...(category ? [{ category: category as PropertyCategory }] : []),
          // Same location area
          { location: { contains: location.split(',')[0]?.trim() || location } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        location: true,
        type: true,
        beds: true,
        baths: true,
        sqft: true,
        provinceSlug: true,
        areaSlug: true,
        image: true, // Fallback image field on property table
        images: {
          select: { url: true },
          orderBy: { position: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return properties.map((p: typeof properties[number]) => {
      // Get original image URL
      const originalImage = p.images[0]?.url || p.image || '';
      
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        location: p.location,
        type: p.type as "FOR_SALE" | "FOR_RENT",
        beds: p.beds,
        baths: p.baths,
        sqft: p.sqft,
        provinceSlug: p.provinceSlug,
        areaSlug: p.areaSlug,
        // Optimized image: 600px width for related property cards
        image: getOptimizedImageUrl(originalImage, { width: 600, quality: 75 }),
        // Blur placeholder for instant perceived loading
        blurDataURL: getOptimizedImageUrl(originalImage, { width: 40, quality: 20, blur: 10 }),
      };
    });
  } catch (error) {
    console.error('Error fetching related properties:', error);
    return [];
  }
}

/**
 * Backfill listing numbers for all properties that don't have one
 * Returns the count of properties updated
 */
export async function backfillListingNumbers(): Promise<{ updated: number; total: number }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized - Admin access required");
  }
  
  // Type assertion for role field added via Better Auth additionalFields
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required");
  }

  try {
    // Find all properties without a listing number
    const propertiesWithoutListingNumber = await prisma.property.findMany({
      where: {
        OR: [
          { listingNumber: null },
          { listingNumber: "" },
        ],
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "asc", // Oldest first to maintain chronological order
      },
    });

    const total = propertiesWithoutListingNumber.length;
    let updated = 0;

    // Update each property with a new listing number
    for (const property of propertiesWithoutListingNumber) {
      const listingNumber = await generateListingNumber();
      
      await prisma.property.update({
        where: { id: property.id },
        data: { listingNumber },
      });
      
      updated++;
    }

    // Revalidate cache
    revalidateTag("properties");
    revalidatePath("/dashboard");
    revalidatePath("/properties");

    return { updated, total };
  } catch (error) {
    console.error("Error backfilling listing numbers:", error);
    throw new Error(`Failed to backfill listing numbers: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get recently sold/rented properties for marketing "Recently Sold" section
 * Returns properties that were marked as SOLD or RENTED in the last 90 days
 */
export async function getRecentlySoldProperties(limit: number = 6) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    const properties = await prisma.property.findMany({
      where: {
        status: { in: [Status.SOLD, Status.RENTED] },
        updatedAt: { gte: ninetyDaysAgo },
      },
      include: {
        images: {
          orderBy: { position: "asc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    return properties;
  } catch (error) {
    console.error("Error fetching recently sold properties:", error);
    return [];
  }
}

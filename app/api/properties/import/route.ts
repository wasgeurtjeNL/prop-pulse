import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { imagekit } from "@/lib/imagekit";
import { slugify } from "@/lib/utils";
import { PropertyType, PropertyCategory, Status } from "@prisma/client";
import { z } from "zod";
import sharp from "sharp";
import { notifyMatchingAlerts } from "@/lib/actions/property-alerts.actions";
import { generateListingNumber } from "@/lib/actions/property.actions";
import { parseLocationToSlugs } from "@/lib/property-url";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { geocodePropertyLocation } from "@/lib/services/poi/geocoding";
import { calculatePropertyPoiDistances, calculatePropertyScores } from "@/lib/services/poi/sync";

// Schema for imported property data
const importSchema = z.object({
  title: z.string().min(5),
  slug: z.string().optional().nullable(), // SEO-optimized slug from scraper
  location: z.string().min(5),
  price: z.string().min(1),
  beds: z.number().int().min(0),
  baths: z.number().min(0),
  sqft: z.number().int().min(0),
  type: z.enum(["FOR_SALE", "FOR_RENT"]),
  category: z.enum(["LUXURY_VILLA", "APARTMENT", "RESIDENTIAL_HOME", "OFFICE_SPACES"]),
  tag: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  content: z.string().min(20),
  contentHtml: z.string().optional().nullable(), // Professional HTML formatted content
  descriptionParagraphs: z.array(z.string()).optional().nullable(), // Array of description paragraphs
  propertyFeatures: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string(),
  })).optional().nullable(), // Property highlights
  amenities: z.array(z.string()).min(1),
  amenitiesWithIcons: z.array(z.object({
    name: z.string(),
    icon: z.string(),
  })).optional().nullable(),
  images: z.array(z.string().url()).min(1),
  garage: z.number().int().optional().nullable(),
  lotSize: z.number().int().optional().nullable(),
  yearBuilt: z.number().int().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  isOptimized: z.boolean().optional().nullable(), // Whether content was AI-optimized
});

// Filter out QR codes and other non-property images
function filterValidImages(images: string[]): string[] {
  return images.filter(url => {
    const lowerUrl = url.toLowerCase();
    // Filter out QR codes
    if (lowerUrl.includes('chart.googleapis.com') || lowerUrl.includes('chart.apis.google.com')) {
      return false;
    }
    if (lowerUrl.includes('qr') && lowerUrl.includes('chart')) {
      return false;
    }
    return true;
  });
}

// Simple API key authentication
// In development, if no API key is set, allow all requests
const API_KEY = process.env.PSM_PHUKET_IMPORT_API_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Generate SEO-optimized alt text for property images based on position and context
 * 
 * Strategy: Real estate photos typically follow a predictable pattern:
 * - Image 1: Exterior/hero shot
 * - Image 2-3: Living room/main areas
 * - Image 4-5: Kitchen/dining
 * - Image 6-7: Bedrooms
 * - Image 8+: Bathrooms, pool, views, amenities
 * 
 * Best practices followed:
 * - Max ~125 characters
 * - No "image of" or "photo of" (screen readers add this)
 * - Include keywords: property type, location, features
 * - Unique per image position
 */
interface AltTextContext {
  title: string;
  location: string;
  beds: number;
  baths: number;
  category: string;
  amenities: string[];
  type: "FOR_SALE" | "FOR_RENT";
}

function generateImageAltText(index: number, context: AltTextContext): string {
  const { title, location, beds, baths, category, amenities, type } = context;
  
  // Extract area from location (first part before comma)
  const area = location.split(',')[0]?.trim() || location;
  
  // Convert category to readable format
  const categoryText = category.replace(/_/g, ' ').toLowerCase();
  
  // Check for specific amenities
  const hasPool = amenities.some(a => a.toLowerCase().includes('pool'));
  const hasGarden = amenities.some(a => a.toLowerCase().includes('garden'));
  const hasSeaView = amenities.some(a => a.toLowerCase().includes('sea view') || a.toLowerCase().includes('ocean'));
  const hasMountainView = amenities.some(a => a.toLowerCase().includes('mountain'));
  
  // Rental or sale context
  const forText = type === "FOR_RENT" ? "for rent" : "for sale";
  
  // Position-based alt text patterns (varied for SEO)
  const position = index + 1;
  
  switch (position) {
    case 1:
      // Hero/exterior shot
      if (hasPool) {
        return `${title} - ${beds} bedroom ${categoryText} with private pool in ${area}`;
      } else if (hasSeaView) {
        return `${title} - ${categoryText} with sea view in ${area}, ${forText}`;
      }
      return `${title} - ${beds} bedroom ${categoryText} ${forText} in ${area}`;
    
    case 2:
      // Living area
      return `Spacious living room in ${title}, modern ${categoryText} in ${area}`;
    
    case 3:
      // Interior/open plan
      if (hasSeaView || hasMountainView) {
        return `Open plan living with stunning views in ${beds} bed ${categoryText}, ${area}`;
      }
      return `Bright interior living space in ${title}, ${area}`;
    
    case 4:
      // Kitchen
      return `Fully equipped modern kitchen in ${title}, ${area}`;
    
    case 5:
      // Dining or second living shot
      return `Dining area in ${beds} bedroom ${categoryText} ${forText} in ${area}`;
    
    case 6:
      // Master bedroom
      return `Comfortable master bedroom in ${title}, ${area}`;
    
    case 7:
      // Second bedroom or bathroom
      if (beds > 1) {
        return `Guest bedroom in ${beds} bed ${categoryText}, ${area}`;
      }
      return `Modern bathroom with quality finishes in ${title}`;
    
    case 8:
      // Bathroom
      return `Stylish bathroom in ${beds} bed ${categoryText} in ${area}`;
    
    case 9:
      // Pool or garden
      if (hasPool) {
        return `Private swimming pool at ${title}, ${area}`;
      } else if (hasGarden) {
        return `Tropical garden at ${title}, ${area}`;
      }
      return `Outdoor area at ${beds} bedroom ${categoryText} in ${area}`;
    
    case 10:
      // View or amenity
      if (hasSeaView) {
        return `Panoramic sea view from ${title} in ${area}`;
      } else if (hasMountainView) {
        return `Mountain view from ${categoryText} in ${area}`;
      }
      return `${title} exterior view, ${categoryText} ${forText} in ${area}`;
    
    default:
      // Additional images (11+)
      const variations = [
        `Interior detail of ${title} in ${area}`,
        `${categoryText} amenities at ${title}, ${area}`,
        `Property feature at ${beds} bed ${categoryText} in ${area}`,
        `${title} - additional view of ${categoryText} in ${area}`,
      ];
      return variations[(position - 11) % variations.length];
  }
}

// Helper function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Download image with retry logic
async function fetchImageWithRetry(
  imageUrl: string, 
  maxRetries: number = 3
): Promise<Buffer | null> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': new URL(imageUrl).origin + '/',
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(imageUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`   ⚠️ Image download failed (attempt ${attempt}/${maxRetries}): HTTP ${response.status}`);
        if (attempt < maxRetries) {
          await delay(1000 * attempt); // Exponential backoff: 1s, 2s, 3s
          continue;
        }
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      
      console.error(`   ⚠️ Image fetch error (attempt ${attempt}/${maxRetries}): ${isAbortError ? 'Timeout' : errorMessage}`);
      
      if (attempt < maxRetries) {
        // Wait before retry with exponential backoff
        await delay(1000 * attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

async function downloadAndUploadImage(
  imageUrl: string, 
  index: number, 
  propertyTitle: string
): Promise<string | null> {
  try {
    // Download the image with retry logic
    const inputBuffer = await fetchImageWithRetry(imageUrl);
    
    if (!inputBuffer) {
      console.error(`   ❌ Failed to download image after retries: ${imageUrl}`);
      return null;
    }
    
    const originalSize = inputBuffer.length;
    
    // Convert to WebP with compression using Sharp
    let outputBuffer: Buffer;
    try {
      outputBuffer = await sharp(inputBuffer)
        .webp({
          quality: 80,           // Good balance between quality and size (1-100)
          effort: 4,             // Compression effort (0-6, higher = smaller file)
          smartSubsample: true,  // Better color subsampling
        })
        .resize({
          width: 1920,           // Max width for property images
          height: 1440,          // Max height (4:3 aspect ratio friendly)
          fit: 'inside',         // Maintain aspect ratio, fit within bounds
          withoutEnlargement: true, // Don't upscale small images
        })
        .toBuffer();
      
      const compressedSize = outputBuffer.length;
      const savings = ((1 - compressedSize / originalSize) * 100).toFixed(0);
      console.log(`   📦 Image ${index + 1}: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB WebP (${savings}% saved)`);
    } catch (sharpError) {
      // If Sharp fails (unsupported format, corrupted image), use original
      console.error(`   ⚠️ Sharp conversion failed for image ${index + 1}, using original:`, sharpError);
      outputBuffer = inputBuffer;
    }
    
    // Generate a clean filename with .webp extension
    const cleanTitle = propertyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    const fileName = `${cleanTitle}-${index + 1}.webp`;
    
    // Upload to ImageKit
    const uploaded = await imagekit.upload({
      file: outputBuffer,
      fileName: fileName,
      folder: "/properties/imported",
    });
    
    return uploaded.url;
  } catch (error) {
    console.error(`Error processing image ${imageUrl}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication: either API key OR logged-in admin/agent user
    const apiKey = request.headers.get('X-API-Key');
    let isAuthenticated = false;

    // Method 1: API Key authentication
    if (API_KEY && apiKey === API_KEY) {
      isAuthenticated = true;
    }

    // Method 2: Session-based authentication (for dashboard users)
    if (!isAuthenticated) {
      try {
        const session = await auth.api.getSession({
          headers: await headers(),
        });
        
        if (session?.user) {
          const allowedRoles = ["AGENT", "ADMIN"];
          if (allowedRoles.includes(session.user.role || "")) {
            isAuthenticated = true;
          }
        }
      } catch {
        // Session check failed, continue to check other auth methods
      }
    }

    // If no valid authentication found
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in or provide a valid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate the incoming data
    const validationResult = importSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // Filter out invalid images (QR codes, etc.)
    data.images = filterValidImages(data.images);
    
    if (data.images.length === 0) {
      return NextResponse.json(
        { error: "No valid images found after filtering" },
        { status: 400 }
      );
    }

    // Use SEO-optimized slug if provided, otherwise generate from title
    let finalSlug = data.slug || slugify(data.title);
    
    // Check if slug already exists
    let existingProperty = await prisma.property.findUnique({
      where: { slug: finalSlug },
    });

    // If SEO slug exists, try adding a unique suffix
    if (existingProperty && data.slug) {
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      finalSlug = `${data.slug}-${randomSuffix}`;
      existingProperty = await prisma.property.findUnique({
        where: { slug: finalSlug },
      });
    }

    if (existingProperty) {
      return NextResponse.json(
        { 
          error: "Property with similar slug already exists", 
          existingSlug: finalSlug 
        },
        { status: 409 }
      );
    }
    
    console.log(`🔗 Using SEO-optimized slug: ${finalSlug}`);

    // Get admin user for property ownership (first admin user)
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found. Please create an admin user first." },
        { status: 500 }
      );
    }

    console.log(`📥 Importing property: ${data.title}`);
    console.log(`📸 Processing ${data.images.length} images...`);

    // Download and upload images to ImageKit with delay between requests
    const uploadedImageUrls: string[] = [];
    for (let i = 0; i < Math.min(data.images.length, 10); i++) {
      console.log(`   Uploading image ${i + 1}/${Math.min(data.images.length, 10)}...`);
      const uploadedUrl = await downloadAndUploadImage(data.images[i], i, data.title);
      if (uploadedUrl) {
        uploadedImageUrls.push(uploadedUrl);
      }
      
      // Add a small delay between downloads to avoid rate limiting (500ms)
      if (i < Math.min(data.images.length, 10) - 1) {
        await delay(500);
      }
    }

    if (uploadedImageUrls.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any images" },
        { status: 500 }
      );
    }

    console.log(`   ✓ Uploaded ${uploadedImageUrls.length} images`);

    // Geocode the property location to get coordinates for POI calculation
    let latitude: number | null = null;
    let longitude: number | null = null;
    let district: string | null = null;
    
    try {
      console.log(`📍 Geocoding location: ${data.location}`);
      const geocodeResult = await geocodePropertyLocation(data.location);
      
      if (geocodeResult?.latitude && geocodeResult?.longitude) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
        district = geocodeResult.district || null;
        console.log(`   ✓ Geocoded: ${latitude}, ${longitude} (${district || 'unknown district'})`);
      } else {
        console.log(`   ⚠️ Could not geocode location: ${data.location}`);
      }
    } catch (error) {
      console.warn("   ⚠️ Geocoding failed, property will be imported without coordinates:", error);
    }

    // Create the property with optimized content
    // Generate unique listing number
    const listingNumber = await generateListingNumber();
    
    // Parse location to get URL slugs for hierarchical URLs
    const { provinceSlug, areaSlug } = parseLocationToSlugs(data.location);
    
    const property = await prisma.property.create({
      data: {
        listingNumber,
        title: data.title,
        slug: finalSlug,
        location: data.location,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: data.sqft,
        type: data.type as PropertyType,
        category: data.category as PropertyCategory,
        tag: data.tag || "",
        status: Status.ACTIVE,
        image: uploadedImageUrls[0], // Main image
        // Use HTML content if available, otherwise plain content
        content: data.contentHtml || data.content,
        shortDescription: data.shortDescription,
        // Store description paragraphs for structured display
        descriptionParagraphs: data.descriptionParagraphs || null,
        // Store property features/highlights
        propertyFeatures: data.propertyFeatures || null,
        amenities: data.amenities,
        amenitiesWithIcons: data.amenitiesWithIcons,
        yearBuilt: data.yearBuilt,
        plotSize: data.lotSize || null, // Land/plot size in m²
        userId: adminUser.id,
        // Add geocoded coordinates
        latitude,
        longitude,
        district,
        // URL structure slugs for hierarchical URLs
        provinceSlug,
        areaSlug,
      },
    });

    // Create PropertyImage entries for gallery with SEO-optimized alt texts
    if (uploadedImageUrls.length > 0) {
      // Prepare context for alt text generation
      const altTextContext: AltTextContext = {
        title: data.title,
        location: data.location,
        beds: data.beds,
        baths: data.baths,
        category: data.category,
        amenities: data.amenities,
        type: data.type,
      };

      const imageData = uploadedImageUrls.map((url, index) => {
        const altText = generateImageAltText(index, altTextContext);
        console.log(`   🏷️ Alt ${index + 1}: "${altText}"`);
        return {
          propertyId: property.id,
          url: url,
          position: index + 1,
          alt: altText,
        };
      });

      await prisma.propertyImage.createMany({
        data: imageData,
      });
    }

    console.log(`✅ Property imported successfully: ${property.slug}`);

    // Calculate POI distances if property has coordinates
    if (latitude && longitude) {
      try {
        console.log(`🏖️ Calculating POI distances for property...`);
        const poiCount = await calculatePropertyPoiDistances(property.id);
        console.log(`   ✓ Calculated distances to ${poiCount} POIs`);
        
        // Calculate location scores (beach, family, convenience, quietness)
        await calculatePropertyScores(property.id);
        console.log(`   ✓ Calculated location scores`);
      } catch (error) {
        console.warn("   ⚠️ Failed to calculate POI distances:", error);
      }
    }

    // Notify matching property alerts (async, don't wait)
    notifyMatchingAlerts({
      id: property.id,
      title: property.title,
      slug: property.slug,
      type: property.type,
      category: property.category,
      location: property.location,
      price: property.price,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
    }).then((result) => {
      if (result.notified > 0) {
        console.log(`📧 Notified ${result.notified} alert subscribers for: ${property.title}`);
      }
    }).catch((err) => {
      console.error("Error notifying alerts:", err);
    });

    return NextResponse.json({
      success: true,
      id: property.id,
      slug: property.slug,
      provinceSlug: property.provinceSlug,
      areaSlug: property.areaSlug,
      imagesUploaded: uploadedImageUrls.length,
      message: `Property "${data.title}" imported successfully`,
    });

  } catch (error) {
    console.error("Property import error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Property Import API is running",
    requiresApiKey: !!API_KEY,
  });
}


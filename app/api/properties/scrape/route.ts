import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { geocodePropertyLocation } from "@/lib/services/poi/geocoding";
import { haversineDistance, formatDistance } from "@/lib/services/poi/distance";
import { PoiCategory } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface for company profile
interface CompanyProfile {
  companyName: string;
  description: string;
  tone: string;
  targetAudience: string;
  usps: string[];
  brandKeywords: string[];
  avoidTopics: string[];
}

// Get company profile from database
async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: { id: "default" }
    });
    
    if (!profile) {
      // Fallback to site settings
      const settings = await prisma.siteSettings.findFirst();
      if (settings) {
        return {
          companyName: settings.siteName || "Real Estate",
          description: settings.companyDescription || "",
          tone: settings.companyTone || "professional",
          targetAudience: settings.targetAudience || "",
          usps: settings.companyUSPs ? JSON.parse(settings.companyUSPs) : [],
          brandKeywords: settings.brandKeywords ? JSON.parse(settings.brandKeywords) : [],
          avoidTopics: settings.avoidTopics ? JSON.parse(settings.avoidTopics) : [],
        };
      }
      return null;
    }
    
    return {
      companyName: profile.companyName || "Real Estate",
      description: profile.description || "",
      tone: profile.tone || "professional",
      targetAudience: profile.targetAudience || "",
      usps: profile.usps ? JSON.parse(profile.usps) : [],
      brandKeywords: profile.brandKeywords ? JSON.parse(profile.brandKeywords) : [],
      avoidTopics: profile.avoidTopics ? JSON.parse(profile.avoidTopics) : [],
    };
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
}

// Mapping of common amenities to Lucide icons
const AMENITY_ICONS: Record<string, string> = {
  "swimming pool": "waves",
  "pool": "waves",
  "garden": "flower2",
  "parking": "car",
  "garage": "car",
  "covered car park": "car",
  "balcony": "door-open",
  "terrace": "sun",
  "terace": "sun",
  "kitchen": "cooking-pot",
  "fully equipped kitchen": "cooking-pot",
  "living room": "sofa",
  "bedroom": "bed-double",
  "bathroom": "bath",
  "air conditioning": "air-vent",
  "central cooling": "air-vent",
  "central heating": "flame",
  "gym": "dumbbell",
  "fitness": "dumbbell",
  "security": "shield",
  "cctv": "cctv",
  "elevator": "arrow-up-down",
  "wifi": "wifi",
  "internet": "wifi",
  "sea view": "waves",
  "mountain view": "mountain",
  "sunset view": "sunset",
  "bbq": "flame",
  "barbecue area": "flame",
  "laundry": "shirt",
  "laundry room": "shirt",
  "fully furnished": "armchair",
  "furnished": "armchair",
  "2 stories": "building-2",
  "3 stories": "building-2",
  "fire alarm": "bell-ring",
  "fire place": "flame",
  "jacuzzi": "waves",
  "home theater": "tv",
  "roof top": "sun",
  "private beach": "umbrella",
  "electric range": "zap",
};

function getIconForAmenity(amenity: string): string {
  const amenityLower = amenity.toLowerCase().trim();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (amenityLower.includes(key) || key.includes(amenityLower)) {
      return icon;
    }
  }
  return "check"; // Default icon
}

// Retry wrapper for fetch with delay
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      console.log(`Fetch attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("Max retries reached");
}

async function scrapeWebpage(url: string): Promise<{ text: string; images: string[] }> {
  const response = await fetchWithRetry(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Connection": "keep-alive",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer, header elements
  $("script, style, nav, footer, header, noscript").remove();

  // Extract text content
  const text = $("body").text().replace(/\s+/g, " ").trim();

  // Extract images
  const images: string[] = [];
  const baseUrl = new URL(url);

  // Get images from img tags (including lazy-loaded images)
  $("img").each((_, el) => {
    // Try multiple attributes for lazy-loaded images
    const src = $(el).attr("src") || 
                $(el).attr("data-src") || 
                $(el).attr("data-lazy-src") || 
                $(el).attr("data-original") ||
                $(el).attr("data-srcset")?.split(",")[0]?.trim()?.split(" ")[0];
    
    if (src && !src.toLowerCase().includes("logo") && !src.toLowerCase().includes("icon") && !src.toLowerCase().includes("avatar")) {
      let absoluteUrl = src;
      if (src.startsWith("//")) {
        absoluteUrl = "https:" + src;
      } else if (src.startsWith("/")) {
        absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${src}`;
      }
      if (!images.includes(absoluteUrl)) {
        images.push(absoluteUrl);
      }
    }
  });

  // Get images from figure elements (often used in galleries)
  $("figure img, .gallery img, .property-gallery img, .fotorama img, .swiper-slide img").each((_, el) => {
    const src = $(el).attr("src") || 
                $(el).attr("data-src") || 
                $(el).attr("data-lazy-src") ||
                $(el).attr("data-full") ||
                $(el).attr("data-large-file");
    
    if (src && !src.toLowerCase().includes("logo") && !src.toLowerCase().includes("icon")) {
      let absoluteUrl = src;
      if (src.startsWith("//")) {
        absoluteUrl = "https:" + src;
      } else if (src.startsWith("/")) {
        absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${src}`;
      }
      if (!images.includes(absoluteUrl)) {
        images.push(absoluteUrl);
      }
    }
  });

  // Get images from links (often used in galleries/lightboxes)
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    // Check for direct image links or WordPress attachment URLs
    if (href && (
      href.includes(".jpg") || 
      href.includes(".jpeg") || 
      href.includes(".png") || 
      href.includes(".webp") ||
      href.includes("/uploads/") ||
      href.includes("wp-content")
    )) {
      let absoluteUrl = href;
      if (href.startsWith("//")) {
        absoluteUrl = "https:" + href;
      } else if (href.startsWith("/")) {
        absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
      }
      // Skip if it's just a thumbnail link
      if (!images.includes(absoluteUrl) && !absoluteUrl.includes("-150x") && !absoluteUrl.includes("-300x")) {
        images.push(absoluteUrl);
      }
    }
  });

  // Get images from srcset attributes (responsive images)
  $("img[srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset");
    if (srcset) {
      // Parse srcset and get the largest image
      const srcsetParts = srcset.split(",").map(s => s.trim());
      for (const part of srcsetParts) {
        const [imgUrl] = part.split(" ");
        if (imgUrl && !imgUrl.includes("-150x") && !imgUrl.includes("-300x")) {
          let absoluteUrl = imgUrl;
          if (imgUrl.startsWith("//")) {
            absoluteUrl = "https:" + imgUrl;
          } else if (imgUrl.startsWith("/")) {
            absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${imgUrl}`;
          }
          if (!images.includes(absoluteUrl)) {
            images.push(absoluteUrl);
          }
        }
      }
    }
  });

  // Get images from data attributes (used by many gallery plugins)
  $("[data-image], [data-bg], [data-background-image]").each((_, el) => {
    const dataImage = $(el).attr("data-image") || 
                      $(el).attr("data-bg") || 
                      $(el).attr("data-background-image");
    if (dataImage && !dataImage.includes("logo") && !dataImage.includes("icon")) {
      let absoluteUrl = dataImage;
      if (dataImage.startsWith("//")) {
        absoluteUrl = "https:" + dataImage;
      } else if (dataImage.startsWith("/")) {
        absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${dataImage}`;
      }
      if (!images.includes(absoluteUrl)) {
        images.push(absoluteUrl);
      }
    }
  });

  // Filter out QR codes, chart images, placeholder images, and duplicates
  const filteredImages = images.filter(img => {
    const lowerImg = img.toLowerCase();
    return !lowerImg.includes("chart.googleapis.com") && 
           !lowerImg.includes("chart.apis.google.com") &&
           !(lowerImg.includes("qr") && lowerImg.includes("chart")) &&
           !lowerImg.includes("placeholder") &&
           !lowerImg.includes("loading") &&
           !lowerImg.includes("spinner") &&
           !lowerImg.includes("blank.gif") &&
           !lowerImg.includes("data:image") && // Skip base64 images
           img.length > 10; // Skip very short URLs
  });

  // Remove duplicates (same image different sizes)
  const uniqueImages: string[] = [];
  const seenBaseNames = new Set<string>();
  
  for (const img of filteredImages) {
    // Extract base filename without size suffixes
    const baseName = img.replace(/-\d+x\d+\./, '.').replace(/\?.*$/, '');
    if (!seenBaseNames.has(baseName)) {
      seenBaseNames.add(baseName);
      uniqueImages.push(img);
    }
  }

  console.log(`🖼️ Found ${uniqueImages.length} unique images`);

  return { text: text.slice(0, 20000), images: uniqueImages.slice(0, 30) };
}

interface PropertyData {
  title: string;
  slug: string; // SEO-optimized slug
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  type: "FOR_SALE" | "FOR_RENT";
  category: "LUXURY_VILLA" | "APARTMENT" | "RESIDENTIAL_HOME" | "OFFICE_SPACES";
  tag: string;
  shortDescription: string;
  content: string;
  contentHtml: string; // Professional HTML formatted content
  descriptionParagraphs: string[]; // Array of description paragraphs
  propertyFeatures: Array<{ title: string; description: string; icon: string }>; // Property highlights
  amenities: string[];
  amenitiesWithIcons: Array<{ name: string; icon: string }>;
  images: string[];
  garage?: number;
  lotSize?: number;
  yearBuilt?: number;
  sourceUrl: string;
  isOptimized: boolean; // Whether content was AI-optimized
  relatedProperties?: Array<{ title: string; slug: string; price: string; image: string }>; // For internal linking
}

// Generate SEO-friendly slug
function generateSeoSlug(propertyData: {
  title: string;
  location: string;
  category: string;
  beds: number;
  amenities?: string[];
}): string {
  // Extract location parts
  const locationParts = propertyData.location.toLowerCase().split(",");
  const area = locationParts[0]?.trim().replace(/[^a-z0-9\s]/g, "").trim() || "";
  
  // Map category to short name
  const categoryMap: Record<string, string> = {
    "LUXURY_VILLA": "villa",
    "APARTMENT": "condo",
    "RESIDENTIAL_HOME": "house",
    "OFFICE_SPACES": "office",
  };
  const propertyType = categoryMap[propertyData.category] || "property";
  
  // Check for key features
  const amenitiesLower = (propertyData.amenities || []).map(a => a.toLowerCase());
  const hasPool = amenitiesLower.some(a => a.includes("pool") || a.includes("swimming"));
  const hasSeaView = amenitiesLower.some(a => a.includes("sea view") || a.includes("ocean view"));
  const hasGarden = amenitiesLower.some(a => a.includes("garden"));
  
  // Build slug parts
  const parts: string[] = [];
  
  // Add key feature if present
  if (hasSeaView) parts.push("sea-view");
  else if (hasPool) parts.push("pool");
  else if (hasGarden) parts.push("garden");
  
  // Add property type
  parts.push(propertyType);
  
  // Add beds
  if (propertyData.beds > 0) {
    parts.push(`${propertyData.beds}bed`);
  }
  
  // Add area (clean it up)
  if (area) {
    // Take first word of area, clean numbers
    const areaClean = area.split(" ").slice(0, 2).join("-").replace(/[0-9]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
    if (areaClean) parts.push(areaClean);
  }
  
  // Join and clean
  let slug = parts.join("-").toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
  
  // Add random suffix for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  slug = `${slug}-${randomSuffix}`;
  
  return slug;
}

// Get related properties for internal linking
async function getRelatedProperties(location: string, category: string, excludeSlug?: string): Promise<Array<{
  title: string;
  slug: string;
  price: string;
  image: string;
  location: string;
}>> {
  try {
    // Extract area from location
    const area = location.split(",")[0]?.trim().toLowerCase() || "";
    
    // Find properties in similar location or same category
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { location: { contains: area, mode: "insensitive" } },
          { category: category as any },
        ],
        slug: excludeSlug ? { not: excludeSlug } : undefined,
        status: "ACTIVE",
      },
      select: {
        title: true,
        slug: true,
        price: true,
        image: true,
        location: true,
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    
    return properties;
  } catch (error) {
    console.error("Error fetching related properties:", error);
    return [];
  }
}

// Get internal links from database - prioritize LandingPages
async function getInternalLinks(isRental: boolean = false): Promise<Array<{
  url: string;
  title: string;
  keywords: string;
  category: string;
}>> {
  try {
    // First, try to get relevant LandingPages
    const landingPages = await prisma.landingPage.findMany({
      where: { 
        published: true,
        OR: [
          { category: isRental ? "service" : "guide" },
          { category: "location" },
        ],
      },
      select: {
        url: true,
        title: true,
        category: true,
      },
      take: 10,
    });

    // Convert to internal link format
    const pageLinks = landingPages.map((p: { url: string; title: string; category: string | null }) => ({
      url: p.url,
      title: p.title,
      keywords: "",
      category: p.category || "page",
    }));

    // If we have enough landing pages, use those
    if (pageLinks.length >= 3) {
      return pageLinks.slice(0, 5);
    }

    // Fallback to InternalLinks if not enough LandingPages
    const links = await prisma.internalLink.findMany({
      where: { isActive: true, pageExists: true },
      select: {
        url: true,
        title: true,
        keywords: true,
        category: true,
      },
      orderBy: { priority: "desc" },
      take: 20,
    });
    
    const internalLinks = links.map((l: { url: string; title: string; keywords: string | null; category: string | null }) => ({
      url: l.url,
      title: l.title,
      keywords: l.keywords || "",
      category: l.category || "page",
    }));

    // Combine: LandingPages first, then InternalLinks
    return [...pageLinks, ...internalLinks].slice(0, 5);
  } catch (error) {
    console.error("Error fetching internal links:", error);
    return [];
  }
}

// Nearby POI interface for AI content
interface NearbyPoi {
  name: string;
  category: string;
  categoryLabel: string;
  distanceMeters: number;
  distanceText: string;
}

// POI category labels for AI content
const POI_CATEGORY_LABELS: Record<string, string> = {
  BEACH: "Beach",
  INTERNATIONAL_SCHOOL: "International School",
  LOCAL_SCHOOL: "School",
  KINDERGARTEN: "Kindergarten",
  HOSPITAL: "Hospital",
  CLINIC: "Medical Clinic",
  SHOPPING_MALL: "Shopping Mall",
  SUPERMARKET: "Supermarket",
  AIRPORT: "Airport",
  GOLF_COURSE: "Golf Course",
  MARINA: "Marina",
  TEMPLE: "Temple",
  GYM: "Fitness Center",
  RESTAURANT: "Restaurant",
  CAFE: "Cafe",
  COWORKING: "Co-working Space",
};

// Find nearby POIs for a given location (for AI content generation)
async function findNearbyPoisForLocation(
  latitude: number,
  longitude: number
): Promise<NearbyPoi[]> {
  try {
    // Calculate bounding box for 5km radius
    const radiusKm = 5;
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    // Priority POI categories for property descriptions
    const priorityCategories: PoiCategory[] = [
      "BEACH",
      "INTERNATIONAL_SCHOOL", 
      "HOSPITAL",
      "SHOPPING_MALL",
      "SUPERMARKET",
      "AIRPORT",
      "GOLF_COURSE",
    ];

    const pois = await prisma.poi.findMany({
      where: {
        isActive: true,
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        },
        category: { in: priorityCategories },
        importance: { gte: 5 }, // Only important POIs
      },
      take: 30,
    });

    // Calculate distances and sort
    const poisWithDistance = pois.map((poi: { name: string; category: string; latitude: number; longitude: number }) => {
      const distanceMeters = haversineDistance(latitude, longitude, poi.latitude, poi.longitude);
      return {
        name: poi.name,
        category: poi.category,
        categoryLabel: POI_CATEGORY_LABELS[poi.category] || poi.category,
        distanceMeters,
        distanceText: formatDistance(distanceMeters),
      };
    }).sort((a: NearbyPoi, b: NearbyPoi) => a.distanceMeters - b.distanceMeters);

    // Select top POI from each category (max 4 total)
    const selected: NearbyPoi[] = [];
    const usedCategories = new Set<string>();
    
    for (const poi of poisWithDistance) {
      if (!usedCategories.has(poi.category) && selected.length < 4) {
        selected.push(poi);
        usedCategories.add(poi.category);
      }
    }

    return selected;
  } catch (error) {
    console.error("Error finding nearby POIs:", error);
    return [];
  }
}

async function extractPropertyData(text: string, images: string[], sourceUrl: string): Promise<PropertyData> {
  const prompt = `You are a real estate data extraction expert. Extract property information from the following webpage content and return it as a structured JSON object.

The property must match this exact schema:

{
    "title": "Property title (string, required)",
    "location": "Full address or location (string, required)",
    "price": "Price with currency symbol (string, see price rules below)",
    "beds": "Number of bedrooms (integer)",
    "baths": "Number of bathrooms (number, can be 2.5 for half baths)",
    "sqft": "Size in square meters (integer) - convert from sq ft if needed",
    "type": "FOR_SALE or FOR_RENT (based on listing type)",
    "category": "One of: LUXURY_VILLA, APARTMENT, RESIDENTIAL_HOME, OFFICE_SPACES",
    "tag": "Optional tag like 'Featured', 'New', 'Hot Deal' or empty string",
    "shortDescription": "1-2 sentence summary of the property (max 200 chars)",
    "content": "Full property description (combine all description paragraphs)",
    "amenities": ["Array of amenity names as strings"],
    "garage": "Number of garage/parking spaces (integer, optional)",
    "lotSize": "Lot size in sq meters (integer, optional)",
    "yearBuilt": "Year built (integer, optional, if mentioned)"
}

PRICE EXTRACTION RULES (VERY IMPORTANT):
1. For RENTALS (For Rent listings):
   - Look for prices with "Month", "Monthly", "/mo", "per month", "฿" followed by numbers
   - Thai Baht rentals: "฿50,000" or "50,000฿" or "50,000 THB" means 50,000 THB/month
   - Format rental prices as: "฿XX,XXX/month" (e.g., "฿50,000/month")
   - If price shows "200,000฿" on a rental = "฿200,000/month"
2. For SALES (For Sale listings):
   - Format as "฿XX,XXX,XXX" (e.g., "฿34,800,000")
3. ALWAYS include the ฿ symbol for Thai properties
4. The number shown on the page IS the price - don't convert or modify it

TYPE DETECTION RULES:
1. If the listing says "For Sale" -> type = "FOR_SALE"
2. If the listing says "For Rent" -> type = "FOR_RENT"
3. If price mentions "month", "monthly", "/mo" -> type = "FOR_RENT"

CATEGORY RULES:
- Villas, large houses with pool -> LUXURY_VILLA
- Condos, apartments, flats -> APARTMENT
- Regular houses, townhouses -> RESIDENTIAL_HOME
- Offices, commercial -> OFFICE_SPACES

OTHER RULES:
- Convert any imperial units to metric (sqft to sqm: divide by 10.764)
- Extract ALL amenities/features mentioned
- Make the shortDescription compelling for SEO

Source URL: ${sourceUrl}

WEBPAGE CONTENT:
${text}

Return ONLY the JSON object, no markdown, no explanation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a precise data extraction assistant that outputs only valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });

  let resultText = response.choices[0].message.content?.trim() || "{}";

  // Clean up markdown code blocks if present
  if (resultText.startsWith("```")) {
    resultText = resultText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const propertyData = JSON.parse(resultText);

  // Add images
  propertyData.images = images.slice(0, 10);

  // Add amenities with icons
  if (propertyData.amenities && Array.isArray(propertyData.amenities)) {
    propertyData.amenitiesWithIcons = propertyData.amenities.map((amenity: string) => ({
      name: amenity,
      icon: getIconForAmenity(amenity),
    }));
  }

  // Add source URL
  propertyData.sourceUrl = sourceUrl;
  propertyData.isOptimized = false;

  // Generate SEO-optimized slug
  propertyData.slug = generateSeoSlug({
    title: propertyData.title,
    location: propertyData.location,
    category: propertyData.category,
    beds: propertyData.beds,
    amenities: propertyData.amenities,
  });

  return propertyData as PropertyData;
}

// Optimize and rewrite content with company branding - SALES FOCUSED
async function optimizePropertyContent(
  propertyData: PropertyData, 
  companyProfile: CompanyProfile | null,
  isRental: boolean = false
): Promise<PropertyData> {
  const companyContext = companyProfile ? `
COMPANY CONTEXT:
- Company: ${companyProfile.companyName}
- Description: ${companyProfile.description}
- Tone: ${companyProfile.tone}
- Target Audience: ${companyProfile.targetAudience}
- USPs: ${companyProfile.usps.join(", ")}
- Brand Keywords to include: ${companyProfile.brandKeywords.join(", ")}
- Topics to AVOID: ${companyProfile.avoidTopics.join(", ")}
` : "";

  // Extract location info for lifestyle content
  const locationParts = propertyData.location.split(",");
  const area = locationParts[0]?.trim() || "";
  const region = locationParts.length > 1 ? locationParts[1]?.trim() : "";

  // Geocode location and find nearby POIs
  let nearbyPois: NearbyPoi[] = [];
  let poiContext = "";
  
  try {
    console.log(`📍 Geocoding location: ${propertyData.location}`);
    const geocodeResult = await geocodePropertyLocation(propertyData.location);
    
    if (geocodeResult?.latitude && geocodeResult?.longitude) {
      console.log(`✅ Geocoded: ${geocodeResult.latitude}, ${geocodeResult.longitude} (${geocodeResult.district || 'unknown district'})`);
      
      nearbyPois = await findNearbyPoisForLocation(
        geocodeResult.latitude, 
        geocodeResult.longitude
      );
      
      if (nearbyPois.length > 0) {
        console.log(`🏖️ Found ${nearbyPois.length} nearby POIs for AI content`);
        
        // Build detailed POI descriptions with specific distances
        const poiDescriptions = nearbyPois.map(poi => {
          const distanceNum = poi.distanceMeters;
          let distanceDescription = "";
          
          if (distanceNum < 500) {
            distanceDescription = `just ${poi.distanceText}`;
          } else if (distanceNum < 1000) {
            distanceDescription = `only ${poi.distanceText} (about ${Math.round(distanceNum / 83)} minutes walk)`;
          } else if (distanceNum < 2000) {
            distanceDescription = `${poi.distanceText} (a short ${Math.round(distanceNum / 500)} minute drive)`;
          } else {
            distanceDescription = `${poi.distanceText} (approximately ${Math.round(distanceNum / 500)} minutes by car)`;
          }
          
          return `- ${poi.name} (${poi.categoryLabel}): ${distanceDescription}`;
        }).join('\n');

        poiContext = `
NEARBY POINTS OF INTEREST - MUST INCLUDE WITH SPECIFIC DISTANCES:
${poiDescriptions}

CRITICAL INSTRUCTIONS FOR POI INTEGRATION:
1. You MUST mention these POIs with their EXACT distances in the "Location & Lifestyle" section
2. Use natural, conversational language like:
   - "Located just 800m from the pristine Nai Harn Beach..."
   - "Families will appreciate British International School, only 2.3km away..."
   - "For healthcare needs, Bangkok Hospital Phuket is a convenient 4.5km drive..."
   - "Daily shopping is easy with Villa Market just 1.2km from your doorstep..."
3. Group related POIs: beaches together, schools/hospitals for families, shopping for convenience
4. The DISTANCES are REAL and ACCURATE - always include them to build trust with buyers/renters
5. For beaches within 1km: emphasize "beachfront living" or "steps from the beach"
6. For schools/hospitals: reassure families about safety and accessibility
`;
      }
    } else {
      console.log(`⚠️ Could not geocode location: ${propertyData.location}`);
    }
  } catch (error) {
    console.warn("Could not geocode location for POI lookup:", error);
  }

  // Different prompts for rental vs sale
  const rentalContext = isRental ? `
RENTAL-SPECIFIC FOCUS:
- Emphasize FLEXIBILITY and convenience of renting
- Highlight monthly affordability vs large purchase
- Focus on lifestyle benefits: move-in ready, no maintenance hassles
- Target: expats, digital nomads, relocating professionals, vacationers
- Mention lease flexibility (short-term, long-term options if applicable)
- Emphasize location convenience for daily life
- Include nearby amenities, transportation, schools, shops
- Make the reader imagine their new life starting immediately
` : "";

  const propertyAction = isRental ? "RENT" : "SELL";
  const priceType = isRental ? "monthly rent" : "purchase price";
  const targetBuyer = isRental 
    ? "renters, expats, digital nomads, professionals relocating to the area"
    : "buyers and investors";

  const prompt = `You are an ELITE real estate copywriter who specializes in ${propertyAction === "RENT" ? "RENTING OUT" : "SELLING"} properties through compelling, emotional, and persuasive content. Your writing makes readers WANT to ${isRental ? "rent this home" : "buy"}.

${companyContext}
${rentalContext}
${poiContext}

PROPERTY TO ${propertyAction}:
- Title: ${propertyData.title}
- Location: ${propertyData.location}
- Area/Neighborhood: ${area}
- Region: ${region}
- ${isRental ? "Monthly Rent" : "Price"}: ${propertyData.price}
- Bedrooms: ${propertyData.beds} | Bathrooms: ${propertyData.baths} | Living Space: ${propertyData.sqft}m²
- Type: ${propertyData.type === "FOR_SALE" ? "For Sale" : "For Rent"}
- Category: ${propertyData.category}
- Original Description: ${propertyData.content}
- Amenities & Features: ${propertyData.amenities.join(", ")}
${propertyData.garage ? `- Parking: ${propertyData.garage} car(s)` : ""}
${propertyData.lotSize ? `- Land Size: ${propertyData.lotSize}m²` : ""}
${propertyData.yearBuilt ? `- Year Built: ${propertyData.yearBuilt}` : ""}

YOUR MISSION - Create ${isRental ? "RENTAL" : "SALES"}-FOCUSED content that:

1. **HOOKS the reader** immediately with an emotional opening
2. **PAINTS A PICTURE** of the lifestyle this property offers
3. **HIGHLIGHTS THE LOCATION** - What's nearby? Beaches, restaurants, schools, shopping, nightlife? What makes this area special?
4. **SHOWCASES EVERY FEATURE** - Don't just list amenities, SELL them. A pool isn't just a pool - it's morning swims with sunrise views.
5. **CREATES URGENCY** - ${isRental ? "Popular rentals get snapped up quickly" : "Properties like this don't stay on the market long"}
6. **SPEAKS TO THE ${isRental ? "RENTER'S" : "BUYER'S"} DREAMS** - ${isRental ? "Flexibility, convenience, lifestyle without commitment" : "Are they looking for a family home? Investment? Retirement paradise?"}
7. **ENDS WITH A STRONG CALL-TO-ACTION** - Make them want to schedule a viewing NOW

${isRental ? `
RENTAL-SPECIFIC MESSAGING:
- Emphasize the AFFORDABLE monthly cost vs buying
- Highlight FLEXIBILITY - no long-term commitment required
- Focus on MOVE-IN READY convenience
- Target expats, digital nomads, relocating professionals
- Mention lease options (monthly, yearly if known)
- Emphasize included utilities/services if applicable
- Make them imagine starting their new life immediately
` : ""}

WRITING STYLE:
- Write like a top real estate agent who LOVES this property
- Use sensory language: "imagine waking up to...", "picture yourself...", "feel the..."
- Be specific about features - don't just say "beautiful view" - describe WHAT view
- For Phuket/Thailand: emphasize tropical living, expat lifestyle, ${isRental ? "convenient island living" : "investment potential"}, beaches, island life
- Create FOMO (Fear Of Missing Out) - this is a rare opportunity
- Sound enthusiastic but professional - never salesy or pushy

STRUCTURE YOUR RESPONSE:
{
  "shortDescription": "An IRRESISTIBLE 1-2 sentence hook that makes ${isRental ? "renters" : "buyers"} click. Include the #1 selling point. Max 200 chars.",
  
  "contentHtml": "Professional HTML ${isRental ? "rental" : "sales"} copy with this structure:
    
    <h2>[Compelling Property Headline - Not just the name]</h2>
    <p>[HOOK - Emotional opening that paints the dream. What lifestyle does this ${isRental ? "rental" : "property"} offer?]</p>
    
    <h3>What Makes This ${isRental ? "Rental" : "Property"} Special</h3>
    <p>[Detailed paragraph about the property's standout features. Be specific and sensory.]</p>
    <ul>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
    </ul>
    
    <h3>Location & Lifestyle</h3>
    <p>[IMPORTANT: If POI data is provided above, you MUST include the specific distances here. Example: 'Just 800m from Nai Harn Beach, this property offers...' or 'Families will love the proximity to British International School (2.3km) and Bangkok Hospital (4.5km).' Include at least 2-3 POIs with their exact distances. Also mention: What's the area like? Dining, activities? Expat community, safety, infrastructure.]</p>
    
    ${isRental ? `<h3>Why Rent Here?</h3>
    <p>[Emphasize flexibility, affordability, no maintenance hassles, included services, ideal for expats/digital nomads/professionals.]</p>` : `<h3>Investment Opportunity</h3>
    <p>[Why is this a smart purchase? Rental potential? Growing area? Value for money? Future development?]</p>`}
    
    <p><strong>Ready to ${isRental ? "move in" : "make this your new home"}?</strong> <em>${isRental ? "This rental won't last long" : "Properties like this are rare"} in ${area}. Contact us today for a private viewing${isRental ? " or to secure your lease" : " before it's gone"}.</em></p>",
    
  "descriptionParagraphs": ["Same content as HTML but in plain text format, 4-5 paragraphs"],
  
  "propertyFeatures": [
    {"title": "[Unique Selling Point 1]", "description": "[Benefit-focused, emotional description]", "icon": "[relevant-icon]"},
    {"title": "[Unique Selling Point 2]", "description": "[Benefit-focused, emotional description]", "icon": "[relevant-icon]"},
    {"title": "[Unique Selling Point 3]", "description": "[Benefit-focused, emotional description]", "icon": "[relevant-icon]"}
  ]
}

ICON OPTIONS for propertyFeatures:
- home, key, shield (security), sun (outdoor/climate), waves (pool/beach), mountain (view), 
- car (parking), tree (garden), sparkles (luxury), crown (premium), star (highlight), 
- heart (lifestyle), map-pin (location), palm-tree (tropical), umbrella-beach

CRITICAL RULES:
- ALWAYS write in ENGLISH - this is mandatory
- Write 100% UNIQUE content - NO copying from original
- Make it SCANNABLE with clear headers and bullet points
- If POI data is provided: ALWAYS mention at least 2-3 nearby places WITH their exact distances (e.g., "800m", "2.3km", "5 minute drive")
- Every sentence should make the reader more interested
- Focus on BENEFITS, not just features
- Include specific details about ${area} and ${region} lifestyle
- Write for international ${isRental ? "renters and expats" : "buyers and investors"}
- Create an emotional connection to the property
- DO NOT use any emoji characters - use plain text only
- Headers should be clean text without symbols like emojis
${isRental ? "- Emphasize the MONTHLY price and flexibility of renting" : ""}

Return ONLY valid JSON, no markdown code blocks.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are an elite real estate copywriter who has ${isRental ? "successfully rented out thousands of premium properties to expats and professionals" : "sold over $500 million in luxury properties"}. Your writing is legendary for making ${isRental ? "renters" : "buyers"} fall in love with properties before they even visit. You understand that people don't ${isRental ? "rent" : "buy"} properties - they ${isRental ? "choose" : "buy"} LIFESTYLES, DREAMS, and ${isRental ? "EXPERIENCES" : "FUTURES"}.

IMPORTANT: You ALWAYS write in ENGLISH, regardless of the source language.
${isRental ? "\nRENTAL FOCUS: Emphasize flexibility, affordability, move-in ready convenience, and lifestyle benefits." : ""}

Your writing style:
- Emotionally compelling but professional
- Specific and sensory - you paint vivid pictures
- Benefit-focused - every feature becomes a lifestyle benefit
- Creates urgency without being pushy
- Speaks to both emotional desires AND practical concerns
${isRental ? "- Highlights the ease and flexibility of renting vs buying" : ""}

You ALWAYS output valid JSON with no markdown formatting.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8, // Higher for more creative, compelling copy
      max_tokens: 3500, // More tokens for richer content
    });

    let resultText = response.choices[0].message.content?.trim() || "{}";

    // Clean up markdown code blocks if present
    if (resultText.startsWith("```")) {
      resultText = resultText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const optimizedContent = JSON.parse(resultText);

    // Get related properties for internal linking
    const relatedProperties = await getRelatedProperties(
      propertyData.location, 
      propertyData.category,
      propertyData.slug
    );

    // Get internal links from database (prioritize rental or sale content)
    const internalLinks = await getInternalLinks(isRental);

    // Related properties will be loaded dynamically in the frontend component
    // to prevent 404s when properties are deleted
    let contentHtml = optimizedContent.contentHtml || "";
    
    // Only add static page links (these are stable and won't cause 404s)
    if (internalLinks.length > 0) {
      const relevantPageLinks = internalLinks
        .filter(l => l.category === "page" || l.category === "service")
        .slice(0, 3);
      
      if (relevantPageLinks.length > 0) {
        const pageLinksHtml = relevantPageLinks.map(l => 
          `<a href="${l.url}" class="text-primary hover:underline">${l.title}</a>`
        ).join(" | ");
        
        contentHtml += `
<p class="mt-4"><strong>Learn More:</strong> ${pageLinksHtml}</p>`;
      }
    }

    // Merge optimized content with original data
    return {
      ...propertyData,
      shortDescription: optimizedContent.shortDescription || propertyData.shortDescription,
      content: optimizedContent.descriptionParagraphs?.join("\n\n") || propertyData.content,
      contentHtml: contentHtml,
      descriptionParagraphs: optimizedContent.descriptionParagraphs || [],
      propertyFeatures: optimizedContent.propertyFeatures || [],
      relatedProperties: relatedProperties.slice(0, 6),
      isOptimized: true,
    };
  } catch (error) {
    console.error("Content optimization error:", error);
    // Return original data if optimization fails
    return {
      ...propertyData,
      contentHtml: `<p>${propertyData.content}</p>`,
      descriptionParagraphs: [propertyData.content],
      propertyFeatures: [],
      isOptimized: false,
    };
  }
}

function validatePropertyData(data: PropertyData): string[] {
  const issues: string[] = [];
  const requiredFields = ["title", "location", "price", "beds", "baths", "sqft", "type", "category", "content"];

  for (const field of requiredFields) {
    if (!data[field as keyof PropertyData]) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  if (data.type && !["FOR_SALE", "FOR_RENT"].includes(data.type)) {
    issues.push(`Invalid type: ${data.type}. Must be FOR_SALE or FOR_RENT`);
  }

  if (data.category && !["LUXURY_VILLA", "APARTMENT", "RESIDENTIAL_HOME", "OFFICE_SPACES"].includes(data.category)) {
    issues.push(`Invalid category: ${data.category}`);
  }

  if (!data.amenities || data.amenities.length < 1) {
    issues.push("At least one amenity is required");
  }

  if (!data.images || data.images.length < 1) {
    issues.push("At least one image is required");
  }

  return issues;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, optimize = true, isRental = false, forceType } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    console.log(`🔍 Scraping property from: ${url}`);

    // Step 1: Get company profile for content optimization
    let companyProfile: CompanyProfile | null = null;
    if (optimize) {
      companyProfile = await getCompanyProfile();
      console.log(`📋 Company profile loaded: ${companyProfile?.companyName || "Not configured"}`);
    }

    // Step 2: Scrape the webpage
    const { text, images } = await scrapeWebpage(url);
    console.log(`📄 Extracted ${text.length} characters and ${images.length} images`);

    // Step 3: Extract data with AI
    let propertyData = await extractPropertyData(text, images, url);
    console.log(`✅ Extracted property: ${propertyData.title}`);

    // Override type if forceType is specified or isRental is true
    if (forceType) {
      propertyData.type = forceType;
    } else if (isRental) {
      propertyData.type = "FOR_RENT";
    }

    // Step 4: Optimize content with company branding (if enabled)
    if (optimize) {
      console.log(`✨ Optimizing content with AI... (isRental: ${isRental})`);
      propertyData = await optimizePropertyContent(propertyData, companyProfile, isRental);
      console.log(`✅ Content optimized: ${propertyData.isOptimized ? "Success" : "Fallback"}`);
    }

    // Step 5: Validate
    const issues = validatePropertyData(propertyData);

    return NextResponse.json({
      success: true,
      data: propertyData,
      validation: {
        isValid: issues.length === 0,
        issues,
      },
      stats: {
        textLength: text.length,
        imagesFound: images.length,
        contentOptimized: propertyData.isOptimized,
        companyProfileUsed: !!companyProfile,
      },
    });

  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Failed to scrape property", details: String(error) },
      { status: 500 }
    );
  }
}


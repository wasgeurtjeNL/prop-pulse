/**
 * WhatsApp Property Content Generator
 * 
 * Generates professional property listings using:
 * - Detected features from AI image analysis
 * - POI data from location
 * - Company profile and brand guidelines
 */

import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { DetectedPropertyFeatures, PoiScoresData, NearbyPoiInfo } from './types';
import { 
  calculatePropertyPoiDistances, 
  calculatePropertyScores,
  analyzePropertySeaView,
} from '@/lib/services/poi/sync';
import { geocodePropertyLocation } from '@/lib/services/poi/geocoding';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// MAIN CONTENT GENERATION
// ============================================

export interface GeneratedContent {
  title: string;
  shortDescription: string;
  content: string;
  contentHtml: string;
  propertyFeatures: Array<{ title: string; description: string; icon: string }>;
  suggestedPrice?: string;
}

/**
 * Generate complete property listing content
 */
export async function generatePropertyContent(
  features: DetectedPropertyFeatures,
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
  },
  images: string[]
): Promise<GeneratedContent> {
  // Get company profile for brand voice
  const companyProfile = await getCompanyProfile();
  
  // Get nearby POIs for location context
  const nearbyPois = await getNearbyPois(location.latitude, location.longitude);
  
  // Build POI context for content generation
  const poiContext = buildPoiContext(nearbyPois);
  
  // Generate content with AI
  const generatedContent = await generateWithAI(
    features,
    location,
    poiContext,
    companyProfile
  );
  
  return generatedContent;
}

/**
 * Calculate POI scores for a location
 */
export async function calculateLocationScores(
  latitude: number,
  longitude: number
): Promise<PoiScoresData> {
  // Get nearby POIs
  const nearbyPois = await getNearbyPois(latitude, longitude);
  
  // Calculate scores based on POI proximity
  const beachPois = nearbyPois.filter(p => p.category === 'BEACH');
  const schoolPois = nearbyPois.filter(p => ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL'].includes(p.category));
  const hospitalPois = nearbyPois.filter(p => ['HOSPITAL', 'CLINIC'].includes(p.category));
  const conveniencePois = nearbyPois.filter(p => 
    ['SUPERMARKET', 'SHOPPING_MALL', 'CONVENIENCE_STORE', 'RESTAURANT'].includes(p.category)
  );
  const noisePois = nearbyPois.filter(p => ['NIGHTCLUB', 'BAR'].includes(p.category));

  // Beach Score (0-100)
  const nearestBeach = beachPois.length > 0 ? Math.min(...beachPois.map(p => p.distanceMeters)) : Infinity;
  const beachScore = nearestBeach > 5000 ? 0 : 
    nearestBeach < 500 ? 100 :
    Math.round(100 - ((nearestBeach - 500) / 4500) * 100);

  // Family Score (0-100)
  const nearestSchool = schoolPois.length > 0 ? Math.min(...schoolPois.map(p => p.distanceMeters)) : Infinity;
  const nearestHospital = hospitalPois.length > 0 ? Math.min(...hospitalPois.map(p => p.distanceMeters)) : Infinity;
  const schoolScore = nearestSchool > 5000 ? 0 : nearestSchool < 1000 ? 100 : Math.round(100 - ((nearestSchool - 1000) / 4000) * 100);
  const hospitalScore = nearestHospital > 10000 ? 0 : nearestHospital < 2000 ? 100 : Math.round(100 - ((nearestHospital - 2000) / 8000) * 100);
  const familyScore = Math.round((schoolScore + hospitalScore) / 2);

  // Convenience Score (0-100)
  const nearestConvenience = conveniencePois.length > 0 ? Math.min(...conveniencePois.map(p => p.distanceMeters)) : Infinity;
  const proximityScore = nearestConvenience > 3000 ? 0 : nearestConvenience < 500 ? 100 : Math.round(100 - ((nearestConvenience - 500) / 2500) * 100);
  const densityScore = Math.min(100, conveniencePois.filter(p => p.distanceMeters < 2000).length * 10);
  const convenienceScore = Math.round((proximityScore + densityScore) / 2);

  // Quietness Score (0-100)
  const nearestNoise = noisePois.length > 0 ? Math.min(...noisePois.map(p => p.distanceMeters)) : Infinity;
  let quietnessScore = 100;
  if (nearestNoise < 200) quietnessScore = 20;
  else if (nearestNoise < 500) quietnessScore = 50;
  else if (nearestNoise < 1000) quietnessScore = 70;
  else if (nearestNoise < 2000) quietnessScore = 85;

  return {
    beachScore,
    familyScore,
    convenienceScore,
    quietnessScore,
    nearbyPois: nearbyPois.slice(0, 10),
  };
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ address: string; district?: string }> {
  try {
    // Use OpenStreetMap Nominatim for reverse geocoding
    // Request English language to get "Rawai" instead of "ราไวย์"
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`,
      {
        headers: {
          'User-Agent': 'PSMPhuket/1.0 (contact@psmphuket.com)',
          'Accept-Language': 'en',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    // Extract address parts
    const address = data.display_name || `${latitude}, ${longitude}`;
    const district = data.address?.suburb || 
                    data.address?.neighbourhood || 
                    data.address?.village || 
                    data.address?.town ||
                    extractDistrictFromAddress(address);
    
    return { address, district };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return { address: `${latitude}, ${longitude}` };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get nearby POIs from database
 */
async function getNearbyPois(
  latitude: number,
  longitude: number,
  maxDistanceMeters: number = 5000
): Promise<NearbyPoiInfo[]> {
  // Calculate bounding box
  const latDelta = maxDistanceMeters / 111000;
  const lngDelta = maxDistanceMeters / (111000 * Math.cos(latitude * Math.PI / 180));

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
    },
    take: 50,
    orderBy: { importance: 'desc' },
  });

  // Calculate distances and format
  return pois.map(poi => {
    const distanceMeters = haversineDistance(latitude, longitude, poi.latitude, poi.longitude);
    return {
      name: poi.name,
      category: poi.category,
      distanceMeters,
      distanceFormatted: formatDistance(distanceMeters),
    };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

/**
 * Format distance for display
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Build POI context for content generation
 */
function buildPoiContext(pois: NearbyPoiInfo[]): string {
  if (pois.length === 0) {
    return 'Various amenities nearby';
  }

  // Group by category
  const categories = new Map<string, string[]>();
  for (const poi of pois) {
    const cat = poi.category;
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)?.push(`${poi.name} (${poi.distanceFormatted})`);
  }

  // Format output
  const lines: string[] = [];
  for (const [category, poiList] of categories) {
    const label = category.replace(/_/g, ' ').toLowerCase();
    lines.push(`${label}: ${poiList.slice(0, 3).join(', ')}`);
  }

  return lines.join('\n') || 'Various amenities nearby';
}

/**
 * Get company profile for brand voice
 */
async function getCompanyProfile(): Promise<{
  companyName: string;
  tone: string;
  targetAudience: string;
  usps: string[];
} | null> {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: { id: 'default' },
    });
    
    if (!profile) return null;
    
    return {
      companyName: profile.companyName || 'PSM Phuket',
      tone: profile.tone || 'professional',
      targetAudience: profile.targetAudience || 'International property investors and buyers',
      usps: profile.usps ? JSON.parse(profile.usps) : [],
    };
  } catch {
    return null;
  }
}

/**
 * Generate content with AI
 */
async function generateWithAI(
  features: DetectedPropertyFeatures,
  location: { latitude: number; longitude: number; address?: string; district?: string },
  poiContext: string,
  companyProfile: { companyName: string; tone: string; targetAudience: string; usps: string[] } | null
): Promise<GeneratedContent> {
  const systemPrompt = `You are an expert real estate copywriter creating compelling property listings.

Your writing style:
- ${companyProfile?.tone || 'Professional'} and engaging
- Emotionally compelling but factual
- Benefit-focused - every feature becomes a lifestyle benefit
- Uses specific distances to nearby amenities to build trust
- Targets: ${companyProfile?.targetAudience || 'International property buyers'}

IMPORTANT: You ALWAYS write in ENGLISH.

Return a JSON object with:
{
  "title": "Compelling property title (max 80 chars)",
  "shortDescription": "1-2 sentence summary highlighting key features (max 200 chars)",
  "content": "3-4 paragraphs of compelling description text (plain text, no HTML)",
  "contentHtml": "Same content but with proper HTML formatting (<p>, <ul>, <strong>, etc.)",
  "propertyFeatures": [
    { "title": "Feature Name", "description": "Brief benefit description", "icon": "mdi:icon-name" }
  ] (4-6 features),
  "suggestedPrice": "Suggested price range based on property type and location (e.g., '฿15,000,000 - ฿20,000,000' or null if unsure)"
}`;

  const userPrompt = `Create a compelling property listing for:

PROPERTY DETAILS:
- Type: ${features.propertyType}
- Category: ${features.category}
- Bedrooms: ${features.beds}
- Bathrooms: ${features.baths}
- Style: ${features.style}
- Condition: ${features.condition}
- Amenities: ${features.amenities.join(', ')}
- Has Pool: ${features.hasPool ? 'Yes' : 'No'}
- Has Garage: ${features.hasGarage ? 'Yes' : 'No'}
- Has Garden: ${features.hasGarden ? 'Yes' : 'No'}
- Has Sea View: ${features.hasSeaView ? 'Yes' : 'No'}
- Key Highlights: ${features.highlights.join(', ')}

LOCATION:
- Address: ${location.address || 'Phuket, Thailand'}
- District: ${location.district || 'Phuket'}
- Coordinates: ${location.latitude}, ${location.longitude}

NEARBY AMENITIES (with exact distances):
${poiContext}

Create engaging content that:
1. Opens with a compelling hook about the lifestyle/location
2. Highlights the best features with specific benefits
3. Mentions nearby amenities with their distances
4. Ends with a call to action

Return only valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    let resultText = response.choices[0].message.content?.trim() || '{}';
    
    if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(resultText);
    
    return {
      title: result.title || features.suggestedTitle,
      shortDescription: result.shortDescription || `Beautiful ${features.propertyType.toLowerCase().replace('_', ' ')} in ${location.district || 'Phuket'}`,
      content: result.content || '',
      contentHtml: result.contentHtml || `<p>${result.content || ''}</p>`,
      propertyFeatures: result.propertyFeatures || [],
      suggestedPrice: result.suggestedPrice,
    };
  } catch (error) {
    console.error('Content generation error:', error);
    
    // Return basic content on error
    return {
      title: features.suggestedTitle,
      shortDescription: `${features.beds} bedroom ${features.propertyType.toLowerCase().replace('_', ' ')} in ${location.district || 'Phuket'}`,
      content: `This ${features.style} ${features.propertyType.toLowerCase().replace('_', ' ')} features ${features.beds} bedrooms and ${features.baths} bathrooms. ${features.hasPool ? 'Includes a private swimming pool. ' : ''}Located in ${location.district || 'Phuket'}.`,
      contentHtml: `<p>This ${features.style} ${features.propertyType.toLowerCase().replace('_', ' ')} features ${features.beds} bedrooms and ${features.baths} bathrooms.</p><p>${features.hasPool ? 'Includes a private swimming pool. ' : ''}Located in ${location.district || 'Phuket'}.</p>`,
      propertyFeatures: features.amenities.slice(0, 4).map(a => ({
        title: a,
        description: a,
        icon: 'mdi:check-circle',
      })),
    };
  }
}

/**
 * Extract district from address string
 */
function extractDistrictFromAddress(address: string): string | undefined {
  const phuketDistricts = [
    'Rawai', 'Patong', 'Kamala', 'Kata', 'Karon', 'Surin',
    'Bang Tao', 'Nai Harn', 'Chalong', 'Nai Yang', 'Mai Khao',
    'Cherng Talay', 'Kathu', 'Phuket Town', 'Thalang', 'Kalim'
  ];
  
  for (const district of phuketDistricts) {
    if (address.toLowerCase().includes(district.toLowerCase())) {
      return district;
    }
  }
  
  return undefined;
}










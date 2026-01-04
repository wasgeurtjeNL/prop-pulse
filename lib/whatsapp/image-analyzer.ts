/**
 * WhatsApp Property Image Analyzer
 * 
 * Uses GPT-4o Vision to analyze property photos and extract:
 * - Property type (villa, apartment, etc.)
 * - Number of bedrooms/bathrooms
 * - Amenities (pool, garage, garden, etc.)
 * - Style and condition
 * - Suggested listing title
 */

import OpenAI from 'openai';
import { DetectedPropertyFeatures } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Analyze property images using GPT-4o Vision
 * 
 * @param imageUrls - Array of image URLs to analyze
 * @param locationContext - Optional location context (district, address)
 * @returns Detected property features
 */
export async function analyzePropertyImages(
  imageUrls: string[],
  locationContext?: { district?: string; address?: string }
): Promise<DetectedPropertyFeatures> {
  // Limit to 10 images for API efficiency
  const imagesToAnalyze = imageUrls.slice(0, 10);
  
  // Build the image content array for GPT-4o Vision
  const imageContent: OpenAI.ChatCompletionContentPart[] = imagesToAnalyze.map(url => ({
    type: 'image_url' as const,
    image_url: {
      url: url,
      detail: 'high' as const,
    },
  }));

  const locationInfo = locationContext 
    ? `\n\nLocation context: ${locationContext.district || ''} ${locationContext.address || ''}`.trim()
    : '';

  const systemPrompt = `You are an expert real estate property analyst. Analyze the provided property photos and extract detailed information about the property.

You must analyze ALL images provided to get a complete picture of the property.

Return a JSON object with the following structure:
{
  "propertyType": "LUXURY_VILLA" | "APARTMENT" | "RESIDENTIAL_HOME" | "OFFICE_SPACES",
  "category": "Descriptive category like 'Modern Beachfront Villa' or 'City Center Apartment'",
  "beds": number (count bedrooms you can see or infer),
  "baths": number (count bathrooms you can see or infer),
  "estimatedSqft": number or null (estimate in square meters if possible),
  "hasPool": boolean,
  "hasGarage": boolean,
  "hasGarden": boolean,
  "hasSeaView": boolean,
  "amenities": ["array of detected amenities like 'Swimming Pool', 'Air Conditioning', 'Modern Kitchen', 'Balcony', 'Parking', etc."],
  "style": "modern" | "traditional" | "tropical" | "contemporary" | "colonial" | "minimalist",
  "condition": "new" | "excellent" | "good" | "needs_renovation",
  "highlights": ["array of 3-5 key selling points based on what you see"],
  "suggestedTitle": "Compelling property title for the listing (max 60 chars)"
}

IMPORTANT GUIDELINES:
1. Be conservative in bedroom/bathroom counts - only count what you can clearly identify
2. Look for visual cues: beds, wardrobes, en-suite bathrooms, shower/bath fixtures
3. For amenities, look for: pools, gardens, balconies, sea views, mountain views, modern appliances, air conditioning units, security systems, parking areas
4. Assess condition based on: maintenance level, age of fixtures, quality of finishes
5. Style should reflect the architectural and interior design approach
6. The title should be compelling and highlight the best features
7. If the property appears to be in Thailand/Phuket, use appropriate local terms

Return ONLY valid JSON, no markdown formatting.`;

  const userPrompt = `Please analyze these ${imagesToAnalyze.length} property photos and provide a detailed assessment.${locationInfo}

Focus on:
1. Accurately counting bedrooms and bathrooms
2. Identifying all visible amenities
3. Assessing the property style and condition
4. Creating a compelling listing title

The images show different areas of the same property.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    let resultText = response.choices[0].message.content?.trim() || '{}';

    // Clean up markdown code blocks if present
    if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const analysisResult = JSON.parse(resultText);

    // Validate and normalize the result
    return normalizeAnalysisResult(analysisResult);

  } catch (error) {
    console.error('Error analyzing property images:', error);
    
    // Return default values if analysis fails
    return getDefaultFeatures();
  }
}

/**
 * Analyze a single image for quick preview
 */
export async function analyzePreviewImage(imageUrl: string): Promise<{
  propertyType: string;
  style: string;
  mainFeature: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Briefly analyze this property photo. Return JSON: {"propertyType": "villa|apartment|house|office", "style": "modern|traditional|tropical", "mainFeature": "one key feature you see"}'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What type of property is this?' },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const resultText = response.choices[0].message.content?.trim() || '{}';
    return JSON.parse(resultText.replace(/```json?\n?/g, '').replace(/```/g, ''));
  } catch {
    return {
      propertyType: 'property',
      style: 'modern',
      mainFeature: 'unknown',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize and validate the analysis result
 */
function normalizeAnalysisResult(result: Partial<DetectedPropertyFeatures>): DetectedPropertyFeatures {
  // Validate property type
  const validPropertyTypes = ['LUXURY_VILLA', 'APARTMENT', 'RESIDENTIAL_HOME', 'OFFICE_SPACES'];
  let propertyType = result.propertyType || 'RESIDENTIAL_HOME';
  if (!validPropertyTypes.includes(propertyType)) {
    // Map common variations
    if (/villa|mansion|estate/i.test(propertyType)) {
      propertyType = 'LUXURY_VILLA';
    } else if (/apartment|condo|flat/i.test(propertyType)) {
      propertyType = 'APARTMENT';
    } else if (/office|commercial/i.test(propertyType)) {
      propertyType = 'OFFICE_SPACES';
    } else {
      propertyType = 'RESIDENTIAL_HOME';
    }
  }

  // Validate condition
  const validConditions = ['new', 'excellent', 'good', 'needs_renovation'];
  let condition = result.condition || 'good';
  if (!validConditions.includes(condition)) {
    condition = 'good';
  }

  // Validate style
  const validStyles = ['modern', 'traditional', 'tropical', 'contemporary', 'colonial', 'minimalist'];
  let style = result.style || 'modern';
  if (!validStyles.includes(style)) {
    style = 'modern';
  }

  // Ensure arrays are arrays
  const amenities = Array.isArray(result.amenities) ? result.amenities : [];
  const highlights = Array.isArray(result.highlights) ? result.highlights : [];

  return {
    propertyType: propertyType as DetectedPropertyFeatures['propertyType'],
    category: result.category || `${style.charAt(0).toUpperCase() + style.slice(1)} ${propertyType.replace('_', ' ').toLowerCase()}`,
    beds: Math.max(0, Math.min(20, Number(result.beds) || 0)),
    baths: Math.max(0, Math.min(20, Number(result.baths) || 0)),
    estimatedSqft: result.estimatedSqft ? Math.max(0, Number(result.estimatedSqft)) : undefined,
    hasPool: Boolean(result.hasPool),
    hasGarage: Boolean(result.hasGarage),
    hasGarden: Boolean(result.hasGarden),
    hasSeaView: Boolean(result.hasSeaView),
    amenities: amenities.slice(0, 20).map(a => String(a)),
    style,
    condition: condition as DetectedPropertyFeatures['condition'],
    highlights: highlights.slice(0, 5).map(h => String(h)),
    suggestedTitle: (result.suggestedTitle || 'Beautiful Property for Sale').slice(0, 80),
  };
}

/**
 * Get default features when analysis fails
 */
function getDefaultFeatures(): DetectedPropertyFeatures {
  return {
    propertyType: 'RESIDENTIAL_HOME',
    category: 'Property',
    beds: 0,
    baths: 0,
    estimatedSqft: undefined,
    hasPool: false,
    hasGarage: false,
    hasGarden: false,
    hasSeaView: false,
    amenities: [],
    style: 'modern',
    condition: 'good',
    highlights: [],
    suggestedTitle: 'Property for Sale',
  };
}

/**
 * Get amenity icon for a detected amenity
 */
export function getAmenityIcon(amenity: string): string {
  const amenityLower = amenity.toLowerCase();
  
  const iconMap: Record<string, string> = {
    'pool': 'mdi:pool',
    'swimming pool': 'mdi:pool',
    'garden': 'mdi:flower',
    'garage': 'mdi:garage',
    'parking': 'mdi:car',
    'air conditioning': 'mdi:air-conditioner',
    'ac': 'mdi:air-conditioner',
    'balcony': 'mdi:balcony',
    'terrace': 'mdi:balcony',
    'sea view': 'mdi:waves',
    'ocean view': 'mdi:waves',
    'mountain view': 'mdi:image-filter-hdr',
    'kitchen': 'mdi:chef-hat',
    'modern kitchen': 'mdi:chef-hat',
    'gym': 'mdi:dumbbell',
    'fitness': 'mdi:dumbbell',
    'security': 'mdi:shield-home',
    'wifi': 'mdi:wifi',
    'internet': 'mdi:wifi',
    'laundry': 'mdi:washing-machine',
    'elevator': 'mdi:elevator',
    'rooftop': 'mdi:home-roof',
    'jacuzzi': 'mdi:hot-tub',
    'spa': 'mdi:spa',
    'fireplace': 'mdi:fireplace',
    'storage': 'mdi:garage-variant',
    'pet friendly': 'mdi:paw',
    'furnished': 'mdi:sofa',
    'unfurnished': 'mdi:sofa-outline',
  };

  // Find matching icon
  for (const [key, icon] of Object.entries(iconMap)) {
    if (amenityLower.includes(key)) {
      return icon;
    }
  }

  return 'mdi:check-circle'; // Default icon
}

/**
 * Generate amenities with icons from detected amenities
 */
export function generateAmenitiesWithIcons(amenities: string[]): Array<{ name: string; icon: string }> {
  return amenities.map(amenity => ({
    name: amenity,
    icon: getAmenityIcon(amenity),
  }));
}










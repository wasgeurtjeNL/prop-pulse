import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { SYSTEM_PROMPT, INTENT_DETECTION_PROMPT, PROPERTY_SEARCH_PROMPT } from '@/lib/chatbot/prompts';

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PropertyResult {
  id: string;
  listingNumber: string | null;
  title: string;
  slug: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  category: string;
  image: string;
  // POI data
  beachScore?: number | null;
  familyScore?: number | null;
  convenienceScore?: number | null;
  quietnessScore?: number | null;
  hasSeaView?: boolean | null;
  seaDistance?: number | null;
  district?: string | null;
}

interface NearbyPoi {
  name: string;
  category: string;
  distanceMeters: number;
  walkingMinutes: number | null;
  drivingMinutes: number | null;
}

interface ChatResponse {
  reply: string;
  properties?: PropertyResult[];
  actions?: Array<{ type: string; label: string; data?: Record<string, unknown> }>;
  intent: string;
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Detect user intent
async function detectIntent(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: INTENT_DETECTION_PROMPT },
        { role: 'user', content: message }
      ],
      max_tokens: 20,
      temperature: 0,
    });
    
    return completion.choices[0]?.message?.content?.trim() || 'GENERAL';
  } catch (error) {
    console.error('Intent detection error:', error);
    return 'GENERAL';
  }
}

// Extract search criteria from natural language
async function extractSearchCriteria(message: string): Promise<Record<string, unknown>> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROPERTY_SEARCH_PROMPT },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    
    const result = completion.choices[0]?.message?.content;
    return result ? JSON.parse(result) : {};
  } catch (error) {
    console.error('Search criteria extraction error:', error);
    return {};
  }
}

// Search properties in database with POI filters
async function searchProperties(criteria: Record<string, unknown>): Promise<PropertyResult[]> {
  try {
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: 'ACTIVE',
    };

    // Type filter
    if (criteria.type === 'buy') {
      where.type = 'FOR_SALE';
    } else if (criteria.type === 'rent') {
      where.type = 'FOR_RENT';
    }

    // Category filter
    if (criteria.category) {
      const categoryMap: Record<string, string> = {
        'luxury-villa': 'LUXURY_VILLA',
        'apartment': 'APARTMENT',
        'residential-home': 'RESIDENTIAL_HOME',
        'office-spaces': 'OFFICE_SPACES',
      };
      where.category = categoryMap[criteria.category as string] || undefined;
    }

    // Beds filter
    if (criteria.minBeds && typeof criteria.minBeds === 'number') {
      where.beds = { gte: criteria.minBeds };
    }

    // Location filter (fuzzy match on location OR district)
    if (criteria.location && typeof criteria.location === 'string') {
      where.OR = [
        { location: { contains: criteria.location, mode: 'insensitive' } },
        { district: { contains: criteria.location, mode: 'insensitive' } },
      ];
    }

    // POI-based filters
    if (criteria.nearBeach === true) {
      where.beachScore = { gte: 70 };
    }
    if (criteria.quiet === true) {
      where.quietnessScore = { gte: 80 };
    }
    if (criteria.familyFriendly === true) {
      where.familyScore = { gte: 50 };
    }
    if (criteria.convenient === true) {
      where.convenienceScore = { gte: 50 };
    }
    if (criteria.seaView === true) {
      where.hasSeaView = true;
    }
    
    // For gym filter, we need to check if property has a GYM POI nearby
    // We'll filter by properties that have POI distances calculated
    if (criteria.nearGym === true) {
      where.poiDistances = {
        some: {
          poi: {
            category: 'GYM',
          },
          distanceMeters: { lte: 2000 }, // Within 2km
        },
      };
    }

    // Determine ordering based on criteria
    let orderBy: any = { createdAt: 'desc' };
    if (criteria.nearBeach) {
      orderBy = { beachScore: 'desc' };
    } else if (criteria.quiet) {
      orderBy = { quietnessScore: 'desc' };
    } else if (criteria.familyFriendly) {
      orderBy = { familyScore: 'desc' };
    } else if (criteria.convenient) {
      orderBy = { convenienceScore: 'desc' };
    }

    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        listingNumber: true,
        title: true,
        slug: true,
        price: true,
        location: true,
        beds: true,
        baths: true,
        sqft: true,
        type: true,
        category: true,
        image: true,
        provinceSlug: true,
        areaSlug: true,
        // Include POI data
        beachScore: true,
        familyScore: true,
        convenienceScore: true,
        quietnessScore: true,
        hasSeaView: true,
        seaDistance: true,
        district: true,
      },
      take: 5,
      orderBy,
    });

    return properties.map((p: typeof properties[0]) => ({
      ...p,
      baths: Number(p.baths),
    }));
  } catch (error) {
    console.error('Property search error:', error);
    return [];
  }
}

// Get nearby POIs for a property
async function getNearbyPois(propertyId: string, limit: number = 10): Promise<NearbyPoi[]> {
  try {
    const distances = await prisma.propertyPoiDistance.findMany({
      where: { propertyId },
      include: {
        poi: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: { distanceMeters: 'asc' },
      take: limit,
    });

    return distances.map((d: typeof distances[0]) => ({
      name: d.poi.name,
      category: d.poi.category,
      distanceMeters: d.distanceMeters,
      walkingMinutes: d.walkingMinutes,
      drivingMinutes: d.drivingMinutes,
    }));
  } catch (error) {
    console.error('Error fetching nearby POIs:', error);
    return [];
  }
}

// Get categorized nearby POIs summary
async function getPoisSummary(propertyId: string): Promise<string> {
  try {
    const distances = await prisma.propertyPoiDistance.findMany({
      where: { propertyId },
      include: {
        poi: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: { distanceMeters: 'asc' },
      take: 20,
    });

    if (distances.length === 0) return '';

    // Group by category
    const grouped: Record<string, Array<{ name: string; distance: number }>> = {};
    for (const d of distances) {
      const cat = d.poi.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ name: d.poi.name, distance: d.distanceMeters });
    }

    // Format summary
    const summaryParts: string[] = [];

    // Beaches
    if (grouped['BEACH']) {
      const nearest = grouped['BEACH'][0];
      const distStr = nearest.distance < 1000 
        ? `${nearest.distance}m` 
        : `${(nearest.distance / 1000).toFixed(1)}km`;
      summaryParts.push(`🏖️ Nearest beach: ${nearest.name} (${distStr})`);
    }

    // Schools
    const schoolCats = ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'KINDERGARTEN'];
    const schools = schoolCats.flatMap(c => grouped[c] || []);
    if (schools.length > 0) {
      const nearest = schools.sort((a, b) => a.distance - b.distance)[0];
      summaryParts.push(`🏫 Nearest school: ${nearest.name} (${(nearest.distance / 1000).toFixed(1)}km)`);
    }

    // Hospitals
    const hospitals = grouped['HOSPITAL'] || [];
    if (hospitals.length > 0) {
      const nearest = hospitals[0];
      summaryParts.push(`🏥 Nearest hospital: ${nearest.name} (${(nearest.distance / 1000).toFixed(1)}km)`);
    }

    // Shopping
    const shopCats = ['SHOPPING_MALL', 'SUPERMARKET'];
    const shops = shopCats.flatMap(c => grouped[c] || []);
    if (shops.length > 0) {
      const nearest = shops.sort((a, b) => a.distance - b.distance)[0];
      const distStr = nearest.distance < 1000 
        ? `${nearest.distance}m` 
        : `${(nearest.distance / 1000).toFixed(1)}km`;
      summaryParts.push(`🛒 Nearest shopping: ${nearest.name} (${distStr})`);
    }

    // Restaurants
    if (grouped['RESTAURANT']) {
      const nearest = grouped['RESTAURANT'][0];
      const distStr = nearest.distance < 1000 
        ? `${nearest.distance}m` 
        : `${(nearest.distance / 1000).toFixed(1)}km`;
      summaryParts.push(`🍽️ Nearby dining: ${nearest.name} (${distStr})`);
    }

    return summaryParts.join('\n');
  } catch (error) {
    console.error('Error generating POI summary:', error);
    return '';
  }
}

// Get property by listing number
async function getPropertyByListingNumber(listingNumber: string): Promise<PropertyResult | null> {
  try {
    const property = await prisma.property.findFirst({
      where: {
        listingNumber: { equals: listingNumber, mode: 'insensitive' },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        listingNumber: true,
        title: true,
        slug: true,
        price: true,
        location: true,
        beds: true,
        baths: true,
        sqft: true,
        type: true,
        category: true,
        image: true,
        provinceSlug: true,
        areaSlug: true,
        beachScore: true,
        familyScore: true,
        convenienceScore: true,
        quietnessScore: true,
        hasSeaView: true,
        seaDistance: true,
        district: true,
      },
    });

    if (!property) return null;

    return {
      ...property,
      baths: Number(property.baths),
    };
  } catch (error) {
    console.error('Property fetch error:', error);
    return null;
  }
}

// Format property location scores for chat context
function formatPropertyLocationInfo(property: PropertyResult): string {
  const parts: string[] = [];
  
  if (property.beachScore !== null && property.beachScore !== undefined) {
    if (property.beachScore >= 90) parts.push('🏖️ Beachfront location');
    else if (property.beachScore >= 70) parts.push('🏖️ Walking distance to beach');
    else if (property.beachScore >= 50) parts.push('🏖️ Short drive to beach');
  }
  
  if (property.seaDistance && property.seaDistance < 2000) {
    parts.push(`🌊 ${property.seaDistance}m from the sea`);
  }
  
  if (property.hasSeaView) {
    parts.push('🌅 Sea view');
  }
  
  if (property.quietnessScore !== null && property.quietnessScore !== undefined) {
    if (property.quietnessScore >= 90) parts.push('🔇 Very quiet area');
    else if (property.quietnessScore >= 70) parts.push('🔇 Quiet residential area');
  }
  
  if (property.familyScore !== null && property.familyScore !== undefined && property.familyScore >= 60) {
    parts.push('👨‍👩‍👧 Family-friendly (schools & hospitals nearby)');
  }
  
  if (property.convenienceScore !== null && property.convenienceScore !== undefined && property.convenienceScore >= 60) {
    parts.push('🛒 Convenient location (shops nearby)');
  }
  
  return parts.join(' | ');
}

// Generate AI response
async function generateResponse(
  message: string,
  intent: string,
  properties: PropertyResult[],
  conversationHistory: ChatMessage[],
  poiContext?: string
): Promise<string> {
  try {
    // Build context about properties if found
    let propertyContext = '';
    if (properties.length > 0) {
      propertyContext = `\n\nFOUND PROPERTIES (${properties.length} results):\n${properties.map(p => {
        const locationInfo = formatPropertyLocationInfo(p);
        return `- ${p.listingNumber || 'N/A'}: ${p.title} | ${p.price} | ${p.beds} bed, ${p.baths} bath | ${p.district || p.location}${locationInfo ? ` | ${locationInfo}` : ''}`;
      }).join('\n')}\n\n⚠️ IMPORTANT: The UI will display these properties as cards. Do NOT list them again in text. Just briefly acknowledge you found them.`;
    } else if (intent === 'PROPERTY_SEARCH') {
      // Explicitly tell AI that no properties were found
      propertyContext = `\n\n⚠️ NO PROPERTIES FOUND matching the search criteria.\nDo NOT make up or invent any properties. Tell the user you couldn't find matching properties and suggest:\n1. Trying different criteria\n2. Contacting an agent for personalized help\n3. Browsing all available properties`;
    }

    // Add POI context if available
    if (poiContext) {
      propertyContext += `\n\nNEARBY POINTS OF INTEREST:\n${poiContext}`;
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT + propertyContext },
      ...conversationHistory.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I'm here to help you find your perfect property! What are you looking for?";
  } catch (error) {
    console.error('Response generation error:', error);
    return "I apologize, but I'm having trouble right now. Please try again or contact us directly at +66 (0)98 626 1646.";
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chat service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [], currentPropertySlug } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Rate limiting (simple in-memory, should use Redis in production)
    // For now, just proceed

    // Detect intent
    const intent = await detectIntent(message);
    console.log('Detected intent:', intent);

    let properties: PropertyResult[] = [];
    let actions: ChatResponse['actions'] = [];
    let poiContext: string | undefined;

    // Handle different intents
    switch (intent) {
      case 'PROPERTY_SEARCH': {
        const criteria = await extractSearchCriteria(message);
        console.log('Search criteria:', criteria);
        properties = await searchProperties(criteria);
        
        if (properties.length > 0) {
          actions = [
            { type: 'schedule_viewing', label: '📅 Schedule Viewing' },
            { type: 'contact', label: '📞 Contact Agent' },
          ];
        }
        break;
      }

      case 'PROPERTY_DETAILS': {
        // Extract listing number from message (PP-XXXX format)
        const listingMatch = message.match(/PP-\d{4}/i);
        if (listingMatch) {
          const property = await getPropertyByListingNumber(listingMatch[0]);
          if (property) {
            properties = [property];
            // Get POI summary for this property
            poiContext = await getPoisSummary(property.id);
            actions = [
              { type: 'schedule_viewing', label: '📅 Schedule Viewing', data: { propertyId: property.id } },
              { type: 'make_offer', label: '💰 Make Offer', data: { propertyId: property.id } },
              { type: 'nearby', label: '📍 What\'s Nearby?' },
            ];
          }
        }
        break;
      }

      case 'LOCATION_QUERY': {
        // User is asking about what's nearby - need property context
        // First check if we're on a property page
        if (currentPropertySlug) {
          const property = await prisma.property.findUnique({
            where: { slug: currentPropertySlug },
            select: {
              id: true,
              listingNumber: true,
              title: true,
              slug: true,
              price: true,
              location: true,
              beds: true,
              baths: true,
              sqft: true,
              type: true,
              category: true,
              image: true,
              provinceSlug: true,
              areaSlug: true,
              beachScore: true,
              familyScore: true,
              convenienceScore: true,
              quietnessScore: true,
              hasSeaView: true,
              seaDistance: true,
              district: true,
            },
          });
          
          if (property) {
            properties = [{ ...property, baths: Number(property.baths) }];
            poiContext = await getPoisSummary(property.id);
            actions = [
              { type: 'schedule_viewing', label: '📅 Schedule Viewing' },
              { type: 'contact', label: '📞 Contact Agent' },
            ];
          }
        }
        break;
      }

      case 'SCHEDULE_VIEWING': {
        actions = [
          { type: 'schedule_viewing', label: '📅 Choose a Date' },
          { type: 'contact', label: '📞 Call Us Instead' },
        ];
        break;
      }

      case 'CONTACT': {
        actions = [
          { type: 'whatsapp', label: '💬 WhatsApp' },
          { type: 'call', label: '📞 Call +66 98 626 1646' },
          { type: 'email', label: '✉️ Email Us' },
        ];
        break;
      }

      case 'GREETING': {
        actions = [
          { type: 'search', label: '🔍 Find Properties' },
          { type: 'schedule_viewing', label: '📅 Schedule Viewing' },
          { type: 'investment', label: '💰 Investment Info' },
          { type: 'contact', label: '📞 Contact Agent' },
        ];
        break;
      }

      default:
        // For FAQ, GENERAL, etc.
        break;
    }

    // If on a property page, include that property in context
    if (currentPropertySlug && properties.length === 0) {
      try {
        const currentProperty = await prisma.property.findUnique({
          where: { slug: currentPropertySlug },
          select: {
            id: true,
            listingNumber: true,
            title: true,
            slug: true,
            price: true,
            location: true,
            beds: true,
            baths: true,
            sqft: true,
            type: true,
            category: true,
            image: true,
            provinceSlug: true,
            areaSlug: true,
            beachScore: true,
            familyScore: true,
            convenienceScore: true,
            quietnessScore: true,
            hasSeaView: true,
            seaDistance: true,
            district: true,
          },
        });
        if (currentProperty) {
          properties = [{
            ...currentProperty,
            baths: Number(currentProperty.baths),
          }];
          // Also get POI context for current property
          poiContext = await getPoisSummary(currentProperty.id);
        }
      } catch (e) {
        console.error('Error fetching current property:', e);
      }
    }

    // Generate response with POI context
    const reply = await generateResponse(message, intent, properties, conversationHistory, poiContext);

    const response: ChatResponse = {
      reply,
      intent,
      ...(properties.length > 0 && { properties }),
      ...(actions.length > 0 && { actions }),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}




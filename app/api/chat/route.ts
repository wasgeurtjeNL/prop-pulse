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

// Search properties in database
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

    // Location filter (fuzzy match)
    if (criteria.location && typeof criteria.location === 'string') {
      where.location = { contains: criteria.location, mode: 'insensitive' };
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
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return properties.map(p => ({
      ...p,
      baths: Number(p.baths),
    }));
  } catch (error) {
    console.error('Property search error:', error);
    return [];
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

// Generate AI response
async function generateResponse(
  message: string,
  intent: string,
  properties: PropertyResult[],
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    // Build context about properties if found
    let propertyContext = '';
    if (properties.length > 0) {
      propertyContext = `\n\nFOUND PROPERTIES:\n${properties.map(p => 
        `- ${p.listingNumber || 'N/A'}: ${p.title} | ${p.price} | ${p.beds} bed, ${p.baths} bath | ${p.location}`
      ).join('\n')}`;
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
      max_tokens: 300,
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
            actions = [
              { type: 'schedule_viewing', label: '📅 Schedule Viewing', data: { propertyId: property.id } },
              { type: 'make_offer', label: '💰 Make Offer', data: { propertyId: property.id } },
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
          },
        });
        if (currentProperty) {
          properties = [{
            ...currentProperty,
            baths: Number(currentProperty.baths),
          }];
        }
      } catch (e) {
        console.error('Error fetching current property:', e);
      }
    }

    // Generate response
    const reply = await generateResponse(message, intent, properties, conversationHistory);

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




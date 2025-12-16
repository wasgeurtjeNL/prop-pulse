import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

interface PropertyInput {
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  category: string;
  content: string;
  shortDescription?: string;
  amenities: string[];
  garage?: number;
  lotSize?: number;
  yearBuilt?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const propertyData: PropertyInput = body;

    // Validate required fields
    if (!propertyData.title || !propertyData.location || !propertyData.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, location, content" },
        { status: 400 }
      );
    }

    console.log(`✨ Rewriting content for: ${propertyData.title}`);

    // Get company profile
    const companyProfile = await getCompanyProfile();
    console.log(`📋 Company profile: ${companyProfile?.companyName || "Not configured"}`);

    // Extract location info
    const locationParts = propertyData.location.split(",");
    const area = locationParts[0]?.trim() || "";
    const region = locationParts.length > 1 ? locationParts[1]?.trim() : "";

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

    const prompt = `You are an ELITE real estate copywriter who specializes in SELLING properties through compelling, emotional, and persuasive content. Your writing makes readers WANT to buy.

${companyContext}

PROPERTY TO SELL:
- Title: ${propertyData.title}
- Location: ${propertyData.location}
- Area/Neighborhood: ${area}
- Region: ${region}
- Price: ${propertyData.price}
- Bedrooms: ${propertyData.beds} | Bathrooms: ${propertyData.baths} | Living Space: ${propertyData.sqft}m²
- Type: ${propertyData.type === "FOR_SALE" ? "For Sale" : "For Rent"}
- Category: ${propertyData.category}
- Current Description: ${propertyData.content}
- Amenities & Features: ${propertyData.amenities?.join(", ") || "Not specified"}
${propertyData.garage ? `- Parking: ${propertyData.garage} car(s)` : ""}
${propertyData.lotSize ? `- Land Size: ${propertyData.lotSize}m²` : ""}
${propertyData.yearBuilt ? `- Year Built: ${propertyData.yearBuilt}` : ""}

YOUR MISSION - Create SALES-FOCUSED content that:

1. **HOOKS the reader** immediately with an emotional opening
2. **PAINTS A PICTURE** of the lifestyle this property offers
3. **HIGHLIGHTS THE LOCATION** - What's nearby? Beaches, restaurants, schools, shopping, nightlife? What makes this area special?
4. **SHOWCASES EVERY FEATURE** - Don't just list amenities, SELL them. A pool isn't just a pool - it's morning swims with sunrise views.
5. **CREATES URGENCY** - Properties like this don't stay on the market long
6. **SPEAKS TO THE BUYER'S DREAMS** - Are they looking for a family home? Investment? Retirement paradise?
7. **ENDS WITH A STRONG CALL-TO-ACTION** - Make them want to schedule a viewing NOW

WRITING STYLE:
- Write like a top real estate agent who LOVES this property
- Use sensory language: "imagine waking up to...", "picture yourself...", "feel the..."
- Be specific about features - don't just say "beautiful view" - describe WHAT view
- For Phuket/Thailand: emphasize tropical living, expat lifestyle, investment potential, beaches, island life
- Create FOMO (Fear Of Missing Out) - this is a rare opportunity
- Sound enthusiastic but professional - never salesy or pushy

STRUCTURE YOUR RESPONSE:
{
  "shortDescription": "An IRRESISTIBLE 1-2 sentence hook that makes buyers click. Include the #1 selling point. Max 200 chars.",
  
  "contentHtml": "Professional HTML sales copy with this structure:
    
    <h2>[Compelling Property Headline - Not just the name]</h2>
    <p>[HOOK - Emotional opening that paints the dream. What lifestyle does this property offer?]</p>
    
    <h3>What Makes This Property Special</h3>
    <p>[Detailed paragraph about the property's standout features. Be specific and sensory.]</p>
    <ul>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
      <li><strong>[Feature]:</strong> [Benefit-focused description]</li>
    </ul>
    
    <h3>Location & Lifestyle</h3>
    <p>[What's the area like? What's nearby? Beaches, dining, activities? Why is this location desirable? For international buyers: mention expat community, safety, infrastructure.]</p>
    
    <h3>Investment Opportunity</h3>
    <p>[Why is this a smart purchase? Rental potential? Growing area? Value for money? Future development?]</p>
    
    <p><strong>Ready to make this your new home?</strong> <em>Properties like this are rare in ${area}. Contact us today for a private viewing before it's gone.</em></p>",
    
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
- Write 100% UNIQUE content - NO copying from original
- Make it SCANNABLE with clear headers and bullet points
- Every sentence should make the reader more interested
- Focus on BENEFITS, not just features
- Include specific details about ${area} and ${region} lifestyle
- Write for international buyers and investors
- Create an emotional connection to the property
- DO NOT use any emoji characters - use plain text only
- Headers should be clean text without symbols like emojis

Return ONLY valid JSON, no markdown code blocks.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are an elite real estate copywriter who has sold over $500 million in luxury properties. Your writing is legendary for making buyers fall in love with properties before they even visit. You understand that people don't buy properties - they buy LIFESTYLES, DREAMS, and FUTURES.

Your writing style:
- Emotionally compelling but professional
- Specific and sensory - you paint vivid pictures
- Benefit-focused - every feature becomes a lifestyle benefit
- Creates urgency without being pushy
- Speaks to both emotional desires AND practical concerns

You ALWAYS output valid JSON with no markdown formatting.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 3500,
    });

    let resultText = response.choices[0].message.content?.trim() || "{}";

    // Clean up markdown code blocks if present
    if (resultText.startsWith("```")) {
      resultText = resultText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const optimizedContent = JSON.parse(resultText);

    console.log(`✅ Content rewritten successfully`);

    return NextResponse.json({
      success: true,
      data: {
        shortDescription: optimizedContent.shortDescription || propertyData.shortDescription,
        contentHtml: optimizedContent.contentHtml || "",
        propertyFeatures: optimizedContent.propertyFeatures || [],
      },
      companyProfileUsed: !!companyProfile,
    });

  } catch (error) {
    console.error("Content rewrite error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite content", details: String(error) },
      { status: 500 }
    );
  }
}



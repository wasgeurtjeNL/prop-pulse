import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/real_estate_pulse",
});

const prisma = new PrismaClient({ adapter });

const templates = [
  {
    id: "default-template",
    name: "default",
    displayName: "Default SEO Template",
    description: "Standard SEO optimization template with best practices",
    category: null,
    metaTitlePrompt: `Create an SEO-optimized title for a page about: {{title}}

Rules:
- Maximum 60 characters
- Include the primary keyword "{{keyword}}" in the first 30 characters
- Make it compelling and click-worthy
- Include location "{{location}}" if relevant
- End with the brand separator and brand name

Examples:
- "Luxury Villas for Sale in Phuket | PSM Phuket"
- "Bangkok Condo Investment Guide 2024 | PSM Phuket"`,
    metaDescriptionPrompt: `Create an SEO-optimized meta description for: {{title}}

Rules:
- 145-155 characters optimal length
- Include the primary keyword "{{keyword}}" in the first 50 characters
- Include a clear call-to-action
- Mention unique selling points
- Make it compelling to encourage clicks

Context: {{content}}`,
    urlSlugRules: `URL Slug Rules:
- Use lowercase letters only
- Separate words with hyphens
- Maximum 60 characters
- Include primary keyword
- Remove stop words (the, a, an, and, or)
- No special characters`,
    contentPrompt: null,
    faqPrompt: null,
    seoRules: {
      titleLength: { min: 50, max: 60 },
      descriptionLength: { min: 145, max: 155 },
      keywordInFirst30Chars: true,
      includeCallToAction: true,
    },
    availableVariables: ["title", "keyword", "location", "content", "category"],
    isActive: true,
    isDefault: true,
  },
  {
    id: "location-template",
    name: "location",
    displayName: "Location Pages Template",
    description: "Optimized for location-based landing pages (cities, areas, neighborhoods)",
    category: "location",
    metaTitlePrompt: `Create an SEO title for a location page about: {{title}}

Rules:
- Format: "[Property Type] in [Location] | [Brand]"
- Maximum 60 characters
- Primary keyword "{{keyword}}" in first 30 characters
- Include location prominently
- Make it specific to the area

Examples:
- "Luxury Villas for Sale in Patong, Phuket | PSM Phuket"
- "Beachfront Condos in Kata Beach | PSM Phuket"`,
    metaDescriptionPrompt: `Create a meta description for the {{location}} real estate page.

Rules:
- 145-155 characters
- Mention the location in first 50 characters
- Include property types available
- Add a call-to-action
- Mention unique area features

Content: {{content}}`,
    urlSlugRules: `Location URL Rules:
- Format: /locations/[location-name]
- Use official area names
- Lowercase with hyphens
- Include region if needed for clarity`,
    contentPrompt: null,
    faqPrompt: null,
    seoRules: {
      titleLength: { min: 50, max: 60 },
      descriptionLength: { min: 145, max: 155 },
      includeLocation: true,
      locationInFirst50: true,
    },
    availableVariables: ["title", "keyword", "location", "region", "content", "propertyTypes"],
    isActive: true,
    isDefault: false,
  },
  {
    id: "service-template",
    name: "service",
    displayName: "Service Pages Template",
    description: "For service-oriented pages (property management, rentals, investment)",
    category: "service",
    metaTitlePrompt: `Create an SEO title for a service page: {{title}}

Rules:
- Format: "[Service Name] in [Location] | [Brand]"
- Maximum 60 characters
- Focus on benefit/value proposition
- Include location if relevant

Examples:
- "Property Management Services in Phuket | PSM Phuket"
- "Investment Consulting for Thailand Real Estate | PSM"`,
    metaDescriptionPrompt: `Create a compelling meta description for our {{title}} service.

Rules:
- 145-155 characters
- Lead with the main benefit
- Include key service features
- Strong call-to-action
- Professional tone

Service details: {{content}}`,
    urlSlugRules: `Service URL Rules:
- Format: /services/[service-name]
- Use action-oriented words
- Keep concise and descriptive`,
    contentPrompt: null,
    faqPrompt: null,
    seoRules: {
      titleLength: { min: 50, max: 60 },
      descriptionLength: { min: 145, max: 155 },
      includeCallToAction: true,
      benefitFocused: true,
    },
    availableVariables: ["title", "keyword", "location", "content", "benefits", "features"],
    isActive: true,
    isDefault: false,
  },
  {
    id: "guide-template",
    name: "guide",
    displayName: "Guide & Blog Template",
    description: "For educational content, guides, and blog posts",
    category: "content",
    metaTitlePrompt: `Create an SEO title for a guide/article: {{title}}

Rules:
- Maximum 60 characters
- Include year if timely content (2024, 2025)
- Use numbers if applicable ("7 Tips", "Complete Guide")
- Make it intriguing and informative

Examples:
- "Complete Guide to Buying Property in Thailand 2024"
- "7 Best Areas for Condo Investment in Phuket"`,
    metaDescriptionPrompt: `Create a meta description for this guide: {{title}}

Rules:
- 145-155 characters
- Highlight what readers will learn
- Include a hook to encourage reading
- Mention expertise/authority if applicable

Summary: {{content}}`,
    urlSlugRules: `Guide URL Rules:
- Format: /guides/[topic-slug] or /blog/[article-slug]
- Include main topic keyword
- Year optional but helpful for dated content`,
    contentPrompt: null,
    faqPrompt: null,
    seoRules: {
      titleLength: { min: 50, max: 60 },
      descriptionLength: { min: 145, max: 155 },
      includeYear: false,
      useNumbers: false,
    },
    availableVariables: ["title", "keyword", "content", "year", "author", "category"],
    isActive: true,
    isDefault: false,
  },
  {
    id: "faq-template",
    name: "faq",
    displayName: "FAQ Pages Template",
    description: "For FAQ and Q&A style pages",
    category: "faq",
    metaTitlePrompt: `Create an SEO title for an FAQ page about: {{title}}

Rules:
- Maximum 60 characters
- Format: "[Topic] FAQ - Common Questions Answered | [Brand]"
- Clear indication this is a Q&A resource

Examples:
- "Thailand Property Ownership FAQ | PSM Phuket"
- "Buying as a Foreigner: Questions Answered | PSM"`,
    metaDescriptionPrompt: `Create a meta description for our FAQ page about {{title}}.

Rules:
- 145-155 characters
- Mention number of questions if available
- Indicate expert answers
- Encourage exploring the FAQ

Topics covered: {{content}}`,
    urlSlugRules: `FAQ URL Rules:
- Format: /faq/[topic] or /[topic]/faq
- Keep topic-focused
- Short and memorable`,
    contentPrompt: null,
    faqPrompt: null,
    seoRules: {
      titleLength: { min: 50, max: 60 },
      descriptionLength: { min: 145, max: 155 },
      schemaFAQ: true,
    },
    availableVariables: ["title", "keyword", "content", "questionCount"],
    isActive: true,
    isDefault: false,
  },
  {
    id: "property-template",
    name: "property",
    displayName: "Property Listing Template",
    description: "For individual property listing pages",
    category: "property",
    metaTitlePrompt: `Create an SEO title for a property listing: {{title}}

Rules:
- Maximum 60 characters
- Format: "[Property Type] [Beds]BR in [Location] - [Price/Feature]"
- Include key selling point
- Make it specific and attractive

Examples:
- "4BR Pool Villa in Rawai, Phuket - Sea Views | PSM"
- "Luxury Penthouse in Patong - Ocean Front | PSM Phuket"`,
    metaDescriptionPrompt: `Create a meta description for this property: {{title}}

Rules:
- 145-155 characters
- Include: bedrooms, location, key feature
- Add price range if available
- Call-to-action: "View details", "Schedule viewing"

Property details: {{content}}`,
    urlSlugRules: `Property URL Rules:
- Format: /properties/[location]/[property-slug]
- Include area and property identifier
- SEO-friendly property names`,
    contentPrompt: null,
    faqPrompt: null,
    seoRules: {
      titleLength: { min: 50, max: 60 },
      descriptionLength: { min: 145, max: 155 },
      includePropertyType: true,
      includeLocation: true,
    },
    availableVariables: ["title", "location", "propertyType", "bedrooms", "price", "features", "content"],
    isActive: true,
    isDefault: false,
  },
];

async function main() {
  console.log("Seeding SEO templates...");
  
  for (const template of templates) {
    const existing = await prisma.seoTemplate.findUnique({
      where: { id: template.id },
    });
    
    if (existing) {
      console.log(`Updating template: ${template.displayName}`);
      await prisma.seoTemplate.update({
        where: { id: template.id },
        data: template,
      });
    } else {
      console.log(`Creating template: ${template.displayName}`);
      await prisma.seoTemplate.create({
        data: template,
      });
    }
  }
  
  console.log("SEO templates seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

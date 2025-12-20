import sharp from "sharp";

/**
 * Image optimization options for WebP conversion
 */
interface ImageOptimizationOptions {
  quality?: number;       // 1-100, default 80
  maxWidth?: number;      // default 1920
  maxHeight?: number;     // default 1440 (blog covers use 1792x1024)
  effort?: number;        // 0-6, default 4 (higher = smaller file)
}

/**
 * Landing page section structure with image
 */
export interface LandingPageSection {
  heading: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  position: "left" | "right";
}

/**
 * Result of WebP conversion
 */
interface WebPConversionResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  savingsPercent: string;
}

/**
 * Convert an image buffer to optimized WebP format
 * 
 * Uses Sharp for high-quality conversion with:
 * - Quality optimization (default 80)
 * - Smart color subsampling
 * - Optional resizing with aspect ratio preservation
 * 
 * @param inputBuffer - The original image buffer
 * @param options - Optional configuration for quality and size
 * @returns Optimized WebP buffer with size statistics
 */
export async function convertToWebP(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<WebPConversionResult> {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1440,
    effort = 4,
  } = options;

  const originalSize = inputBuffer.length;

  try {
    const outputBuffer = await sharp(inputBuffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "cover", // Use cover to fill the target dimensions
        withoutEnlargement: false, // Allow enlargement to match target size
      })
      .webp({
        quality,
        effort,
        smartSubsample: true,
      })
      .toBuffer();

    const compressedSize = outputBuffer.length;
    const savingsPercent = ((1 - compressedSize / originalSize) * 100).toFixed(0);

    return {
      buffer: outputBuffer,
      originalSize,
      compressedSize,
      savingsPercent,
    };
  } catch (error) {
    console.error("WebP conversion failed:", error);
    // Return original buffer if conversion fails
    return {
      buffer: inputBuffer,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: "0",
    };
  }
}

/**
 * Generate SEO-optimized ALT text for blog cover images
 * 
 * Best practices followed:
 * - Max ~125 characters
 * - No "image of" or "photo of" (screen readers add this)
 * - Include relevant keywords
 * - Descriptive and contextual
 * 
 * @param title - The blog post title
 * @param topic - Optional topic/category for additional context
 * @returns SEO-optimized ALT text
 */
export function generateBlogCoverAlt(title: string, topic?: string): string {
  // Clean up the title - remove special characters but keep the meaning
  const cleanTitle = title
    .replace(/[|–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  // Common real estate keywords to check for context
  const realEstateKeywords = [
    "dubai",
    "property",
    "investment",
    "villa",
    "apartment",
    "real estate",
    "market",
    "buying",
    "selling",
    "rental",
    "luxury",
  ];

  // Check if title already contains real estate context
  const hasRealEstateContext = realEstateKeywords.some((keyword) =>
    cleanTitle.toLowerCase().includes(keyword)
  );

  // Build ALT text based on content
  let altText: string;

  if (topic) {
    // If topic is provided, use it for context
    altText = `${cleanTitle} - ${topic} insights`;
  } else if (hasRealEstateContext) {
    // Title already has context, use it directly with slight enhancement
    altText = `${cleanTitle} - real estate guide`;
  } else {
    // Generic blog post without specific context
    altText = `${cleanTitle} - PSM Phuket blog`;
  }

  // Ensure ALT text doesn't exceed ~125 characters
  if (altText.length > 125) {
    // Truncate intelligently at word boundary
    altText = altText.substring(0, 120).replace(/\s+\S*$/, "") + "...";
  }

  return altText;
}

/**
 * Generate a descriptive filename for blog images
 * 
 * @param title - The blog post title
 * @param suffix - Optional suffix (e.g., "cover", "hero")
 * @returns Clean, SEO-friendly filename
 */
export function generateBlogImageFilename(title: string, suffix: string = "cover"): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  const timestamp = Date.now();
  return `${cleanTitle}-${suffix}-${timestamp}.webp`;
}

/**
 * Build an optimized prompt for real estate blog images
 * 
 * Creates hyperrealistic, professional prompts that produce
 * photographic-quality imagery indistinguishable from real photos.
 * 
 * @param topic - The blog topic/title
 * @param style - Image style preference
 * @returns Optimized prompt for GPT Image 1.5
 */
export function buildBlogImagePrompt(
  topic: string,
  style: "professional" | "luxury" | "modern" | "lifestyle" = "professional",
  options?: { variationKey?: string }
): string {
  const variationKey = options?.variationKey?.trim();

  // Tiny deterministic hash so we can pick variants without adding deps.
  const hashString = (input: string): number => {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const baseSeed = hashString(`${topic}::${style}::${variationKey || ""}`);
  const pick = <T,>(items: T[], salt: number): T => {
    if (items.length === 0) throw new Error("pick() called with empty array");
    return items[(baseSeed + salt) % items.length];
  };

  // Style-specific descriptors
  const styleDescriptors: Record<string, string> = {
    professional: "professional, clean, corporate, trustworthy",
    luxury: "luxurious, elegant, premium, sophisticated, golden hour lighting",
    modern: "modern, minimalist, contemporary, sleek design",
    lifestyle: "aspirational, warm, inviting, lifestyle-focused, human element",
  };

  const styleText = styleDescriptors[style] || styleDescriptors.professional;

  // Detect topic category for better image generation
  const topicLower = topic.toLowerCase();
  
  let contextualPrompt = "";
  let localeHint = "";

  // Locale cues (helps reduce “same-looking” generic renders)
  if (topicLower.includes("phuket")) {
    localeHint = "Phuket, Thailand; tropical coastal atmosphere";
  } else if (topicLower.includes("thailand") || topicLower.includes("thai")) {
    localeHint = "Thailand; Southeast Asian urban/tropical atmosphere";
  } else if (topicLower.includes("dubai") || topicLower.includes("uae")) {
    localeHint = "Dubai, UAE; modern skyline and premium architecture cues";
  }
  
  // Topic-driven scene selection (aim: photorealistic editorial photography, not CGI)
  if (topicLower.includes("lease") || topicLower.includes("law") || topicLower.includes("legal") || topicLower.includes("contract")) {
    contextualPrompt = "a photorealistic editorial photo of a modern desk with a property contract, fountain pen, and a blurred city skyline through a window (no readable text)";
  } else if (topicLower.includes("co-living") || topicLower.includes("coliving") || topicLower.includes("community")) {
    contextualPrompt = "a photorealistic editorial photo of a modern shared living space: warm lighting, natural materials, subtle lived-in details, no identifiable faces";
  } else if (topicLower.includes("invest") || topicLower.includes("roi") || topicLower.includes("market") || topicLower.includes("trend") || topicLower.includes("analysis")) {
    contextualPrompt = "a photorealistic editorial photo of a modern workspace with a laptop and printed market report (charts blurred/unreadable), city view in the background, calm premium mood";
  } else if (topicLower.includes("villa") || topicLower.includes("house") || topicLower.includes("home")) {
    contextualPrompt = "a photorealistic architectural photo of a modern luxury villa exterior, natural shadows, realistic materials, subtle landscaping";
  } else if (topicLower.includes("apartment") || topicLower.includes("condo") || topicLower.includes("flat") || topicLower.includes("high-rise") || topicLower.includes("highrise")) {
    contextualPrompt = "a photorealistic architectural photo of a modern high-rise residential building with premium facade details and realistic perspective";
  } else if (topicLower.includes("rent") || topicLower.includes("rental")) {
    contextualPrompt = "a photorealistic interior photo of a furnished modern apartment, soft natural window light, tasteful decor, no staged CGI look";
  } else if (topicLower.includes("interior") || topicLower.includes("design")) {
    contextualPrompt = "a photorealistic interior design photo: modern living room with high ceilings, natural textures, subtle imperfections, soft daylight";
  } else if (topicLower.includes("pool") || topicLower.includes("outdoor") || topicLower.includes("garden")) {
    contextualPrompt = "a photorealistic architectural photo of a private pool terrace with tropical landscaping, warm natural light, premium resort vibe";
  } else {
    // Default: general real estate imagery
    contextualPrompt = "a photorealistic architectural photo of premium modern real estate, clean lines, realistic materials, natural light";
  }

  // Variation knobs (reduce “same-looking” outputs)
  const timeOfDay = pick(
    [
      "morning soft daylight",
      "late afternoon golden hour",
      "overcast softbox daylight",
      "blue hour ambient light",
    ],
    11
  );

  const cameraLook = pick(
    [
      "shot on a full-frame DSLR, 35mm lens, natural depth of field",
      "shot on a full-frame DSLR, 50mm lens, shallow depth of field",
      "shot on a full-frame DSLR, 24mm wide-angle, crisp architectural lines",
      "shot on a full-frame DSLR, 85mm lens, elegant compression and bokeh",
    ],
    29
  );

  const composition = pick(
    [
      "clean wide composition with generous negative space for a header",
      "rule-of-thirds composition with a clear focal point",
      "leading lines composition toward the main subject",
      "balanced symmetrical composition, premium editorial feel",
    ],
    47
  );

  const colorMood = pick(
    [
      "neutral premium palette (warm whites, soft grays, natural wood tones)",
      "cool modern palette (glass, steel, soft blues) with warm highlights",
      "warm inviting palette (golden light, beige tones, subtle contrast)",
      "high-end magazine look with natural contrast and subtle film grain",
    ],
    71
  );

  const localeLine = localeHint ? `Locale cues: ${localeHint}` : "";
  const variationLine = variationKey ? `Variation key: ${variationKey}` : "";

  return [
    "Create a HYPERREALISTIC photograph indistinguishable from a real photo taken by a professional photographer.",
    `Subject: ${contextualPrompt}`,
    `Topic context: "${topic}"`,
    localeLine,
    `Style direction: ${styleText}`,
    `Lighting: ${timeOfDay}`,
    `Camera: ${cameraLook}`,
    `Composition: ${composition}`,
    `Color mood: ${colorMood}`,
    "CRITICAL REQUIREMENTS for hyperrealism:",
    "- Must look like a REAL photograph, NOT AI-generated",
    "- Real camera imperfections: subtle lens distortion, natural depth of field, slight vignetting",
    "- Natural material textures: wood grain, fabric weave, metal reflections, concrete pores",
    "- Realistic lighting with natural shadows, ambient occlusion, and light falloff",
    "- NO plastic/smooth CGI surfaces, NO illustration style, NO 3D render look",
    "- NO text, watermarks, logos, or UI elements anywhere",
    "- If people appear, they must be unidentifiable (silhouettes, back view, or partial views only)",
    "- Wide landscape header format suitable for blog cover",
    variationLine,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Build a prompt for landing page section images
 * 
 * Creates hyperrealistic, professional prompts for section images
 * that match the content of each H2 section.
 * 
 * @param sectionHeading - The H2 heading of the section
 * @param pageTitle - The overall page title for context
 * @param sectionIndex - Index for variation
 * @returns Optimized prompt for GPT Image 1.5
 */
export function buildSectionImagePrompt(
  sectionHeading: string,
  pageTitle: string,
  sectionIndex: number = 0
): string {
  const headingLower = sectionHeading.toLowerCase();
  const pageLower = pageTitle.toLowerCase();

  // Determine locale hints from page title
  let localeHint = "";
  if (pageLower.includes("phuket")) {
    localeHint = "Phuket, Thailand setting with tropical coastal atmosphere";
  } else if (pageLower.includes("thailand") || pageLower.includes("thai")) {
    localeHint = "Thailand setting with Southeast Asian urban/tropical atmosphere";
  } else if (pageLower.includes("dubai") || pageLower.includes("uae")) {
    localeHint = "Dubai, UAE setting with modern skyline and premium architecture";
  }

  // Topic-driven scene selection based on section heading
  let scenePrompt = "";
  
  if (headingLower.includes("eco") || headingLower.includes("sustainable") || headingLower.includes("green")) {
    scenePrompt = "a modern eco-friendly villa with solar panels, lush tropical garden, sustainable materials, natural ventilation design";
  } else if (headingLower.includes("invest") || headingLower.includes("roi") || headingLower.includes("return")) {
    scenePrompt = "a premium modern workspace with city view, elegant desk with property documents (no readable text), laptop showing charts (blurred)";
  } else if (headingLower.includes("co-living") || headingLower.includes("community") || headingLower.includes("shared")) {
    scenePrompt = "a modern co-living common area with comfortable seating, natural materials, warm lighting, plants, social atmosphere (no identifiable faces)";
  } else if (headingLower.includes("legal") || headingLower.includes("law") || headingLower.includes("contract") || headingLower.includes("lease")) {
    scenePrompt = "a professional legal office with property documents on an elegant desk, fountain pen, modern decor, city view through window";
  } else if (headingLower.includes("luxury") || headingLower.includes("premium") || headingLower.includes("high-end")) {
    scenePrompt = "a stunning luxury property interior with floor-to-ceiling windows, premium materials, designer furniture, ocean or city view";
  } else if (headingLower.includes("villa") || headingLower.includes("house") || headingLower.includes("home")) {
    scenePrompt = "a modern luxury villa exterior with infinity pool, tropical landscaping, dramatic architecture, golden hour lighting";
  } else if (headingLower.includes("apartment") || headingLower.includes("condo") || headingLower.includes("unit")) {
    scenePrompt = "a modern high-rise apartment interior with panoramic views, open floor plan, premium finishes, natural light";
  } else if (headingLower.includes("market") || headingLower.includes("trend") || headingLower.includes("analysis")) {
    scenePrompt = "an aerial view of a developing real estate area with modern buildings, construction activity, growing neighborhood";
  } else if (headingLower.includes("lifestyle") || headingLower.includes("living")) {
    scenePrompt = "a serene lifestyle scene: morning coffee on a private terrace, tropical view, premium resort atmosphere";
  } else if (headingLower.includes("beach") || headingLower.includes("ocean") || headingLower.includes("sea")) {
    scenePrompt = "a beachfront property with direct ocean access, pristine sand, crystal clear water, palm trees, sunset lighting";
  } else if (headingLower.includes("pool") || headingLower.includes("outdoor")) {
    scenePrompt = "a stunning private infinity pool overlooking ocean or mountains, modern deck, tropical plants, resort-style living";
  } else if (headingLower.includes("faq") || headingLower.includes("question") || headingLower.includes("answer")) {
    scenePrompt = "a welcoming real estate consultation scene: modern office, comfortable seating, property brochures, professional atmosphere";
  } else {
    // Generic real estate scene
    scenePrompt = "a premium modern real estate exterior or interior with clean lines, natural light, tropical or urban setting";
  }

  // Variation based on section index
  const timeVariants = [
    "soft morning daylight",
    "golden hour warm light",
    "bright midday natural light",
    "late afternoon soft shadows"
  ];
  const timeOfDay = timeVariants[sectionIndex % timeVariants.length];

  const cameraVariants = [
    "shot on full-frame DSLR, 35mm lens, natural depth of field",
    "shot on full-frame DSLR, 24mm wide-angle, architectural perspective",
    "shot on full-frame DSLR, 50mm lens, elegant bokeh",
    "shot on full-frame DSLR, 28mm lens, environmental portrait style"
  ];
  const cameraLook = cameraVariants[sectionIndex % cameraVariants.length];

  return [
    "Create a HYPERREALISTIC photograph that looks exactly like a professional real estate magazine photo.",
    `Scene: ${scenePrompt}`,
    `Context: Section about "${sectionHeading}" in an article about "${pageTitle}"`,
    localeHint ? `Location atmosphere: ${localeHint}` : "",
    `Lighting: ${timeOfDay}`,
    `Technical: ${cameraLook}`,
    "Style: Premium real estate magazine editorial photography, natural colors, realistic textures",
    "Aspect ratio: 4:3 landscape format",
    "CRITICAL REQUIREMENTS for hyperrealism:",
    "- Must be INDISTINGUISHABLE from a real photograph taken by a professional photographer",
    "- Real camera characteristics: natural depth of field, subtle lens aberrations, realistic bokeh",
    "- Natural material textures: visible wood grain, fabric weave, stone pores, metal reflections",
    "- Realistic lighting: natural shadows, ambient occlusion, proper light falloff, subtle reflections",
    "- Absolutely NO text, watermarks, logos, or UI elements",
    "- NO illustration style, NO 3D render look, NO plastic/smooth CGI surfaces",
    "- If people appear, they must be unidentifiable (silhouettes, back view, or blurred)",
    "- High-end luxury real estate publication quality"
  ].filter(Boolean).join("\n");
}

/**
 * Generate SEO-optimized ALT text for landing page section images
 */
export function generateSectionImageAlt(sectionHeading: string, pageTitle: string): string {
  const cleanHeading = sectionHeading
    .replace(/[|–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  
  let altText = `${cleanHeading} - ${pageTitle}`;
  
  // Truncate if too long
  if (altText.length > 125) {
    altText = altText.substring(0, 120).replace(/\s+\S*$/, "") + "...";
  }
  
  return altText;
}

/**
 * Generate a filename for landing page section images
 */
export function generateSectionImageFilename(pageSlug: string, sectionIndex: number): string {
  const cleanSlug = pageSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  
  const timestamp = Date.now();
  return `${cleanSlug}-section-${sectionIndex + 1}-${timestamp}.webp`;
}


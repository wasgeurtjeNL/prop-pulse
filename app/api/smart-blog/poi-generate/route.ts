import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { 
  getPoiBlogData, 
  getAvailableDistricts,
  getPopularPois,
  getAvailableTemplates,
  type PoiBlogData 
} from '@/lib/actions/poi-blog.actions';
import { POI_BLOG_TEMPLATES } from '@/lib/services/poi-blog/templates';
import { slugify } from '@/lib/utils';
import { parseLocationToSlugs } from '@/lib/property-url';
import { revalidatePath } from 'next/cache';
import { imagekit } from '@/lib/imagekit';
import { 
  convertToWebP, 
  buildSectionImagePrompt,
  generateSectionImageAlt,
  generateSectionImageFilename,
  buildBlogImagePrompt,
  generateBlogCoverAlt,
  generateBlogImageFilename
} from '@/lib/utils/image-utils';

// ============================================
// TYPES
// ============================================

interface GenerateRequest {
  templateId: string;
  overrides?: {
    district?: string;
    poiName?: string;
    maxPrice?: number;
    minPrice?: number;
    limit?: number;
  };
  language?: 'en' | 'nl';
  autoPublish?: boolean;
  generateImages?: boolean; // Whether to generate AI images
}

interface GeneratedImage {
  url: string;
  alt: string;
}

// ============================================
// IMAGE GENERATION HELPER
// ============================================

async function generateBlogImage(
  openai: OpenAI,
  prompt: string,
  filename: string,
  folder: string = '/blogs/ai-generated'
): Promise<GeneratedImage | null> {
  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1.5',
      prompt: prompt,
      n: 1,
      size: '1536x1024', // GPT Image 1.5 supported landscape size
    });

    // GPT Image 1.5 returns base64 data by default
    const imageData = response.data?.[0];
    const b64Data = (imageData as { b64_json?: string })?.b64_json;
    const imageUrl = imageData?.url;

    let imageBuffer: Buffer;

    if (b64Data) {
      imageBuffer = Buffer.from(b64Data, 'base64');
    } else if (imageUrl) {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) return null;
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else {
      return null;
    }
    const webpResult = await convertToWebP(imageBuffer, {
      quality: 85,
      maxWidth: 1536,
      maxHeight: 1024,
    });

    // Upload to ImageKit
    const uploaded = await imagekit.upload({
      file: webpResult.buffer,
      fileName: filename,
      folder: folder,
    });

    return {
      url: uploaded.url,
      alt: '',
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

// ============================================
// GET - List available templates and options
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'templates';

    // Public endpoint for fetching properties (used by blog pages)
    if (action === 'properties') {
      const templateId = searchParams.get('templateId');
      const queryParamsStr = searchParams.get('queryParams');
      const limit = parseInt(searchParams.get('limit') || '6');
      
      if (!templateId) {
        return NextResponse.json({ error: 'templateId required' }, { status: 400 });
      }
      
      // Parse query params if provided
      let overrides = {};
      if (queryParamsStr) {
        try {
          overrides = JSON.parse(queryParamsStr);
        } catch {
          // Ignore parse errors, use defaults
        }
      }
      
      const result = await getPoiBlogData(templateId, { ...overrides, limit });
      
      if (!result.success || !result.data) {
        return NextResponse.json({ success: false, properties: [] });
      }
      
      // Transform to simplified format for frontend
      const properties = result.data.properties.map(p => {
        // Get slugs from database or generate from location
        const locationSlugs = parseLocationToSlugs(p.location);
        
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          location: p.location,
          beds: p.beds,
          baths: p.baths,
          sqft: p.sqft,
          image: p.image,
          type: p.priceNumeric > 500000 ? 'FOR_SALE' : 'FOR_RENT', // Simple heuristic
          // Add URL slugs for proper routing
          provinceSlug: (p as any).provinceSlug || locationSlugs.provinceSlug,
          areaSlug: (p as any).areaSlug || locationSlugs.areaSlug,
          nearestPoi: p.nearestPois[0] ? {
            name: p.nearestPois[0].name,
            distance: p.nearestPois[0].distanceFormatted,
          } : undefined,
        };
      });
      
      return NextResponse.json({ success: true, properties });
    }

    // All other actions require authentication
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'templates': {
        const result = await getAvailableTemplates();
        return NextResponse.json(result);
      }
      
      case 'districts': {
        const result = await getAvailableDistricts();
        return NextResponse.json(result);
      }
      
      case 'pois': {
        const category = searchParams.get('category');
        const categories = category ? [category] : undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await getPopularPois(categories as any);
        return NextResponse.json(result);
      }
      
      case 'preview': {
        // Preview what data would be used for a template
        const templateId = searchParams.get('templateId');
        const district = searchParams.get('district') || undefined;
        
        if (!templateId) {
          return NextResponse.json({ error: 'templateId required' }, { status: 400 });
        }
        
        const result = await getPoiBlogData(templateId, { district });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ 
          templates: POI_BLOG_TEMPLATES.map(t => ({
            id: t.id,
            title: t.titleTemplate,
            type: t.type,
            description: t.description,
          }))
        });
    }
  } catch (error: unknown) {
    console.error('POI Blog GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
// POST - Generate a POI-based blog
// ============================================

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { 
      templateId, 
      overrides, 
      language = 'en', 
      autoPublish = false,
      generateImages = true 
    } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    console.log(`🚀 Generating POI blog: template=${templateId}, district=${overrides?.district}`);

    // Step 1: Fetch POI + Property data
    const dataResult = await getPoiBlogData(templateId, overrides);
    
    if (!dataResult.success || !dataResult.data) {
      return NextResponse.json({ 
        success: false,
        error: dataResult.error || 'Failed to fetch property data' 
      }, { status: 400 });
    }

    const blogData = dataResult.data;

    if (blogData.properties.length < 3) {
      return NextResponse.json({ 
        success: false,
        error: `Only ${blogData.properties.length} properties found. Need at least 3 for a quality blog.`,
        data: blogData,
      }, { status: 400 });
    }

    console.log(`✓ Found ${blogData.properties.length} properties`);

    // Step 2: Get company context
    let companyProfile = null;
    try {
      companyProfile = await prisma.companyProfile.findUnique({
        where: { id: 'default' },
      });
    } catch {
      console.log('CompanyProfile not available');
    }

    // Step 3: Check OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const languageInstruction = language === 'nl'
      ? 'Schrijf de blog volledig in het Nederlands.'
      : 'Write the blog in English.';

    // Step 5: Generate the blog content
    console.log('🤖 Generating content with AI...');

    // HYBRID APPROACH: Generate EVERGREEN content with rich visual formatting
    // The blog will contain a dynamic property section that fetches live listings
    const systemPrompt = `You are a premium real estate content writer creating VISUALLY STUNNING, EVERGREEN blog posts.
${languageInstruction}

COMPANY CONTEXT:
${companyProfile?.description || 'Premium real estate in Phuket, Thailand'}
Target Audience: ${companyProfile?.targetAudience || 'International investors, expats, and retirees'}

YOUR TASK:
Write a comprehensive, beautifully formatted blog post about: ${blogData.template.description}
This is a "${blogData.template.type}" type article.

⚠️ CRITICAL - EVERGREEN CONTENT RULES:
1. DO NOT mention specific property names, titles, or prices - these change over time
2. DO NOT link to specific properties - a dynamic section will be added automatically
3. DO use the STATISTICS and AVERAGES provided (these represent current market data)
4. Write about the AREA, LIFESTYLE, and BENEFITS in a timeless way

STATISTICS TO REFERENCE (current market averages):
- Properties Available: ${blogData.stats.totalMatching}
${blogData.stats.saleCount > 0 ? `- FOR SALE: ${blogData.stats.saleCount} properties, avg ฿${blogData.stats.avgSalePrice?.toLocaleString()}, range ฿${blogData.stats.salePriceRange?.min.toLocaleString()} - ฿${blogData.stats.salePriceRange?.max.toLocaleString()}` : ''}
${blogData.stats.rentCount > 0 ? `- FOR RENT: ${blogData.stats.rentCount} properties, avg ฿${blogData.stats.avgRentPrice?.toLocaleString()}/month, range ฿${blogData.stats.rentPriceRange?.min.toLocaleString()} - ฿${blogData.stats.rentPriceRange?.max.toLocaleString()}/month` : ''}
${blogData.stats.avgBeachScore !== null ? `- Beach Proximity Score: ${blogData.stats.avgBeachScore}/100 average` : ''}
${blogData.stats.avgFamilyScore !== null ? `- Family-Friendly Score: ${blogData.stats.avgFamilyScore}/100 average` : ''}
${blogData.stats.avgConvenienceScore !== null ? `- Convenience Score: ${blogData.stats.avgConvenienceScore}/100 average` : ''}
${blogData.stats.avgQuietnessScore !== null ? `- Quietness Score: ${blogData.stats.avgQuietnessScore}/100 average` : ''}

📐 RICH HTML STRUCTURE (use these exact CSS classes and elements):

1. INTRO SECTION with hook:
<div class="blog-intro">
  <p class="lead">Opening hook paragraph - make it captivating and set the scene</p>
</div>

2. STATISTICS HIGHLIGHT BOX (use real data provided above):
<div class="stats-highlight">
  <div class="stat-item"><span class="stat-value">XX</span><span class="stat-label">Properties Available</span></div>
  <div class="stat-item"><span class="stat-value">฿XX</span><span class="stat-label">Average Price</span></div>
  <div class="stat-item"><span class="stat-value">XX/100</span><span class="stat-label">Beach Score</span></div>
</div>

3. CONTENT SECTIONS with image placeholders:
<!-- IMAGE_PLACEHOLDER_1: [descriptive scene for AI image] -->
<h2>Section Title</h2>
<p>Content paragraph...</p>

4. BLOCKQUOTE for key insights:
<blockquote class="insight-quote">
  <p>Important insight or lifestyle benefit that stands out</p>
</blockquote>

5. FEATURE LIST with icons:
<ul class="feature-list">
  <li><span class="feature-icon">🏖️</span><strong>Beach Access:</strong> Description...</li>
  <li><span class="feature-icon">🏫</span><strong>Schools:</strong> Description...</li>
  <li><span class="feature-icon">🛒</span><strong>Shopping:</strong> Description...</li>
</ul>

6. TIPS/ADVICE BOX:
<div class="tip-box">
  <h4>💡 Pro Tip</h4>
  <p>Helpful advice for buyers...</p>
</div>

7. FAQ as accordion-ready format:
<div class="faq-section">
  <div class="faq-item">
    <h4 class="faq-question">Question here?</h4>
    <p class="faq-answer">Answer here...</p>
  </div>
</div>

📸 IMAGE PLACEHOLDERS:
Include 2-3 image placeholders in your content using this EXACT format:
<!-- IMAGE_PLACEHOLDER_1: tropical luxury villa with infinity pool overlooking ocean -->
<!-- IMAGE_PLACEHOLDER_2: modern living room with panoramic sea view -->
These will be replaced with AI-generated images.

Return valid JSON:
{
  "title": "Compelling, SEO-optimized title",
  "metaTitle": "SEO title (50-65 chars)",
  "metaDescription": "Meta description with key stats (150-160 chars)",
  "excerpt": "2-3 sentence captivating summary",
  "content": "<article class='rich-blog-content'>Full HTML content with all formatting...</article>",
  "coverImagePrompt": "Brief description for cover image (e.g., 'aerial view of Phuket coastline with luxury villas')",
  "sections": [
    { "heading": "Section heading for image", "imagePrompt": "detailed scene description for that section" }
  ],
  "faq": [{ "question": "...", "answer": "..." }],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedSlug": "url-friendly-slug"
}`;

    // Build POI context for area description (without specific properties)
    const poiContext = buildPoiContext(blogData);

    const userPrompt = `Create a VISUALLY STUNNING blog post for: "${blogData.generatedTitle}"

=== LOCATION CONTEXT ===
${blogData.district ? `District: ${blogData.district}` : 'Region: Phuket, Thailand'}
${blogData.targetPoi ? `Featured POI: ${blogData.targetPoi.name} (${blogData.targetPoi.category})` : ''}
Template Type: ${blogData.template.type}
Template Focus: ${blogData.template.description}

=== NEARBY AMENITIES (from property data) ===
${poiContext}

=== MARKET STATISTICS (use these exact numbers) ===
- Total Properties: ${blogData.stats.totalMatching}
${blogData.stats.saleCount > 0 ? `- FOR SALE: ${blogData.stats.saleCount} properties, avg ฿${blogData.stats.avgSalePrice?.toLocaleString()}` : ''}
${blogData.stats.rentCount > 0 ? `- FOR RENT: ${blogData.stats.rentCount} properties, avg ฿${blogData.stats.avgRentPrice?.toLocaleString()}/mo` : ''}
${blogData.stats.avgBeachScore !== null ? `- Beach Score: ${blogData.stats.avgBeachScore}/100` : ''}
${blogData.stats.avgFamilyScore !== null ? `- Family Score: ${blogData.stats.avgFamilyScore}/100` : ''}
${blogData.stats.avgConvenienceScore !== null ? `- Convenience Score: ${blogData.stats.avgConvenienceScore}/100` : ''}
${blogData.stats.avgQuietnessScore !== null ? `- Quietness Score: ${blogData.stats.avgQuietnessScore}/100` : ''}

IMPORTANT:
1. Use the rich HTML formatting elements from the system prompt
2. Include 2-3 IMAGE_PLACEHOLDER comments for AI image generation
3. Use the stats-highlight box with REAL numbers from above
4. Make it visually engaging with blockquotes, feature lists, and tip boxes
5. Write evergreen content - no specific property names
6. A live property listing section will be added automatically at the end`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 5000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    console.log('✓ Content generated');

    let generatedBlog;
    try {
      generatedBlog = JSON.parse(result);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('AI returned invalid JSON');
    }

    // Step 6: Generate images (if enabled)
    const shouldGenerateImages = generateImages !== false; // Default to true
    let finalContent = generatedBlog.content;
    let coverImageUrl: string | null = null;
    let coverImageAlt: string | null = null;
    const generatedImages: { url: string; alt: string }[] = [];

    if (shouldGenerateImages) {
      console.log('🎨 Generating AI images...');
      
      // Generate cover image
      if (generatedBlog.coverImagePrompt) {
        console.log('  → Generating cover image...');
        const coverPrompt = buildBlogImagePrompt(
          generatedBlog.coverImagePrompt || generatedBlog.title,
          'luxury'
        );
        const coverFilename = generateBlogImageFilename(generatedBlog.title, 'cover');
        const coverImage = await generateBlogImage(openai, coverPrompt, coverFilename);
        
        if (coverImage) {
          coverImageUrl = coverImage.url;
          coverImageAlt = generateBlogCoverAlt(generatedBlog.title);
          console.log('  ✓ Cover image generated');
        }
      }

      // Generate section images from placeholders
      const placeholderRegex = /<!-- IMAGE_PLACEHOLDER_(\d+): (.+?) -->/g;
      const placeholders = [...finalContent.matchAll(placeholderRegex)];
      
      for (const match of placeholders) {
        const [fullMatch, index, description] = match;
        console.log(`  → Generating section image ${index}: ${description.substring(0, 40)}...`);
        
        const sectionPrompt = buildSectionImagePrompt(
          description,
          generatedBlog.title,
          parseInt(index)
        );
        const sectionFilename = generateSectionImageFilename(
          generatedBlog.suggestedSlug || 'blog',
          parseInt(index)
        );
        const sectionImage = await generateBlogImage(openai, sectionPrompt, sectionFilename);
        
        if (sectionImage) {
          const imageAlt = generateSectionImageAlt(description, generatedBlog.title);
          const imageHtml = `
<figure class="blog-image">
  <img src="${sectionImage.url}" alt="${imageAlt}" loading="lazy" />
  <figcaption>${description}</figcaption>
</figure>`;
          finalContent = finalContent.replace(fullMatch, imageHtml);
          generatedImages.push({ url: sectionImage.url, alt: imageAlt });
          console.log(`  ✓ Section image ${index} generated`);
        } else {
          // Remove placeholder if image generation failed
          finalContent = finalContent.replace(fullMatch, '');
        }
      }
      
      console.log(`✓ Generated ${generatedImages.length + (coverImageUrl ? 1 : 0)} images`);
    } else {
      // Remove all image placeholders if not generating images
      finalContent = finalContent.replace(/<!-- IMAGE_PLACEHOLDER_\d+: .+? -->/g, '');
    }

    // Step 7: Create the blog post
    const baseSlug = generatedBlog.suggestedSlug || slugify(generatedBlog.title);
    let slug = baseSlug;

    // Check for duplicate and add suffix if needed
    const existing = await prisma.blog.findFirst({
      where: { slug },
    });

    if (existing) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    // Build query params to store for dynamic property fetching
    const queryParamsToStore = {
      ...blogData.template.query,
      ...overrides,
    };

    // Create the blog with generated images
    const blog = await prisma.blog.create({
      data: {
        title: generatedBlog.title || blogData.generatedTitle,
        slug,
        excerpt: generatedBlog.excerpt,
        content: finalContent,
        image: coverImageUrl || undefined,
        imageAlt: coverImageAlt || undefined,
        metaTitle: generatedBlog.metaTitle,
        metaDescription: generatedBlog.metaDescription,
        tag: blogData.template.suggestedTags[0] || generatedBlog.suggestedTags?.[0] || null,
        published: autoPublish,
        publishedAt: autoPublish ? new Date() : null,
        authorId: session.user.id,
      },
    });

    // Update POI metadata using raw SQL (workaround for cached Prisma client)
    await prisma.$executeRaw`
      UPDATE blog 
      SET poi_template_id = ${templateId},
          poi_query_params = ${JSON.stringify(queryParamsToStore)}::jsonb,
          has_dynamic_properties = true
      WHERE id = ${blog.id}
    `;

    console.log(`✓ Blog created: ${blog.slug}`);

    // Revalidate paths
    revalidatePath('/dashboard/blogs');
    revalidatePath('/blogs');
    if (autoPublish) {
      revalidatePath(`/blogs/${blog.slug}`);
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        published: blog.published,
        coverImage: coverImageUrl,
      },
      meta: {
        templateUsed: templateId,
        propertiesFeatured: blogData.properties.length,
        district: blogData.district,
        targetPoi: blogData.targetPoi?.name,
        imagesGenerated: generatedImages.length + (coverImageUrl ? 1 : 0),
      },
      stats: blogData.stats,
    });

  } catch (error: unknown) {
    console.error('POI Blog Generation Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate POI blog';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build POI context from property data - focuses on area amenities
 * without mentioning specific properties
 */
function buildPoiContext(data: PoiBlogData): string {
  // Collect all unique POIs across properties
  const poiMap = new Map<string, { name: string; category: string; minDistance: string }>();
  
  for (const property of data.properties) {
    for (const poi of property.nearestPois) {
      const key = poi.name;
      if (!poiMap.has(key)) {
        poiMap.set(key, {
          name: poi.name,
          category: poi.category,
          minDistance: poi.distanceFormatted,
        });
      }
    }
  }

  // Group by category
  const categories = new Map<string, string[]>();
  for (const [, poi] of poiMap) {
    const cat = poi.category;
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)?.push(`${poi.name} (within ${poi.minDistance})`);
  }

  // Format output
  const lines: string[] = [];
  for (const [category, pois] of categories) {
    const label = category.replace(/_/g, ' ').toLowerCase();
    lines.push(`${label}: ${pois.slice(0, 3).join(', ')}`);
  }

  return lines.join('\n') || 'Various amenities nearby';
}


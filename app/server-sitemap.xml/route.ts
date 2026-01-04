import { getServerSideSitemap, ISitemapField } from 'next-sitemap';
import { getProperties } from '@/lib/actions/property.actions';
import { getPublishedBlogs } from '@/lib/actions/blog.actions';

/**
 * Safely convert a date to ISO string, handling both Date objects and strings
 */
function toISOString(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  
  if (typeof date === 'string') {
    // Already a string - check if it's valid ISO format
    if (date.includes('T')) return date;
    // Try to parse it
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
  }
  
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  return new Date().toISOString();
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://prop-pulse-nine.vercel.app';
  
  const fields: ISitemapField[] = [];
  
  // Fetch dynamic property routes
  try {
    const properties = await getProperties({});
    
    for (const property of properties) {
      const province = property.provinceSlug || 'phuket';
      const area = property.areaSlug || 'other';
      
      fields.push({
        loc: `${baseUrl}/properties/${province}/${area}/${property.slug}`,
        lastmod: toISOString(property.updatedAt || property.createdAt),
        changefreq: 'weekly',
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error('Error fetching properties for server sitemap:', error);
  }
  
  // Fetch dynamic blog routes
  try {
    const blogs = await getPublishedBlogs();
    
    for (const blog of blogs) {
      fields.push({
        loc: `${baseUrl}/blogs/${blog.slug}`,
        lastmod: toISOString(blog.updatedAt || blog.publishedAt),
        changefreq: 'monthly',
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error('Error fetching blogs for server sitemap:', error);
  }
  
  return getServerSideSitemap(fields);
}


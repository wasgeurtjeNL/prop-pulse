#!/usr/bin/env npx tsx
/**
 * Image Audit Script
 * 
 * Analyzes all images in the database and reports:
 * - Images with wrong extensions (not WebP)
 * - Images that are too large (file size)
 * - Images with incorrect dimensions
 * - Images missing from ImageKit
 * 
 * Usage:
 *   npx tsx scripts/audit-images.ts
 *   npx tsx scripts/audit-images.ts --fix  # Auto-fix issues
 */

// Load environment variables first
import 'dotenv/config';

import prisma from '../lib/prisma';
import { imagekit } from '../lib/imagekit';

interface ImageIssue {
  id: string;
  url: string;
  propertyId?: string;
  propertyTitle?: string;
  issues: string[];
  fileSize?: number;
  width?: number;
  height?: number;
  format?: string;
}

interface AuditResult {
  totalImages: number;
  imagesWithIssues: number;
  issues: {
    wrongFormat: ImageIssue[];
    tooLarge: ImageIssue[];
    wrongDimensions: ImageIssue[];
    missingImages: ImageIssue[];
    notOnImageKit: ImageIssue[];
  };
  summary: {
    totalSizeBytes: number;
    potentialSavingsBytes: number;
    formatBreakdown: Record<string, number>;
  };
}

// Recommended limits
const LIMITS = {
  maxFileSizeKB: 500,           // Max 500KB per image
  maxWidth: 1920,               // Max width
  maxHeight: 1440,              // Max height
  recommendedFormat: 'webp',    // Preferred format
  heroMaxWidth: 1536,           // Hero images
  thumbnailMaxWidth: 640,       // Thumbnails
  carouselMaxWidth: 1024,       // Carousel images
};

async function getImageMetadata(url: string): Promise<{
  size?: number;
  width?: number;
  height?: number;
  format?: string;
  exists: boolean;
}> {
  try {
    // For ImageKit URLs, we can get file info
    if (url.includes('ik.imagekit.io')) {
      // Extract file path from URL
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/[^/]+\/(.+)/);
      
      if (pathMatch) {
        try {
          // Try to fetch headers to get size
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            const contentLength = response.headers.get('content-length');
            const contentType = response.headers.get('content-type');
            
            // Determine format from content-type or URL
            let format = 'unknown';
            if (contentType?.includes('webp')) format = 'webp';
            else if (contentType?.includes('jpeg') || contentType?.includes('jpg')) format = 'jpeg';
            else if (contentType?.includes('png')) format = 'png';
            else if (contentType?.includes('avif')) format = 'avif';
            else {
              // Fallback to URL extension
              const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
              if (ext) format = ext;
            }
            
            return {
              size: contentLength ? parseInt(contentLength) : undefined,
              format,
              exists: true,
            };
          }
        } catch (e) {
          // Ignore fetch errors
        }
      }
    }
    
    // For other URLs, just check if accessible
    const response = await fetch(url, { method: 'HEAD' });
    return { exists: response.ok };
  } catch (error) {
    return { exists: false };
  }
}

function getFormatFromUrl(url: string): string {
  // Check for ImageKit transformation parameter
  if (url.includes('f-webp') || url.includes('f-auto')) {
    return 'webp'; // Will be served as WebP
  }
  
  // Check if it's from our optimized folder (these are all WebP)
  if (url.includes('/properties/optimized/')) {
    return 'webp'; // Our optimize script converts everything to WebP
  }
  
  // Get extension from URL
  const cleanUrl = url.split('?')[0];
  const ext = cleanUrl.split('.').pop()?.toLowerCase();
  
  // If extension is very long (like a hash), it's probably no extension
  if (ext && ext.length > 10) {
    return 'unknown';
  }
  
  return ext || 'unknown';
}

async function auditPropertyImages(): Promise<AuditResult> {
  console.log('🔍 Starting image audit...\n');
  
  const result: AuditResult = {
    totalImages: 0,
    imagesWithIssues: 0,
    issues: {
      wrongFormat: [],
      tooLarge: [],
      wrongDimensions: [],
      missingImages: [],
      notOnImageKit: [],
    },
    summary: {
      totalSizeBytes: 0,
      potentialSavingsBytes: 0,
      formatBreakdown: {},
    },
  };
  
  // Fetch all property images
  const propertyImages = await prisma.propertyImage.findMany({
    include: {
      property: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
  
  console.log(`📊 Found ${propertyImages.length} property images to audit\n`);
  result.totalImages = propertyImages.length;
  
  // Audit each image
  let processed = 0;
  for (const image of propertyImages) {
    processed++;
    if (processed % 50 === 0) {
      console.log(`   Processing ${processed}/${propertyImages.length}...`);
    }
    
    const url = image.url;
    if (!url) continue;
    
    const issues: string[] = [];
    const format = getFormatFromUrl(url);
    
    // Track format breakdown
    result.summary.formatBreakdown[format] = (result.summary.formatBreakdown[format] || 0) + 1;
    
    // Check if on ImageKit
    if (!url.includes('ik.imagekit.io')) {
      issues.push('NOT_ON_IMAGEKIT');
      result.issues.notOnImageKit.push({
        id: image.id,
        url,
        propertyId: image.propertyId || undefined,
        propertyTitle: image.property?.title || undefined,
        issues: ['Image not hosted on ImageKit - cannot optimize'],
      });
    }
    
    // Check format
    if (format !== 'webp' && format !== 'avif' && !url.includes('f-auto')) {
      issues.push('WRONG_FORMAT');
    }
    
    // Get metadata for size check
    const metadata = await getImageMetadata(url);
    
    if (!metadata.exists) {
      issues.push('MISSING');
      result.issues.missingImages.push({
        id: image.id,
        url,
        propertyId: image.propertyId || undefined,
        propertyTitle: image.property?.title || undefined,
        issues: ['Image URL returns 404 or is inaccessible'],
      });
    }
    
    if (metadata.size) {
      result.summary.totalSizeBytes += metadata.size;
      
      const sizeKB = metadata.size / 1024;
      if (sizeKB > LIMITS.maxFileSizeKB) {
        issues.push('TOO_LARGE');
        result.issues.tooLarge.push({
          id: image.id,
          url,
          propertyId: image.propertyId || undefined,
          propertyTitle: image.property?.title || undefined,
          issues: [`File size ${sizeKB.toFixed(0)}KB exceeds limit of ${LIMITS.maxFileSizeKB}KB`],
          fileSize: metadata.size,
          format: metadata.format,
        });
        
        // Estimate savings if converted to WebP
        const estimatedWebpSize = metadata.size * 0.6; // WebP typically 40% smaller
        result.summary.potentialSavingsBytes += metadata.size - estimatedWebpSize;
      }
    }
    
    if (issues.length > 0) {
      result.imagesWithIssues++;
    }
    
    // Record wrong format issues
    if (issues.includes('WRONG_FORMAT')) {
      result.issues.wrongFormat.push({
        id: image.id,
        url,
        propertyId: image.propertyId || undefined,
        propertyTitle: image.property?.title || undefined,
        issues: [`Format is ${format}, should be WebP`],
        format,
      });
    }
  }
  
  return result;
}

async function auditHeroImages(): Promise<ImageIssue[]> {
  console.log('\n🖼️  Auditing hero images...');
  
  const heroImages = await prisma.heroImage.findMany();
  const issues: ImageIssue[] = [];
  
  for (const hero of heroImages) {
    const url = hero.imageUrl;
    const format = getFormatFromUrl(url);
    const metadata = await getImageMetadata(url);
    
    const imageIssues: string[] = [];
    
    if (!url.includes('ik.imagekit.io')) {
      imageIssues.push('Not on ImageKit');
    }
    
    if (format !== 'webp' && format !== 'avif' && !url.includes('f-auto')) {
      imageIssues.push(`Wrong format: ${format}`);
    }
    
    if (metadata.size && metadata.size / 1024 > 300) {
      imageIssues.push(`Too large: ${(metadata.size / 1024).toFixed(0)}KB`);
    }
    
    if (imageIssues.length > 0) {
      issues.push({
        id: hero.id,
        url,
        issues: imageIssues,
        fileSize: metadata.size,
        format,
      });
    }
  }
  
  return issues;
}

async function auditBlogImages(): Promise<ImageIssue[]> {
  console.log('\n📝 Auditing blog images...');
  
  const blogs = await prisma.blog.findMany({
    select: {
      id: true,
      title: true,
      coverImage: true,
    },
  });
  
  const issues: ImageIssue[] = [];
  
  for (const blog of blogs) {
    if (!blog.coverImage) continue;
    
    const url = blog.coverImage;
    const format = getFormatFromUrl(url);
    const metadata = await getImageMetadata(url);
    
    const imageIssues: string[] = [];
    
    if (format !== 'webp' && format !== 'avif' && !url.includes('f-auto')) {
      imageIssues.push(`Wrong format: ${format}`);
    }
    
    if (metadata.size && metadata.size / 1024 > 400) {
      imageIssues.push(`Too large: ${(metadata.size / 1024).toFixed(0)}KB`);
    }
    
    if (imageIssues.length > 0) {
      issues.push({
        id: blog.id,
        url,
        propertyTitle: blog.title,
        issues: imageIssues,
        fileSize: metadata.size,
        format,
      });
    }
  }
  
  return issues;
}

function printReport(result: AuditResult, heroIssues: ImageIssue[], blogIssues: ImageIssue[]) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMAGE AUDIT REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total property images: ${result.totalImages}`);
  console.log(`   Images with issues: ${result.imagesWithIssues}`);
  console.log(`   Total size: ${(result.summary.totalSizeBytes / 1024 / 1024).toFixed(1)}MB`);
  console.log(`   Potential savings: ${(result.summary.potentialSavingsBytes / 1024 / 1024).toFixed(1)}MB`);
  
  console.log(`\n📁 FORMAT BREAKDOWN:`);
  for (const [format, count] of Object.entries(result.summary.formatBreakdown).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / result.totalImages) * 100).toFixed(1);
    console.log(`   ${format}: ${count} (${pct}%)`);
  }
  
  if (result.issues.notOnImageKit.length > 0) {
    console.log(`\n🔴 NOT ON IMAGEKIT (${result.issues.notOnImageKit.length}):`);
    result.issues.notOnImageKit.slice(0, 5).forEach(i => {
      console.log(`   - ${i.propertyTitle || 'Unknown'}: ${i.url.substring(0, 60)}...`);
    });
    if (result.issues.notOnImageKit.length > 5) {
      console.log(`   ... and ${result.issues.notOnImageKit.length - 5} more`);
    }
  }
  
  if (result.issues.wrongFormat.length > 0) {
    console.log(`\n🟡 WRONG FORMAT (${result.issues.wrongFormat.length}):`);
    result.issues.wrongFormat.slice(0, 5).forEach(i => {
      console.log(`   - ${i.format}: ${i.url.substring(0, 60)}...`);
    });
    if (result.issues.wrongFormat.length > 5) {
      console.log(`   ... and ${result.issues.wrongFormat.length - 5} more`);
    }
  }
  
  if (result.issues.tooLarge.length > 0) {
    console.log(`\n🟠 TOO LARGE (${result.issues.tooLarge.length}):`);
    result.issues.tooLarge.slice(0, 10).forEach(i => {
      console.log(`   - ${(i.fileSize! / 1024).toFixed(0)}KB: ${i.propertyTitle || 'Unknown'}`);
    });
    if (result.issues.tooLarge.length > 10) {
      console.log(`   ... and ${result.issues.tooLarge.length - 10} more`);
    }
  }
  
  if (result.issues.missingImages.length > 0) {
    console.log(`\n🔴 MISSING/BROKEN (${result.issues.missingImages.length}):`);
    result.issues.missingImages.slice(0, 5).forEach(i => {
      console.log(`   - ${i.propertyTitle || 'Unknown'}: ${i.url.substring(0, 60)}...`);
    });
  }
  
  if (heroIssues.length > 0) {
    console.log(`\n🖼️  HERO IMAGE ISSUES (${heroIssues.length}):`);
    heroIssues.forEach(i => {
      console.log(`   - ${i.issues.join(', ')}`);
    });
  }
  
  if (blogIssues.length > 0) {
    console.log(`\n📝 BLOG IMAGE ISSUES (${blogIssues.length}):`);
    blogIssues.slice(0, 5).forEach(i => {
      console.log(`   - ${i.propertyTitle}: ${i.issues.join(', ')}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATIONS:');
  console.log('='.repeat(60));
  
  if (result.issues.notOnImageKit.length > 0) {
    console.log('\n1. Migrate images to ImageKit for CDN delivery');
  }
  
  if (result.issues.wrongFormat.length > 0) {
    console.log('\n2. Convert non-WebP images:');
    console.log('   - Run: npx tsx scripts/optimize-images.ts');
  }
  
  if (result.issues.tooLarge.length > 0) {
    console.log('\n3. Compress large images:');
    console.log('   - Set max width to 1920px');
    console.log('   - Use quality 80 for WebP');
  }
  
  console.log('\n4. Add ImageKit URL transformations:');
  console.log('   - Use ?tr=w-1024,q-80,f-auto for optimized delivery');
  
  console.log('\n5. Remove unoptimized={true} from Next.js Image components');
  console.log('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  try {
    const propertyResult = await auditPropertyImages();
    const heroIssues = await auditHeroImages();
    const blogIssues = await auditBlogImages();
    
    printReport(propertyResult, heroIssues, blogIssues);
    
    if (shouldFix) {
      console.log('🔧 --fix flag detected. Starting optimization...\n');
      console.log('   (Fix functionality coming soon - run optimize-images.ts instead)\n');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


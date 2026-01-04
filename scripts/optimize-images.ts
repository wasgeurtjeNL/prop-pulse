#!/usr/bin/env npx tsx
/**
 * Image Optimization Script
 * 
 * Automatically optimizes images in the database:
 * - Converts to WebP format
 * - Resizes to appropriate dimensions
 * - Compresses to target file size
 * - Updates database URLs
 * 
 * Usage:
 *   npx tsx scripts/optimize-images.ts              # Dry run - shows what would be changed
 *   npx tsx scripts/optimize-images.ts --execute    # Actually perform optimizations
 *   npx tsx scripts/optimize-images.ts --property PP-0045  # Optimize specific property
 */

// Load environment variables first
import 'dotenv/config';

import prisma from '../lib/prisma';
import { imagekit } from '../lib/imagekit';
import sharp from 'sharp';

// Optimization settings - CONSERVATIVE to preserve quality
const SETTINGS = {
  propertyImage: {
    maxWidth: 1920,
    maxHeight: 1440,
    quality: 85, // High quality to preserve details
    minQuality: 75, // Never go below this
  },
  thumbnail: {
    maxWidth: 640,
    maxHeight: 480,
    quality: 80,
    minQuality: 70,
  },
  hero: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 90, // Very high for hero images
    minQuality: 80,
  },
  carousel: {
    maxWidth: 1024,
    maxHeight: 768,
    quality: 85,
    minQuality: 75,
  },
  targetSizeKB: 500, // Higher target = better quality
  skipAlreadyOptimized: true, // Don't re-compress optimized images
};

interface OptimizationResult {
  id: string;
  originalUrl: string;
  newUrl?: string;
  originalSize: number;
  newSize?: number;
  savings?: number;
  status: 'optimized' | 'skipped' | 'failed';
  reason?: string;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function optimizeAndUpload(
  buffer: Buffer,
  fileName: string,
  folder: string,
  settings: { maxWidth: number; maxHeight: number; quality: number; minQuality?: number }
): Promise<{ url: string; size: number; finalQuality: number } | null> {
  try {
    // Get original metadata
    const metadata = await sharp(buffer).metadata();
    const minQuality = settings.minQuality || 75; // Conservative default
    
    // Optimize with Sharp
    let sharpInstance = sharp(buffer);
    
    // Resize if needed
    if (metadata.width && metadata.width > settings.maxWidth) {
      sharpInstance = sharpInstance.resize({
        width: settings.maxWidth,
        height: settings.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convert to WebP with high quality
    const optimizedBuffer = await sharpInstance
      .webp({
        quality: settings.quality,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();
    
    // Only reduce quality if REALLY necessary, and never below minQuality
    let finalBuffer = optimizedBuffer;
    let currentQuality = settings.quality;
    
    // Only compress more if file is very large (> 1MB) and quality is above minimum
    while (finalBuffer.length > SETTINGS.targetSizeKB * 1024 * 2 && currentQuality > minQuality) {
      currentQuality -= 5; // Smaller steps for quality reduction
      finalBuffer = await sharp(buffer)
        .resize({
          width: settings.maxWidth,
          height: settings.maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: currentQuality,
          effort: 4,
        })
        .toBuffer();
    }
    
    // Ensure filename has .webp extension
    const webpFileName = fileName.replace(/\.[^.]+$/, '.webp');
    
    // Upload to ImageKit
    const uploaded = await imagekit.upload({
      file: finalBuffer,
      fileName: webpFileName,
      folder: folder,
      tags: ['optimized', 'webp', `q${currentQuality}`], // Tag with quality level
    });
    
    return {
      url: uploaded.url,
      size: finalBuffer.length,
      finalQuality: currentQuality,
    };
  } catch (error) {
    console.error('Optimization failed:', error);
    return null;
  }
}

async function optimizePropertyImages(
  propertySlug?: string,
  dryRun: boolean = true
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];
  
  // Build query
  const where = propertySlug 
    ? { property: { slug: propertySlug } }
    : {};
  
  const images = await prisma.propertyImage.findMany({
    where,
    include: {
      property: {
        select: { slug: true, title: true },
      },
    },
    take: dryRun ? 50 : undefined, // Limit for dry run
  });
  
  console.log(`\n📷 Found ${images.length} images to process\n`);
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const url = image.url;
    
    if (!url) {
      results.push({
        id: image.id,
        originalUrl: '',
        originalSize: 0,
        status: 'skipped',
        reason: 'No URL',
      });
      continue;
    }
    
    // Check if already optimized - SKIP to prevent quality degradation
    if (SETTINGS.skipAlreadyOptimized) {
      // Skip if in 'optimized' folder (already processed by this script)
      if (url.includes('/optimized/') || url.includes('/properties/optimized')) {
        results.push({
          id: image.id,
          originalUrl: url,
          originalSize: 0,
          status: 'skipped',
          reason: '⏭️ Already in optimized folder - skipping to preserve quality',
        });
        continue;
      }
      
      // Skip if already WebP and reasonably sized
      if (url.includes('.webp') && url.includes('ik.imagekit.io')) {
        const response = await fetch(url, { method: 'HEAD' });
        const size = parseInt(response.headers.get('content-length') || '0');
        
        // Skip if already under 500KB (already optimized enough)
        if (size < 500 * 1024) {
          results.push({
            id: image.id,
            originalUrl: url,
            originalSize: size,
            status: 'skipped',
            reason: `✓ Already WebP (${(size / 1024).toFixed(0)}KB) - good quality`,
          });
          continue;
        }
      }
    }
    
    console.log(`[${i + 1}/${images.length}] Processing: ${image.property?.title || 'Unknown'}...`);
    
    if (dryRun) {
      // Just report what would be done
      const response = await fetch(url, { method: 'HEAD' });
      const size = parseInt(response.headers.get('content-length') || '0');
      
      results.push({
        id: image.id,
        originalUrl: url,
        originalSize: size,
        status: 'skipped',
        reason: `Would optimize: ${(size / 1024).toFixed(0)}KB → ~${(size * 0.6 / 1024).toFixed(0)}KB`,
      });
    } else {
      // Actually optimize
      const buffer = await downloadImage(url);
      
      if (!buffer) {
        results.push({
          id: image.id,
          originalUrl: url,
          originalSize: 0,
          status: 'failed',
          reason: 'Failed to download',
        });
        continue;
      }
      
      const result = await optimizeAndUpload(
        buffer,
        `${image.property?.slug || 'property'}-${image.id}`,
        '/properties/optimized',
        SETTINGS.propertyImage
      );
      
      if (result) {
        // Update database
        await prisma.propertyImage.update({
          where: { id: image.id },
          data: { url: result.url },
        });
        
        const savings = buffer.length - result.size;
        
        results.push({
          id: image.id,
          originalUrl: url,
          newUrl: result.url,
          originalSize: buffer.length,
          newSize: result.size,
          savings,
          status: 'optimized',
        });
        
        console.log(`   ✅ ${(buffer.length / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB (saved ${(savings / 1024).toFixed(0)}KB) [Q${result.finalQuality}]`);
      } else {
        results.push({
          id: image.id,
          originalUrl: url,
          originalSize: buffer.length,
          status: 'failed',
          reason: 'Optimization failed',
        });
      }
    }
  }
  
  return results;
}

function printSummary(results: OptimizationResult[]) {
  const optimized = results.filter(r => r.status === 'optimized');
  const skipped = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status === 'failed');
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNewSize = optimized.reduce((sum, r) => sum + (r.newSize || 0), 0);
  const totalSavings = optimized.reduce((sum, r) => sum + (r.savings || 0), 0);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Optimized: ${optimized.length}`);
  console.log(`   Skipped: ${skipped.length}`);
  console.log(`   Failed: ${failed.length}`);
  console.log(`   Total savings: ${(totalSavings / 1024 / 1024).toFixed(1)}MB`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed items:');
    failed.forEach(f => {
      console.log(`   - ${f.id}: ${f.reason}`);
    });
  }
  
  console.log('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const propertyIndex = args.indexOf('--property');
  const propertySlug = propertyIndex >= 0 ? args[propertyIndex + 1] : undefined;
  
  console.log('🖼️  Image Optimization Script');
  console.log('='.repeat(50));
  console.log(`   Mode: ${execute ? '🔧 EXECUTE' : '👀 DRY RUN'}`);
  if (propertySlug) {
    console.log(`   Property: ${propertySlug}`);
  }
  console.log('');
  
  if (!execute) {
    console.log('💡 This is a DRY RUN. Add --execute to actually optimize images.\n');
  }
  
  try {
    const results = await optimizePropertyImages(propertySlug, !execute);
    printSummary(results);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


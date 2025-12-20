import ImageKit from "imagekit";

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

/**
 * ImageKit URL transformation options
 */
interface ImageKitTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blur?: number;
  /** Focus area for smart cropping */
  focus?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right' | 'face';
}

/**
 * Get optimized ImageKit URL with transformations
 * Works for any ImageKit URL by appending transformation parameters
 * 
 * @example
 * getOptimizedImageUrl('https://ik.imagekit.io/xxx/image.jpg', { width: 400, quality: 80 })
 * // Returns: https://ik.imagekit.io/xxx/image.jpg?tr=w-400,q-80,f-auto
 */
export function getOptimizedImageUrl(
  url: string, 
  options: ImageKitTransformOptions = {}
): string {
  // Only transform ImageKit URLs
  if (!url.includes('ik.imagekit.io')) {
    return url;
  }

  const transforms: string[] = [];
  
  if (options.width) transforms.push(`w-${options.width}`);
  if (options.height) transforms.push(`h-${options.height}`);
  if (options.quality) transforms.push(`q-${options.quality}`);
  if (options.blur) transforms.push(`bl-${options.blur}`);
  if (options.focus) transforms.push(`fo-${options.focus}`);
  
  // Always use auto format for best compression (WebP/AVIF based on browser support)
  transforms.push(`f-${options.format || 'auto'}`);
  
  if (transforms.length === 0) return url;
  
  // Handle URLs that already have query parameters
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tr=${transforms.join(',')}`;
}

/**
 * Generate responsive image srcset for ImageKit images
 * Creates multiple sizes for responsive loading
 */
export function getImageKitSrcSet(
  url: string,
  widths: number[] = [320, 640, 768, 1024, 1280],
  quality: number = 75
): string {
  if (!url.includes('ik.imagekit.io')) {
    return '';
  }

  return widths
    .map(width => `${getOptimizedImageUrl(url, { width, quality })} ${width}w`)
    .join(', ');
}

/**
 * Generate a tiny blur placeholder URL for LQIP (Low Quality Image Placeholder)
 * Returns a very small, blurred version of the image (~1-2KB)
 * 
 * @example
 * getBlurPlaceholderUrl('https://ik.imagekit.io/xxx/image.jpg')
 * // Returns: https://ik.imagekit.io/xxx/image.jpg?tr=w-40,q-20,bl-10,f-auto
 */
export function getBlurPlaceholderUrl(url: string): string {
  if (!url || !url.includes('ik.imagekit.io')) {
    return '';
  }
  
  // Generate a tiny blurred version: 40px wide, 20% quality, blur 10
  return getOptimizedImageUrl(url, { 
    width: 40, 
    quality: 20, 
    blur: 10 
  });
}
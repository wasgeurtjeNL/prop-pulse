import { getHeroImages } from '@/lib/actions/hero-image.actions';
import { getOptimizedImageUrl, getImageKitSrcSet } from '@/lib/imagekit';

/**
 * Server component that preloads hero images for faster LCP
 * Uses ImageKit transformations for optimal image delivery:
 * - Smaller file sizes with quality optimization
 * - Auto format (WebP/AVIF) based on browser support
 * - Responsive srcset for mobile devices
 */
export default async function HeroImagePreloader() {
  const result = await getHeroImages('home');
  const images = result.data || [];
  
  // Fallback to default hero image if no database images
  const defaultImage = '/images/hero/heroBanner.png';
  
  if (images.length === 0) {
    return (
      <link
        rel="preload"
        as="image"
        href={defaultImage}
        fetchPriority="high"
      />
    );
  }

  const mobileImage = images.find(img => img.deviceType === 'MOBILE');
  const desktopImage = images.find(img => img.deviceType === 'DESKTOP');

  return (
    <>
      {/* Mobile hero image - optimized for smaller screens */}
      {mobileImage && (
        <link
          rel="preload"
          as="image"
          href={getOptimizedImageUrl(mobileImage.imageUrl, { 
            width: 480, 
            quality: 75,
            focus: 'auto'
          })}
          imageSrcSet={getImageKitSrcSet(mobileImage.imageUrl, [320, 480, 640, 750], 75)}
          imageSizes="100vw"
          fetchPriority="high"
          media="(max-width: 1023px)"
        />
      )}
      
      {/* Desktop hero image - higher quality for larger screens */}
      {desktopImage && (
        <link
          rel="preload"
          as="image"
          href={getOptimizedImageUrl(desktopImage.imageUrl, { 
            width: 1280, 
            quality: 80 
          })}
          imageSrcSet={getImageKitSrcSet(desktopImage.imageUrl, [1024, 1280, 1536, 1920], 80)}
          imageSizes="100vw"
          fetchPriority="high"
          media="(min-width: 1024px)"
        />
      )}
    </>
  );
}

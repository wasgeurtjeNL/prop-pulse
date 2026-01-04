import { getHeroImages } from '@/lib/actions/hero-image.actions';

/**
 * Server component that preloads hero images for faster LCP
 * 
 * CRITICAL: This must generate the EXACT same URLs that Next.js Image will use
 * Otherwise the preloaded resources won't be used (wasted bandwidth + no LCP benefit)
 * 
 * Next.js default loader format: /_next/image?url=<encoded_url>&w=<width>&q=<quality>
 */

/**
 * Generate a Next.js Image URL that matches the default loader output
 */
function getNextImageUrl(src: string, width: number, quality: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

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
        href={getNextImageUrl(defaultImage, 1920, 75)}
        fetchPriority="high"
      />
    );
  }

  const mobileImage = images.find(img => img.deviceType === 'MOBILE');
  const desktopImage = images.find(img => img.deviceType === 'DESKTOP');

  // Quality values MUST match the Image component quality props
  // Hero desktop uses quality={80}, mobile uses quality={75}
  const MOBILE_QUALITY = 75;
  const DESKTOP_QUALITY = 80;

  // Generate srcset that matches Next.js Image output
  // These widths correspond to deviceSizes in next.config.ts
  const mobileSrcSet = mobileImage ? [
    `${getNextImageUrl(mobileImage.imageUrl, 640, MOBILE_QUALITY)} 640w`,
    `${getNextImageUrl(mobileImage.imageUrl, 750, MOBILE_QUALITY)} 750w`,
    `${getNextImageUrl(mobileImage.imageUrl, 828, MOBILE_QUALITY)} 828w`,
    `${getNextImageUrl(mobileImage.imageUrl, 1080, MOBILE_QUALITY)} 1080w`,
  ].join(', ') : '';

  const desktopSrcSet = desktopImage ? [
    `${getNextImageUrl(desktopImage.imageUrl, 1080, DESKTOP_QUALITY)} 1080w`,
    `${getNextImageUrl(desktopImage.imageUrl, 1200, DESKTOP_QUALITY)} 1200w`,
    `${getNextImageUrl(desktopImage.imageUrl, 1920, DESKTOP_QUALITY)} 1920w`,
    `${getNextImageUrl(desktopImage.imageUrl, 2048, DESKTOP_QUALITY)} 2048w`,
  ].join(', ') : '';

  return (
    <>
      {/* Mobile hero image preload - matches sizes="100vw" on mobile */}
      {mobileImage && (
        <link
          rel="preload"
          as="image"
          href={getNextImageUrl(mobileImage.imageUrl, 750, MOBILE_QUALITY)}
          imageSrcSet={mobileSrcSet}
          imageSizes="100vw"
          fetchPriority="high"
          media="(max-width: 1023px)"
        />
      )}
      
      {/* Desktop hero image preload - matches sizes="100vw" on desktop */}
      {desktopImage && (
        <link
          rel="preload"
          as="image"
          href={getNextImageUrl(desktopImage.imageUrl, 1920, DESKTOP_QUALITY)}
          imageSrcSet={desktopSrcSet}
          imageSizes="100vw"
          fetchPriority="high"
          media="(min-width: 1024px)"
        />
      )}
    </>
  );
}

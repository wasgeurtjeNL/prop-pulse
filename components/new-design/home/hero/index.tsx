import Image from 'next/image'
import Link from 'next/link'
import { getHeroImages } from '@/lib/actions/hero-image.actions'
import { getHighlightedProperty, HighlightedProperty } from '@/lib/actions/property.actions'
import { formatPrice, sanitizeText } from '@/lib/utils'
import { getOptimizedImageUrl } from '@/lib/imagekit'

// Default fallback images
const DEFAULT_HERO_IMAGE = {
  desktop: {
    src: '/images/hero/heroBanner.png',
    alt: 'PropPulse Thailand - Premium Real Estate Investment hero image - desktop view',
    width: 1082,
    height: 1016,
  },
  mobile: {
    src: '/images/hero/heroBanner.png',
    alt: 'PropPulse Thailand - Premium Real Estate Investment hero image - mobile view',
    width: 750,
    height: 1334,
  },
}

interface HeroProps {
  page?: string;
}

const Hero: React.FC<HeroProps> = async ({ page = 'home' }) => {
  // Fetch dynamic hero images and highlighted property from database
  const [heroImagesResult, highlightedPropertyResult] = await Promise.all([
    getHeroImages(page),
    getHighlightedProperty()
  ])
  
  const heroImages = heroImagesResult.data
  const highlightedProperty: HighlightedProperty = highlightedPropertyResult
  
  // Find images for each device type
  const desktopImage = heroImages?.find(img => img.deviceType === 'DESKTOP')
  const mobileImage = heroImages?.find(img => img.deviceType === 'MOBILE')
  
  // Use database images or fallback to defaults - with ImageKit optimization
  const heroDesktop = desktopImage ? {
    // Optimize desktop image: 1280px wide, 80% quality
    src: getOptimizedImageUrl(desktopImage.imageUrl, { width: 1536, quality: 80 }),
    alt: desktopImage.alt,
    width: desktopImage.width || 1082,
    height: desktopImage.height || 1016,
  } : DEFAULT_HERO_IMAGE.desktop
  
  const heroMobile = mobileImage ? {
    // Optimize mobile image: 640px wide (enough for most phones), 75% quality
    src: getOptimizedImageUrl(mobileImage.imageUrl, { width: 640, quality: 75, focus: 'auto' }),
    alt: mobileImage.alt,
    width: mobileImage.width || 750,
    height: mobileImage.height || 1334,
  } : DEFAULT_HERO_IMAGE.mobile

  return (
    <section className='!py-0 overflow-x-clip w-full -mt-20'>
      <div className='w-full overflow-x-clip relative'>
        {/* Desktop Hero Background Image - full background, extends behind header */}
        <div className='hidden lg:block absolute inset-0 -top-20 z-0'>
          <Image
            src={heroDesktop.src}
            alt={heroDesktop.alt}
            fill
            priority={true}
            fetchPriority="high"
            sizes="100vw"
            quality={80}
            className='object-cover object-top'
          />
        </div>
        
        {/* Mobile Hero Background Image - optimized for fast LCP */}
        <div className='lg:hidden absolute inset-0 z-0'>
          <Image
            src={heroMobile.src}
            alt={heroMobile.alt}
            fill
            priority={true}
            fetchPriority="high"
            sizes="100vw"
            quality={75}
            className='object-cover object-top'
          />
          {/* Gradient overlay for text readability */}
          <div className='absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent' />
        </div>
        
        <div className='w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0 pt-28 sm:pt-32 lg:pt-36 pb-0 md:pb-68 relative z-10'>
          <div className='relative text-white dark:text-dark text-center md:text-start'>
            <p className='text-white lg:text-dark lg:dark:text-white text-xs sm:text-sm font-medium'>Phuket & Pattaya, Thailand</p>
            <h1 className='text-white lg:text-dark lg:dark:text-white text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-semibold -tracking-wider md:max-w-[55%] lg:max-w-45p mt-3 sm:mt-4 mb-5 sm:mb-6 leading-tight'>
              Your Tropical Paradise Awaits
            </h1>
            <div className='flex flex-col xs:flex-row justify-center md:justify-start gap-3 sm:gap-4'>
              <Link href="/contactus" className='px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 border border-white lg:border-dark dark:border-white bg-white lg:bg-dark dark:bg-white text-dark lg:text-white dark:text-dark duration-300 hover:bg-transparent hover:text-white lg:hover:text-dark lg:dark:hover:text-white text-sm sm:text-base font-semibold rounded-full hover:cursor-pointer text-center'>
                Schedule Viewing
              </Link>
              <Link href={"/properties"} className='px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 border border-white lg:border-dark dark:border-white bg-transparent text-white lg:text-dark dark:text-white hover:bg-white lg:hover:bg-dark dark:hover:bg-white hover:text-dark lg:hover:text-white dark:hover:text-dark duration-300 text-sm sm:text-base font-semibold rounded-full hover:cursor-pointer text-center'>
                Explore Properties
              </Link>
            </div>
          </div>
          {/* Mobile spacer - negative to pull up */}
          <div className='block lg:hidden -mb-8' />
        </div>
        {/* Property Info Bar - Only show if highlighted property exists */}
        {highlightedProperty && (
          <Link 
            href={`/properties/${highlightedProperty.slug}`}
            className='w-full md:w-auto md:absolute bottom-0 md:-right-68 xl:right-0 bg-white dark:bg-black py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-16 md:pr-[295px] rounded-none md:rounded-none md:rounded-tl-2xl mt-0 md:mt-44 block hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group z-20 cursor-pointer'
          >
            <div className='grid grid-cols-2 sm:grid-cols-4 md:flex gap-4 sm:gap-6 md:gap-10 lg:gap-16 xl:gap-24 text-left sm:text-center dark:text-white text-black'>
              <div className='flex flex-col sm:items-center gap-2 sm:gap-3'>
                <Image
                  src={'/images/hero/sofa.svg'}
                  alt='bedrooms'
                  width={28}
                  height={28}
                  className='block dark:hidden w-6 h-6 sm:w-8 sm:h-8'
                  unoptimized={true}
                />
                <Image
                  src={'/images/hero/dark-sofa.svg'}
                  alt='bedrooms'
                  width={28}
                  height={28}
                  className='hidden dark:block w-6 h-6 sm:w-8 sm:h-8'
                  unoptimized={true}
                />
                <p className='text-xs sm:text-sm md:text-base font-normal text-inherit'>
                  {highlightedProperty.beds} Bedroom{highlightedProperty.beds !== 1 ? 's' : ''}
                </p>
              </div>
              <div className='flex flex-col sm:items-center gap-2 sm:gap-3'>
                <Image
                  src={'/images/hero/tube.svg'}
                  alt='bathrooms'
                  width={28}
                  height={28}
                  className='block dark:hidden w-6 h-6 sm:w-8 sm:h-8'
                  unoptimized={true}
                />
                <Image
                  src={'/images/hero/dark-tube.svg'}
                  alt='bathrooms'
                  width={28}
                  height={28}
                  className='hidden dark:block w-6 h-6 sm:w-8 sm:h-8'
                  unoptimized={true}
                />
                <p className='text-xs sm:text-sm md:text-base font-normal text-inherit'>
                  {highlightedProperty.baths} Bathroom{highlightedProperty.baths !== 1 ? 's' : ''}
                </p>
              </div>
              <div className='flex flex-col sm:items-center gap-2 sm:gap-3'>
                <Image
                  src={'/images/hero/parking.svg'}
                  alt='size'
                  width={28}
                  height={28}
                  className='block dark:hidden w-6 h-6 sm:w-8 sm:h-8'
                  unoptimized={true}
                />
                <Image
                  src={'/images/hero/dark-parking.svg'}
                  alt='size'
                  width={28}
                  height={28}
                  className='hidden dark:block w-6 h-6 sm:w-8 sm:h-8'
                  unoptimized={true}
                />
                <p className='text-xs sm:text-sm md:text-base font-normal text-inherit'>
                  {highlightedProperty.sqft.toLocaleString()} sqm
                </p>
              </div>
              <div className='flex flex-col sm:items-center gap-1 sm:gap-3'>
                <p className='text-xl sm:text-2xl md:text-3xl font-medium text-inherit group-hover:text-primary transition-colors'>
                  {formatPrice(highlightedProperty.price)}
                </p>
                <p className='text-xs sm:text-sm md:text-base font-normal text-black/50 dark:text-white/50'>
                  {highlightedProperty.type === 'FOR_SALE' ? 'Selling price' : 'Monthly rent'}
                </p>
              </div>
            </div>
            {/* Property title hint */}
            <p className='text-xs text-center mt-4 text-black/40 dark:text-white/40 group-hover:text-primary/60 transition-colors'>
              {sanitizeText(highlightedProperty.title)} - Click to view details
            </p>
          </Link>
        )}
      </div>
    </section>
  )
}

export default Hero

"use client"

import { PropertyHomes, getPropertyUrl } from '@/types/properyHomes'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import ImageLightbox from '@/components/shared/image-lightbox'
import { formatPrice } from '@/lib/utils'

interface PropertyCardItem extends PropertyHomes {
  type?: 'FOR_SALE' | 'FOR_RENT';
  // POI Location data
  beachScore?: number | null;
  familyScore?: number | null;
  hasSeaView?: boolean | null;
  seaDistance?: number | null;
  quietnessScore?: number | null;
}

const PropertyCard: React.FC<{ item: PropertyCardItem; priority?: boolean }> = ({ item, priority = false }) => {
  const { name, location, rate, beds, baths, area, slug, images, type, seaDistance, amenities, yearBuilt, provinceSlug, areaSlug } = item
  const propertyUrl = getPropertyUrl({ slug, provinceSlug, areaSlug })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const currentImage = images[currentImageIndex]?.src;
  const currentImageBlur = (images[currentImageIndex] as any)?.blurDataURL;
  const isRental = type === 'FOR_RENT';
  const hasMultipleImages = images.length > 1;

  // Convert images to lightbox format
  const lightboxImages = images.map((img, index) => ({
    src: img.src,
    alt: img.alt || `${name} - Image ${index + 1}`
  }))

  const handleViewImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLightboxOpen(true)
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      <div>
        <div className='relative rounded-xl sm:rounded-2xl border border-dark/10 dark:border-white/10 group hover:shadow-3xl duration-300 dark:hover:shadow-white/20'>
          <div className='overflow-hidden rounded-t-xl sm:rounded-t-2xl'>
            <Link href={propertyUrl}>
              <div className='relative w-full h-[220px] sm:h-[260px] md:h-[300px]'>
                {currentImage && (
                  <Image
                    src={currentImage}
                    alt={`${name} - Image ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    priority={priority && currentImageIndex === 0}
                    placeholder={currentImageBlur ? "blur" : "empty"}
                    blurDataURL={currentImageBlur}
                    className='object-cover rounded-t-2xl group-hover:brightness-50 group-hover:scale-125 transition duration-300 delay-75'
                    unoptimized={true}
                  />
                )}
                
                {/* Image counter indicator */}
                {hasMultipleImages && (
                  <div className='absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10 backdrop-blur-sm'>
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
                
                {/* Property Feature Badges - Based on actual property features */}
                <div className='absolute bottom-3 left-3 flex flex-wrap gap-1.5 z-10'>
                  {/* Beachfront - only truly close properties (< 500m) */}
                  {seaDistance && seaDistance < 500 && (
                    <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-cyan-500/90 text-white backdrop-blur-sm shadow-sm'>
                      <Icon icon="ph:umbrella-simple" width={12} height={12} />
                      {seaDistance}m beach
                    </span>
                  )}
                  
                  {/* Pool - from amenities */}
                  {amenities?.some(a => a.toLowerCase().includes('pool')) && (
                    <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-500/90 text-white backdrop-blur-sm shadow-sm'>
                      <Icon icon="ph:swimming-pool" width={12} height={12} />
                      Pool
                    </span>
                  )}
                  
                  {/* New Build - recent construction (2023+) */}
                  {yearBuilt && yearBuilt >= 2023 && (
                    <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-amber-500/90 text-white backdrop-blur-sm shadow-sm'>
                      <Icon icon="ph:sparkle" width={12} height={12} />
                      New Build
                    </span>
                  )}
                  
                  {/* Spacious - large properties (300m²+) */}
                  {area && area >= 300 && (
                    <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-purple-500/90 text-white backdrop-blur-sm shadow-sm'>
                      <Icon icon="ph:arrows-out" width={12} height={12} />
                      Spacious
                    </span>
                  )}
                  
                  {/* Sea View - from amenities */}
                  {amenities?.some(a => a.toLowerCase().includes('sea view')) && (
                    <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-600/90 text-white backdrop-blur-sm shadow-sm'>
                      <Icon icon="ph:waves" width={12} height={12} />
                      Sea View
                    </span>
                  )}
                </div>
              </div>
            </Link>
            {/* Property Type Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isRental 
                ? 'bg-purple-500 text-white' 
                : 'bg-primary text-white'
            }`}>
              <Icon 
                icon={isRental ? 'solar:key-bold' : 'solar:tag-price-bold'} 
                width={14} 
                height={14} 
              />
              {isRental ? 'For Rent' : 'For Sale'}
            </div>
            
            {/* View Image Button - Always visible, positioned top right */}
            <button
              onClick={handleViewImage}
              className='absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110 z-10'
              aria-label="View property images"
              title="View images"
            >
              <Icon
                icon={'solar:gallery-bold'}
                width={18}
                height={18}
                className='text-black'
              />
            </button>
            
            {/* Image Navigation Arrows - shows on hover when multiple images */}
            {hasMultipleImages && (
              <>
                {/* Previous Arrow */}
                <button
                  onClick={handlePrevImage}
                  className='absolute top-1/2 -translate-y-1/2 left-4 p-3 bg-white/90 hover:bg-white rounded-full hidden group-hover:flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 z-10'
                  aria-label="Previous image"
                >
                  <Icon
                    icon={'solar:arrow-left-linear'}
                    width={20}
                    height={20}
                    className='text-black'
                  />
                </button>
                
                {/* Next Arrow */}
                <button
                  onClick={handleNextImage}
                  className='absolute top-1/2 -translate-y-1/2 right-4 p-3 bg-white/90 hover:bg-white rounded-full hidden group-hover:flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 z-10'
                  aria-label="Next image"
                >
                  <Icon
                    icon={'solar:arrow-right-linear'}
                    width={20}
                    height={20}
                    className='text-black'
                  />
                </button>
              </>
            )}
          </div>
          <div className='p-4 sm:p-5 lg:p-6'>
            <div className='flex flex-col xs:flex-row gap-3 xs:gap-0 justify-between mb-4 sm:mb-5 lg:mb-6'>
              <div className='flex-1 min-w-0'>
                <Link href={propertyUrl}>
                  <h3 className='text-base sm:text-lg lg:text-xl font-medium text-black dark:text-white duration-300 group-hover:text-primary truncate'>
                    {name}
                  </h3>
                </Link>
                <p className='text-sm sm:text-base font-normal text-black/50 dark:text-white/50 truncate'>
                  {location}
                </p>
              </div>
              <div className='flex flex-col items-start xs:items-end flex-shrink-0'>
                <span className='text-sm sm:text-base font-medium text-primary px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full bg-primary/10'>
                  {formatPrice(rate)}
                </span>
                {isRental && !rate?.toLowerCase?.().includes('month') && (
                  <span className='text-xs text-primary font-medium mt-1'>Monthly</span>
                )}
              </div>
            </div>
            <div className='flex gap-2 sm:gap-3 lg:gap-4'>
              <div className='flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0'>
                <Icon icon={'solar:bed-linear'} className="w-4 h-4 sm:w-5 sm:h-5 text-dark/70 dark:text-white/70" />
                <p className='text-xs sm:text-sm font-normal text-black dark:text-white'>
                  {beds} Beds
                </p>
              </div>
              <div className='flex flex-col gap-1.5 sm:gap-2 border-x border-black/10 dark:border-white/20 px-2 sm:px-3 lg:px-4 flex-1 min-w-0'>
                <Icon icon={'solar:bath-linear'} className="w-4 h-4 sm:w-5 sm:h-5 text-dark/70 dark:text-white/70" />
                <p className='text-xs sm:text-sm font-normal text-black dark:text-white'>
                  {baths} Baths
                </p>
              </div>
              <div className='flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0'>
                <Icon
                  icon={'lineicons:arrow-all-direction'}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-dark/70 dark:text-white/70"
                />
                <p className='text-xs sm:text-sm font-normal text-black dark:text-white'>
                  {area}m<sup>2</sup>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        isOpen={lightboxOpen}
        currentIndex={currentImageIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setCurrentImageIndex}
      />
    </>
  )
}

export default PropertyCard

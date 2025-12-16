"use client"

import { PropertyHomes } from '@/app/types/properyHomes'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import ImageLightbox from '@/components/shared/image-lightbox'

interface PropertyCardItem extends PropertyHomes {
  type?: 'FOR_SALE' | 'FOR_RENT';
}

const PropertyCard: React.FC<{ item: PropertyCardItem; priority?: boolean }> = ({ item, priority = false }) => {
  const { name, location, rate, beds, baths, area, slug, images, type } = item
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const mainImage = images[0]?.src;
  const isRental = type === 'FOR_RENT';

  // Convert images to lightbox format
  const lightboxImages = images.map((img, index) => ({
    src: img.src,
    alt: img.alt || `${name} - Image ${index + 1}`
  }))

  const handleViewImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex(0)
    setLightboxOpen(true)
  }

  return (
    <>
      <div>
        <div className='relative rounded-xl sm:rounded-2xl border border-dark/10 dark:border-white/10 group hover:shadow-3xl duration-300 dark:hover:shadow-white/20'>
          <div className='overflow-hidden rounded-t-xl sm:rounded-t-2xl'>
            <Link href={`/properties/${slug}`}>
              <div className='relative w-full h-[220px] sm:h-[260px] md:h-[300px]'>
                {mainImage && (
                  <Image
                    src={mainImage}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    priority={priority}
                    className='object-cover rounded-t-2xl group-hover:brightness-50 group-hover:scale-125 transition duration-300 delay-75'
                    unoptimized={true}
                  />
                )}
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
            
            {/* Arrow link - shows on hover */}
            <div className='absolute top-16 right-4 p-4 bg-white rounded-full hidden group-hover:block'>
              <Icon
                icon={'solar:arrow-right-linear'}
                width={24}
                height={24}
                className='text-black'
              />
            </div>
          </div>
          <div className='p-4 sm:p-5 lg:p-6'>
            <div className='flex flex-col xs:flex-row gap-3 xs:gap-0 justify-between mb-4 sm:mb-5 lg:mb-6'>
              <div className='flex-1 min-w-0'>
                <Link href={`/properties/${slug}`}>
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
                  ${rate}
                </span>
                {isRental && (
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

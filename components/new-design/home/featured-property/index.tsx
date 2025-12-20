import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getHighlightedProperty } from "@/lib/actions/property.actions";
import { formatPrice, sanitizeText } from "@/lib/utils";
import { getPropertyUrl } from "@/lib/property-url";
import { getOptimizedImageUrl } from "@/lib/imagekit";
import FeaturedPropertyCarousel from "./carousel";

const FeaturedProperty = async () => {
  // Fetch the highlighted property from the database
  const highlightedProperty = await getHighlightedProperty();

  // If no highlighted property, don't render the section
  if (!highlightedProperty) {
    return null;
  }

  // Get property images for the carousel with ImageKit optimization
  // Featured property carousel: 1024px width for high-quality display
  const carouselImages = highlightedProperty.images.length > 0
    ? highlightedProperty.images.map((img) => ({
        src: getOptimizedImageUrl(img.url || highlightedProperty.image, { width: 1024, quality: 80 }),
        alt: img.alt || highlightedProperty.title,
      }))
    : [{ 
        src: getOptimizedImageUrl(highlightedProperty.image, { width: 1024, quality: 80 }), 
        alt: highlightedProperty.title 
      }];

  // Format the short description or use a truncated version of the content
  const description = highlightedProperty.shortDescription || 
    (highlightedProperty.content ? 
      highlightedProperty.content.replace(/<[^>]*>/g, '').slice(0, 300) + '...' : 
      'Discover this exceptional property with premium features and stunning design.'
    );

  return (
    <section className="!py-12 sm:!py-16 lg:!py-24">
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {/* Image Carousel */}
          <FeaturedPropertyCarousel images={carouselImages} />

          {/* Property Details */}
          <div className="flex flex-col gap-5 sm:gap-6 lg:gap-10">
            <div>
              <p className="text-dark/75 dark:text-white/75 text-sm sm:text-base font-semibold flex items-center gap-2">
                <Icon icon="ph:house-simple-fill" className="text-xl sm:text-2xl text-primary" />
                Featured Property
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-dark dark:text-white mt-1">
                {sanitizeText(highlightedProperty.title)}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Icon icon="ph:map-pin" className="w-5 h-5 sm:w-6 sm:h-6 text-dark/50 dark:text-white/50 flex-shrink-0" />
                <p className="text-dark/50 dark:text-white/50 text-sm sm:text-base">
                  {sanitizeText(highlightedProperty.location)}
                </p>
              </div>
            </div>
            
            <p className="text-sm sm:text-base text-dark/50 dark:text-white/50 leading-relaxed">
              {sanitizeText(description)}
            </p>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-10">
              {/* Bedrooms */}
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/sofa.svg'}
                    alt='bedrooms'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-sofa.svg'}
                    alt='bedrooms'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">{highlightedProperty.beds} Bedroom{highlightedProperty.beds !== 1 ? 's' : ''}</h6>
              </div>
              
              {/* Bathrooms */}
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/tube.svg'}
                    alt='bathrooms'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-tube.svg'}
                    alt='bathrooms'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">{highlightedProperty.baths} Bathroom{highlightedProperty.baths !== 1 ? 's' : ''}</h6>
              </div>
              
              {/* Size */}
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/parking.svg'}
                    alt='size'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-parking.svg'}
                    alt='size'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">{highlightedProperty.sqft.toLocaleString()} sqm</h6>
              </div>
              
              {/* Property Type Badge */}
              <div className="flex items-center gap-4">
                <div className="bg-dark/5 dark:bg-white/5 p-2.5 rounded-[6px]">
                  <Image
                    src={'/images/hero/bar.svg'}
                    alt='type'
                    width={24}
                    height={24}
                    className='block dark:hidden'
                    unoptimized={true}
                  />
                  <Image
                    src={'/images/hero/dark-bar.svg'}
                    alt='type'
                    width={24}
                    height={24}
                    className='hidden dark:block'
                    unoptimized={true}
                  />
                </div>
                <h6 className="">{highlightedProperty.type === 'FOR_SALE' ? 'For Sale' : 'For Rent'}</h6>
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-4 sm:gap-6 lg:gap-10 items-start xs:items-center">
              <Link 
                href={getPropertyUrl(highlightedProperty)} 
                className="w-full xs:w-auto text-center py-3 sm:py-3.5 lg:py-4 px-5 sm:px-6 lg:px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white text-sm sm:text-base font-semibold"
              >
                View Property
              </Link>
              <div>
                <h4 className="text-xl sm:text-2xl lg:text-3xl text-dark dark:text-white font-medium">
                  {formatPrice(highlightedProperty.price)}
                </h4>
                <p className="text-xs sm:text-sm lg:text-base text-dark/50">
                  {highlightedProperty.type === 'FOR_SALE' ? 'Selling Price' : 'Monthly Rent'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperty;

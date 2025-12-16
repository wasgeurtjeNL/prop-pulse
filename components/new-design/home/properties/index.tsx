"use client";
import { Icon } from '@iconify/react'
import PropertyCard from './card/Card'
import { useEffect, useState } from 'react';
import Link from 'next/link';

type PropertyType = 'all' | 'FOR_SALE' | 'FOR_RENT';

const ITEMS_PER_PAGE = 6;

const Properties: React.FC = () => {

  const [propertyHomes, setPropertyHomes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<PropertyType>('all');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/property-data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setPropertyHomes(data?.propertyHomes)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])  

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilter]);

  // Filter properties based on selected type
  const filteredProperties = propertyHomes?.filter((property: any) => {
    if (activeFilter === 'all') return true;
    return property.type === activeFilter;
  }) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  const goToPrevious = () => {
    if (canGoPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Don't render section if no properties
  if (!loading && (!propertyHomes || propertyHomes.length === 0)) {
    return null;
  }

  return (
    <section className="!py-12 sm:!py-16 lg:!py-24">
      <div className='w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0'>
        <div className='mb-8 sm:mb-12 lg:mb-16 flex flex-col gap-2 sm:gap-3'>
          <div className='flex gap-2 items-center justify-center'>
            <span>
              <Icon
                icon={'ph:house-simple-fill'}
                width={18}
                height={18}
                className='text-primary sm:w-5 sm:h-5'
              />
            </span>
            <p className='text-sm sm:text-base font-semibold text-dark/75 dark:text-white/75'>
              Properties
            </p>
          </div>
          <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-black dark:text-white text-center tracking-tight leading-tight mb-1 sm:mb-2'>
            Discover inspiring designed homes.
          </h2>
          <p className='text-sm sm:text-base font-normal text-black/50 dark:text-white/50 text-center px-4'>
            Curated homes where elegance, style, and comfort unite.
          </p>
          
          {/* Filter Tabs */}
          <div className='flex justify-center mt-4 sm:mt-6 px-2'>
            <div className='inline-flex flex-wrap justify-center items-center gap-1 p-1 sm:p-1.5 bg-gray-100 dark:bg-white/10 rounded-full'>
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeFilter === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('FOR_SALE')}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 ${
                  activeFilter === 'FOR_SALE'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                <Icon icon="solar:tag-price-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                For Sale
              </button>
              <button
                onClick={() => setActiveFilter('FOR_RENT')}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 ${
                  activeFilter === 'FOR_RENT'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                <Icon icon="solar:key-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                For Rent
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : currentProperties && currentProperties.length > 0 ? (
          <div className="relative">
            {/* Navigation Arrows - Desktop */}
            {totalPages > 1 && (
              <>
                {/* Previous Arrow */}
                <button
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                  className={`hidden lg:flex absolute -left-6 xl:-left-16 top-1/2 -translate-y-1/2 z-10 
                    w-12 h-12 items-center justify-center rounded-full border-2 transition-all duration-300
                    ${canGoPrevious 
                      ? 'bg-white dark:bg-dark border-primary text-primary hover:bg-primary hover:text-white cursor-pointer shadow-lg hover:shadow-xl' 
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/20 cursor-not-allowed'
                    }`}
                  aria-label="Previous properties"
                >
                  <Icon icon="solar:arrow-left-linear" width={24} height={24} />
                </button>

                {/* Next Arrow */}
                <button
                  onClick={goToNext}
                  disabled={!canGoNext}
                  className={`hidden lg:flex absolute -right-6 xl:-right-16 top-1/2 -translate-y-1/2 z-10 
                    w-12 h-12 items-center justify-center rounded-full border-2 transition-all duration-300
                    ${canGoNext 
                      ? 'bg-white dark:bg-dark border-primary text-primary hover:bg-primary hover:text-white cursor-pointer shadow-lg hover:shadow-xl' 
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/20 cursor-not-allowed'
                    }`}
                  aria-label="Next properties"
                >
                  <Icon icon="solar:arrow-right-linear" width={24} height={24} />
                </button>
              </>
            )}

            {/* Properties Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-10'>
              {currentProperties.map((item: any, index: number) => (
                <div key={`${item.slug}-${index}`}>
                  <PropertyCard item={item} />
                </div>
              ))}
            </div>

            {/* Pagination Controls - Mobile & Page Indicators */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                {/* Previous Button - Mobile */}
                <button
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                  className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${canGoPrevious 
                      ? 'bg-white dark:bg-dark border-primary text-primary hover:bg-primary hover:text-white' 
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/20 cursor-not-allowed'
                    }`}
                  aria-label="Previous properties"
                >
                  <Icon icon="solar:arrow-left-linear" width={20} height={20} />
                </button>

                {/* Page Dots */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        currentPage === index 
                          ? 'bg-primary w-8' 
                          : 'bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40'
                      }`}
                      aria-label={`Go to page ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Next Button - Mobile */}
                <button
                  onClick={goToNext}
                  disabled={!canGoNext}
                  className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${canGoNext 
                      ? 'bg-white dark:bg-dark border-primary text-primary hover:bg-primary hover:text-white' 
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-300 dark:text-white/20 cursor-not-allowed'
                    }`}
                  aria-label="Next properties"
                >
                  <Icon icon="solar:arrow-right-linear" width={20} height={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon icon="solar:home-smile-linear" width={48} height={48} className="text-gray-300 dark:text-white/20 mb-4" />
            <p className="text-gray-500 dark:text-white/50">
              No {activeFilter === 'FOR_SALE' ? 'properties for sale' : 'rentals'} available at the moment.
            </p>
          </div>
        )}

        {filteredProperties.length > 6 && (
          <div className="flex justify-center mt-8 sm:mt-10 lg:mt-12">
            <Link 
              href={`/properties${activeFilter !== 'all' ? `?type=${activeFilter}` : ''}`}
              className="py-3 sm:py-3.5 lg:py-4 px-6 sm:px-7 lg:px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white text-sm sm:text-base font-semibold w-full xs:w-auto text-center"
            >
              View All {activeFilter === 'FOR_RENT' ? 'Rentals' : activeFilter === 'FOR_SALE' ? 'Properties for Sale' : 'Properties'}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default Properties

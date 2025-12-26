"use client";
import { Icon } from '@iconify/react'
import PropertyCard from './card/Card'
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

type PropertyType = 'all' | 'FOR_SALE' | 'FOR_RENT';

const ITEMS_PER_PAGE = 6;

interface PropertiesProps {
  initialProperties?: any[];
}

const Properties: React.FC<PropertiesProps> = ({ initialProperties }) => {

  // Use initial properties if provided, otherwise fetch client-side
  const [propertyHomes, setPropertyHomes] = useState<any>(initialProperties || null);
  const [loading, setLoading] = useState(!initialProperties);
  const [activeFilter, setActiveFilter] = useState<PropertyType>('all');
  const [currentPage, setCurrentPage] = useState(0);
  
  // New filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortStay, setShowShortStay] = useState(false);

  useEffect(() => {
    // Skip fetching if we already have initial properties
    if (initialProperties) return;
    
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
  }, [initialProperties])  

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilter, searchQuery, showShortStay]);

  // Filter properties based on all criteria
  const filteredProperties = useMemo(() => {
    if (!propertyHomes) return [];
    
    return propertyHomes.filter((property: any) => {
      // Type filter (For Sale / For Rent)
      if (activeFilter !== 'all' && property.type !== activeFilter) return false;
      
      // Short Stay filter (daily rental enabled)
      if (showShortStay && !property.enableDailyRental) return false;
      
      // Search filter (location, listing number, or title)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesLocation = property.location?.toLowerCase().includes(query);
        const matchesListing = property.listingNumber?.toLowerCase().includes(query);
        const matchesTitle = property.title?.toLowerCase().includes(query);
        const matchesName = property.name?.toLowerCase().includes(query);
        if (!matchesLocation && !matchesListing && !matchesTitle && !matchesName) return false;
      }
      
      return true;
    });
  }, [propertyHomes, activeFilter, showShortStay, searchQuery]);

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
          
          {/* Search Bar */}
          <div className='flex justify-center mt-4 sm:mt-6 px-2'>
            <div className='relative w-full max-w-md'>
              <Icon 
                icon="solar:magnifer-linear" 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40"
              />
              <input
                type="text"
                placeholder="Search by location or listing number (e.g. PP-0045)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/10 border-0 rounded-full 
                  text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
                >
                  <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Filter Tabs + Short Stay Toggle */}
          <div className='flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-4 px-2'>
            {/* Type Tabs */}
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
            
            {/* Short Stay Toggle */}
            <button
              onClick={() => setShowShortStay(!showShortStay)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border-2 ${
                showShortStay
                  ? 'bg-primary border-primary text-white shadow-md'
                  : 'border-gray-200 dark:border-white/20 text-gray-600 dark:text-white/70 hover:border-primary hover:text-primary dark:hover:border-primary'
              }`}
            >
              <Icon icon="solar:calendar-minimalistic-bold" className="w-4 h-4" />
              Short Stay
              {showShortStay && (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Active Filters Summary */}
          {(searchQuery || showShortStay) && (
            <div className='flex flex-wrap justify-center items-center gap-2 mt-3'>
              {searchQuery && (
                <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full'>
                  <Icon icon="solar:magnifer-linear" className="w-3 h-3" />
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className='hover:text-primary/70'>
                    <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {showShortStay && (
                <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full'>
                  <Icon icon="solar:calendar-minimalistic-bold" className="w-3 h-3" />
                  Short Stay Only
                  <button onClick={() => setShowShortStay(false)} className='hover:text-primary/70'>
                    <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button 
                onClick={() => { setSearchQuery(""); setShowShortStay(false); setActiveFilter('all'); }}
                className='text-xs text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/70 underline'
              >
                Clear all
              </button>
            </div>
          )}
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

            {/* Properties - Mobile Horizontal Scroll (shows ALL filtered properties) */}
            <div className='sm:hidden -mx-4 px-4'>
              <div className='flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4'>
                {filteredProperties.map((item: any, index: number) => (
                  <div key={`${item.slug}-${index}`} className='flex-shrink-0 w-[85%] snap-start'>
                    <PropertyCard item={item} />
                  </div>
                ))}
              </div>
              {/* Scroll hint with count */}
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400 dark:text-white/40">
                <Icon icon="ph:arrows-left-right" width={14} height={14} />
                <span>Swipe to see all {filteredProperties.length} properties</span>
              </div>
            </div>

            {/* Properties Grid - Tablet & Desktop */}
            <div className='hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-10'>
              {currentProperties.map((item: any, index: number) => (
                <div key={`${item.slug}-${index}`}>
                  <PropertyCard item={item} />
                </div>
              ))}
            </div>

            {/* Pagination Controls - Tablet & Desktop Only */}
            {totalPages > 1 && (
              <div className="hidden sm:flex items-center justify-center gap-4 mt-10">
                {/* Previous Button - Tablet */}
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

                {/* Next Button - Tablet */}
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
              {searchQuery || showShortStay 
                ? `No properties found matching your criteria.`
                : `No ${activeFilter === 'FOR_SALE' ? 'properties for sale' : activeFilter === 'FOR_RENT' ? 'rentals' : 'properties'} available at the moment.`
              }
            </p>
            {(searchQuery || showShortStay) && (
              <button 
                onClick={() => { setSearchQuery(""); setShowShortStay(false); setActiveFilter('all'); }}
                className='mt-3 text-sm text-primary hover:text-primary/70 underline'
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* View All Button - Hidden on mobile since horizontal scroll shows all */}
        {filteredProperties.length > 6 && (
          <div className="hidden sm:flex justify-center mt-8 sm:mt-10 lg:mt-12">
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

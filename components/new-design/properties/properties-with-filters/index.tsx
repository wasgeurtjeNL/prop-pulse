"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import PropertyCard from "../../home/properties/card/Card";
import HeroSub from "../../shared/hero-sub";
import PropertyFilters from "@/components/shared/properties/property-filters";
import PropertyAlertCTA from "../PropertyAlertCTA";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem } from "@/components/new-design/breadcrumb";

const PropertiesWithFilters: React.FC = () => {
  const [propertyHomes, setPropertyHomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true); // Default open
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const shortStayParam = searchParams.get("shortStay");
  const typeParam = searchParams.get("type");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Build query string from search params
        const queryParams = new URLSearchParams();
        
        // Add all filter parameters
        const filters = [
          'query', 'type', 'category', 'beds', 'baths', 'amenities', 'shortStay',
          // Price & area filters
          'minPrice', 'maxPrice', 'minArea', 'maxArea', 
          // Feature filters
          'hasSeaView', 'allowPets', 'ownershipType', 'isResale',
          // Location filter
          'area'
        ];
        filters.forEach(filter => {
          const value = searchParams.get(filter);
          if (value) {
            queryParams.append(filter, value);
          }
        });
        
        const url = `/api/property-data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPropertyHomes(data?.propertyHomes || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setPropertyHomes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const formatCategory = (text: string) => {
    return text
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Build breadcrumbs based on current filters
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Properties', href: '/properties' },
  ];
  
  // Add Short Stay to breadcrumbs if filtered
  if (shortStayParam === "true") {
    breadcrumbs.push({ 
      name: 'Short Stay', 
      href: '/properties?type=FOR_RENT&shortStay=true' 
    });
  }
  
  // Add category to breadcrumbs if filtered
  if (categoryParam) {
    breadcrumbs.push({ 
      name: formatCategory(categoryParam), 
      href: `/properties?category=${categoryParam}` 
    });
  }

  // Determine page title
  const getPageTitle = () => {
    if (shortStayParam === "true") {
      return "Short Stay Rentals";
    }
    if (typeParam === "FOR_RENT") {
      return "Rental Properties";
    }
    if (typeParam === "FOR_SALE") {
      return "Properties for Sale";
    }
    if (categoryParam) {
      return formatCategory(categoryParam);
    }
    return "Discover inspiring designed homes.";
  };

  // Determine page description
  const getPageDescription = () => {
    if (shortStayParam === "true") {
      return "Daily and weekly vacation rentals. Perfect for holidays and short-term stays under 30 days.";
    }
    if (typeParam === "FOR_RENT") {
      return "Find your perfect rental property. Monthly and yearly contracts available.";
    }
    return "Experience elegance and comfort with our exclusive luxury villas, designed for sophisticated living.";
  };

  return (
    <>
      <HeroSub
        title={getPageTitle()}
        description={getPageDescription()}
        badge={shortStayParam === "true" ? "Short Stay" : "Properties"}
        breadcrumbs={breadcrumbs}
        propertyCount={propertyHomes.length}
        isLoading={isLoading}
      />
      
      <section className='pb-6 sm:pb-8'>
        <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
          {/* Filter Toggle Button */}
          <div className='flex items-center justify-end mb-4'>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-full"
            >
              {showFilters ? (
                <>
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Hide Filters</span>
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Show Filters</span>
                </>
              )}
            </Button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Filters Sidebar - Collapsible */}
            {showFilters && (
              <aside className='lg:col-span-1'>
                <PropertyFilters />
              </aside>
            )}
            
            {/* Properties Grid */}
            <div className={`${showFilters ? 'col-span-1 lg:col-span-3' : 'col-span-1 lg:col-span-4'}`}>
              {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading properties...</p>
                  </div>
                </div>
              ) : propertyHomes.length === 0 ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold mb-2">No properties found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Horizontal Scroll */}
                  <div className='md:hidden -mx-5 px-5'>
                    <div className='flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4'>
                      {propertyHomes.map((item: any, index: number) => (
                        <div key={item?.slug ?? index} className='flex-shrink-0 w-[85%] snap-start'>
                          <PropertyCard item={item} priority={index === 0} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Tablet & Desktop Grid */}
                  <div className='hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {propertyHomes.map((item: any, index: number) => (
                      <div key={item?.slug ?? index}>
                        <PropertyCard item={item} priority={index === 0} />
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {/* Property Alert CTA - Show after properties */}
              {!isLoading && (
                <div className="mt-12">
                  <PropertyAlertCTA 
                    variant="banner" 
                    propertyType={searchParams.get("type") === "rent" ? "FOR_RENT" : searchParams.get("type") === "sale" ? "FOR_SALE" : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PropertiesWithFilters;


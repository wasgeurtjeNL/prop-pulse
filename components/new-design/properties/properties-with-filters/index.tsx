"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, X, SlidersHorizontal, Home, Key } from "lucide-react";
import PropertyCard from "../../home/properties/card/Card";
import HeroSub from "../../shared/hero-sub";
import PropertyFilters from "@/components/shared/properties/property-filters";
import PropertyAlertCTA from "../PropertyAlertCTA";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem } from "@/components/new-design/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// Section Header Component
function SectionHeader({ 
  icon: Icon, 
  title, 
  count,
  color = "primary"
}: { 
  icon: React.ElementType; 
  title: string; 
  count: number;
  color?: "primary" | "emerald";
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        color === "emerald" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary/10"
      }`}>
        <Icon className={`w-5 h-5 ${
          color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
        }`} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-muted-foreground">{count} properties</p>
      </div>
    </div>
  );
}

const PropertiesWithFilters: React.FC = () => {
  const [propertyHomes, setPropertyHomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true); // Desktop sidebar
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false); // Mobile bottom sheet
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const shortStayParam = searchParams.get("shortStay");
  const typeParam = searchParams.get("type");

  // Count active filters for badge (excluding 'type' for grouping logic)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    const filterKeys = [
      'query', 'type', 'category', 'beds', 'baths', 'amenities',
      'minPrice', 'maxPrice', 'minArea', 'maxArea',
      'hasSeaView', 'allowPets', 'ownershipType', 'isResale', 'area'
    ];
    filterKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value && value !== 'all' && value !== 'Any') {
        count++;
      }
    });
    return count;
  }, [searchParams]);

  // Check if any meaningful filter is applied (for grouping logic)
  const hasActiveFilters = useMemo(() => {
    const filterKeys = [
      'query', 'type', 'category', 'beds', 'baths', 'amenities',
      'minPrice', 'maxPrice', 'minArea', 'maxArea',
      'hasSeaView', 'allowPets', 'ownershipType', 'isResale', 'area', 'shortStay'
    ];
    return filterKeys.some(key => {
      const value = searchParams.get(key);
      return value && value !== 'all' && value !== 'Any';
    });
  }, [searchParams]);

  // Group properties by type when no filters are active
  const groupedProperties = useMemo(() => {
    if (hasActiveFilters) {
      return { sale: [], rent: [], showGrouped: false };
    }
    
    const saleProperties = propertyHomes.filter(p => p.type === 'FOR_SALE');
    const rentProperties = propertyHomes.filter(p => p.type === 'FOR_RENT');
    
    return {
      sale: saleProperties,
      rent: rentProperties,
      showGrouped: true
    };
  }, [propertyHomes, hasActiveFilters]);

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
    if (typeParam === "FOR_RENT" || typeParam === "rent") {
      return "Rental Properties";
    }
    if (typeParam === "FOR_SALE" || typeParam === "buy") {
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
    if (typeParam === "FOR_RENT" || typeParam === "rent") {
      return "Find your perfect rental property. Monthly and yearly contracts available.";
    }
    return "Experience elegance and comfort with our exclusive luxury villas, designed for sophisticated living.";
  };

  // Render property grid (reusable for both grouped and ungrouped)
  const renderPropertyGrid = (items: any[], startPriority: number = 0) => (
    <>
      {/* Mobile Horizontal Scroll */}
      <div className='md:hidden -mx-5 px-5'>
        <div className='flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4'>
          {items.map((item: any, index: number) => (
            <div key={item?.slug ?? index} className='flex-shrink-0 w-[85%] snap-start'>
              <PropertyCard item={item} priority={index === 0 && startPriority === 0} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Tablet & Desktop Grid */}
      <div className='hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {items.map((item: any, index: number) => (
          <div key={item?.slug ?? index}>
            <PropertyCard item={item} priority={index === 0 && startPriority === 0} />
          </div>
        ))}
      </div>
    </>
  );

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
          {/* Desktop: Filter Toggle Button */}
          <div className='hidden lg:flex items-center justify-end mb-4'>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-full"
            >
              {showFilters ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Hide Filters</span>
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  <span>Show Filters</span>
                </>
              )}
            </Button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Desktop: Filters Sidebar - Collapsible & Sticky with scroll */}
            {showFilters && (
              <aside className='hidden lg:block lg:col-span-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent'>
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
              ) : groupedProperties.showGrouped ? (
                /* Grouped view: Sale first, then Rent */
                <div className="space-y-12">
                  {/* For Sale Section */}
                  {groupedProperties.sale.length > 0 && (
                    <div>
                      <SectionHeader 
                        icon={Home} 
                        title="Properties for Sale" 
                        count={groupedProperties.sale.length}
                        color="primary"
                      />
                      {renderPropertyGrid(groupedProperties.sale, 0)}
                    </div>
                  )}
                  
                  {/* Divider between sections */}
                  {groupedProperties.sale.length > 0 && groupedProperties.rent.length > 0 && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-4 text-sm text-muted-foreground">
                          or explore rentals
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* For Rent Section */}
                  {groupedProperties.rent.length > 0 && (
                    <div>
                      <SectionHeader 
                        icon={Key} 
                        title="Properties for Rent" 
                        count={groupedProperties.rent.length}
                        color="emerald"
                      />
                      {renderPropertyGrid(groupedProperties.rent, groupedProperties.sale.length)}
                    </div>
                  )}
                </div>
              ) : (
                /* Filtered view: Show all results normally */
                renderPropertyGrid(propertyHomes)
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

      {/* Mobile: Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setMobileFiltersOpen(true)}
          size="lg"
          className="rounded-full shadow-lg px-6 gap-2 bg-primary hover:bg-primary/90"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile: Filter Bottom Sheet */}
      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent 
          className="!fixed !top-auto !bottom-0 !left-0 !right-0 !translate-x-0 !translate-y-0 !max-w-full !w-full !rounded-t-3xl !rounded-b-none max-h-[85vh] overflow-hidden flex flex-col data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down"
          showCloseButton={false}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-slate-300" />
          </div>
          
          <DialogHeader className="px-2 pb-2 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Filters</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
            {activeFilterCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </p>
            )}
          </DialogHeader>
          
          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto px-2 pb-24">
            <PropertyFilters />
          </div>
          
          {/* Fixed bottom button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <Button 
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full rounded-full"
              size="lg"
            >
              Show {propertyHomes.length} properties
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom animation styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.2s ease-in;
        }
      `}</style>
    </>
  );
};

export default PropertiesWithFilters;

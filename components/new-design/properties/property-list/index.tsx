"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "../../home/properties/card/Card";
import HeroSub from "../../shared/hero-sub";

const PropertiesListing: React.FC = () => {
  const [propertyHomes, setPropertyHomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Build query string from search params
        const queryParams = new URLSearchParams();
        
        // Add all filter parameters
        const filters = ['query', 'type', 'category', 'beds', 'baths', 'amenities'];
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
  }, [searchParams]);

  const formatCategory = (text: string) => {
    return text
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  return (
    <>
      <HeroSub
        title={categoryParam ? formatCategory(categoryParam) : "Discover inspiring designed homes."}
        description="Experience elegance and comfort with our exclusive luxury villas, designed for sophisticated living."
        badge="Properties"
      />
      <section className='pt-0!'>
        <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
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
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10'>
              {propertyHomes.map((item: any, index: number) => (
                <div key={index}>
                  <PropertyCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default PropertiesListing;

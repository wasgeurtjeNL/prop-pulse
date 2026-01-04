"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { getPropertyUrl } from "@/lib/property-url";
import { formatPrice } from "@/lib/utils";

interface RecentlySoldProperty {
  id: string;
  title: string;
  slug: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  status: "SOLD" | "RENTED";
  type: "FOR_SALE" | "FOR_RENT";
  provinceSlug: string | null;
  areaSlug: string | null;
  image: string;
  updatedAt: string;
}

interface RecentlySoldProps {
  initialProperties?: RecentlySoldProperty[];
}

export default function RecentlySold({ initialProperties }: RecentlySoldProps) {
  const [properties, setProperties] = useState<RecentlySoldProperty[]>(initialProperties || []);
  const [loading, setLoading] = useState(!initialProperties);

  useEffect(() => {
    if (initialProperties) return;

    const fetchRecentlySold = async () => {
      try {
        const response = await fetch("/api/properties/recently-sold");
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.error("Failed to fetch recently sold properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlySold();
  }, [initialProperties]);

  // Don't render if no sold properties
  if (!loading && properties.length === 0) {
    return null;
  }

  // Calculate time since sold
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return "1 month ago";
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto max-w-8xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="ph:seal-check-fill" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Success Stories
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Recently Sold Properties
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
              See what properties we&apos;ve successfully sold for our clients
            </p>
          </div>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors text-sm"
          >
            <Icon icon="ph:buildings" className="w-4 h-4" />
            View All Properties
            <Icon icon="ph:arrow-right" className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl h-80" />
            ))}
          </div>
        )}

        {/* Properties Grid */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const propertyUrl = getPropertyUrl({
                slug: property.slug,
                provinceSlug: property.provinceSlug,
                areaSlug: property.areaSlug,
              });

              return (
                <Link
                  key={property.id}
                  href={propertyUrl}
                  className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
                >
                  {/* Image */}
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Sold/Rented Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full font-bold text-white text-sm flex items-center gap-1.5 shadow-lg ${
                      property.status === "SOLD" ? "bg-blue-600" : "bg-amber-500"
                    }`}>
                      <Icon 
                        icon={property.status === "SOLD" ? "ph:seal-check-fill" : "ph:key-fill"} 
                        className="w-4 h-4" 
                      />
                      {property.status}
                    </div>

                    {/* Time Badge */}
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 shadow-sm">
                      {getTimeSince(property.updatedAt)}
                    </div>

                    {/* Price Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-white font-bold text-lg sm:text-xl drop-shadow-lg">
                        {formatPrice(property.price)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                      <Icon icon="ph:map-pin" className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{property.location}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                        <Icon icon="ph:bed" className="w-4 h-4" />
                        <span>{property.beds}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                        <Icon icon="ph:bathtub" className="w-4 h-4" />
                        <span>{property.baths}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                        <Icon icon="ph:arrows-out" className="w-4 h-4" />
                        <span>{property.sqft} m²</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">50+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Properties Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">98%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Client Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">45</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Avg Days to Sell</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">฿500M+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Sales Value</div>
          </div>
        </div>
      </div>
    </section>
  );
}

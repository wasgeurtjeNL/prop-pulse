"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import PropertyAlertForm from "./PropertyAlertForm";
import { formatPrice } from "@/lib/utils";
import { getPropertyUrl } from "@/lib/property-url";

export interface RelatedProperty {
  id: string;
  title: string;
  slug: string;
  price: string;
  location: string;
  type: "FOR_SALE" | "FOR_RENT";
  image: string;
  blurDataURL?: string;
  beds: number;
  baths: number;
  sqft: number;
  provinceSlug?: string | null;
  areaSlug?: string | null;
}

interface RelatedPropertiesProps {
  currentSlug: string;
  propertyType: "FOR_SALE" | "FOR_RENT";
  location: string;
  category?: string;
  limit?: number;
  /** Pre-fetched properties from server for faster initial render */
  initialProperties?: RelatedProperty[];
}

export default function RelatedProperties({
  currentSlug,
  propertyType,
  location,
  category,
  limit = 3,
  initialProperties,
}: RelatedPropertiesProps) {
  // Use initial properties if provided, otherwise fetch client-side
  const [properties, setProperties] = useState<RelatedProperty[]>(initialProperties || []);
  const [loading, setLoading] = useState(!initialProperties);
  const [error, setError] = useState<string | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  useEffect(() => {
    // Skip fetch if we have initial properties
    if (initialProperties && initialProperties.length > 0) {
      return;
    }

    const fetchRelatedProperties = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          slug: currentSlug,
          type: propertyType,
          location: location,
          limit: limit.toString(),
        });
        
        if (category) {
          params.append("category", category);
        }

        const response = await fetch(`/api/properties/related?${params}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          setProperties(data.data);
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error("Failed to fetch related properties:", err);
        setError("Failed to load related properties");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProperties();
  }, [currentSlug, propertyType, location, category, limit, initialProperties]);

  // Skeleton loader - only show if no initial properties
  if (loading && !initialProperties) {
    return (
      <div className="mt-12 pt-10 border-t border-dark/10 dark:border-white/10">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || properties.length === 0) {
    return null;
  }

  const isRental = propertyType === "FOR_RENT";
  const area = location.split(",")[0]?.trim() || location;

  return (
    <div className="mt-12 pt-10 border-t border-dark/10 dark:border-white/10">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-white tracking-tight">
              {isRental ? "Explore More Rentals" : "Discover Similar Properties"}
            </h2>
          </div>
          <p className="text-dark/60 dark:text-white/60 ml-4 text-sm sm:text-base">
            Handpicked selections in {area} that match your lifestyle
          </p>
        </div>
        
        <Link
          href={`/properties?type=${isRental ? "rent" : "sale"}`}
          prefetch={false}
          className="group flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium text-sm"
        >
          View all {isRental ? "rentals" : "properties"}
          <Icon 
            icon="ph:arrow-right" 
            width={18} 
            height={18} 
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      {/* Property Cards - Mobile Horizontal Scroll */}
      <div className="md:hidden -mx-3 sm:-mx-4 px-3 sm:px-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
          {properties.map((property, index) => (
            <Link
              key={property.id}
              href={getPropertyUrl(property)}
              prefetch={false}
              className="group block flex-shrink-0 w-[80%] snap-start"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
                <Image
                  src={property.image || "/images/placeholder-property.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 80vw, 33vw"
                  placeholder={property.blurDataURL ? "blur" : "empty"}
                  blurDataURL={property.blurDataURL}
                  loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Price Badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-white/95 dark:bg-dark/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                    <span className="text-primary font-bold text-lg">
                      {formatPrice(property.price)}
                    </span>
                    {isRental && (
                      <span className="text-dark/60 dark:text-white/50 text-sm font-normal">
                        /mo
                      </span>
                    )}
                  </div>
                </div>

                {/* Type Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`
                    px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider
                    ${isRental 
                      ? "bg-blue-500/90 text-white" 
                      : "bg-blue-500/90 text-white"
                    }
                  `}>
                    {isRental ? "For Rent" : "For Sale"}
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-dark dark:text-white text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {property.title}
                </h3>
                
                {/* Location */}
                <div className="flex items-center gap-1.5 text-dark/60 dark:text-white/60 text-sm">
                  <Icon icon="ph:map-pin" width={16} height={16} className="text-primary flex-shrink-0" />
                  <span className="truncate">{property.location.split(",").slice(0, 2).join(",")}</span>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-dark/70 dark:text-white/70">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon icon="solar:bed-linear" width={18} height={18} className="text-primary" />
                    </div>
                    <span className="font-medium">{property.beds}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-dark/70 dark:text-white/70">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon icon="solar:bath-linear" width={18} height={18} className="text-primary" />
                    </div>
                    <span className="font-medium">{property.baths}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-dark/70 dark:text-white/70">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon icon="ph:ruler" width={18} height={18} className="text-primary" />
                    </div>
                    <span className="font-medium">{property.sqft}m²</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Property Cards Grid - Tablet & Desktop */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {properties.map((property, index) => (
          <Link
            key={property.id}
            href={getPropertyUrl(property)}
            prefetch={false}
            className="group block"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Image Container */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
              <Image
                src={property.image || "/images/placeholder-property.jpg"}
                alt={property.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
                placeholder={property.blurDataURL ? "blur" : "empty"}
                blurDataURL={property.blurDataURL}
                loading="lazy"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Price Badge */}
              <div className="absolute top-4 left-4">
                <div className="bg-white/95 dark:bg-dark/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <span className="text-primary font-bold text-lg">
                    {formatPrice(property.price)}
                  </span>
                  {isRental && (
                    <span className="text-dark/60 dark:text-white/50 text-sm font-normal">
                      /mo
                    </span>
                  )}
                </div>
              </div>

              {/* Type Badge */}
              <div className="absolute top-4 right-4">
                <div className={`
                  px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider
                  ${isRental 
                    ? "bg-blue-500/90 text-white" 
                    : "bg-blue-500/90 text-white"
                  }
                `}>
                  {isRental ? "For Rent" : "For Sale"}
                </div>
              </div>

              {/* Quick View Button - appears on hover */}
              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                <div className="flex items-center justify-center gap-2 bg-white dark:bg-dark text-dark dark:text-white py-3 px-4 rounded-xl font-medium text-sm shadow-xl">
                  <Icon icon="ph:eye" width={18} height={18} />
                  View Details
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-dark dark:text-white text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {property.title}
              </h3>
              
              {/* Location */}
              <div className="flex items-center gap-1.5 text-dark/60 dark:text-white/60 text-sm">
                <Icon icon="ph:map-pin" width={16} height={16} className="text-primary flex-shrink-0" />
                <span className="truncate">{property.location.split(",").slice(0, 2).join(",")}</span>
              </div>

              {/* Specs */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-dark/70 dark:text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon icon="solar:bed-linear" width={18} height={18} className="text-primary" />
                  </div>
                  <span className="font-medium">{property.beds}</span>
                </div>
                <div className="flex items-center gap-1.5 text-dark/70 dark:text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon icon="solar:bath-linear" width={18} height={18} className="text-primary" />
                  </div>
                  <span className="font-medium">{property.baths}</span>
                </div>
                <div className="flex items-center gap-1.5 text-dark/70 dark:text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon icon="ph:ruler" width={18} height={18} className="text-primary" />
                  </div>
                  <span className="font-medium">{property.sqft}m²</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA - Enhanced with two options */}
      <div className="mt-10">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 p-6">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon icon="ph:sparkle" width={24} height={24} className="text-primary" />
              </div>
              <div>
                <p className="text-dark dark:text-white font-semibold text-lg">
                  Can't find what you're looking for?
                </p>
                <p className="text-dark/60 dark:text-white/60 text-sm">
                  Get notified when matching properties become available
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Create Alert Button */}
              <button
                onClick={() => setShowAlertDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
              >
                <Icon icon="ph:bell-ringing" width={18} height={18} />
                Create Alert
              </button>
              
              {/* Contact Us Link */}
              <Link 
                href="/contactus" 
                prefetch={false}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-dark border border-dark/10 dark:border-white/10 hover:border-primary/50 text-dark dark:text-white rounded-xl font-semibold text-sm transition-all hover:scale-105"
              >
                <Icon icon="ph:envelope" width={18} height={18} />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Property Alert Dialog */}
      <PropertyAlertForm 
        isOpen={showAlertDialog} 
        onClose={() => setShowAlertDialog(false)} 
      />
    </div>
  );
}

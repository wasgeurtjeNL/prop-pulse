"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import HTMLContent from '@/components/ui/html-content';
import Breadcrumb from '@/components/new-design/breadcrumb';

// Dynamic imports for below-the-fold components to reduce initial bundle
const PropertyRequestTabs = dynamic(
  () => import('@/components/new-design/property-request/PropertyRequestTabs'),
  { loading: () => <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-[400px] rounded-2xl" /> }
);

const PropertyTrustBadges = dynamic(
  () => import('@/components/new-design/property-trust-badges'),
  { ssr: false }
);

const RelatedProperties = dynamic(
  () => import('@/components/new-design/properties/RelatedProperties'),
  { loading: () => <div className="animate-pulse h-64" /> }
);

const NearbyPois = dynamic(
  () => import('@/components/new-design/properties/NearbyPois'),
  { loading: () => <div className="animate-pulse h-48 rounded-xl bg-slate-100 dark:bg-slate-800" /> }
);

const PropertyAmenities = dynamic(
  () => import('@/components/new-design/properties/PropertyAmenities'),
  { loading: () => <div className="animate-pulse h-32 rounded-xl bg-slate-100 dark:bg-slate-800" /> }
);

const AdminEditButton = dynamic(
  () => import('@/components/shared/admin-edit-button'),
  { ssr: false }
);

const RentalBookingWidget = dynamic(
  () => import('@/components/shared/rental/RentalBookingWidget'),
  { ssr: false }
);

const PropertyMap = dynamic(
  () => import('@/components/shared/property-map'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-[250px] sm:h-[350px] md:h-[400px] rounded-2xl mt-6 sm:mt-8" />
  }
);

// Skeleton component for image placeholders with fixed aspect ratio to prevent CLS
const ImageSkeleton = ({ className = "", aspectRatio = "4/3" }: { className?: string; aspectRatio?: string }) => (
  <div 
    className={`animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 ${className}`}
    style={{ aspectRatio }}
  >
    <div className="w-full h-full flex items-center justify-center">
      <Icon icon="ph:image" className="w-12 h-12 text-slate-300 dark:text-slate-600" aria-hidden="true" />
    </div>
  </div>
);

// Optimized property image component with blur placeholder for instant perceived loading
const PropertyImage = ({ 
  src, 
  alt, 
  priority = false, 
  className = "",
  containerClassName = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  aspectRatio = "4/3",
  blurDataURL
}: { 
  src: string; 
  alt: string; 
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  aspectRatio?: string;
  blurDataURL?: string;
}) => {
  const [error, setError] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ aspectRatio }}
    >
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-xl sm:rounded-2xl">
          <Icon icon="ph:image-broken" className="w-12 h-12 text-slate-400" aria-hidden="true" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        className={`object-cover ${className}`}
        onError={() => setError(true)}
      />
    </div>
  );
};
import { formatPrice, sanitizeText } from '@/lib/utils';
import type { RelatedProperty } from '@/components/new-design/properties/RelatedProperties';

interface DetailsProps {
    /** Server-side fetched property data for faster initial render */
    initialProperty?: any;
    /** Server-side fetched related properties */
    initialRelatedProperties?: RelatedProperty[];
}

export default function Details({ initialProperty, initialRelatedProperties }: DetailsProps) {
    const { slug } = useParams();
    const [testimonials, setTestimonials] = useState<any>(null);
    const [propertyHomes, setPropertyHomes] = useState<any>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [pricingConfig, setPricingConfig] = useState<any>(null);

    // Fetch pricing config for rentals with daily rental enabled
    useEffect(() => {
        const fetchPricingConfig = async () => {
            try {
                const response = await fetch('/api/rental-pricing-config');
                if (response.ok) {
                    const data = await response.json();
                    setPricingConfig(data.config);
                }
            } catch (error) {
                console.error('Failed to fetch pricing config:', error);
            }
        };
        
        // Only fetch if we have a rental property with daily rental enabled
        const property = initialProperty || propertyHomes;
        if (property?.type === 'FOR_RENT' && property?.enableDailyRental) {
            fetchPricingConfig();
        }
    }, [initialProperty, propertyHomes]);

   useEffect(() => {
    // Skip fetch if we have initial property data
    if (initialProperty) {
        return;
    }
    
    const fetchData = async () => {
        try {
            const [pageRes, propertyRes] = await Promise.all([
                fetch('/api/page-data'),
                fetch('/api/property-data')
            ])

            if (!pageRes.ok || !propertyRes.ok) {
                throw new Error('Failed to fetch one or more APIs')
            }

            const pageData = await pageRes.json()
            const propertyData = await propertyRes.json()

            setTestimonials(pageData?.testimonials)
            setPropertyHomes(propertyData?.propertyHomes) 

        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }

    fetchData()
}, [initialProperty])

    // Use server-side data if available, otherwise use client-side fetched data
    const item = initialProperty || propertyHomes?.find((item:any) => item.slug === slug);

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = 'unset';
    };

    const nextImage = () => {
        if (item?.images) {
            setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
        }
    };

    const previousImage = () => {
        if (item?.images) {
            setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') previousImage();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, item?.images]);
    // Build breadcrumbs for the property
    const breadcrumbs = item ? [
        { name: 'Properties', href: '/properties' },
        { name: item.name || item.title || 'Property', href: `/properties/${item.slug}` }
    ] : [];

    // Check if property is sold or rented
    const isSoldOrRented = item?.status === 'SOLD' || item?.status === 'RENTED';
    const statusLabel = item?.status === 'SOLD' ? 'Sold' : 'Rented';
    const statusColor = item?.status === 'SOLD' ? 'from-blue-600 to-blue-800' : 'from-amber-500 to-amber-700';
    const statusIcon = item?.status === 'SOLD' ? 'ph:seal-check-fill' : 'ph:key-fill';

    return (
        <main className="py-[5px] relative overflow-x-hidden" role="main">
            <div className="container mx-auto max-w-8xl px-3 sm:px-4 md:px-5 2xl:px-0">
                {/* Breadcrumbs */}
                {item && (
                    <div className="mb-1 sm:mb-2">
                        <Breadcrumb items={breadcrumbs} />
                    </div>
                )}
                
                {/* SOLD / RENTED Banner */}
                {isSoldOrRented && (
                    <div className={`bg-gradient-to-r ${statusColor} text-white py-4 px-4 sm:px-6 mb-4 sm:mb-6 rounded-xl shadow-lg`}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Icon icon={statusIcon} className="w-6 h-6 sm:w-8 sm:h-8" />
                                <div>
                                    <span className="text-lg sm:text-xl font-bold uppercase tracking-wide">
                                        This Property Has Been {statusLabel}
                                    </span>
                                    <p className="text-white/80 text-sm mt-0.5">
                                        Interested in similar properties?
                                    </p>
                                </div>
                            </div>
                            <Link 
                                href={`/properties?type=${item?.type === 'FOR_RENT' ? 'rent' : 'buy'}`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
                            >
                                <Icon icon="ph:buildings" className="w-4 h-4" />
                                View Available Properties
                                <Icon icon="ph:arrow-right" className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-12 items-end gap-3 sm:gap-4 md:gap-6">
                    <div className="lg:col-span-8 col-span-12">
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                            {/* Property Type Badge */}
                            <span className={`inline-flex items-center gap-1 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                                item?.type === 'FOR_RENT' 
                                    ? 'bg-purple-500 text-white' 
                                    : 'bg-primary text-white'
                            }`}>
                                <Icon 
                                    icon={item?.type === 'FOR_RENT' ? 'solar:key-bold' : 'solar:tag-price-bold'} 
                                    width={14} 
                                    height={14}
                                    className="sm:w-4 sm:h-4"
                                />
                                {item?.type === 'FOR_RENT' ? 'For Rent' : 'For Sale'}
                            </span>
                            {/* Category Badge */}
                            {item?.category && (
                                <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70">
                                    {item.category.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                            )}
                            {/* Listing Number Badge */}
                            {item?.listingNumber && (
                                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono">
                                    <Icon icon="ph:hash" width={12} height={12} />
                                    {item.listingNumber}
                                </span>
                            )}
                            {/* Ownership Type Badge (Freehold/Leasehold) - Only for FOR_SALE */}
                            {item?.type === 'FOR_SALE' && item?.ownershipType && (
                                <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
                                    item.ownershipType === 'FREEHOLD'
                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                }`}>
                                    <Icon 
                                        icon={item.ownershipType === 'FREEHOLD' ? 'ph:seal-check-bold' : 'ph:clock-bold'} 
                                        width={12} 
                                        height={12} 
                                    />
                                    {item.ownershipType === 'FREEHOLD' ? 'Freehold' : 'Leasehold'}
                                </span>
                            )}
                            {/* Re-sale Badge - Only for FOR_SALE */}
                            {item?.type === 'FOR_SALE' && item?.isResale && (
                                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    <Icon icon="ph:repeat-bold" width={12} height={12} />
                                    Re-sale
                                </span>
                            )}
                        </div>
                        <h1 className='text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-52 font-semibold text-dark dark:text-white leading-tight'>{sanitizeText(item?.name)}</h1>
                        <div className="flex gap-2 mt-1.5 sm:mt-2">
                            <Icon icon="ph:map-pin" width={16} height={16} className="text-dark/60 dark:text-white/50 flex-shrink-0 sm:w-5 sm:h-5" />
                            <p className='text-dark/60 dark:text-white/50 text-xs sm:text-sm md:text-base'>{sanitizeText(item?.location)}</p>
                        </div>
                        {/* Price Display */}
                        {item?.rate && (
                            <div className="mt-2 sm:mt-4 flex items-baseline gap-1 sm:gap-2">
                                <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                                    {formatPrice(item.rate)}
                                </span>
                                {item?.type === 'FOR_RENT' && !item.rate.toString().toLowerCase().includes('month') && (
                                    <span className="text-sm sm:text-base md:text-lg text-dark/60 dark:text-white/50 font-medium">
                                        / month
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-4 col-span-12 mt-3 lg:mt-0">
                        <div className='flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mb-2 snap-x snap-mandatory'>
                            <div className='flex flex-col gap-1 sm:gap-2 flex-shrink-0 min-w-[70px] sm:min-w-0 sm:flex-1 snap-start'>
                                <Icon icon={'solar:bed-linear'} width={18} height={18} className="sm:w-5 sm:h-5" />
                                <p className='text-[11px] sm:text-xs md:text-sm font-normal text-black dark:text-white whitespace-nowrap'>
                                    {item?.beds} Bed
                                </p>
                            </div>
                            <div className='flex flex-col gap-1 sm:gap-2 border-x border-black/10 dark:border-white/20 px-2 sm:px-3 md:px-4 flex-shrink-0 min-w-[70px] sm:min-w-0 sm:flex-1 snap-start'>
                                <Icon icon={'solar:bath-linear'} width={18} height={18} className="sm:w-5 sm:h-5" />
                                <p className='text-[11px] sm:text-xs md:text-sm font-normal text-black dark:text-white whitespace-nowrap'>
                                    {item?.baths} Bath
                                </p>
                            </div>
                            <div className='flex flex-col gap-1 sm:gap-2 flex-shrink-0 min-w-[70px] sm:min-w-0 sm:flex-1 snap-start'>
                                <Icon
                                    icon={'lineicons:arrow-all-direction'}
                                    width={18}
                                    height={18}
                                    className="sm:w-5 sm:h-5"
                                />
                                <p className='text-[11px] sm:text-xs md:text-sm font-normal text-black dark:text-white whitespace-nowrap'>
                                    {item?.area}m<sup>2</sup>
                                </p>
                            </div>
                            {item?.plotSize && item.plotSize > 0 && (
                                <div className='flex flex-col gap-1 sm:gap-2 border-l border-black/10 dark:border-white/20 pl-2 sm:pl-3 md:pl-4 flex-shrink-0 min-w-[70px] sm:min-w-0 sm:flex-1 snap-start'>
                                    <Icon
                                        icon={'ph:selection-all'}
                                        width={18}
                                        height={18}
                                        className="sm:w-5 sm:h-5"
                                    />
                                    <p className='text-[11px] sm:text-xs md:text-sm font-normal text-black dark:text-white whitespace-nowrap'>
                                        {item.plotSize}m<sup>2</sup> Plot
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Image Gallery - Mobile Horizontal Scroll */}
                {item?.images && item.images.length > 0 && (
                    <div className="sm:hidden mt-6 -mx-3 px-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2" role="region" aria-label="Property images gallery">
                            {item.images.map((image: any, index: number) => (
                                <button 
                                    key={index}
                                    className="flex-shrink-0 w-[85%] snap-start cursor-pointer group relative overflow-hidden rounded-xl border-0 p-0 bg-transparent"
                                    onClick={() => openLightbox(index)}
                                    aria-label={`View property image ${index + 1} of ${item.images.length}`}
                                    type="button"
                                >
                                    <PropertyImage
                                        src={image.src}
                                        alt={`${item?.name || 'Property'} - Image ${index + 1}`}
                                        priority={index === 0}
                                        sizes="85vw"
                                        className="rounded-xl"
                                        blurDataURL={image.blurDataURL}
                                        containerClassName="w-full"
                                        aspectRatio="4/3"
                                    />
                                    {/* SOLD/RENTED Overlay on Mobile Images (first image only) */}
                                    {isSoldOrRented && index === 0 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 pointer-events-none rounded-xl">
                                            <div className={`
                                                transform rotate-[-12deg] px-6 py-3 
                                                ${item?.status === 'SOLD' ? 'bg-blue-600' : 'bg-amber-500'}
                                                shadow-xl border-2 border-white/30
                                            `}>
                                                <span className="text-white font-black text-2xl uppercase tracking-widest">
                                                    {item?.status}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {/* Image counter badge */}
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10" aria-hidden="true">
                                        <Icon icon="ph:images" width={14} height={14} aria-hidden="true" />
                                        {index + 1}/{item.images.length}
                                    </div>
                                    {/* Tap to expand hint on first image (hide when sold) */}
                                    {index === 0 && !isSoldOrRented && (
                                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 z-10" aria-hidden="true">
                                            <Icon icon="ph:arrows-out" width={12} height={12} aria-hidden="true" />
                                            Tap to expand
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Image Gallery - Desktop Grid Layout (Hidden on mobile) */}
                <div className="hidden sm:grid grid-cols-12 mt-6 sm:mt-8 gap-2 sm:gap-4 md:gap-6" role="region" aria-label="Property images gallery">
                    {/* Main Image - Hero with priority loading */}
                    <div className="col-span-12 lg:col-span-8 lg:row-span-2">
                        {item?.images && item?.images[0] && (
                            <button 
                                className="w-full cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 p-0 bg-transparent block" 
                                onClick={() => openLightbox(0)}
                                aria-label={`View main property image - ${item?.name || 'Property'}`}
                                type="button"
                            >
                                <PropertyImage
                                    src={item.images[0]?.src}
                                    alt={`${item?.name || 'Property'} - Main image`}
                                    priority={true}
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                    className="rounded-xl sm:rounded-2xl transition-transform duration-300 group-hover:scale-105"
                                    blurDataURL={item.images[0]?.blurDataURL}
                                    containerClassName="w-full"
                                    aspectRatio="16/10"
                                />
                                {/* SOLD/RENTED Overlay on Main Image */}
                                {isSoldOrRented && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 pointer-events-none rounded-xl sm:rounded-2xl">
                                        <div className={`
                                            transform rotate-[-12deg] px-8 sm:px-12 py-4 sm:py-6 
                                            ${item?.status === 'SOLD' ? 'bg-blue-600' : 'bg-amber-500'}
                                            shadow-2xl border-4 border-white/30
                                        `}>
                                            <span className="text-white font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-widest drop-shadow-lg">
                                                {item?.status}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center z-10" aria-hidden="true">
                                    <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={36} height={36} aria-hidden="true" />
                                </div>
                            </button>
                        )}
                    </div>
                    {/* Secondary images - Only visible on sm+ screens */}
                    <div className="hidden sm:block lg:col-span-4 col-span-6">
                        {item?.images && item?.images[1] && (
                            <button 
                                className="w-full cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 p-0 bg-transparent block" 
                                onClick={() => openLightbox(1)}
                                aria-label={`View property image 2 of ${item.images.length}`}
                                type="button"
                            >
                                <PropertyImage
                                    src={item.images[1]?.src}
                                    alt={`${item?.name || 'Property'} - Image 2`}
                                    sizes="(max-width: 1024px) 50vw, 33vw"
                                    className="rounded-xl sm:rounded-2xl transition-transform duration-300 group-hover:scale-105"
                                    containerClassName="w-full"
                                    blurDataURL={item.images[1]?.blurDataURL}
                                    aspectRatio="4/3"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center z-10" aria-hidden="true">
                                    <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={40} height={40} aria-hidden="true" />
                                </div>
                            </button>
                        )}
                    </div>
                    <div className="hidden sm:block lg:col-span-2 col-span-6">
                        {item?.images && item?.images[2] && (
                            <button 
                                className="w-full cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 p-0 bg-transparent block" 
                                onClick={() => openLightbox(2)}
                                aria-label={`View property image 3 of ${item.images.length}`}
                                type="button"
                            >
                                <PropertyImage
                                    src={item.images[2]?.src}
                                    alt={`${item?.name || 'Property'} - Image 3`}
                                    sizes="(max-width: 1024px) 50vw, 16vw"
                                    className="rounded-xl sm:rounded-2xl transition-transform duration-300 group-hover:scale-105"
                                    containerClassName="w-full"
                                    blurDataURL={item.images[2]?.blurDataURL}
                                    aspectRatio="16/9"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center z-10" aria-hidden="true">
                                    <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={36} height={36} aria-hidden="true" />
                                </div>
                            </button>
                        )}
                    </div>
                    <div className="hidden sm:block lg:col-span-2 col-span-6">
                        {item?.images && item?.images[3] && (
                            <button 
                                className="w-full cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 p-0 bg-transparent block" 
                                onClick={() => openLightbox(3)}
                                aria-label={item.images.length > 4 ? `View all ${item.images.length} property images` : `View property image 4 of ${item.images.length}`}
                                type="button"
                            >
                                <PropertyImage
                                    src={item.images[3]?.src}
                                    alt={`${item?.name || 'Property'} - Image 4`}
                                    sizes="(max-width: 1024px) 50vw, 16vw"
                                    className="rounded-xl sm:rounded-2xl transition-transform duration-300 group-hover:scale-105"
                                    containerClassName="w-full"
                                    blurDataURL={item.images[3]?.blurDataURL}
                                    aspectRatio="16/9"
                                />
                                
                                {/* Show More Overlay - when there are more than 4 images */}
                                {item.images.length > 4 ? (
                                    <div className="absolute inset-0 bg-black/70 group-hover:bg-black/80 transition-all duration-300 flex flex-col items-center justify-center z-10">
                                        <span className="text-white text-sm sm:text-xl font-bold uppercase tracking-wider">Show More</span>
                                        <span className="text-white text-xs sm:text-sm mt-1">+{item.images.length - 4} photos</span>
                                        <Icon icon="ph:images" className="text-white mt-2" width={24} height={24} aria-hidden="true" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center z-10" aria-hidden="true">
                                        <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={36} height={36} aria-hidden="true" />
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8 mt-5 sm:mt-8">
                    <div className="lg:col-span-8 col-span-12">
                        <h2 className='text-base sm:text-lg md:text-xl font-medium'>Property details</h2>
                        <div className="py-4 sm:py-6 md:py-8 my-4 sm:my-6 md:my-8 border-y border-dark/10 dark:border-white/20 flex flex-col gap-4 sm:gap-6">
                            {item?.propertyFeatures && item.propertyFeatures.length > 0 ? (
                                item.propertyFeatures.map((feature: any, index: number) => (
                                    <div key={index} className="flex items-start gap-4 sm:gap-6">
                                        <div className="flex-shrink-0">
                                            <Icon 
                                                icon={feature.icon || 'ph:house'} 
                                                width={28} 
                                                height={28} 
                                                className="text-dark dark:text-white sm:w-8 sm:h-8" 
                                            />
                                        </div>
                                        <div>
                                            <h3 className='text-dark dark:text-white text-base sm:text-sm'>{feature.title}</h3>
                                            <p className='text-sm sm:text-base text-dark/60 dark:text-white/50'>
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Fallback to default features if none in database
                                <>
                                    <div className="flex items-start gap-4 sm:gap-6">
                                        <div className="flex-shrink-0">
                                            <Image src="/images/SVGs/property-details.svg" width={32} height={32} alt="" className='w-7 h-7 sm:w-8 sm:h-8 dark:hidden' unoptimized={true} />
                                            <Image src="/images/SVGs/property-details-white.svg" width={32} height={32} alt="" className='w-7 h-7 sm:w-8 sm:h-8 dark:block hidden' unoptimized={true} />
                                        </div>
                                        <div>
                                            <h3 className='text-dark dark:text-white text-base sm:text-sm'>Property details</h3>
                                            <p className='text-sm sm:text-base text-dark/60 dark:text-white/50'>
                                                One of the few homes in the area with a private pool.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <Image src="/images/SVGs/smart-home-access.svg" width={400} height={500} alt="" className='w-8 h-8 dark:hidden' unoptimized={true} />
                                            <Image src="/images/SVGs/smart-home-access-white.svg" width={400} height={500} alt="" className='w-8 h-8 dark:block hidden' unoptimized={true} />
                                        </div>
                                        <div>
                                            <h3 className='text-dark dark:text-white text-sm'>Smart home access</h3>
                                            <p className='text-base text-dark/60 dark:text-white/50'>
                                                Easily check yourself in with a modern keypad system.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <Image src="/images/SVGs/energyefficient.svg" width={400} height={500} alt="" className='w-8 h-8 dark:hidden' unoptimized={true} />
                                            <Image src="/images/SVGs/energyefficient-white.svg" width={400} height={500} alt="" className='w-8 h-8 dark:block hidden' unoptimized={true} />
                                        </div>
                                        <div>
                                            <h3 className='text-dark dark:text-white text-sm'>
                                                {item?.yearBuilt ? `Built in ${item.yearBuilt}` : 'Energy efficient'}
                                            </h3>
                                            <p className='text-base text-dark/60 dark:text-white/50'>
                                                {item?.yearBuilt 
                                                    ? `Modern construction with sustainable features.`
                                                    : 'Built with sustainable and smart-home features.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex flex-col gap-4 sm:gap-5">
                            {item?.shortDescription && (
                                <p className='text-dark dark:text-white text-base sm:text-lg font-medium'>
                                    {item.shortDescription}
                                </p>
                            )}
                            {item?.content ? (
                                <HTMLContent 
                                    content={item.content} 
                                    className="text-dark dark:text-white text-sm sm:text-base prose prose-p:my-4 max-w-none" 
                                />
                            ) : (
                                <p className='text-dark dark:text-white text-sm sm:text-base'>
                                    No description available for this property.
                                </p>
                            )}
                        </div>
                        {/* Property Amenities - Interactive Component */}
                        {item?.amenities && item.amenities.length > 0 && (
                            <PropertyAmenities amenities={item.amenities} />
                        )}
                        {/* Nearby Points of Interest */}
                        {item?.id && (
                            <NearbyPois propertyId={item.id} />
                        )}

                        {/* Dynamic Related Properties - prevents 404s when properties are deleted */}
                        {item && (
                            <RelatedProperties
                                currentSlug={item.slug}
                                propertyType={item.type}
                                location={item.location}
                                category={item.category}
                                limit={3}
                                initialProperties={initialRelatedProperties}
                            />
                        )}

                        {/* Property Map - Uses Google Embed if valid, otherwise OpenStreetMap fallback */}
                        {(item?.mapUrl || (item?.latitude && item?.longitude)) && (
                            <div className="mt-6 sm:mt-8">
                                <PropertyMap
                                    mapUrl={item.mapUrl}
                                    latitude={item.latitude}
                                    longitude={item.longitude}
                                    title={item.title}
                                    className="rounded-2xl w-full h-[250px] sm:h-[350px] md:h-[400px]"
                                />
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-4 col-span-12 mt-4 sm:mt-6 lg:mt-0">
                        {/* SOLD / RENTED - Show Alternative CTA */}
                        {isSoldOrRented ? (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-800/50">
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                                        item?.status === 'SOLD' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                                    }`}>
                                        <Icon 
                                            icon={item?.status === 'SOLD' ? 'ph:seal-check-fill' : 'ph:key-fill'} 
                                            className={`w-8 h-8 ${
                                                item?.status === 'SOLD' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
                                            }`}
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        This Property is No Longer Available
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                                        This property has been {item?.status?.toLowerCase()}. Browse our other {item?.type === 'FOR_RENT' ? 'rental' : 'sale'} properties to find your perfect home.
                                    </p>
                                    <Link 
                                        href={`/properties?type=${item?.type === 'FOR_RENT' ? 'rent' : 'buy'}`}
                                        className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                                    >
                                        <Icon icon="ph:buildings" className="w-5 h-5" />
                                        Browse Available Properties
                                    </Link>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                            Or contact us for similar properties:
                                        </p>
                                        <a 
                                            href="tel:+66986261646"
                                            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                                        >
                                            <Icon icon="ph:phone" className="w-4 h-4" />
                                            +66 (0)98 626 1646
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Rental Booking Widget - Only for FOR_RENT with daily rental enabled */}
                                {item?.type === 'FOR_RENT' && item?.enableDailyRental && item?.monthlyRentalPrice && (
                                    <div className="mb-6">
                                        <RentalBookingWidget
                                            monthlyPrice={item.monthlyRentalPrice}
                                            maxGuests={item.maxGuests || 10}
                                            allowPets={item.allowPets || false}
                                            pricingConfig={pricingConfig}
                                            property={{
                                                id: item.id,
                                                title: item.title,
                                                image: item.images?.[0]?.src || item.image || '/images/properties/property7.jpg',
                                                location: item.location,
                                            }}
                                            onBookingConfirmed={(booking) => {
                                                console.log('Booking confirmed:', booking);
                                            }}
                                        />
                                    </div>
                                )}
                                {/* Property Request Tabs */}
                                {item && (
                                    <PropertyRequestTabs
                                        propertyId={item.id}
                                        propertyTitle={item.title}
                                        propertySlug={item.slug}
                                        phoneNumber="+66 (0)98 626 1646"
                                    />
                                )}
                            </>
                        )}
                        {testimonials && testimonials?.slice(0, 1).map((item:any, index:any) => (
                            <div key={index} className="border p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl border-dark/10 dark:border-white/20 mt-4 sm:mt-6 md:mt-10 flex flex-col gap-3 sm:gap-4 md:gap-6">
                                <Icon icon="ph:house-simple" width={36} height={36} className="text-primary sm:w-11 sm:h-11" />
                                <p className='text-sm sm:text-base text-dark dark:text-white'>{item.review}</p>
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <Image src={item.image} alt={item.name} width={80} height={80} className='w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0' loading="lazy" />
                                    <div className="">
                                        <h3 className='text-sm sm:text-base text-dark dark:text-white'>{item.name}</h3>
                                        <h4 className='text-xs sm:text-sm text-dark/60 dark:text-white/50'>{item.position}</h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal - Improved for mobile */}
            {lightboxOpen && item?.images && (
                <div 
                    className="fixed inset-0 bg-black z-[9999] flex flex-col"
                    onClick={closeLightbox}
                >
                    {/* Header with close button and counter - Minimal on mobile */}
                    <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 flex-shrink-0 absolute top-0 left-0 right-0 z-20">
                        <div className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                            {currentImageIndex + 1} / {item.images.length}
                        </div>
                        <button
                            onClick={closeLightbox}
                            className="text-white hover:text-gray-300 transition-colors p-1.5 sm:p-2 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80"
                            aria-label="Close lightbox"
                        >
                            <Icon icon="ph:x" width={22} height={22} className="sm:w-6 sm:h-6" />
                        </button>
                    </div>

                    {/* Main Image Area - Takes maximum space */}
                    <div 
                        className="flex-1 relative flex items-center justify-center px-1 sm:px-4 pt-12 sm:pt-14 pb-16 sm:pb-20 min-h-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Previous Button */}
                        {item.images.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    previousImage();
                                }}
                                className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-1.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                                aria-label="Previous image"
                            >
                                <Icon icon="ph:caret-left" width={28} height={28} className="sm:w-10 sm:h-10" />
                            </button>
                        )}

                        {/* Image - Uses fill to take full container space */}
                        <div className="relative w-full h-full max-w-7xl mx-auto">
                            <Image
                                src={item.images[currentImageIndex]?.src}
                                alt={`Property Image ${currentImageIndex + 1}`}
                                fill
                                sizes="100vw"
                                className="object-contain"
                                priority
                            />
                            
                            {/* SOLD Overlay in Lightbox */}
                            {isSoldOrRented && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className={`
                                        transform rotate-[-12deg] px-6 sm:px-10 py-3 sm:py-5 
                                        ${item?.status === 'SOLD' ? 'bg-blue-600/90' : 'bg-amber-500/90'}
                                        shadow-2xl border-2 sm:border-4 border-white/40
                                    `}>
                                        <span className="text-white font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-widest drop-shadow-lg">
                                            {item?.status}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Next Button */}
                        {item.images.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextImage();
                                }}
                                className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-1.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                                aria-label="Next image"
                            >
                                <Icon icon="ph:caret-right" width={28} height={28} className="sm:w-10 sm:h-10" />
                            </button>
                        )}
                    </div>

                    {/* Thumbnail Strip - Ultra compact on mobile, positioned at bottom */}
                    {item.images.length > 1 && (
                        <div className="absolute bottom-0 left-0 right-0 flex-shrink-0 py-1.5 sm:py-3 px-2 sm:px-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                            <div className="flex gap-1 sm:gap-2 justify-center max-w-full overflow-x-auto scrollbar-hide">
                                {item.images.map((image: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex(index);
                                        }}
                                        className={`relative flex-shrink-0 rounded overflow-hidden transition-all duration-200 ${
                                            index === currentImageIndex 
                                                ? 'ring-2 ring-white opacity-100 scale-110' 
                                                : 'opacity-40 hover:opacity-70'
                                        }`}
                                        aria-label={`View image ${index + 1}`}
                                    >
                                        <Image
                                            src={image.src}
                                            alt={`Thumbnail ${index + 1}`}
                                            width={48}
                                            height={36}
                                            className="w-10 h-7 sm:w-14 sm:h-10 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Admin Edit Button */}
            {item && <AdminEditButton editType="property" editId={item.id} />}
        </main>
    );
}

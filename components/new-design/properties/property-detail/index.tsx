"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import HTMLContent from '@/components/ui/html-content';
import PropertyRequestTabs from '@/components/new-design/property-request/PropertyRequestTabs';
import PropertyTrustBadges from '@/components/new-design/property-trust-badges';
import RelatedProperties from '@/components/new-design/properties/RelatedProperties';
import Breadcrumb from '@/components/new-design/breadcrumb';
import AdminEditButton from '@/components/shared/admin-edit-button';

export default function Details() {
    const { slug } = useParams();
    const [testimonials, setTestimonials] = useState<any>(null);
    const [propertyHomes, setPropertyHomes] = useState<any>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

   useEffect(() => {
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
}, [])

    const item = propertyHomes?.find((item:any) => item.slug === slug);

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

    return (
        <section className="pt-2 sm:pt-3 pb-8 sm:pb-12 md:pb-16 lg:pb-20 relative overflow-x-hidden" >
            <div className="container mx-auto max-w-8xl px-3 sm:px-4 md:px-5 2xl:px-0">
                {/* Breadcrumbs */}
                {item && (
                    <div className="mb-1 sm:mb-2">
                        <Breadcrumb items={breadcrumbs} />
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
                        </div>
                        <h1 className='text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-52 font-semibold text-dark dark:text-white leading-tight'>{item?.name}</h1>
                        <div className="flex gap-2 mt-1.5 sm:mt-2">
                            <Icon icon="ph:map-pin" width={16} height={16} className="text-dark/50 dark:text-white/50 flex-shrink-0 sm:w-5 sm:h-5" />
                            <p className='text-dark/50 dark:text-white/50 text-xs sm:text-sm md:text-base'>{item?.location}</p>
                        </div>
                        {/* Price Display */}
                        {item?.rate && (
                            <div className="mt-2 sm:mt-4 flex items-baseline gap-1 sm:gap-2">
                                <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                                    {item.rate.toString().includes('฿') || item.rate.toString().includes('$') ? item.rate : `฿${item.rate}`}
                                </span>
                                {item?.type === 'FOR_RENT' && !item.rate.toString().toLowerCase().includes('month') && (
                                    <span className="text-sm sm:text-base md:text-lg text-dark/50 dark:text-white/50 font-medium">
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
                        </div>
                    </div>
                </div>
                {/* Image Gallery - Mobile Horizontal Scroll */}
                {item?.images && item.images.length > 0 && (
                    <div className="sm:hidden mt-6 -mx-3 px-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
                            {item.images.map((image: any, index: number) => (
                                <div 
                                    key={index}
                                    className="flex-shrink-0 w-[85%] h-[220px] xs:h-[260px] snap-start cursor-pointer group relative overflow-hidden rounded-xl"
                                    onClick={() => openLightbox(index)}
                                >
                                    <Image
                                        src={image.src}
                                        alt={`Property Image ${index + 1}`}
                                        width={400}
                                        height={500}
                                        className="rounded-xl w-full h-full object-cover"
                                        unoptimized={true}
                                    />
                                    {/* Image counter badge */}
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Icon icon="ph:images" width={14} height={14} />
                                        {index + 1}/{item.images.length}
                                    </div>
                                    {/* Tap to expand hint on first image */}
                                    {index === 0 && (
                                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                                            <Icon icon="ph:arrows-out" width={12} height={12} />
                                            Tap to expand
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Image Gallery - Desktop Grid Layout (Hidden on mobile) */}
                <div className="hidden sm:grid grid-cols-12 mt-6 sm:mt-8 gap-2 sm:gap-4 md:gap-6">
                    {/* Main Image */}
                    <div className="col-span-12 lg:col-span-8 lg:row-span-2">
                        {item?.images && item?.images[0] && (
                            <div className="w-full h-[400px] md:h-[540px] cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl" onClick={() => openLightbox(0)}>
                                <Image
                                    src={item.images[0]?.src}
                                    alt="Main Property Image"
                                    width={400}
                                    height={500}
                                    className="rounded-xl sm:rounded-2xl w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    unoptimized={true}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                    <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={36} height={36} />
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Secondary images - Only visible on sm+ screens */}
                    <div className="hidden sm:block lg:col-span-4 col-span-6 w-full h-[180px] sm:h-[240px] md:h-[335px]">
                        {item?.images && item?.images[1] && (
                            <div className="w-full h-full cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl" onClick={() => openLightbox(1)}>
                                <Image src={item.images[1]?.src} alt="Property Image 2" width={400} height={500} className="rounded-xl sm:rounded-2xl w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" unoptimized={true} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                    <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={40} height={40} />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:block lg:col-span-2 col-span-6 w-full h-[100px] sm:h-[140px] md:h-[155px]">
                        {item?.images && item?.images[2] && (
                            <div className="w-full h-full cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl" onClick={() => openLightbox(2)}>
                                <Image src={item.images[2]?.src} alt="Property Image 3" width={400} height={500} className="rounded-xl sm:rounded-2xl w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" unoptimized={true} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                    <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={36} height={36} />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:block lg:col-span-2 col-span-6 w-full h-[100px] sm:h-[140px] md:h-[155px]">
                        {item?.images && item?.images[3] && (
                            <div className="w-full h-full cursor-pointer group relative overflow-hidden rounded-xl sm:rounded-2xl" onClick={() => openLightbox(3)}>
                                <Image src={item.images[3]?.src} alt="Property Image 4" width={400} height={500} className="rounded-xl sm:rounded-2xl w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" unoptimized={true} />
                                
                                {/* Show More Overlay - when there are more than 4 images */}
                                {item.images.length > 4 ? (
                                    <div className="absolute inset-0 bg-black/70 group-hover:bg-black/80 transition-all duration-300 flex flex-col items-center justify-center">
                                        <h3 className="text-white text-sm sm:text-xl font-bold uppercase tracking-wider">Show More</h3>
                                        <p className="text-white text-xs sm:text-sm mt-1">+{item.images.length - 4} photos</p>
                                        <Icon icon="ph:images" className="text-white mt-2" width={24} height={24} />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                        <Icon icon="ph:magnifying-glass-plus" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width={36} height={36} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8 mt-5 sm:mt-8">
                    <div className="lg:col-span-8 col-span-12">
                        <h3 className='text-base sm:text-lg md:text-xl font-medium'>Property details</h3>
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
                                            <h3 className='text-dark dark:text-white text-base sm:text-xm'>{feature.title}</h3>
                                            <p className='text-sm sm:text-base text-dark/50 dark:text-white/50'>
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
                                            <h3 className='text-dark dark:text-white text-base sm:text-xm'>Property details</h3>
                                            <p className='text-sm sm:text-base text-dark/50 dark:text-white/50'>
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
                                            <h3 className='text-dark dark:text-white text-xm'>Smart home access</h3>
                                            <p className='text-base text-dark/50 dark:text-white/50'>
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
                                            <h3 className='text-dark dark:text-white text-xm'>
                                                {item?.yearBuilt ? `Built in ${item.yearBuilt}` : 'Energy efficient'}
                                            </h3>
                                            <p className='text-base text-dark/50 dark:text-white/50'>
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
                        {item?.amenities && item.amenities.length > 0 && (
                            <div className="py-4 sm:py-6 md:py-8 mt-4 sm:mt-6 border-t border-dark/5 dark:border-white/15">
                                <h3 className='text-base sm:text-lg md:text-xl font-medium'>What this property offers</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 mt-3 sm:mt-4 gap-3 sm:gap-4">
                                    {item.amenities.map((amenity: string, index: number) => (
                                        <div key={index} className="flex items-center gap-2.5">
                                            <Icon icon="ph:check-circle" width={20} height={20} className="text-primary flex-shrink-0 sm:w-6 sm:h-6" />
                                            <p className='text-sm sm:text-base dark:text-white text-dark'>{amenity}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Dynamic Related Properties - prevents 404s when properties are deleted */}
                        {item && (
                            <RelatedProperties
                                currentSlug={item.slug}
                                propertyType={item.type}
                                location={item.location}
                                category={item.category}
                                limit={3}
                            />
                        )}

                        {item?.mapUrl && (
                            <iframe
                                src={item.mapUrl}
                                width="1114" height="400" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-2xl w-full h-[250px] sm:h-[350px] md:h-[400px] mt-6 sm:mt-8">
                            </iframe>
                        )}
                    </div>
                    <div className="lg:col-span-4 col-span-12 mt-4 sm:mt-6 lg:mt-0">
                        {/* Property Request Tabs */}
                        {item && (
                            <PropertyRequestTabs
                                propertyId={item.id}
                                propertyTitle={item.title}
                                propertySlug={item.slug}
                                phoneNumber="+66 (0) 9 862 61646"
                            />
                        )}
                        {testimonials && testimonials?.slice(0, 1).map((item:any, index:any) => (
                            <div key={index} className="border p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl border-dark/10 dark:border-white/20 mt-4 sm:mt-6 md:mt-10 flex flex-col gap-3 sm:gap-4 md:gap-6">
                                <Icon icon="ph:house-simple" width={36} height={36} className="text-primary sm:w-11 sm:h-11" />
                                <p className='text-sm sm:text-base text-dark dark:text-white'>{item.review}</p>
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <Image src={item.image} alt={item.name} width={80} height={80} className='w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0' unoptimized={true} />
                                    <div className="">
                                        <h3 className='text-sm sm:text-base text-dark dark:text-white'>{item.name}</h3>
                                        <h4 className='text-xs sm:text-sm text-dark/50 dark:text-white/50'>{item.position}</h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && item?.images && (
                <div 
                    className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-2 sm:p-4"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[10000] text-white hover:text-gray-300 transition-colors p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70"
                        aria-label="Close lightbox"
                    >
                        <Icon icon="ph:x" width={24} height={24} className="sm:w-8 sm:h-8" />
                    </button>

                    {/* Previous Button */}
                    {item.images.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                previousImage();
                            }}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70"
                            aria-label="Previous image"
                        >
                            <Icon icon="ph:caret-left" width={28} height={28} className="sm:w-10 sm:h-10" />
                        </button>
                    )}

                    {/* Image Container */}
                    <div 
                        className="relative max-w-7xl max-h-[85vh] sm:max-h-[90vh] w-full h-full flex items-center justify-center pb-20 sm:pb-24"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={item.images[currentImageIndex]?.src}
                            alt={`Property Image ${currentImageIndex + 1}`}
                            width={1920}
                            height={1080}
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                            unoptimized={true}
                        />
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                            {currentImageIndex + 1} / {item.images.length}
                        </div>
                    </div>

                    {/* Next Button */}
                    {item.images.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                nextImage();
                            }}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70"
                            aria-label="Next image"
                        >
                            <Icon icon="ph:caret-right" width={28} height={28} className="sm:w-10 sm:h-10" />
                        </button>
                    )}

                    {/* Thumbnail Strip */}
                    {item.images.length > 1 && (
                        <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 max-w-[90vw] overflow-x-auto px-2 sm:px-4 pb-2 scrollbar-hide">
                            {item.images.map((image: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex(index);
                                    }}
                                    className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                        currentImageIndex === index
                                            ? 'border-white scale-110'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <Image
                                        src={image.src}
                                        alt={`Thumbnail ${index + 1}`}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                        unoptimized={true}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Admin Edit Button */}
            {item && <AdminEditButton editType="property" editId={item.id} />}
        </section>
    );
}

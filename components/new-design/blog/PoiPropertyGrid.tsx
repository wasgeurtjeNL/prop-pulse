'use client';

/**
 * PoiPropertyGrid - Dynamic property grid for POI-based blogs
 * 
 * This component fetches LIVE properties based on stored POI query parameters,
 * ensuring blog visitors always see current, available properties rather than
 * potentially sold/outdated listings that were used during blog generation.
 */

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPropertyUrl } from '@/lib/property-url';

interface Property {
  id: string;
  title: string;
  slug: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  type: 'FOR_SALE' | 'FOR_RENT';
  provinceSlug?: string | null;
  areaSlug?: string | null;
  nearestPoi?: {
    name: string;
    distance: string;
  };
}

interface PoiPropertyGridProps {
  templateId: string;
  queryParams: Record<string, unknown>;
  title?: string;
  maxItems?: number;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { 
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

// Loading skeleton with shimmer effect
function PropertySkeleton() {
  return (
    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      </div>
      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-24" />
        </div>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-4/5" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/5" />
        <div className="flex gap-4 pt-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-16" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-16" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

// Property card component
function PropertyCard({ property, index }: { property: Property; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      <Link
        href={getPropertyUrl(property)}
        className="block relative bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm"
      >
        {/* Glow effect on hover */}
        <motion.div
          className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50 opacity-0 blur-sm z-0"
          animate={{ opacity: isHovered ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        <div className="relative z-10 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          {/* Image Container */}
          <div className="aspect-[4/3] relative overflow-hidden">
            {/* Placeholder gradient while loading */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
            
            <Image
              src={property.image}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-all duration-700 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } ${isHovered ? 'scale-110' : 'scale-100'}`}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Price Badge - Premium glassmorphism style */}
            <motion.div 
              className="absolute top-4 left-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {property.price}
                </span>
              </div>
            </motion.div>

            {/* Type Badge */}
            <motion.div 
              className="absolute top-4 right-4"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-lg ${
                property.type === 'FOR_SALE' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
              }`}>
                {property.type === 'FOR_SALE' ? 'For Sale' : 'For Rent'}
              </div>
            </motion.div>

            {/* Quick Actions on Hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      // Could add to favorites logic here
                    }}
                    className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <Icon icon="ph:heart" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </motion.button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex-1 max-w-[180px]"
                  >
                    <span className="block px-6 py-3 bg-primary text-white text-sm font-medium rounded-full text-center shadow-lg shadow-primary/30">
                      View Details
                    </span>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.share?.({ 
                        title: property.title, 
                        url: `/properties/${property.slug}` 
                      });
                    }}
                    className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <Icon icon="ph:share-network" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Title */}
            <h4 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {property.title}
            </h4>
            
            {/* Location */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Icon icon="ph:map-pin-fill" className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                {property.location}
              </span>
            </div>

            {/* Specs - Pill style */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Icon icon="ph:bed-fill" className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{property.beds}</span>
                <span className="text-xs text-slate-500">Beds</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Icon icon="ph:bathtub-fill" className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{property.baths}</span>
                <span className="text-xs text-slate-500">Baths</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Icon icon="ph:ruler-fill" className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{property.sqft}</span>
                <span className="text-xs text-slate-500">m²</span>
              </div>
            </div>

            {/* Nearest POI - Enhanced */}
            {property.nearestPoi && (
              <motion.div 
                className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 rounded-xl">
                  <div className="p-1 bg-primary/20 rounded-lg">
                    <Icon icon="ph:navigation-arrow-fill" className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {property.nearestPoi.name}
                  </span>
                  <span className="ml-auto text-xs font-bold text-primary">
                    {property.nearestPoi.distance}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function PoiPropertyGrid({ 
  templateId, 
  queryParams, 
  title = "Featured Properties",
  maxItems = 6 
}: PoiPropertyGridProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'properties',
        templateId,
        limit: String(maxItems),
      });

      if (queryParams) {
        params.set('queryParams', JSON.stringify(queryParams));
      }

      const response = await fetch(`/api/smart-blog/poi-generate?${params}`);
      const data = await response.json();

      if (data.success && data.properties) {
        setProperties(data.properties);
      } else {
        setError('No properties available');
      }
    } catch (err) {
      console.error('Failed to fetch POI properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [templateId, queryParams, maxItems]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  if (loading) {
    return (
      <section className="my-16 py-16 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <div className="relative container max-w-6xl mx-auto px-4">
          {/* Header skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl w-64 mx-auto mb-4" />
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-xl w-96 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <PropertySkeleton />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || properties.length === 0) {
    return null;
  }

  return (
    <section className="my-16 py-16 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full mb-6"
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Live Listings</span>
          </motion.div>

          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              {title}
            </span>
          </h3>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
            Discover our handpicked selection of premium properties matching your criteria
          </p>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
            <div className="w-3 h-3 rotate-45 border-2 border-primary/50" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </motion.div>

        {/* Property Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {properties.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/properties"
            className="group relative inline-flex items-center gap-3 px-8 py-4 overflow-hidden rounded-2xl font-semibold text-white"
          >
            {/* Button background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-primary bg-[length:200%_100%] transition-all duration-500 group-hover:bg-[position:100%_0]" />
            
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            
            {/* Button content */}
            <span className="relative">Explore All Properties</span>
            <motion.span
              className="relative"
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <Icon icon="ph:arrow-right-bold" className="w-5 h-5" />
            </motion.span>
          </Link>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-emerald-500" />
              <span>Verified Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="ph:shield-check-fill" className="w-4 h-4 text-primary" />
              <span>Trusted Partners</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="ph:clock-fill" className="w-4 h-4 text-amber-500" />
              <span>Updated Daily</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

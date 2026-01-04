"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useFavorites } from '@/lib/contexts/FavoritesContext';
import PropertyCard from '../properties/card/Card';

interface FavoritesSectionProps {
  allProperties: any[];
}

export default function FavoritesSection({ allProperties }: FavoritesSectionProps) {
  const { favorites, favoritesCount, isLoading } = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR or if no favorites
  if (!mounted || isLoading) {
    return null;
  }

  if (favoritesCount === 0) {
    return null;
  }

  // Filter properties to only show favorites
  const favoriteProperties = allProperties.filter(property => 
    favorites.includes(property.id) || favorites.includes(property.slug)
  );

  // If no matching properties found, don't render
  if (favoriteProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-red-50/50 to-white dark:from-red-500/5 dark:to-black">
      <div className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-start gap-4">
            <div className="p-3 sm:p-4 bg-red-500 rounded-2xl shadow-lg shadow-red-500/25">
              <Icon icon="ph:heart-fill" className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark dark:text-white">
                Your Favorites
              </h2>
              <p className="text-sm sm:text-base text-dark/60 dark:text-white/60 mt-1">
                {favoritesCount} saved {favoritesCount === 1 ? 'property' : 'properties'} waiting for you
              </p>
            </div>
          </div>

          <Link
            href="/properties?favorites=true"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
          >
            View All Favorites
            <Icon icon="ph:arrow-right-bold" className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Scroll Wrapper */}
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
              {favoriteProperties.map((property, index) => (
                <div 
                  key={property.slug || index} 
                  className="flex-shrink-0 w-[85%] sm:w-[45%] lg:w-[32%] xl:w-[380px] snap-start"
                >
                  <PropertyCard item={property} />
                </div>
              ))}
              
              {/* View All Card */}
              {favoriteProperties.length > 2 && (
                <div className="flex-shrink-0 w-[85%] sm:w-[45%] lg:w-[32%] xl:w-[380px] snap-start">
                  <Link 
                    href="/properties?favorites=true"
                    className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border-2 border-dashed border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors group"
                  >
                    <div className="p-4 bg-red-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <Icon icon="ph:heart-fill" className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">View All Favorites</p>
                    <p className="text-sm text-red-500/70 dark:text-red-400/70 mt-1">
                      {favoritesCount} saved {favoritesCount === 1 ? 'property' : 'properties'}
                    </p>
                    <Icon icon="ph:arrow-right-bold" className="w-6 h-6 text-red-500 mt-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Scroll Hint */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-dark/40 dark:text-white/40">
            <Icon icon="ph:hand-swipe-right" className="w-5 h-5" />
            <span>Swipe to see all {favoritesCount} favorites</span>
          </div>
        </div>
      </div>
    </section>
  );
}

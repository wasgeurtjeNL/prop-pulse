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

        {/* Properties Grid - Show max 3 on homepage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {favoriteProperties.slice(0, 3).map((property, index) => (
            <PropertyCard key={property.slug || index} item={property} />
          ))}
        </div>

        {/* Show more indicator if more than 3 favorites */}
        {favoriteProperties.length > 3 && (
          <div className="mt-8 text-center">
            <Link
              href="/properties?favorites=true"
              className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <span>+{favoriteProperties.length - 3} more favorites</span>
              <Icon icon="ph:arrow-right" className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

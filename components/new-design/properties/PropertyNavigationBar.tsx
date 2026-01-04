"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { usePropertyNavigationInfo } from '@/lib/contexts/PropertyNavigationContext';
import { getPropertyUrl } from '@/lib/property-url';
import { useFavorites } from '@/lib/contexts/FavoritesContext';

interface PropertyNavigationBarProps {
  currentSlug: string;
}

// Parse filter query string to get readable filter labels
function getActiveFilters(queryString: string): string[] {
  if (!queryString || queryString === '?') return [];
  
  const params = new URLSearchParams(queryString.replace('?', ''));
  const filters: string[] = [];
  
  // Type filter
  const type = params.get('type');
  if (type === 'FOR_SALE' || type === 'buy') filters.push('For Sale');
  if (type === 'FOR_RENT' || type === 'rent') filters.push('For Rent');
  
  // Category
  const category = params.get('category');
  if (category) filters.push(category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  
  // Beds
  const beds = params.get('beds');
  if (beds && beds !== 'Any') filters.push(`${beds}+ Beds`);
  
  // Price range
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  if (minPrice || maxPrice) filters.push('Price');
  
  // Amenities
  const amenities = params.get('amenities');
  if (amenities) {
    const amenityList = amenities.split(',');
    if (amenityList.length === 1) {
      filters.push(amenityList[0].replace(/\b\w/g, l => l.toUpperCase()));
    } else {
      filters.push(`${amenityList.length} Amenities`);
    }
  }
  
  // Area
  const area = params.get('area');
  if (area) filters.push(area.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  
  // Short Stay
  if (params.get('shortStay') === 'true') filters.push('Short Stay');
  
  // Sea View
  if (params.get('hasSeaView') === 'true') filters.push('Sea View');
  
  // Pets
  if (params.get('allowPets') === 'true') filters.push('Pets Allowed');
  
  return filters;
}

export default function PropertyNavigationBar({ currentSlug }: PropertyNavigationBarProps) {
  const navInfo = usePropertyNavigationInfo(currentSlug);
  const { favoritesCount, isFavorite, toggleFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(true);
  
  // useMemo MUST be called before any early returns (Rules of Hooks)
  const activeFilters = useMemo(() => {
    if (!navInfo?.filterQueryString) return [];
    return getActiveFilters(navInfo.filterQueryString);
  }, [navInfo?.filterQueryString]);
  
  const isCurrentFavorite = isFavorite(currentSlug);

  // Always show bar - even without navigation context
  // This allows users to always navigate and see favorites
  if (!navInfo || !navInfo.hasContext) {
    
    // Show minimal favorites-only bar
    return (
      <div className="sticky top-[72px] sm:top-[80px] left-0 right-0 z-40">
        <div className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="bg-gradient-to-r from-red-50 via-red-100/50 to-red-50 dark:from-red-500/10 dark:via-red-500/20 dark:to-red-500/10 backdrop-blur-md rounded-2xl border border-red-200 dark:border-red-500/30 shadow-lg">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
              {/* Left: Back to properties */}
              <Link 
                href="/properties"
                className="group flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
                </div>
                <span className="hidden sm:block font-medium">All Properties</span>
                <span className="sm:hidden font-medium">Back</span>
              </Link>

              {/* Center: View Favorites */}
              <Link
                href="/properties?favorites=true"
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                title="View your favorites"
              >
                <Icon icon="ph:heart-fill" className="w-4 h-4" />
                <span className="text-sm font-semibold">{favoritesCount}</span>
                <span className="text-sm font-medium hidden sm:inline">Favorites</span>
                <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
              </Link>

              {/* Right: Add to favorites */}
              <button
                onClick={() => toggleFavorite(currentSlug)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-sm border transition-colors ${
                  isCurrentFavorite
                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-red-300 hover:text-red-500'
                }`}
                title={isCurrentFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Icon icon="ph:heart-fill" className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  {isCurrentFavorite ? 'Saved' : 'Save'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { filterQueryString, currentIndex, totalCount, prevProperty, nextProperty } = navInfo;
  const hasFilters = activeFilters.length > 0;

  const prevUrl = prevProperty 
    ? getPropertyUrl({ slug: prevProperty.slug, provinceSlug: prevProperty.provinceSlug, areaSlug: prevProperty.areaSlug })
    : null;
  
  const nextUrl = nextProperty 
    ? getPropertyUrl({ slug: nextProperty.slug, provinceSlug: nextProperty.provinceSlug, areaSlug: nextProperty.areaSlug })
    : null;

  // Minimized state - show only a small floating button
  if (!isExpanded) {
    return (
      <div className="fixed top-[80px] sm:top-[88px] right-4 sm:right-6 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all group"
          title="Show navigation bar"
        >
          {/* Favorites badge - always visible */}
          {favoritesCount > 0 && (
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-700">
              <Icon icon="ph:heart-fill" className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-500">{favoritesCount}</span>
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Icon icon="ph:caret-left-bold" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
            <span className="text-xs sm:text-sm font-bold text-primary">{currentIndex + 1}</span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{totalCount}</span>
            <Icon icon="ph:caret-right-bold" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
          </div>
          {hasFilters && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              <Icon icon="ph:funnel-fill" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{activeFilters.length}</span>
            </div>
          )}
          <Icon icon="ph:caret-down" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-primary transition-colors" />
        </button>
      </div>
    );
  }

  // Expanded state - full navigation bar
  return (
    <div className="sticky top-[72px] sm:top-[80px] left-0 right-0 z-40">
      <div className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 backdrop-blur-md rounded-2xl border border-primary/20 shadow-lg">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            {/* Left: Back to search results */}
            <Link 
              href={`/properties${filterQueryString}`}
              className="group flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Back to</span>
                <span className="font-semibold">{hasFilters ? 'Filtered Results' : 'All Properties'}</span>
              </div>
              <span className="sm:hidden font-medium">Back</span>
            </Link>

            {/* Center: Favorites + Filter indicator + Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Favorites Badge - Now visible on mobile too */}
              {favoritesCount > 0 && (
                <Link
                  href="/properties?favorites=true"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group"
                  title="View your favorites"
                >
                  <Icon icon="ph:heart-fill" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                  <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">{favoritesCount}</span>
                  <span className="text-xs text-red-500/70 dark:text-red-400/70 hidden lg:inline">Favorites</span>
                </Link>
              )}
              
              {/* Filter Pills - Show active filters (desktop only) */}
              {hasFilters && (
                <div className="hidden md:flex items-center gap-2">
                  <Icon icon="ph:funnel-fill" className="w-4 h-4 text-primary" />
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[300px]">
                    {activeFilters.slice(0, 3).map((filter, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
                      >
                        {filter}
                      </span>
                    ))}
                    {activeFilters.length > 3 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        +{activeFilters.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Navigation Controls */}
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                {/* Previous Button */}
                {prevUrl ? (
                  <Link
                    href={prevUrl}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-full transition-colors border-r border-slate-200 dark:border-slate-700"
                    title="Previous property"
                  >
                    <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Prev</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-slate-300 dark:text-slate-600 rounded-l-full border-r border-slate-200 dark:border-slate-700 cursor-not-allowed">
                    <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Prev</span>
                  </div>
                )}

                {/* Counter */}
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2">
                  <span className="text-xs sm:text-sm font-bold text-primary">{currentIndex + 1}</span>
                  <span className="text-xs text-slate-400">/</span>
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{totalCount}</span>
                </div>

                {/* Next Button */}
                {nextUrl ? (
                  <Link
                    href={nextUrl}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-full transition-colors border-l border-slate-200 dark:border-slate-700"
                    title="Next property"
                  >
                    <span className="hidden sm:inline text-sm font-medium">Next</span>
                    <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-slate-300 dark:text-slate-600 rounded-r-full border-l border-slate-200 dark:border-slate-700 cursor-not-allowed">
                    <span className="hidden sm:inline text-sm font-medium">Next</span>
                    <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Edit filters + Minimize button */}
            <div className="flex items-center gap-2">
              {/* Edit Filters - Desktop */}
              <Link 
                href={`/properties${filterQueryString}`}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Icon icon="ph:funnel-simple-fill" className="w-4 h-4" />
                {hasFilters ? 'Edit Filters' : 'Add Filters'}
              </Link>
              
              {/* Mobile: Filter icon */}
              <Link 
                href={`/properties${filterQueryString}`}
                className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white shadow-sm"
                title={hasFilters ? 'Edit Filters' : 'Add Filters'}
              >
                <Icon icon="ph:funnel-simple-fill" className="w-4 h-4" />
              </Link>
              
              {/* Minimize Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm border border-slate-200 dark:border-slate-700"
                title="Minimize navigation bar"
              >
                <Icon icon="ph:minus-bold" className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Mobile: Show filter summary */}
          {hasFilters && (
            <div className="md:hidden flex items-center gap-2 px-4 pb-3 pt-0 overflow-x-auto scrollbar-hide">
              <Icon icon="ph:funnel-fill" className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="flex items-center gap-1.5">
                {activeFilters.slice(0, 4).map((filter, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full whitespace-nowrap"
                  >
                    {filter}
                  </span>
                ))}
                {activeFilters.length > 4 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    +{activeFilters.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

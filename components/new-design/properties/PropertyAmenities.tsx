'use client';

/**
 * PropertyAmenities Component - Optimized for PageSpeed
 * 
 * Uses CSS-only animations and Lucide icons (bundled, no network requests).
 * Minimal JavaScript, maximum performance.
 * Uses shared amenity mapping for consistent icon display.
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronUp, Sparkle } from 'lucide-react';
import { getAmenityIcon, normalizeAmenityName } from '@/lib/amenity-mapping';

interface PropertyAmenitiesProps {
  amenities: string[];
  className?: string;
}

export default function PropertyAmenities({ amenities, className }: PropertyAmenitiesProps) {
  const [showAll, setShowAll] = useState(false);

  // Get display amenities
  const displayAmenities = useMemo(() => {
    return showAll ? amenities : amenities.slice(0, 9);
  }, [amenities, showAll]);

  const hiddenCount = amenities.length - 9;

  if (amenities.length === 0) return null;

  return (
    <section className={cn('py-6 sm:py-8 border-t border-slate-200 dark:border-slate-700', className)}>
      {/* Header - Clean and simple */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Amenities
          </h3>
          <p className="text-sm text-slate-500">
            {amenities.length} features included
          </p>
        </div>
      </div>

      {/* Amenities Grid - Simple checkmark list */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
        {displayAmenities.map((amenity, index) => {
          const IconComponent = getAmenityIcon(amenity);
          const displayName = normalizeAmenityName(amenity);
          
          return (
            <div
              key={`${amenity}-${index}`}
              className="flex items-center gap-3 py-2 group"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors group-hover:bg-primary/10">
                <IconComponent className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {displayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={cn(
            'mt-5 w-full py-3 px-4 rounded-xl font-medium text-sm',
            'flex items-center justify-center gap-2',
            'bg-slate-100 dark:bg-slate-800',
            'text-slate-700 dark:text-slate-300',
            'hover:bg-slate-200 dark:hover:bg-slate-700',
            'border border-slate-200 dark:border-slate-700',
            'transition-colors duration-200'
          )}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show all {amenities.length} amenities
            </>
          )}
        </button>
      )}
    </section>
  );
}

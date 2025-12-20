'use client';

/**
 * PropertyAmenities Component
 * 
 * Displays property amenities in an interactive, categorized layout.
 * Optimized for PageSpeed with CSS-only animations and no heavy dependencies.
 */

import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

// Amenity categories with icons
const AMENITY_CONFIG: Record<string, { icon: string; category: string; color: string }> = {
  // Views
  'sea view': { icon: 'ph:waves-fill', category: 'views', color: 'text-cyan-500' },
  'ocean view': { icon: 'ph:waves-fill', category: 'views', color: 'text-cyan-500' },
  'mountain view': { icon: 'ph:mountains-fill', category: 'views', color: 'text-emerald-500' },
  'garden view': { icon: 'ph:tree-fill', category: 'views', color: 'text-green-500' },
  'pool view': { icon: 'ph:swimming-pool-fill', category: 'views', color: 'text-blue-500' },
  'city view': { icon: 'ph:buildings-fill', category: 'views', color: 'text-slate-500' },
  
  // Outdoor
  'swimming pool': { icon: 'ph:swimming-pool-fill', category: 'outdoor', color: 'text-blue-500' },
  'pool': { icon: 'ph:swimming-pool-fill', category: 'outdoor', color: 'text-blue-500' },
  'private pool': { icon: 'ph:swimming-pool-fill', category: 'outdoor', color: 'text-blue-500' },
  'garden': { icon: 'ph:flower-fill', category: 'outdoor', color: 'text-green-500' },
  'terrace': { icon: 'ph:sun-fill', category: 'outdoor', color: 'text-amber-500' },
  'terace': { icon: 'ph:sun-fill', category: 'outdoor', color: 'text-amber-500' },
  'balcony': { icon: 'ph:door-open-fill', category: 'outdoor', color: 'text-amber-500' },
  'roof top': { icon: 'ph:building-fill', category: 'outdoor', color: 'text-violet-500' },
  'rooftop': { icon: 'ph:building-fill', category: 'outdoor', color: 'text-violet-500' },
  'roof top/poolbar': { icon: 'ph:champagne-fill', category: 'outdoor', color: 'text-violet-500' },
  'barbecue': { icon: 'ph:fire-fill', category: 'outdoor', color: 'text-orange-500' },
  'barbecue area': { icon: 'ph:fire-fill', category: 'outdoor', color: 'text-orange-500' },
  'parking': { icon: 'ph:car-fill', category: 'outdoor', color: 'text-slate-500' },
  'covered car park': { icon: 'ph:garage-fill', category: 'outdoor', color: 'text-slate-500' },
  'garage': { icon: 'ph:garage-fill', category: 'outdoor', color: 'text-slate-500' },
  
  // Indoor
  'kitchen': { icon: 'ph:cooking-pot-fill', category: 'indoor', color: 'text-orange-500' },
  'fully equipped kitchen': { icon: 'ph:cooking-pot-fill', category: 'indoor', color: 'text-orange-500' },
  'living room': { icon: 'ph:couch-fill', category: 'indoor', color: 'text-amber-600' },
  'dining room': { icon: 'ph:fork-knife-fill', category: 'indoor', color: 'text-rose-500' },
  'fully furnished': { icon: 'ph:armchair-fill', category: 'indoor', color: 'text-indigo-500' },
  'air conditioning': { icon: 'ph:wind-fill', category: 'indoor', color: 'text-sky-500' },
  'heating': { icon: 'ph:thermometer-hot-fill', category: 'indoor', color: 'text-red-500' },
  'fireplace': { icon: 'ph:fire-simple-fill', category: 'indoor', color: 'text-orange-600' },
  'laundry': { icon: 'ph:t-shirt-fill', category: 'indoor', color: 'text-blue-400' },
  'storage': { icon: 'ph:archive-fill', category: 'indoor', color: 'text-slate-500' },
  
  // Features
  '2 stories': { icon: 'ph:stairs-fill', category: 'features', color: 'text-slate-600' },
  '3 stories': { icon: 'ph:stairs-fill', category: 'features', color: 'text-slate-600' },
  "26' ceilings": { icon: 'ph:arrows-out-cardinal-fill', category: 'features', color: 'text-violet-500' },
  'high ceilings': { icon: 'ph:arrows-out-cardinal-fill', category: 'features', color: 'text-violet-500' },
  'smart home': { icon: 'ph:wifi-high-fill', category: 'features', color: 'text-blue-500' },
  'security': { icon: 'ph:shield-check-fill', category: 'features', color: 'text-green-600' },
  'cctv': { icon: 'ph:video-camera-fill', category: 'features', color: 'text-slate-600' },
  'elevator': { icon: 'ph:elevator-fill', category: 'features', color: 'text-slate-500' },
  
  // Facilities
  'gym': { icon: 'ph:barbell-fill', category: 'facilities', color: 'text-red-500' },
  'fitness': { icon: 'ph:barbell-fill', category: 'facilities', color: 'text-red-500' },
  'spa': { icon: 'ph:flower-lotus-fill', category: 'facilities', color: 'text-pink-500' },
  'sauna': { icon: 'ph:thermometer-fill', category: 'facilities', color: 'text-orange-500' },
  'jacuzzi': { icon: 'ph:bathtub-fill', category: 'facilities', color: 'text-blue-400' },
  'restaurant': { icon: 'ph:fork-knife-fill', category: 'facilities', color: 'text-amber-600' },
  'concierge': { icon: 'ph:bell-fill', category: 'facilities', color: 'text-yellow-500' },
};

const CATEGORY_INFO = {
  views: { title: 'Views', icon: 'ph:eye-fill', color: 'from-cyan-500 to-blue-500' },
  outdoor: { title: 'Outdoor', icon: 'ph:sun-fill', color: 'from-amber-500 to-orange-500' },
  indoor: { title: 'Indoor', icon: 'ph:house-fill', color: 'from-violet-500 to-purple-500' },
  features: { title: 'Features', icon: 'ph:star-fill', color: 'from-emerald-500 to-teal-500' },
  facilities: { title: 'Facilities', icon: 'ph:buildings-fill', color: 'from-rose-500 to-pink-500' },
  other: { title: 'Other', icon: 'ph:check-circle-fill', color: 'from-slate-500 to-slate-600' },
};

interface PropertyAmenitiesProps {
  amenities: string[];
  className?: string;
}

export default function PropertyAmenities({ amenities, className }: PropertyAmenitiesProps) {
  const [showAll, setShowAll] = useState(false);
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(null);

  // Categorize amenities
  const categorizedAmenities = useMemo(() => {
    const categories: Record<string, Array<{ name: string; icon: string; color: string }>> = {
      views: [],
      outdoor: [],
      indoor: [],
      features: [],
      facilities: [],
      other: [],
    };

    amenities.forEach(amenity => {
      const lowerAmenity = amenity.toLowerCase().trim();
      const config = AMENITY_CONFIG[lowerAmenity];
      
      if (config) {
        categories[config.category].push({
          name: amenity,
          icon: config.icon,
          color: config.color,
        });
      } else {
        // Default for unknown amenities
        categories.other.push({
          name: amenity,
          icon: 'ph:check-circle-fill',
          color: 'text-primary',
        });
      }
    });

    // Remove empty categories
    return Object.entries(categories).filter(([, items]) => items.length > 0);
  }, [amenities]);

  // Count total amenities
  const totalAmenities = amenities.length;
  const visibleCount = showAll ? totalAmenities : Math.min(9, totalAmenities);
  const hiddenCount = totalAmenities - 9;

  // Flatten for simple grid view
  const flatAmenities = useMemo(() => {
    return categorizedAmenities.flatMap(([, items]) => items);
  }, [categorizedAmenities]);

  const displayAmenities = showAll ? flatAmenities : flatAmenities.slice(0, 9);

  if (amenities.length === 0) return null;

  return (
    <section className={cn('py-6 sm:py-8 border-t border-slate-200/50 dark:border-slate-700/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl">
            <Icon icon="ph:sparkle-fill" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              What this property offers
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalAmenities} amenities included
            </p>
          </div>
        </div>
      </div>

      {/* Amenities Grid - Simple but Interactive */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayAmenities.map((amenity, index) => (
          <div
            key={`${amenity.name}-${index}`}
            className={cn(
              'group relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 cursor-default',
              'bg-slate-50/80 dark:bg-slate-800/50',
              'border border-transparent',
              'hover:bg-white dark:hover:bg-slate-800',
              'hover:border-slate-200 dark:hover:border-slate-600',
              'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
              'hover:scale-[1.02]',
              hoveredAmenity === amenity.name && 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-lg scale-[1.02]'
            )}
            onMouseEnter={() => setHoveredAmenity(amenity.name)}
            onMouseLeave={() => setHoveredAmenity(null)}
            style={{
              animationDelay: `${index * 30}ms`,
            }}
          >
            {/* Icon Container */}
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
              'bg-white dark:bg-slate-700/50',
              'group-hover:scale-110 group-hover:rotate-3',
              'shadow-sm group-hover:shadow-md'
            )}>
              <Icon 
                icon={amenity.icon} 
                className={cn('w-5 h-5 transition-colors', amenity.color)} 
              />
            </div>

            {/* Text */}
            <span className={cn(
              'text-sm font-medium transition-colors',
              'text-slate-700 dark:text-slate-200',
              'group-hover:text-slate-900 dark:group-hover:text-white'
            )}>
              {amenity.name}
            </span>

            {/* Hover indicator */}
            <div className={cn(
              'absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity',
              'text-primary'
            )}>
              <Icon icon="ph:check-circle-fill" className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={cn(
            'mt-4 w-full py-3.5 px-4 rounded-xl font-medium text-sm',
            'flex items-center justify-center gap-2',
            'bg-slate-100 dark:bg-slate-800',
            'text-slate-700 dark:text-slate-200',
            'hover:bg-slate-200 dark:hover:bg-slate-700',
            'border border-slate-200 dark:border-slate-700',
            'transition-all duration-300',
            'hover:scale-[1.01] active:scale-[0.99]'
          )}
        >
          <Icon 
            icon={showAll ? 'ph:caret-up-bold' : 'ph:caret-down-bold'} 
            className="w-4 h-4" 
          />
          {showAll ? 'Show less' : `Show all ${totalAmenities} amenities`}
        </button>
      )}

      {/* Category Legend - Only show when expanded */}
      {showAll && categorizedAmenities.length > 1 && (
        <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-wrap gap-3">
            {categorizedAmenities.map(([category, items]) => {
              const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
              return (
                <div 
                  key={category}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium"
                >
                  <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', info.color)} />
                  <span className="text-slate-600 dark:text-slate-300">
                    {info.title} ({items.length})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}


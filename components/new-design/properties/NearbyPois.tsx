'use client';

/**
 * NearbyPois Component - Optimized for PageSpeed
 * 
 * NO Framer Motion - uses CSS-only animations
 * Lucide icons (bundled, no network requests)
 * Simple progress bars instead of animated circles
 * Lazy loading POI data on expand
 */

import React, { useEffect, useState, useCallback } from 'react';
import { getNearbyPois, getPropertyLocationSummary } from '@/lib/actions/poi.actions';
import { formatDistance } from '@/lib/services/poi/distance';
import { cn } from '@/lib/utils';
import {
  MapPin, Waves, GraduationCap, ShoppingCart, VolumeX,
  Plane, ChevronDown, Star, Footprints,
  Umbrella, TreePine, Eye, Anchor, Building2,
  Baby, BookOpen, Heart, Stethoscope, PillBottle,
  Store, ShoppingBag, Apple, Dumbbell, Laptop, Landmark, CreditCard,
  UtensilsCrossed, Coffee, Wine, Bus, Ship, Car
} from 'lucide-react';

// Category configuration
const CATEGORY_GROUPS = {
  leisure: {
    title: 'Leisure',
    icon: Umbrella,
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/30',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    iconBgClass: 'bg-cyan-500',
    categories: ['BEACH', 'PARK', 'VIEWPOINT', 'GOLF_COURSE', 'MARINA', 'TEMPLE'],
  },
  family: {
    title: 'Family & Education',
    icon: GraduationCap,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    textClass: 'text-blue-700 dark:text-blue-300',
    iconBgClass: 'bg-blue-500',
    categories: ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'KINDERGARTEN', 'UNIVERSITY', 'HOSPITAL', 'CLINIC', 'PHARMACY'],
  },
  dailyLife: {
    title: 'Daily Life',
    icon: ShoppingCart,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    iconBgClass: 'bg-emerald-500',
    categories: ['SHOPPING_MALL', 'SUPERMARKET', 'CONVENIENCE_STORE', 'MARKET', 'GYM', 'COWORKING', 'BANK', 'RESTAURANT', 'CAFE'],
  },
  transport: {
    title: 'Transport',
    icon: Plane,
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    textClass: 'text-violet-700 dark:text-violet-300',
    iconBgClass: 'bg-violet-500',
    categories: ['AIRPORT', 'BUS_STATION', 'FERRY_TERMINAL', 'TAXI_STAND'],
  },
};

// Category to icon mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  BEACH: Waves,
  PARK: TreePine,
  VIEWPOINT: Eye,
  GOLF_COURSE: MapPin,
  MARINA: Anchor,
  TEMPLE: Building2,
  INTERNATIONAL_SCHOOL: GraduationCap,
  LOCAL_SCHOOL: GraduationCap,
  KINDERGARTEN: Baby,
  UNIVERSITY: BookOpen,
  HOSPITAL: Heart,
  CLINIC: Stethoscope,
  PHARMACY: PillBottle,
  SHOPPING_MALL: Store,
  SUPERMARKET: ShoppingCart,
  CONVENIENCE_STORE: ShoppingBag,
  MARKET: Apple,
  GYM: Dumbbell,
  COWORKING: Laptop,
  BANK: Landmark,
  ATM: CreditCard,
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  NIGHTCLUB: Wine,
  AIRPORT: Plane,
  BUS_STATION: Bus,
  FERRY_TERMINAL: Ship,
  TAXI_STAND: Car,
};

interface NearbyPoisProps {
  propertyId: string;
  className?: string;
}

interface PoiItem {
  id: string;
  name: string;
  nameTh?: string;
  category: string;
  distanceMeters: number;
  walkingMinutes?: number;
  importance: number;
  isHighlight: boolean;
}

interface LocationSummary {
  beachScore: number | null;
  familyScore: number | null;
  convenienceScore: number | null;
  quietnessScore: number | null;
  hasSeaView: boolean;
  seaViewDirection: string | null;
  seaDistance: number | null;
  nearestBeach: { name: string; distance: string } | null;
  nearestSchool: { name: string; distance: string } | null;
  airportDistance: { distance: string; time: string } | null;
}

export default function NearbyPois({ propertyId, className }: NearbyPoisProps) {
  const [summary, setSummary] = useState<LocationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loadedPois, setLoadedPois] = useState<Record<string, PoiItem[]>>({});
  const [loadingPois, setLoadingPois] = useState(false);

  // Initial load - just summary
  useEffect(() => {
    async function fetchSummary() {
      try {
        const result = await getPropertyLocationSummary(propertyId);
        if (result.success && result.data) {
          setSummary(result.data);
        }
      } catch (err) {
        console.error('Failed to load location summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [propertyId]);

  // Load POIs when first group is expanded
  const loadAllPois = useCallback(async () => {
    if (loadingPois || Object.keys(loadedPois).length > 0) return;
    
    setLoadingPois(true);
    try {
      const result = await getNearbyPois(propertyId, { maxDistance: 5000, limit: 100 });
      if (result.success && result.data) {
        const poisByGroup: Record<string, PoiItem[]> = {};
        
        for (const [groupKey, config] of Object.entries(CATEGORY_GROUPS)) {
          poisByGroup[groupKey] = [];
        }
        
        for (const group of result.data) {
          for (const poi of group.pois) {
            for (const [groupKey, config] of Object.entries(CATEGORY_GROUPS)) {
              if (config.categories.includes(poi.category)) {
                poisByGroup[groupKey].push(poi as PoiItem);
                break;
              }
            }
          }
        }
        
        // Sort by distance
        for (const key of Object.keys(poisByGroup)) {
          poisByGroup[key].sort((a, b) => a.distanceMeters - b.distanceMeters);
        }
        
        setLoadedPois(poisByGroup);
      }
    } catch (err) {
      console.error('Failed to load POIs:', err);
    } finally {
      setLoadingPois(false);
    }
  }, [propertyId, loadingPois, loadedPois]);

  const toggleGroup = useCallback((groupKey: string) => {
    // Load POIs on first expand
    if (Object.keys(loadedPois).length === 0) {
      loadAllPois();
    }
    
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, [loadedPois, loadAllPois]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('py-6 animate-pulse', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2">
            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <section className={cn('py-6 sm:py-8 border-t border-slate-200 dark:border-slate-700', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            What's Nearby
          </h3>
          <p className="text-sm text-slate-500">
            Explore the neighborhood
          </p>
        </div>
      </div>

      {/* Location Scores - Simple progress bars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <ScoreCard
          icon={Waves}
          label="Beach Access"
          score={summary.beachScore}
          detail={summary.nearestBeach?.distance}
          colorClass="text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40"
          barClass="bg-cyan-500"
        />
        <ScoreCard
          icon={GraduationCap}
          label="Family Friendly"
          score={summary.familyScore}
          colorClass="text-blue-600 bg-blue-100 dark:bg-blue-900/40"
          barClass="bg-blue-500"
        />
        <ScoreCard
          icon={ShoppingCart}
          label="Convenience"
          score={summary.convenienceScore}
          colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40"
          barClass="bg-emerald-500"
        />
        <ScoreCard
          icon={VolumeX}
          label="Quietness"
          score={summary.quietnessScore}
          colorClass="text-violet-600 bg-violet-100 dark:bg-violet-900/40"
          barClass="bg-violet-500"
        />
      </div>

      {/* Quick Facts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {summary.nearestBeach && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
            <Waves className="w-3.5 h-3.5" />
            {summary.nearestBeach.name} - {summary.nearestBeach.distance}
          </span>
        )}
        {summary.airportDistance && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
            <Plane className="w-3.5 h-3.5" />
            Airport {summary.airportDistance.time}
          </span>
        )}
      </div>

      {/* POI Groups - Collapsible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Object.entries(CATEGORY_GROUPS).map(([groupKey, config]) => {
          const isExpanded = expandedGroups.has(groupKey);
          const pois = loadedPois[groupKey] || [];
          const IconComponent = config.icon;

          return (
            <div
              key={groupKey}
              className={cn(
                'rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-shadow',
                isExpanded && 'shadow-lg'
              )}
            >
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(groupKey)}
                className={cn(
                  'w-full flex items-center justify-between p-4 transition-colors',
                  config.bgClass,
                  'hover:brightness-95 dark:hover:brightness-110'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.iconBgClass)}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {config.title}
                    </h4>
                    <p className={cn('text-sm', config.textClass)}>
                      Places nearby
                    </p>
                  </div>
                </div>
                <ChevronDown 
                  className={cn(
                    'w-5 h-5 text-slate-400 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )} 
                />
              </button>

              {/* POI List */}
              {isExpanded && (
                <div className="p-4 pt-2 space-y-2 bg-white dark:bg-slate-900">
                  {loadingPois ? (
                    // Loading skeleton
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                          <div className="flex-1 space-y-1">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                          </div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                        </div>
                      ))}
                    </div>
                  ) : pois.length === 0 ? (
                    <p className="text-center py-4 text-sm text-slate-500">
                      No places found nearby
                    </p>
                  ) : (
                    pois.slice(0, 5).map((poi) => {
                      const PoiIcon = CATEGORY_ICONS[poi.category] || MapPin;
                      return (
                        <div
                          key={poi.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <PoiIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                              {poi.name}
                            </span>
                            {poi.isHighlight && (
                              <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              {formatDistance(poi.distanceMeters)}
                            </span>
                            {poi.walkingMinutes && poi.walkingMinutes <= 15 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                <Footprints className="w-3 h-3" />
                                {poi.walkingMinutes}m
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Simple Score Card with progress bar
function ScoreCard({
  icon: Icon,
  label,
  score,
  detail,
  colorClass,
  barClass,
}: {
  icon: React.ElementType;
  label: string;
  score: number | null;
  detail?: string;
  colorClass: string;
  barClass: string;
}) {
  if (score === null) return null;

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Limited';
  };

  return (
    <div className={cn('p-3 rounded-xl', colorClass)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', barClass)}
          style={{ width: `${score}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{getLabel(score)}</span>
        <span className="text-xs opacity-70">{score}/100</span>
      </div>
      
      {detail && (
        <p className="text-xs opacity-70 mt-1 truncate">{detail}</p>
      )}
    </div>
  );
}

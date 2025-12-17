'use client';

/**
 * NearbyPois Component
 * 
 * Displays Points of Interest near a property in an organized, 
 * visually appealing layout with category groupings.
 */

import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getNearbyPois, getPropertyLocationSummary } from '@/lib/actions/poi.actions';
import { formatDistance } from '@/lib/services/poi/distance';
import { cn } from '@/lib/utils';

// Category configuration for UI
const CATEGORY_GROUPS = {
  leisure: {
    title: 'Leisure',
    titleTh: 'สันทนาการ',
    icon: 'ph:umbrella-simple',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    categories: ['BEACH', 'PARK', 'VIEWPOINT', 'GOLF_COURSE', 'MARINA', 'TEMPLE'],
  },
  family: {
    title: 'Family & Education',
    titleTh: 'ครอบครัวและการศึกษา',
    icon: 'ph:graduation-cap',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    categories: ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'KINDERGARTEN', 'UNIVERSITY', 'HOSPITAL', 'CLINIC', 'PHARMACY'],
  },
  dailyLife: {
    title: 'Daily Life',
    titleTh: 'ชีวิตประจำวัน',
    icon: 'ph:shopping-cart',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    categories: ['SHOPPING_MALL', 'SUPERMARKET', 'CONVENIENCE_STORE', 'MARKET', 'GYM', 'COWORKING', 'BANK', 'RESTAURANT', 'CAFE'],
  },
  transport: {
    title: 'Transport',
    titleTh: 'การขนส่ง',
    icon: 'ph:airplane-takeoff',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    textColor: 'text-violet-700 dark:text-violet-300',
    categories: ['AIRPORT', 'BUS_STATION', 'FERRY_TERMINAL', 'TAXI_STAND'],
  },
};

// Category to icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  BEACH: 'ph:waves',
  PARK: 'ph:tree',
  VIEWPOINT: 'ph:binoculars',
  GOLF_COURSE: 'ph:golf',
  MARINA: 'ph:anchor',
  TEMPLE: 'ph:buildings',
  INTERNATIONAL_SCHOOL: 'ph:graduation-cap',
  LOCAL_SCHOOL: 'ph:student',
  KINDERGARTEN: 'ph:baby',
  UNIVERSITY: 'ph:book-open',
  HOSPITAL: 'ph:first-aid-kit',
  CLINIC: 'ph:stethoscope',
  PHARMACY: 'ph:pill',
  DENTIST: 'ph:tooth',
  SHOPPING_MALL: 'ph:storefront',
  SUPERMARKET: 'ph:shopping-cart',
  CONVENIENCE_STORE: 'ph:bag-simple',
  MARKET: 'ph:basket',
  GYM: 'ph:barbell',
  COWORKING: 'ph:laptop',
  BANK: 'ph:bank',
  ATM: 'ph:credit-card',
  RESTAURANT: 'ph:fork-knife',
  CAFE: 'ph:coffee',
  NIGHTCLUB: 'ph:martini',
  AIRPORT: 'ph:airplane-takeoff',
  BUS_STATION: 'ph:bus',
  FERRY_TERMINAL: 'ph:boat',
  TAXI_STAND: 'ph:taxi',
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
  const [pois, setPois] = useState<PoiItem[]>([]);
  const [summary, setSummary] = useState<LocationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['leisure', 'family']));

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const [poisResult, summaryResult] = await Promise.all([
          getNearbyPois(propertyId, { maxDistance: 5000, limit: 100 }),
          getPropertyLocationSummary(propertyId),
        ]);

        if (poisResult.success && poisResult.data) {
          // Flatten grouped POIs
          const allPois: PoiItem[] = [];
          for (const group of poisResult.data) {
            for (const poi of group.pois) {
              allPois.push(poi as PoiItem);
            }
          }
          setPois(allPois);
        }

        if (summaryResult.success && summaryResult.data) {
          setSummary(summaryResult.data);
        }
      } catch (err) {
        setError('Could not load nearby places');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [propertyId]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Group POIs by our category groups
  const groupedPois = React.useMemo(() => {
    const result: Record<string, PoiItem[]> = {};
    
    for (const [groupKey, groupConfig] of Object.entries(CATEGORY_GROUPS)) {
      result[groupKey] = pois.filter(poi => 
        groupConfig.categories.includes(poi.category)
      ).sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
    
    return result;
  }, [pois]);

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || pois.length === 0) {
    return null; // Don't show section if no data
  }

  return (
    <section className={cn('py-6 border-t border-dark/10 dark:border-white/20', className)}>
      <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
        <Icon icon="ph:map-pin" className="w-6 h-6 text-primary" />
        What's Nearby
      </h3>

      {/* Location Scores */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <ScoreCard
            icon="ph:waves"
            label="Beach Access"
            score={summary.beachScore}
            detail={summary.nearestBeach?.distance}
          />
          <ScoreCard
            icon="ph:graduation-cap"
            label="Family Friendly"
            score={summary.familyScore}
            detail={summary.nearestSchool?.name}
          />
          <ScoreCard
            icon="ph:shopping-cart"
            label="Convenience"
            score={summary.convenienceScore}
          />
          <ScoreCard
            icon="ph:ear-slash"
            label="Quietness"
            score={summary.quietnessScore}
          />
        </div>
      )}

      {/* Quick Facts */}
      {summary && (
        <div className="flex flex-wrap gap-2 mb-6">
          {summary.hasSeaView && (
            <QuickFact
              icon="ph:sun-horizon"
              text={`Sea View (${summary.seaViewDirection})`}
              color="cyan"
            />
          )}
          {summary.nearestBeach && (
            <QuickFact
              icon="ph:waves"
              text={`${summary.nearestBeach.name} - ${summary.nearestBeach.distance}`}
              color="blue"
            />
          )}
          {summary.airportDistance && (
            <QuickFact
              icon="ph:airplane-takeoff"
              text={`Airport ${summary.airportDistance.time}`}
              color="violet"
            />
          )}
        </div>
      )}

      {/* POI Groups */}
      <div className="space-y-4">
        {Object.entries(CATEGORY_GROUPS).map(([groupKey, groupConfig]) => {
          const groupPois = groupedPois[groupKey];
          if (!groupPois || groupPois.length === 0) return null;

          const isExpanded = expandedGroups.has(groupKey);
          const displayPois = isExpanded ? groupPois : groupPois.slice(0, 3);

          return (
            <div
              key={groupKey}
              className={cn(
                'rounded-xl overflow-hidden transition-all duration-300',
                groupConfig.bgColor
              )}
            >
              <button
                type="button"
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center',
                    groupConfig.color
                  )}>
                    <Icon icon={groupConfig.icon} className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-dark dark:text-white">
                      {groupConfig.title}
                    </h4>
                    <p className={cn('text-sm', groupConfig.textColor)}>
                      {groupPois.length} places nearby
                    </p>
                  </div>
                </div>
                <Icon
                  icon={isExpanded ? 'ph:caret-up' : 'ph:caret-down'}
                  className="w-5 h-5 text-dark/50 dark:text-white/50"
                />
              </button>

              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {displayPois.map(poi => (
                    <PoiRow key={poi.id} poi={poi} />
                  ))}
                </div>
                
                {groupPois.length > 3 && !isExpanded && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupKey)}
                    className={cn(
                      'mt-2 text-sm font-medium',
                      groupConfig.textColor
                    )}
                  >
                    +{groupPois.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Sub-components

function ScoreCard({
  icon,
  label,
  score,
  detail,
}: {
  icon: string;
  label: string;
  score: number | null;
  detail?: string;
}) {
  if (score === null) return null;

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (s >= 60) return 'text-green-600 dark:text-green-400';
    if (s >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Limited';
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={icon} className="w-5 h-5 text-slate-500" />
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn('text-2xl font-bold', getScoreColor(score))}>
          {score}
        </span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
      <p className={cn('text-xs mt-1', getScoreColor(score))}>
        {getScoreLabel(score)}
      </p>
      {detail && (
        <p className="text-xs text-slate-500 mt-1 truncate" title={detail}>
          {detail}
        </p>
      )}
    </div>
  );
}

function QuickFact({
  icon,
  text,
  color,
}: {
  icon: string;
  text: string;
  color: 'cyan' | 'blue' | 'violet' | 'emerald';
}) {
  const colorClasses = {
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
      colorClasses[color]
    )}>
      <Icon icon={icon} className="w-4 h-4" />
      <span>{text}</span>
    </div>
  );
}

function PoiRow({ poi }: { poi: PoiItem }) {
  const icon = CATEGORY_ICONS[poi.category] || 'ph:map-pin';
  
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white/50 dark:bg-slate-800/30 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <Icon icon={icon} className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-dark dark:text-white truncate">
            {poi.name}
          </p>
          {poi.nameTh && (
            <p className="text-xs text-slate-500 truncate">{poi.nameTh}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDistance(poi.distanceMeters)}
        </span>
        {poi.walkingMinutes && poi.walkingMinutes <= 15 && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Icon icon="ph:person-simple-walk" className="w-3 h-3" />
            {poi.walkingMinutes}m
          </span>
        )}
        {poi.isHighlight && (
          <Icon icon="ph:star-fill" className="w-4 h-4 text-amber-500" />
        )}
      </div>
    </div>
  );
}


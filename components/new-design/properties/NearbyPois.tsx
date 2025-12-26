'use client';

/**
 * NearbyPois Component - Optimized for PageSpeed
 * 
 * Uses lazy loading: POI data is only fetched when a category is expanded.
 * This significantly improves initial page load time.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { getNearbyPois, getPropertyLocationSummary } from '@/lib/actions/poi.actions';
import { formatDistance } from '@/lib/services/poi/distance';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Category configuration for UI
const CATEGORY_GROUPS = {
  leisure: {
    title: 'Leisure',
    titleTh: 'สันทนาการ',
    icon: 'ph:umbrella-simple-fill',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    accentColor: 'cyan',
    categories: ['BEACH', 'PARK', 'VIEWPOINT', 'GOLF_COURSE', 'MARINA', 'TEMPLE'],
  },
  family: {
    title: 'Family & Education',
    titleTh: 'ครอบครัวและการศึกษา',
    icon: 'ph:graduation-cap-fill',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
    textColor: 'text-blue-700 dark:text-blue-300',
    accentColor: 'blue',
    categories: ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'KINDERGARTEN', 'UNIVERSITY', 'HOSPITAL', 'CLINIC', 'PHARMACY'],
  },
  dailyLife: {
    title: 'Daily Life',
    titleTh: 'ชีวิตประจำวัน',
    icon: 'ph:shopping-bag-fill',
    color: 'from-blue-500 to-sky-500',
    bgColor: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40',
    textColor: 'text-blue-700 dark:text-blue-300',
    accentColor: 'emerald',
    categories: ['SHOPPING_MALL', 'SUPERMARKET', 'CONVENIENCE_STORE', 'MARKET', 'GYM', 'COWORKING', 'BANK', 'RESTAURANT', 'CAFE'],
  },
  transport: {
    title: 'Transport',
    titleTh: 'การขนส่ง',
    icon: 'ph:airplane-takeoff-fill',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
    textColor: 'text-violet-700 dark:text-violet-300',
    accentColor: 'violet',
    categories: ['AIRPORT', 'BUS_STATION', 'FERRY_TERMINAL', 'TAXI_STAND'],
  },
};

// Category to icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  BEACH: 'ph:waves-fill',
  PARK: 'ph:tree-fill',
  VIEWPOINT: 'ph:binoculars-fill',
  GOLF_COURSE: 'ph:golf-fill',
  MARINA: 'ph:anchor-fill',
  TEMPLE: 'ph:buildings-fill',
  INTERNATIONAL_SCHOOL: 'ph:graduation-cap-fill',
  LOCAL_SCHOOL: 'ph:student-fill',
  KINDERGARTEN: 'ph:baby-fill',
  UNIVERSITY: 'ph:book-open-fill',
  HOSPITAL: 'ph:first-aid-kit-fill',
  CLINIC: 'ph:stethoscope-fill',
  PHARMACY: 'ph:pill-fill',
  DENTIST: 'ph:tooth-fill',
  SHOPPING_MALL: 'ph:storefront-fill',
  SUPERMARKET: 'ph:shopping-cart-fill',
  CONVENIENCE_STORE: 'ph:bag-simple-fill',
  MARKET: 'ph:basket-fill',
  GYM: 'ph:barbell-fill',
  COWORKING: 'ph:laptop-fill',
  BANK: 'ph:bank-fill',
  ATM: 'ph:credit-card-fill',
  RESTAURANT: 'ph:fork-knife-fill',
  CAFE: 'ph:coffee-fill',
  NIGHTCLUB: 'ph:martini-fill',
  AIRPORT: 'ph:airplane-takeoff-fill',
  BUS_STATION: 'ph:bus-fill',
  FERRY_TERMINAL: 'ph:boat-fill',
  TAXI_STAND: 'ph:taxi-fill',
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

interface GroupCounts {
  [key: string]: number;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

const groupVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export default function NearbyPois({ propertyId, className }: NearbyPoisProps) {
  // Only load summary initially (lightweight)
  const [summary, setSummary] = useState<LocationSummary | null>(null);
  const [groupCounts, setGroupCounts] = useState<GroupCounts>({});
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Lazy loaded POI data per group
  const [loadedGroups, setLoadedGroups] = useState<Record<string, PoiItem[]>>({});
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Cache for all POIs (loaded once, then filtered)
  const [allPois, setAllPois] = useState<PoiItem[] | null>(null);

  // Initial lightweight load - just summary and counts
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setInitialLoading(true);
        
        const summaryResult = await getPropertyLocationSummary(propertyId);
        
        if (summaryResult.success && summaryResult.data) {
          setSummary(summaryResult.data);
          
          // Calculate group counts from summary if available
          // For now, we'll show "nearby" without exact counts until expanded
          const counts: GroupCounts = {};
          Object.keys(CATEGORY_GROUPS).forEach(key => {
            counts[key] = -1; // -1 means "unknown, show 'nearby'"
          });
          setGroupCounts(counts);
        }
      } catch (err) {
        console.error('Failed to load location summary:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    fetchInitialData();
  }, [propertyId]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  // Lazy load POIs when a group is expanded (useEffect to avoid setState during render)
  useEffect(() => {
    // Find groups that are expanded but not yet loaded
    const groupsToLoad = Array.from(expandedGroups).filter(
      groupKey => !loadedGroups[groupKey] && !loadingGroups.has(groupKey)
    );

    if (groupsToLoad.length === 0 || allPois !== null) {
      return;
    }

    // Load POIs for the first unloaded expanded group
    const groupKey = groupsToLoad[0];
    
    const loadPois = async () => {
      setLoadingGroups(prev => new Set(prev).add(groupKey));
      
      try {
        const poisResult = await getNearbyPois(propertyId, { maxDistance: 5000, limit: 100 });
        
        if (poisResult.success && poisResult.data) {
          const pois: PoiItem[] = [];
          for (const group of poisResult.data) {
            for (const poi of group.pois) {
              pois.push(poi as PoiItem);
            }
          }
          
          setAllPois(pois);
          
          // Update counts for all groups
          const newCounts: GroupCounts = {};
          const newLoadedGroups: Record<string, PoiItem[]> = {};
          
          for (const [key, config] of Object.entries(CATEGORY_GROUPS)) {
            const groupPois = pois.filter(poi => config.categories.includes(poi.category))
              .sort((a, b) => a.distanceMeters - b.distanceMeters);
            newCounts[key] = groupPois.length;
            newLoadedGroups[key] = groupPois;
          }
          
          setGroupCounts(newCounts);
          setLoadedGroups(newLoadedGroups);
        }
      } catch (err) {
        console.error('Failed to load POIs:', err);
      } finally {
        setLoadingGroups(prev => {
          const next = new Set(prev);
          next.delete(groupKey);
          return next;
        });
      }
    };

    loadPois();
  }, [expandedGroups, loadedGroups, loadingGroups, allPois, propertyId]);

  // Sort groups by count (most first)
  const sortedGroups = React.useMemo(() => {
    return Object.entries(CATEGORY_GROUPS)
      .map(([groupKey, groupConfig]) => ({
        groupKey,
        groupConfig,
        count: groupCounts[groupKey] ?? -1,
      }))
      .filter(({ count }) => count !== 0) // Hide empty groups
      .sort((a, b) => {
        // Unknown counts (-1) go last
        if (a.count === -1 && b.count === -1) return 0;
        if (a.count === -1) return 1;
        if (b.count === -1) return -1;
        return b.count - a.count;
      });
  }, [groupCounts]);

  if (initialLoading) {
    return (
      <div className={cn('py-6', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no summary
  if (!summary) {
    return null;
  }

  return (
    <motion.section 
      className={cn('py-8 border-t border-slate-200/50 dark:border-slate-700/50', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-8">
        <motion.div 
          className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon icon="ph:map-trifold-fill" className="w-7 h-7 text-primary" />
        </motion.div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            What's Nearby
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Explore the neighborhood
          </p>
        </div>
      </div>

      {/* Location Scores - Always show (lightweight data from summary) */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <ScoreCard
          icon="ph:waves-fill"
          label="Beach Access"
          score={summary.beachScore}
          detail={summary.nearestBeach?.distance}
          color="cyan"
          delay={0}
        />
        <ScoreCard
          icon="ph:graduation-cap-fill"
          label="Family Friendly"
          score={summary.familyScore}
          detail={summary.nearestSchool?.name}
          color="blue"
          delay={0.1}
        />
        <ScoreCard
          icon="ph:shopping-cart-fill"
          label="Convenience"
          score={summary.convenienceScore}
          color="emerald"
          delay={0.2}
        />
        <ScoreCard
          icon="ph:ear-slash-fill"
          label="Quietness"
          score={summary.quietnessScore}
          color="violet"
          delay={0.3}
        />
      </motion.div>

      {/* Quick Facts - Lightweight chips */}
      <motion.div 
        className="flex flex-wrap gap-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {summary.hasSeaView && (
          <QuickFact
            icon="ph:sun-horizon-fill"
            text={`Sea View (${summary.seaViewDirection})`}
            color="cyan"
          />
        )}
        {summary.nearestBeach && (
          <QuickFact
            icon="ph:waves-fill"
            text={`${summary.nearestBeach.name} - ${summary.nearestBeach.distance}`}
            color="blue"
          />
        )}
        {summary.airportDistance && (
          <QuickFact
            icon="ph:airplane-takeoff-fill"
            text={`Airport ${summary.airportDistance.time}`}
            color="violet"
          />
        )}
      </motion.div>

      {/* POI Groups - Lazy loaded on expand */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sortedGroups.map(({ groupKey, groupConfig, count }) => {
          const isExpanded = expandedGroups.has(groupKey);
          const isLoading = loadingGroups.has(groupKey);
          const groupPois = loadedGroups[groupKey] || [];
          const displayPois = isExpanded ? groupPois : groupPois.slice(0, 3);
          const hasHighlight = groupPois.some(p => p.isHighlight);

          return (
            <motion.div
              key={groupKey}
              variants={groupVariants}
              className="group"
            >
              <div
                className={cn(
                  'rounded-2xl overflow-hidden border border-white/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30 backdrop-blur-sm transition-all duration-300',
                  groupConfig.bgColor,
                  isExpanded && 'ring-2 ring-primary/20'
                )}
              >
                {/* Group Header - Always clickable */}
                <motion.button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300"
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                        groupConfig.color
                      )}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Icon icon={groupConfig.icon} className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="text-left">
                      <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
                        {groupConfig.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-sm font-medium', groupConfig.textColor)}>
                          {count === -1 ? 'Places nearby' : `${count} places nearby`}
                        </span>
                        {hasHighlight && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                            <Icon icon="ph:star-fill" className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50"
                  >
                    <Icon
                      icon="ph:caret-down-bold"
                      className="w-5 h-5 text-slate-600 dark:text-slate-300"
                    />
                  </motion.div>
                </motion.button>

                {/* POI List - Only shown when expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      className="px-5 pb-5"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isLoading ? (
                        // Loading skeleton
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 py-3 px-4 bg-white/50 dark:bg-slate-800/30 rounded-xl animate-pulse">
                              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                              </div>
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                            </div>
                          ))}
                        </div>
                      ) : groupPois.length === 0 ? (
                        // No POIs in this category
                        <div className="text-center py-6 text-slate-500">
                          <Icon icon="ph:map-pin-line" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No places found in this category</p>
                        </div>
                      ) : (
                        <>
                          <motion.div 
                            className="space-y-2"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            {displayPois.map((poi, index) => (
                              <PoiRow 
                                key={poi.id} 
                                poi={poi} 
                                index={index}
                                accentColor={groupConfig.accentColor}
                              />
                            ))}
                          </motion.div>
                          
                          {groupPois.length > 3 && (
                            <motion.button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle show all vs show 3
                                setExpandedGroups(prev => {
                                  const next = new Set(prev);
                                  // This just triggers a re-render with full list
                                  return next;
                                });
                              }}
                              className={cn(
                                'mt-4 w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300',
                                'bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800',
                                'border border-slate-200/50 dark:border-slate-600/50',
                                groupConfig.textColor
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {displayPois.length === groupPois.length ? (
                                <>
                                  <Icon icon="ph:minus-circle" className="w-4 h-4" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <Icon icon="ph:plus-circle" className="w-4 h-4" />
                                  +{groupPois.length - 3} more places
                                </>
                              )}
                            </motion.button>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

// Sub-components

function ScoreCard({
  icon,
  label,
  score,
  detail,
  color,
  delay = 0,
}: {
  icon: string;
  label: string;
  score: number | null;
  detail?: string;
  color: 'cyan' | 'blue' | 'emerald' | 'violet';
  delay?: number;
}) {
  if (score === null) return null;

  const colorConfig = {
    cyan: {
      gradient: 'from-cyan-500 to-blue-500',
      bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/50 dark:to-cyan-900/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      ring: 'stroke-cyan-500',
      ringBg: 'stroke-cyan-200 dark:stroke-cyan-800',
    },
    blue: {
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'stroke-blue-500',
      ringBg: 'stroke-blue-200 dark:stroke-blue-800',
    },
    emerald: {
      gradient: 'from-blue-500 to-sky-500',
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'stroke-blue-500',
      ringBg: 'stroke-blue-200 dark:stroke-blue-800',
    },
    violet: {
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/30',
      text: 'text-violet-600 dark:text-violet-400',
      ring: 'stroke-violet-500',
      ringBg: 'stroke-violet-200 dark:stroke-violet-800',
    },
  };

  const config = colorConfig[color];
  const circumference = 2 * Math.PI * 26;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Limited';
  };

  return (
    <motion.div 
      className={cn(
        'relative p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg overflow-hidden group cursor-default',
        config.bg
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Background decoration */}
      <div className={cn(
        'absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 blur-xl',
        `bg-gradient-to-br ${config.gradient}`
      )} />
      
      <div className="relative flex items-center gap-3">
        {/* Circular Progress */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              strokeWidth="5"
              className={config.ringBg}
            />
            <motion.circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className={config.ring}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, delay: delay + 0.3, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className={cn('text-lg font-bold', config.text)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5 }}
            >
              {score}
            </motion.span>
          </div>
        </div>

        {/* Labels */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon icon={icon} className={cn('w-4 h-4 flex-shrink-0', config.text)} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</span>
          </div>
          <p className={cn('text-sm font-semibold', config.text)}>
            {getScoreLabel(score)}
          </p>
          {detail && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={detail}>
              {detail}
            </p>
          )}
        </div>
      </div>
    </motion.div>
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
    cyan: 'bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-700/50',
    blue: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50',
    violet: 'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-700/50',
    emerald: 'bg-gradient-to-r from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50',
  };

  return (
    <motion.div 
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border shadow-sm',
        colorClasses[color]
      )}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon icon={icon} className="w-4 h-4" />
      <span>{text}</span>
    </motion.div>
  );
}

function PoiRow({ 
  poi, 
  index,
  accentColor 
}: { 
  poi: PoiItem; 
  index: number;
  accentColor: string;
}) {
  const icon = CATEGORY_ICONS[poi.category] || 'ph:map-pin-fill';
  const [isHovered, setIsHovered] = useState(false);
  
  const accentColors: Record<string, string> = {
    cyan: 'text-cyan-500',
    blue: 'text-blue-500',
    emerald: 'text-blue-500',
    violet: 'text-violet-500',
  };

  return (
    <motion.div 
      className={cn(
        'flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300 cursor-default',
        'bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm',
        'border border-transparent hover:border-slate-200/50 dark:hover:border-slate-600/50',
        'hover:bg-white dark:hover:bg-slate-800',
        'hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-slate-900/30',
        isHovered && 'scale-[1.02]'
      )}
      variants={itemVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <motion.div 
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
            isHovered 
              ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600' 
              : 'bg-slate-100/80 dark:bg-slate-700/50'
          )}
          animate={{ rotate: isHovered ? 5 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon 
            icon={icon} 
            className={cn(
              'w-5 h-5 transition-colors',
              isHovered ? accentColors[accentColor] || 'text-primary' : 'text-slate-500 dark:text-slate-400'
            )} 
          />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-sm font-medium truncate transition-colors',
            isHovered ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'
          )}>
            {poi.name}
          </p>
          {poi.nameTh && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{poi.nameTh}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <div className="text-right">
          <span className={cn(
            'text-sm font-semibold transition-colors',
            isHovered ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
          )}>
            {formatDistance(poi.distanceMeters)}
          </span>
        </div>

        {poi.walkingMinutes && poi.walkingMinutes <= 15 && (
          <motion.div 
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Icon icon="ph:person-simple-walk-fill" className="w-3.5 h-3.5" />
            <span>{poi.walkingMinutes}m</span>
          </motion.div>
        )}

        {poi.isHighlight && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.05 + 0.2 }}
          >
            <Icon icon="ph:star-fill" className="w-5 h-5 text-amber-500" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

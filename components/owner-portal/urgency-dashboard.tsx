"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Flame,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  price: string;
  type: "FOR_SALE" | "FOR_RENT";
  status: string;
}

interface UrgencyDashboardProps {
  properties: Property[];
  userName?: string;
  lang: "en" | "nl";
  onUpgradeClick?: () => void;
}

interface PropertyStats {
  propertyId: string;
  viewsThisWeek: number;
  viewsLastWeek: number;
  trend: number;
  liveViewers: number;
  inquiries: number;
  favorites: number;
}

export default function UrgencyDashboard({
  properties,
  userName,
  lang,
  onUpgradeClick,
}: UrgencyDashboardProps) {
  const [stats, setStats] = useState<PropertyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);

  // Simulated data - in production, fetch from API
  useEffect(() => {
    const fetchStats = async () => {
      // Simulate API call with realistic data
      const simulatedStats: PropertyStats[] = properties.map((p) => ({
        propertyId: p.id,
        viewsThisWeek: Math.floor(Math.random() * 80) + 20,
        viewsLastWeek: Math.floor(Math.random() * 60) + 15,
        trend: Math.floor(Math.random() * 40) - 10,
        liveViewers: Math.floor(Math.random() * 5),
        inquiries: Math.floor(Math.random() * 8),
        favorites: Math.floor(Math.random() * 15) + 5,
      }));
      setStats(simulatedStats);
      setLoading(false);
    };

    fetchStats();
  }, [properties]);

  // Rotate through properties
  useEffect(() => {
    if (properties.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % properties.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [properties.length]);

  const totalViews = useMemo(() => 
    stats.reduce((sum, s) => sum + s.viewsThisWeek, 0), 
    [stats]
  );

  const totalInquiries = useMemo(() => 
    stats.reduce((sum, s) => sum + s.inquiries, 0), 
    [stats]
  );

  const avgTrend = useMemo(() => {
    if (stats.length === 0) return 0;
    return Math.round(stats.reduce((sum, s) => sum + s.trend, 0) / stats.length);
  }, [stats]);

  const currentProperty = properties[currentStatIndex];
  const currentStats = stats[currentStatIndex];

  const t = {
    en: {
      liveNow: "Live Now",
      viewersLooking: "viewers looking at similar properties",
      viewsThisWeek: "views this week",
      avgSellingTime: "Avg selling time in your area",
      months: "months",
      fasterWithMarketing: "faster with marketing",
      inquiries: "inquiries",
      savedAsFavorite: "saved as favorite",
      yourProperties: "Your Properties Performance",
      marketInsight: "Market Insight",
      propertiesWithMarketing: "Properties with marketing sell",
      upgradeNow: "Upgrade Now",
      competingProperties: "competing properties in your price range",
      actNow: "Act now to stand out!",
    },
    nl: {
      liveNow: "Live Nu",
      viewersLooking: "bezoekers bekijken vergelijkbare woningen",
      viewsThisWeek: "weergaven deze week",
      avgSellingTime: "Gem. verkooptijd in uw gebied",
      months: "maanden",
      fasterWithMarketing: "sneller met marketing",
      inquiries: "aanvragen",
      savedAsFavorite: "opgeslagen als favoriet",
      yourProperties: "Prestaties Uw Woningen",
      marketInsight: "Markt Inzicht",
      propertiesWithMarketing: "Woningen met marketing verkopen",
      upgradeNow: "Upgrade Nu",
      competingProperties: "concurrerende woningen in uw prijsklasse",
      actNow: "Onderneem nu actie om op te vallen!",
    },
  }[lang];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Activity Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 p-4 text-white"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-0">
                  {t.liveNow}
                </Badge>
                <span className="font-bold text-lg">
                  {stats.reduce((sum, s) => sum + s.liveViewers, 0) + Math.floor(Math.random() * 3) + 1}
                </span>
                <span className="text-white/80">{t.viewersLooking}</span>
              </div>
              <p className="text-sm text-white/70 mt-1">
                {Math.floor(Math.random() * 50) + 80}+ {t.competingProperties}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={onUpgradeClick}
            className="bg-white text-orange-600 hover:bg-white/90 shadow-lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            {t.actNow}
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Views */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  avgTrend >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {avgTrend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(avgTrend)}%
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{totalViews}</div>
                <div className="text-xs text-muted-foreground">{t.viewsThisWeek}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Avg Selling Time */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 hover:border-amber-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  -47%
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">8-14</div>
                <div className="text-xs text-muted-foreground">{t.avgSellingTime}</div>
              </div>
              <div className="text-xs text-green-600 mt-1 font-medium">
                3-5 {t.months} {t.fasterWithMarketing}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Inquiries */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 hover:border-emerald-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                {totalInquiries > 0 && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{totalInquiries}</div>
                <div className="text-xs text-muted-foreground">{t.inquiries}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Favorites */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 hover:border-pink-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                  <Flame className="h-5 w-5 text-pink-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  {stats.reduce((sum, s) => sum + s.favorites, 0)}
                </div>
                <div className="text-xs text-muted-foreground">{t.savedAsFavorite}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Market Insight Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{t.marketInsight}:</span>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                +47%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.propertiesWithMarketing} <span className="font-bold text-green-600">47%</span> {t.fasterWithMarketing}
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Target className="h-4 w-4 mr-1" />
            {t.upgradeNow}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

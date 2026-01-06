"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Currency, CURRENCY_SYMBOLS, formatCurrency } from "@/lib/calculators/property-transfer";
import {
  SEASONAL_INSIGHTS,
  TRANSFER_METHODS,
  MARKET_EVENTS,
  getCurrentSeasonalInsight,
  calculateTimingScore,
  getUpcomingEvents,
  TransferMethod,
  SeasonalInsight,
  MarketEvent,
} from "@/lib/calculators/property-transfer/market-insights";

// ============================================
// TYPES
// ============================================

interface HistoricalRateData {
  currency: string;
  annualAverage: number;
  monthlyRates: {
    month: string;
    monthIndex: number;
    rate: number;
    vsAverage: number;
    recommendation: 'best' | 'good' | 'average' | 'poor' | 'worst';
  }[];
  bestMonths: string[];
  worstMonths: string[];
  currentMonth: string;
  currentMonthRating: string;
  potentialSavingsPercent: number;
}

interface BestTimeToBuyProps {
  currency: Currency;
  budget: number;
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MonthlyRateChart({ data, currency }: { data: HistoricalRateData; currency: Currency }) {
  const currentMonthIndex = new Date().getMonth();
  
  const getCardStyles = (recommendation: string) => {
    switch (recommendation) {
      case 'best': 
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20',
          border: 'border-green-300 dark:border-green-700',
          text: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-500 text-white',
          label: 'BEST',
          icon: '🟢'
        };
      case 'good': 
        return {
          bg: 'bg-gradient-to-br from-lime-50 to-green-100 dark:from-lime-900/30 dark:to-green-900/20',
          border: 'border-lime-300 dark:border-lime-700',
          text: 'text-lime-700 dark:text-lime-300',
          badge: 'bg-lime-500 text-white',
          label: 'GOOD',
          icon: '🟢'
        };
      case 'average': 
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/20',
          border: 'border-yellow-300 dark:border-yellow-700',
          text: 'text-yellow-700 dark:text-yellow-300',
          badge: 'bg-yellow-500 text-white',
          label: 'OK',
          icon: '🟡'
        };
      case 'poor': 
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/30 dark:to-red-900/20',
          border: 'border-orange-300 dark:border-orange-700',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-500 text-white',
          label: 'POOR',
          icon: '🟠'
        };
      case 'worst': 
        return {
          bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/20',
          border: 'border-red-300 dark:border-red-700',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-500 text-white',
          label: 'AVOID',
          icon: '🔴'
        };
      default: 
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-300 dark:border-gray-700',
          text: 'text-gray-700 dark:text-gray-300',
          badge: 'bg-gray-500 text-white',
          label: 'N/A',
          icon: '⚪'
        };
    }
  };
  
  // Split months into two rows of 6
  const firstRow = data.monthlyRates.slice(0, 6);
  const secondRow = data.monthlyRates.slice(6, 12);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">Lower rate = Better value</span> for your {currency}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="text-green-500">●</span> Best</span>
          <span className="flex items-center gap-1"><span className="text-yellow-500">●</span> OK</span>
          <span className="flex items-center gap-1"><span className="text-red-500">●</span> Avoid</span>
        </div>
      </div>
      
      {/* Calendar Grid - First Row (Jan-Jun) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {firstRow.map((month, index) => {
          const styles = getCardStyles(month.recommendation);
          const isCurrentMonth = index === currentMonthIndex;
          
          return (
            <motion.div
              key={month.month}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-105 cursor-pointer",
                styles.bg,
                styles.border,
                isCurrentMonth && "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900"
              )}
            >
              {/* Current month indicator */}
              {isCurrentMonth && (
                <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                  NOW
                </div>
              )}
              
              {/* Month name */}
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {month.month.slice(0, 3).toUpperCase()}
              </div>
              
              {/* Rate */}
              <div className={cn("text-lg font-bold", styles.text)}>
                ฿{month.rate.toFixed(1)}
              </div>
              
              {/* vs Average */}
              <div className={cn(
                "text-[10px] font-medium",
                month.vsAverage < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {month.vsAverage > 0 ? '+' : ''}{month.vsAverage}%
              </div>
              
              {/* Rating badge */}
              <div className={cn(
                "mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-center",
                styles.badge
              )}>
                {styles.label}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Calendar Grid - Second Row (Jul-Dec) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {secondRow.map((month, index) => {
          const actualIndex = index + 6;
          const styles = getCardStyles(month.recommendation);
          const isCurrentMonth = actualIndex === currentMonthIndex;
          
          return (
            <motion.div
              key={month.month}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: (index + 6) * 0.05 }}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-105 cursor-pointer",
                styles.bg,
                styles.border,
                isCurrentMonth && "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900"
              )}
            >
              {/* Current month indicator */}
              {isCurrentMonth && (
                <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                  NOW
                </div>
              )}
              
              {/* Month name */}
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {month.month.slice(0, 3).toUpperCase()}
              </div>
              
              {/* Rate */}
              <div className={cn("text-lg font-bold", styles.text)}>
                ฿{month.rate.toFixed(1)}
              </div>
              
              {/* vs Average */}
              <div className={cn(
                "text-[10px] font-medium",
                month.vsAverage < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {month.vsAverage > 0 ? '+' : ''}{month.vsAverage}%
              </div>
              
              {/* Rating badge */}
              <div className={cn(
                "mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-center",
                styles.badge
              )}>
                {styles.label}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Quick insight */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Icon icon="solar:lightbulb-bolt-bold" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-blue-900 dark:text-blue-200">Quick Insight:</span>{' '}
            <span className="text-blue-800 dark:text-blue-300">
              For {currency}, the best months to buy are{' '}
              <strong className="text-green-700 dark:text-green-400">{data.bestMonths.slice(0, 2).join(' & ')}</strong>
              {' '}with rates up to <strong>{data.potentialSavingsPercent}% lower</strong> than peak months.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeasonalInsightCard({ insight, isActive }: { insight: SeasonalInsight; isActive: boolean }) {
  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'very_high': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      case 'very_low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getPriceColor = (price: string) => {
    switch (price) {
      case 'peak': return 'text-red-600';
      case 'above_average': return 'text-orange-600';
      case 'average': return 'text-yellow-600';
      case 'below_average': return 'text-green-600';
      case 'lowest': return 'text-green-700';
      default: return 'text-gray-600';
    }
  };
  
  const getNegotiationColor = (power: string) => {
    switch (power) {
      case 'excellent': return 'text-green-700';
      case 'good': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'limited': return 'text-orange-600';
      case 'minimal': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border transition-all",
        isActive 
          ? "bg-primary/5 border-primary shadow-lg" 
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            insight.season === 'high' ? 'bg-red-100 text-red-700' :
            insight.season === 'low' ? 'bg-green-100 text-green-700' :
            'bg-yellow-100 text-yellow-700'
          )}>
            {insight.season === 'high' ? '🔥 High Season' : 
             insight.season === 'low' ? '💎 Low Season' : 
             '🌤️ Shoulder Season'}
          </span>
          {isActive && (
            <span className="px-2 py-1 bg-primary text-white rounded-full text-xs font-medium">
              Current
            </span>
          )}
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {insight.months.join(', ')}
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        {insight.description}
      </p>
      
      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-gray-500 mb-1">Buyers</div>
          <div className={cn("font-medium", getActivityColor(insight.buyerActivity).split(' ')[0])}>
            {insight.buyerActivity.replace('_', ' ')}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-gray-500 mb-1">Prices</div>
          <div className={cn("font-medium", getPriceColor(insight.priceLevel))}>
            {insight.priceLevel.replace('_', ' ')}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-gray-500 mb-1">Negotiation</div>
          <div className={cn("font-medium", getNegotiationColor(insight.negotiationPower))}>
            {insight.negotiationPower}
          </div>
        </div>
      </div>
      
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Icon icon="solar:lightbulb-bolt-bold" className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-200">
          {insight.tip}
        </p>
      </div>
    </motion.div>
  );
}

function TransferMethodCard({ method, isExpanded, onToggle }: { 
  method: TransferMethod; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all",
      method.recommended 
        ? "border-green-300 dark:border-green-800" 
        : "border-gray-200 dark:border-gray-700"
    )}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            method.recommended ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"
          )}>
            <Icon 
              icon={
                method.id === 'wise' ? 'simple-icons:wise' :
                method.id === 'bank-wire' ? 'solar:bank-bold' :
                method.id === 'ofx' ? 'solar:dollar-bold' :
                'solar:shield-check-bold'
              } 
              className={cn(
                "w-5 h-5",
                method.recommended ? "text-green-600" : "text-gray-600"
              )} 
            />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
              {method.recommended && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{method.description}</p>
          </div>
        </div>
        <Icon 
          icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} 
          className="w-5 h-5 text-gray-400" 
        />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-gray-500 mb-1">Fees</div>
                  <div className="font-medium text-gray-900 dark:text-white">{method.fees}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-gray-500 mb-1">Timeframe</div>
                  <div className="font-medium text-gray-900 dark:text-white">{method.timeframe}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Pros</div>
                  <ul className="space-y-1">
                    {method.pros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                        <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">Cons</div>
                  <ul className="space-y-1">
                    {method.cons.slice(0, 3).map((con, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                        <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Best for:</strong> {method.bestFor}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MarketEventBadge({ event }: { event: MarketEvent }) {
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      event.impact === 'positive' ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
      event.impact === 'negative' ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" :
      "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm text-gray-900 dark:text-white">{event.name}</span>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          event.impact === 'positive' ? "bg-green-100 text-green-700" :
          event.impact === 'negative' ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-gray-700"
        )}>
          {event.impact === 'positive' ? '✓ Good' : event.impact === 'negative' ? '⚠ Caution' : '○ Note'}
        </span>
      </div>
      <div className="text-xs text-gray-500 mb-1">{event.period}</div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{event.description}</p>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BestTimeToBuy({ currency, budget }: BestTimeToBuyProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalRateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMethod, setExpandedMethod] = useState<string | null>('wise');
  const [activeTab, setActiveTab] = useState<'exchange' | 'seasonal' | 'transfer'>('exchange');
  
  // Fetch historical data
  useEffect(() => {
    const fetchData = async () => {
      if (currency === 'THB') {
        setHistoricalData(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/currency/historical?currency=${currency}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setHistoricalData(data);
      } catch (err) {
        setError('Failed to load historical data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currency]);
  
  const currentSeason = useMemo(() => getCurrentSeasonalInsight(), []);
  const currentTimingScore = useMemo(() => calculateTimingScore(new Date().getMonth()), []);
  const upcomingEvents = useMemo(() => getUpcomingEvents(), []);
  
  // Calculate potential savings based on budget
  const potentialSavings = useMemo(() => {
    if (!historicalData || currency === 'THB') return null;
    
    const savingsPercent = historicalData.potentialSavingsPercent;
    const budgetInTHB = budget;
    const savingsAmount = budgetInTHB * (savingsPercent / 100);
    
    return {
      percent: savingsPercent,
      amount: savingsAmount,
    };
  }, [historicalData, budget, currency]);
  
  if (currency === 'THB') {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
        <Icon icon="solar:info-circle-bold" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-400">
          Select a foreign currency to see timing recommendations
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with current timing score */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="solar:calendar-bold" className="w-5 h-5" />
              Best Time to Buy Analysis
            </h3>
            <p className="text-gray-400 text-sm">Based on {currency}/THB patterns</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentTimingScore.score}</div>
            <div className={cn(
              "text-sm",
              currentTimingScore.color === 'green' ? 'text-green-400' :
              currentTimingScore.color === 'lime' ? 'text-lime-400' :
              currentTimingScore.color === 'yellow' ? 'text-yellow-400' :
              currentTimingScore.color === 'orange' ? 'text-orange-400' :
              'text-red-400'
            )}>
              {currentTimingScore.label} Timing
            </div>
          </div>
        </div>
        
        {/* Timing meter */}
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentTimingScore.score}%` }}
            className={cn(
              "h-full rounded-full",
              currentTimingScore.color === 'green' ? 'bg-green-500' :
              currentTimingScore.color === 'lime' ? 'bg-lime-500' :
              currentTimingScore.color === 'yellow' ? 'bg-yellow-500' :
              currentTimingScore.color === 'orange' ? 'bg-orange-500' :
              'bg-red-500'
            )}
          />
        </div>
        
        {potentialSavings && (
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
            <span className="text-gray-300">Potential timing savings</span>
            <span className="font-bold text-green-400">
              Up to {formatCurrency(potentialSavings.amount, 'THB')}
            </span>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {[
          { id: 'exchange', label: 'Exchange Rates', icon: 'solar:chart-2-bold' },
          { id: 'seasonal', label: 'Market Seasons', icon: 'solar:calendar-bold' },
          { id: 'transfer', label: 'Transfer Methods', icon: 'solar:card-transfer-bold' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Icon icon={tab.icon} className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'exchange' && (
          <motion.div
            key="exchange"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Icon icon="solar:chart-bold" className="w-5 h-5 text-primary" />
                {currency}/THB Monthly Patterns (5-Year Average)
              </h4>
              
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Icon icon="solar:refresh-linear" className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : error ? (
                <div className="h-64 flex items-center justify-center text-red-500">
                  {error}
                </div>
              ) : historicalData ? (
                <MonthlyRateChart data={historicalData} currency={currency} />
              ) : null}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'seasonal' && (
          <motion.div
            key="seasonal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {SEASONAL_INSIGHTS.map((insight, index) => (
              <SeasonalInsightCard 
                key={index} 
                insight={insight} 
                isActive={insight.months.includes(new Date().toLocaleString('en-US', { month: 'long' }))}
              />
            ))}
            
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Icon icon="solar:calendar-mark-bold" className="w-5 h-5 text-primary" />
                Key Market Events
              </h4>
              <div className="space-y-2">
                {upcomingEvents.map((event, index) => (
                  <MarketEventBadge key={index} event={event} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'transfer' && (
          <motion.div
            key="transfer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {TRANSFER_METHODS.map((method) => (
              <TransferMethodCard
                key={method.id}
                method={method}
                isExpanded={expandedMethod === method.id}
                onToggle={() => setExpandedMethod(expandedMethod === method.id ? null : method.id)}
              />
            ))}
            
            {/* Pro tip */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Icon icon="solar:lightbulb-bolt-bold" className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Pro Tip</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    For transactions over ฿5 million, use Wise or OFX for the transfer and request an escrow service through your lawyer. 
                    This combination gives you the best exchange rate with maximum security.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Disclaimer */}
      <div className="text-xs text-gray-500 text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <Icon icon="solar:info-circle-linear" className="w-4 h-4 inline mr-1" />
        Historical patterns are not guarantees. Exchange rates and market conditions can vary.
      </div>
    </div>
  );
}

export default BestTimeToBuy;

// ============================================
// THAILAND PROPERTY MARKET INSIGHTS
// Seasonal patterns, best times to buy, transfer methods
// ============================================

export interface SeasonalInsight {
  months: string[];
  season: 'high' | 'low' | 'shoulder';
  buyerActivity: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  priceLevel: 'peak' | 'above_average' | 'average' | 'below_average' | 'lowest';
  negotiationPower: 'minimal' | 'limited' | 'moderate' | 'good' | 'excellent';
  description: string;
  tip: string;
}

export interface TransferMethod {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  fees: string;
  timeframe: string;
  bestFor: string;
  recommended: boolean;
}

export interface MarketEvent {
  name: string;
  period: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

// ============================================
// SEASONAL PATTERNS
// ============================================

export const SEASONAL_INSIGHTS: SeasonalInsight[] = [
  {
    months: ['November', 'December', 'January', 'February'],
    season: 'high',
    buyerActivity: 'very_high',
    priceLevel: 'peak',
    negotiationPower: 'limited',
    description: 'High season - Many European and Russian buyers actively searching. Best weather in Phuket.',
    tip: 'Start negotiations in October for closings in Dec-Feb. More inventory but also more competition.',
  },
  {
    months: ['March', 'April'],
    season: 'shoulder',
    buyerActivity: 'high',
    priceLevel: 'above_average',
    negotiationPower: 'moderate',
    description: 'Shoulder season - Still busy but activity starts to slow. Songkran (Thai New Year) in April.',
    tip: 'Good time to find motivated sellers who want to close before low season.',
  },
  {
    months: ['May', 'June', 'July', 'August', 'September', 'October'],
    season: 'low',
    buyerActivity: 'low',
    priceLevel: 'below_average',
    negotiationPower: 'excellent',
    description: 'Low season - Rainy season, fewer tourists and buyers. Best time for deals.',
    tip: 'Best negotiation power. Sellers are more flexible. Properties may sit longer on market.',
  },
];

// ============================================
// MARKET EVENTS
// ============================================

export const MARKET_EVENTS: MarketEvent[] = [
  {
    name: 'Chinese New Year',
    period: 'Late Jan - Early Feb',
    impact: 'negative',
    description: 'Price surge from Chinese buyers. Avoid if price-sensitive.',
  },
  {
    name: 'Songkran (Thai New Year)',
    period: 'April 13-15',
    impact: 'neutral',
    description: 'Many offices closed. Transactions may be delayed.',
  },
  {
    name: 'Government Incentive Deadline',
    period: 'Until June 2026',
    impact: 'positive',
    description: '0.01% transfer fee instead of 2%. Significant savings.',
  },
  {
    name: 'End of Financial Year',
    period: 'December',
    impact: 'positive',
    description: 'Some sellers motivated to close before year-end for tax purposes.',
  },
  {
    name: 'High Season Start',
    period: 'November 1',
    impact: 'negative',
    description: 'Property prices typically increase as tourist season begins.',
  },
];

// ============================================
// TRANSFER METHODS
// ============================================

export const TRANSFER_METHODS: TransferMethod[] = [
  {
    id: 'wise',
    name: 'Wise (TransferWise)',
    description: 'Online money transfer service with competitive rates',
    pros: [
      'Best exchange rates (mid-market rate)',
      'Low transparent fees (0.4-0.6%)',
      'Fast transfers (1-2 business days)',
      'Easy online process',
      'FET form documentation included',
    ],
    cons: [
      'Daily/monthly limits may apply',
      'Requires Wise account setup',
      'May need multiple transfers for large amounts',
    ],
    fees: '0.4-0.6% of transfer amount',
    timeframe: '1-2 business days',
    bestFor: 'Amounts up to ฿10 million',
    recommended: true,
  },
  {
    id: 'bank-wire',
    name: 'Bank Wire Transfer',
    description: 'Traditional SWIFT transfer through your bank',
    pros: [
      'No transfer limits',
      'Direct bank-to-bank',
      'Suitable for large amounts',
      'Bank provides documentation',
    ],
    cons: [
      'Higher fees ($25-50 + intermediary fees)',
      'Poor exchange rates (2-4% markup)',
      'Slower (3-5 business days)',
      'Complex documentation',
    ],
    fees: '$25-50 flat + 2-4% exchange markup',
    timeframe: '3-5 business days',
    bestFor: 'Amounts over ฿10 million',
    recommended: false,
  },
  {
    id: 'ofx',
    name: 'OFX (formerly OzForex)',
    description: 'Specialized foreign exchange broker',
    pros: [
      'Good rates for large transfers',
      'Personal dealer assigned',
      'No transfer fees over $10,000',
      'Hedging options available',
    ],
    cons: [
      'Minimum transfer $1,000',
      'Account setup required',
      'Rates vary by amount',
    ],
    fees: '0.5-1% exchange margin',
    timeframe: '1-3 business days',
    bestFor: 'Amounts ฿5-20 million',
    recommended: true,
  },
  {
    id: 'escrow',
    name: 'Escrow Service',
    description: 'Third-party holds funds until conditions are met',
    pros: [
      'Maximum security for both parties',
      'Protects against fraud',
      'Professional handling',
      'Dispute resolution included',
    ],
    cons: [
      'Additional fee (0.5-1%)',
      'Slower process',
      'Requires coordination',
    ],
    fees: '0.5-1% of transaction value',
    timeframe: '5-10 business days',
    bestFor: 'High-value transactions or new sellers',
    recommended: true,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getCurrentSeasonalInsight(): SeasonalInsight {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  return SEASONAL_INSIGHTS.find(s => s.months.includes(currentMonth)) || SEASONAL_INSIGHTS[0];
}

export function getBestMonthsForBuying(): string[] {
  // Low season months - best for negotiation
  return ['May', 'June', 'July', 'August', 'September', 'October'];
}

export function calculateTimingScore(month: number): {
  score: number;
  label: string;
  color: string;
} {
  // 0 = January, 11 = December
  // Low season months (May-Oct) get highest scores
  const scores: Record<number, number> = {
    0: 35, // Jan - CNY impact
    1: 30, // Feb - CNY impact
    2: 50, // Mar - shoulder
    3: 55, // Apr - shoulder
    4: 90, // May - low season start
    5: 95, // Jun - best
    6: 95, // Jul - best
    7: 90, // Aug - great
    8: 85, // Sep - great
    9: 75, // Oct - good
    10: 40, // Nov - high season starts
    11: 45, // Dec - high season
  };
  
  const score = scores[month] || 50;
  
  let label: string;
  let color: string;
  
  if (score >= 85) {
    label = 'Excellent';
    color = 'green';
  } else if (score >= 70) {
    label = 'Good';
    color = 'lime';
  } else if (score >= 50) {
    label = 'Average';
    color = 'yellow';
  } else if (score >= 35) {
    label = 'Below Average';
    color = 'orange';
  } else {
    label = 'Poor';
    color = 'red';
  }
  
  return { score, label, color };
}

export function getUpcomingEvents(): MarketEvent[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Filter events that are relevant to current/upcoming period
  return MARKET_EVENTS.filter(event => {
    // Government incentive is always relevant until deadline
    if (event.name.includes('Government Incentive')) {
      return new Date() < new Date('2026-06-30');
    }
    return true;
  });
}

// ============================================
// TRANSLATIONS
// ============================================

export const MARKET_INSIGHTS_TRANSLATIONS = {
  en: {
    title: 'Best Time to Buy',
    subtitle: 'Optimize your purchase timing for maximum savings',
    exchangeRatePatterns: 'Exchange Rate Patterns',
    seasonalMarket: 'Seasonal Market Conditions',
    transferMethods: 'Transfer Methods',
    currentMonth: 'Current Month',
    bestMonths: 'Best Months',
    worstMonths: 'Avoid',
    potentialSavings: 'Potential Savings',
    marketActivity: 'Market Activity',
    priceLevel: 'Price Level',
    negotiationPower: 'Negotiation Power',
    upcomingEvents: 'Upcoming Events',
    recommendedMethod: 'Recommended',
    viewDetails: 'View Details',
    loading: 'Loading...',
    error: 'Failed to load data',
    disclaimer: 'Historical patterns are not guarantees of future performance. Exchange rates and market conditions can vary.',
  },
  nl: {
    title: 'Beste Moment om te Kopen',
    subtitle: 'Optimaliseer je aankooptiming voor maximale besparingen',
    exchangeRatePatterns: 'Wisselkoerspatronen',
    seasonalMarket: 'Seizoensgebonden Marktomstandigheden',
    transferMethods: 'Overdrachtsmethoden',
    currentMonth: 'Huidige Maand',
    bestMonths: 'Beste Maanden',
    worstMonths: 'Vermijden',
    potentialSavings: 'Potentiële Besparing',
    marketActivity: 'Marktactiviteit',
    priceLevel: 'Prijsniveau',
    negotiationPower: 'Onderhandelingspositie',
    upcomingEvents: 'Aankomende Gebeurtenissen',
    recommendedMethod: 'Aanbevolen',
    viewDetails: 'Details Bekijken',
    loading: 'Laden...',
    error: 'Laden mislukt',
    disclaimer: 'Historische patronen zijn geen garantie voor toekomstige prestaties. Wisselkoersen en marktomstandigheden kunnen variëren.',
  },
};

export type MarketInsightsLanguage = keyof typeof MARKET_INSIGHTS_TRANSLATIONS;

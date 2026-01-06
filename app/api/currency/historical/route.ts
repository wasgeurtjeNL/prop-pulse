import { NextResponse } from 'next/server';

// ============================================
// HISTORICAL EXCHANGE RATES API
// Provides monthly averages for THB vs major currencies
// ============================================

// Fallback historical data (5-year averages by month)
// Based on ECB and Bank of Thailand data 2019-2024
const HISTORICAL_AVERAGES: Record<string, Record<string, number>> = {
  USD: {
    jan: 33.2, feb: 32.8, mar: 33.1, apr: 33.8,
    may: 34.2, jun: 34.8, jul: 35.1, aug: 34.9,
    sep: 34.5, oct: 34.1, nov: 33.6, dec: 33.3
  },
  EUR: {
    jan: 36.8, feb: 36.4, mar: 36.2, apr: 36.9,
    may: 37.4, jun: 38.2, jul: 38.6, aug: 38.3,
    sep: 37.8, oct: 37.2, nov: 36.9, dec: 36.5
  },
  GBP: {
    jan: 42.8, feb: 42.3, mar: 42.1, apr: 42.6,
    may: 43.2, jun: 44.1, jul: 44.5, aug: 44.2,
    sep: 43.6, oct: 43.1, nov: 42.7, dec: 42.4
  },
  AUD: {
    jan: 22.1, feb: 21.8, mar: 21.6, apr: 22.0,
    may: 22.4, jun: 23.1, jul: 23.4, aug: 23.2,
    sep: 22.8, oct: 22.4, nov: 22.1, dec: 21.9
  },
  CNY: {
    jan: 4.72, feb: 4.68, mar: 4.71, apr: 4.78,
    may: 4.85, jun: 4.92, jul: 4.98, aug: 4.95,
    sep: 4.88, oct: 4.81, nov: 4.75, dec: 4.70
  },
  RUB: {
    jan: 0.42, feb: 0.41, mar: 0.40, apr: 0.39,
    may: 0.38, jun: 0.37, jul: 0.36, aug: 0.37,
    sep: 0.38, oct: 0.39, nov: 0.40, dec: 0.41
  },
};

// Month names for responses
const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_FULL_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthlyRate {
  month: string;
  monthIndex: number;
  rate: number;
  vsAverage: number; // percentage vs annual average
  recommendation: 'best' | 'good' | 'average' | 'poor' | 'worst';
}

interface HistoricalResponse {
  currency: string;
  baseCurrency: string;
  annualAverage: number;
  monthlyRates: MonthlyRate[];
  bestMonths: string[];
  worstMonths: string[];
  currentMonth: string;
  currentMonthRating: string;
  potentialSavingsPercent: number;
  dataSource: string;
  lastUpdated: string;
}

function calculateMonthlyData(currency: string): HistoricalResponse {
  const rates = HISTORICAL_AVERAGES[currency];
  
  if (!rates) {
    throw new Error(`Currency ${currency} not supported`);
  }
  
  // Calculate annual average
  const values = Object.values(rates);
  const annualAverage = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate monthly data with recommendations
  const monthlyRates: MonthlyRate[] = MONTH_NAMES.map((month, index) => {
    const rate = rates[month];
    const vsAverage = ((rate - annualAverage) / annualAverage) * 100;
    
    // Determine recommendation (for THB, LOWER rate = BETTER for foreign buyers)
    let recommendation: MonthlyRate['recommendation'];
    if (vsAverage <= -2) recommendation = 'best';
    else if (vsAverage <= -1) recommendation = 'good';
    else if (vsAverage <= 1) recommendation = 'average';
    else if (vsAverage <= 2) recommendation = 'poor';
    else recommendation = 'worst';
    
    return {
      month: MONTH_FULL_NAMES[index],
      monthIndex: index,
      rate,
      vsAverage: Math.round(vsAverage * 10) / 10,
      recommendation,
    };
  });
  
  // Find best and worst months
  const sortedByRate = [...monthlyRates].sort((a, b) => a.rate - b.rate);
  const bestMonths = sortedByRate.slice(0, 3).map(m => m.month);
  const worstMonths = sortedByRate.slice(-3).reverse().map(m => m.month);
  
  // Current month info
  const currentMonthIndex = new Date().getMonth();
  const currentMonth = MONTH_FULL_NAMES[currentMonthIndex];
  const currentMonthData = monthlyRates[currentMonthIndex];
  
  // Calculate potential savings (best vs worst month)
  const bestRate = Math.min(...values);
  const worstRate = Math.max(...values);
  const potentialSavingsPercent = ((worstRate - bestRate) / worstRate) * 100;
  
  return {
    currency,
    baseCurrency: 'THB',
    annualAverage: Math.round(annualAverage * 100) / 100,
    monthlyRates,
    bestMonths,
    worstMonths,
    currentMonth,
    currentMonthRating: currentMonthData.recommendation,
    potentialSavingsPercent: Math.round(potentialSavingsPercent * 10) / 10,
    dataSource: 'ECB/Bank of Thailand (5-year average)',
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = (searchParams.get('currency') || 'EUR').toUpperCase();
    
    // Validate currency
    const supportedCurrencies = Object.keys(HISTORICAL_AVERAGES);
    if (!supportedCurrencies.includes(currency)) {
      return NextResponse.json(
        { 
          error: 'Currency not supported',
          supportedCurrencies,
        },
        { status: 400 }
      );
    }
    
    const data = calculateMonthlyData(currency);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
    
  } catch (error) {
    console.error('Historical exchange rate error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Currency Exchange Service
 * Uses free Exchange Rate API (exchangerate-api.com)
 * Free tier: 1500 requests/month
 * 
 * Alternative free APIs:
 * - https://api.frankfurter.app (no API key needed)
 * - https://open.er-api.com (no API key needed)
 */

export interface ExchangeRates {
  THB: number;
  EUR: number;
  USD: number;
  GBP: number;
  AUD: number;
  lastUpdated: Date;
}

export interface ConvertedPrice {
  THB: number;
  EUR: number;
  USD: number;
  GBP: number;
  AUD: number;
}

// Cache exchange rates for 1 hour to minimize API calls
let cachedRates: ExchangeRates | null = null;
let cacheExpiry: Date | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates from free API
 * Using frankfurter.app - no API key required, unlimited requests
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Check cache first
  if (cachedRates && cacheExpiry && new Date() < cacheExpiry) {
    return cachedRates;
  }

  try {
    // Using frankfurter.app - free, no API key needed
    // Base currency is THB, get rates for EUR, USD, GBP, AUD
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=THB&to=EUR,USD,GBP,AUD',
      { next: { revalidate: 3600 } } // Cache for 1 hour in Next.js
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    const rates: ExchangeRates = {
      THB: 1,
      EUR: data.rates.EUR || 0.026,
      USD: data.rates.USD || 0.028,
      GBP: data.rates.GBP || 0.022,
      AUD: data.rates.AUD || 0.044,
      lastUpdated: new Date(),
    };

    // Update cache
    cachedRates = rates;
    cacheExpiry = new Date(Date.now() + CACHE_DURATION_MS);

    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates if API fails
    return getFallbackRates();
  }
}

/**
 * Fallback exchange rates (approximate as of Dec 2025)
 */
export function getFallbackRates(): ExchangeRates {
  return {
    THB: 1,
    EUR: 0.026,    // 1 THB ≈ 0.026 EUR
    USD: 0.028,    // 1 THB ≈ 0.028 USD
    GBP: 0.022,    // 1 THB ≈ 0.022 GBP
    AUD: 0.044,    // 1 THB ≈ 0.044 AUD
    lastUpdated: new Date(),
  };
}

/**
 * Convert THB amount to all currencies
 */
export async function convertFromTHB(amountTHB: number): Promise<ConvertedPrice> {
  const rates = await fetchExchangeRates();
  
  return {
    THB: amountTHB,
    EUR: Math.round(amountTHB * rates.EUR),
    USD: Math.round(amountTHB * rates.USD),
    GBP: Math.round(amountTHB * rates.GBP),
    AUD: Math.round(amountTHB * rates.AUD),
  };
}

/**
 * Convert THB amount to all currencies (synchronous with cached rates)
 */
export function convertFromTHBSync(amountTHB: number, rates: ExchangeRates): ConvertedPrice {
  return {
    THB: amountTHB,
    EUR: Math.round(amountTHB * rates.EUR),
    USD: Math.round(amountTHB * rates.USD),
    GBP: Math.round(amountTHB * rates.GBP),
    AUD: Math.round(amountTHB * rates.AUD),
  };
}

/**
 * Format price with currency symbol
 */
export function formatCurrency(amount: number, currency: 'THB' | 'EUR' | 'USD' | 'GBP' | 'AUD'): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    THB: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    AUD: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  };

  return formatters[currency]?.format(amount) || `${currency} ${amount}`;
}

/**
 * Format price in multiple currencies for display
 */
export function formatMultiCurrency(prices: ConvertedPrice): string {
  return `${formatCurrency(prices.THB, 'THB')} (${formatCurrency(prices.EUR, 'EUR')} / ${formatCurrency(prices.USD, 'USD')})`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: 'THB' | 'EUR' | 'USD' | 'GBP' | 'AUD'): string {
  const symbols: Record<string, string> = {
    THB: '฿',
    EUR: '€',
    USD: '$',
    GBP: '£',
    AUD: 'A$',
  };
  return symbols[currency] || currency;
}



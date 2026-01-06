"use client";

import { useState, useEffect, useCallback } from "react";

export interface CurrencyRate {
  currency: string;
  rate: number;
  displayRate: string;
  lastUpdated: string;
  source: string;
}

interface CurrencyRatesResponse {
  success: boolean;
  baseCurrency: string;
  rates: CurrencyRate[];
  cached?: boolean;
  stale?: boolean;
  fallback?: boolean;
  warning?: string;
  fetchedAt?: string;
  expiresAt?: string;
}

interface UseCurrencyRatesResult {
  rates: CurrencyRate[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isStale: boolean;
  isFallback: boolean;
  refetch: () => Promise<void>;
  getRate: (currency: string) => number;
  getDisplayRate: (currency: string) => string;
}

/**
 * Hook for fetching and using live currency exchange rates
 */
export function useCurrencyRates(): UseCurrencyRatesResult {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/currency");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.status}`);
      }

      const data: CurrencyRatesResponse = await response.json();

      if (data.success && data.rates) {
        setRates(data.rates);
        setLastUpdated(new Date());
        setIsStale(data.stale ?? false);
        setIsFallback(data.fallback ?? false);
        
        if (data.warning) {
          console.warn("Currency rates warning:", data.warning);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to fetch currency rates:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch rates");
      
      // Use fallback rates on error
      setRates(getFallbackRates());
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Get rate for a specific currency
  const getRate = useCallback(
    (currency: string): number => {
      if (currency === "THB") return 1;
      const rate = rates.find((r) => r.currency === currency);
      return rate?.rate ?? 0;
    },
    [rates]
  );

  // Get display rate string for a currency
  const getDisplayRate = useCallback(
    (currency: string): string => {
      if (currency === "THB") return "Base currency";
      const rate = rates.find((r) => r.currency === currency);
      return rate?.displayRate ?? "N/A";
    },
    [rates]
  );

  return {
    rates,
    isLoading,
    error,
    lastUpdated,
    isStale,
    isFallback,
    refetch: fetchRates,
    getRate,
    getDisplayRate,
  };
}

/**
 * Fallback rates for offline use
 */
function getFallbackRates(): CurrencyRate[] {
  const fallbackRates: Record<string, number> = {
    USD: 0.029,
    EUR: 0.027,
    GBP: 0.023,
    AUD: 0.044,
    CNY: 0.20,
    RUB: 2.6,
  };

  return Object.entries(fallbackRates).map(([currency, rate]) => ({
    currency,
    rate,
    displayRate: `1 ${currency} = ฿${(1 / rate).toFixed(2)}`,
    lastUpdated: new Date().toISOString(),
    source: "fallback",
  }));
}

export default useCurrencyRates;

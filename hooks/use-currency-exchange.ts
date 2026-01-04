"use client";

import { useState, useEffect } from 'react';
import { 
  ExchangeRates, 
  ConvertedPrice, 
  fetchExchangeRates, 
  getFallbackRates,
  convertFromTHBSync,
  formatCurrency,
  getCurrencySymbol
} from '@/lib/services/currency-exchange';

export interface UseCurrencyExchangeReturn {
  rates: ExchangeRates;
  isLoading: boolean;
  error: string | null;
  convertFromTHB: (amountTHB: number) => ConvertedPrice;
  formatPrice: (amount: number, currency: 'THB' | 'EUR' | 'USD' | 'GBP' | 'AUD') => string;
  formatMultiPrice: (amountTHB: number) => { thb: string; eur: string; usd: string };
  getCurrencySymbol: (currency: 'THB' | 'EUR' | 'USD' | 'GBP' | 'AUD') => string;
}

export function useCurrencyExchange(): UseCurrencyExchangeReturn {
  const [rates, setRates] = useState<ExchangeRates>(getFallbackRates());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRates() {
      try {
        setIsLoading(true);
        const fetchedRates = await fetchExchangeRates();
        if (isMounted) {
          setRates(fetchedRates);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load exchange rates');
          // Keep using fallback rates
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRates();

    return () => {
      isMounted = false;
    };
  }, []);

  const convertFromTHB = (amountTHB: number): ConvertedPrice => {
    return convertFromTHBSync(amountTHB, rates);
  };

  const formatPrice = (amount: number, currency: 'THB' | 'EUR' | 'USD' | 'GBP' | 'AUD'): string => {
    return formatCurrency(amount, currency);
  };

  const formatMultiPrice = (amountTHB: number): { thb: string; eur: string; usd: string } => {
    const converted = convertFromTHBSync(amountTHB, rates);
    return {
      thb: formatCurrency(converted.THB, 'THB'),
      eur: formatCurrency(converted.EUR, 'EUR'),
      usd: formatCurrency(converted.USD, 'USD'),
    };
  };

  return {
    rates,
    isLoading,
    error,
    convertFromTHB,
    formatPrice,
    formatMultiPrice,
    getCurrencySymbol,
  };
}









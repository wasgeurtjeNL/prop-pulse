import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Exchange rate API configuration
const EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest/THB";
const CACHE_DURATION_HOURS = 1;

// Supported currencies
const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CNY", "RUB"];

interface ExchangeRateApiResponse {
  base: string;
  date: string;
  time_last_updated: number;
  rates: Record<string, number>;
}

interface CurrencyRate {
  currency: string;
  rate: number;
  displayRate: string;
  lastUpdated: string;
  source: string;
}

/**
 * GET /api/currency
 * Returns current exchange rates for THB
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we have valid cached rates
    const cachedRates = await prisma.currencyExchangeRate.findMany({
      where: {
        base_currency: "THB",
        target_currency: { in: SUPPORTED_CURRENCIES },
        valid_until: { gt: new Date() },
      },
    });

    // If we have all rates cached and valid, return them
    if (cachedRates.length === SUPPORTED_CURRENCIES.length) {
      const rates: CurrencyRate[] = cachedRates.map((r) => ({
        currency: r.target_currency,
        rate: r.rate,
        displayRate: formatDisplayRate(r.target_currency, r.rate),
        lastUpdated: r.fetched_at.toISOString(),
        source: r.source,
      }));

      return NextResponse.json({
        success: true,
        baseCurrency: "THB",
        rates,
        cached: true,
        expiresAt: cachedRates[0]?.valid_until?.toISOString(),
      });
    }

    // Fetch fresh rates from API
    const freshRates = await fetchExchangeRates();

    if (freshRates) {
      // Update database with fresh rates
      await updateCachedRates(freshRates);

      return NextResponse.json({
        success: true,
        baseCurrency: "THB",
        rates: freshRates,
        cached: false,
        fetchedAt: new Date().toISOString(),
      });
    }

    // If API fails, return cached rates (even if stale)
    const staleRates = await prisma.currencyExchangeRate.findMany({
      where: {
        base_currency: "THB",
        target_currency: { in: SUPPORTED_CURRENCIES },
      },
    });

    if (staleRates.length > 0) {
      const rates: CurrencyRate[] = staleRates.map((r) => ({
        currency: r.target_currency,
        rate: r.rate,
        displayRate: formatDisplayRate(r.target_currency, r.rate),
        lastUpdated: r.fetched_at.toISOString(),
        source: r.source + " (stale)",
      }));

      return NextResponse.json({
        success: true,
        baseCurrency: "THB",
        rates,
        cached: true,
        stale: true,
        warning: "Using cached rates - API temporarily unavailable",
      });
    }

    // Return fallback rates
    return NextResponse.json({
      success: true,
      baseCurrency: "THB",
      rates: getFallbackRates(),
      cached: false,
      fallback: true,
      warning: "Using fallback rates - external API unavailable",
    });
  } catch (error) {
    console.error("Currency API error:", error);

    // Return fallback rates on error
    return NextResponse.json({
      success: true,
      baseCurrency: "THB",
      rates: getFallbackRates(),
      fallback: true,
      error: "Failed to fetch live rates, using fallback",
    });
  }
}

/**
 * Fetch exchange rates from external API
 */
async function fetchExchangeRates(): Promise<CurrencyRate[] | null> {
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data: ExchangeRateApiResponse = await response.json();

    // Convert rates (API returns THB -> other, we want 1 THB = X other)
    const rates: CurrencyRate[] = SUPPORTED_CURRENCIES.map((currency) => {
      const rate = data.rates[currency] || 0;
      return {
        currency,
        rate,
        displayRate: formatDisplayRate(currency, rate),
        lastUpdated: new Date().toISOString(),
        source: "exchangerate-api",
      };
    });

    return rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return null;
  }
}

/**
 * Update cached rates in database
 */
async function updateCachedRates(rates: CurrencyRate[]): Promise<void> {
  const validUntil = new Date(Date.now() + CACHE_DURATION_HOURS * 60 * 60 * 1000);

  for (const rate of rates) {
    await prisma.currencyExchangeRate.upsert({
      where: {
        unique_currency_pair: {
          base_currency: "THB",
          target_currency: rate.currency,
        },
      },
      create: {
        base_currency: "THB",
        target_currency: rate.currency,
        rate: rate.rate,
        source: rate.source,
        fetched_at: new Date(),
        valid_until: validUntil,
      },
      update: {
        rate: rate.rate,
        source: rate.source,
        fetched_at: new Date(),
        valid_until: validUntil,
      },
    });
  }
}

/**
 * Format display rate for user
 */
function formatDisplayRate(currency: string, rate: number): string {
  if (rate === 0) return "N/A";

  // Convert: 1 THB = X currency
  // To show: 1 USD = X THB (inverse)
  const inverse = 1 / rate;

  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    CNY: "¥",
    RUB: "₽",
  };

  return `1 ${symbols[currency] || currency} = ฿${inverse.toFixed(2)}`;
}

/**
 * Fallback rates (approximate)
 */
function getFallbackRates(): CurrencyRate[] {
  const fallbackRates: Record<string, number> = {
    USD: 0.029, // 1 THB = 0.029 USD (1 USD ≈ 34.5 THB)
    EUR: 0.027, // 1 THB = 0.027 EUR (1 EUR ≈ 37 THB)
    GBP: 0.023, // 1 THB = 0.023 GBP (1 GBP ≈ 43.5 THB)
    AUD: 0.044, // 1 THB = 0.044 AUD (1 AUD ≈ 22.7 THB)
    CNY: 0.20, // 1 THB = 0.20 CNY (1 CNY ≈ 5 THB)
    RUB: 2.6, // 1 THB = 2.6 RUB (1 RUB ≈ 0.38 THB)
  };

  return SUPPORTED_CURRENCIES.map((currency) => ({
    currency,
    rate: fallbackRates[currency] || 0,
    displayRate: formatDisplayRate(currency, fallbackRates[currency] || 0),
    lastUpdated: new Date().toISOString(),
    source: "fallback",
  }));
}

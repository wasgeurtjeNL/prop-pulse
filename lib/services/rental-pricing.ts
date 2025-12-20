/**
 * Rental Pricing Calculator
 * Calculates daily rental prices based on season and surcharge tiers
 * 
 * Pricing logic:
 * - Base daily price = monthly price / 30
 * - Shorter stays have a surcharge (extra cost) added on top
 * - Longer stays = lower surcharge (better value for customer)
 * - Customer only sees final price, not the surcharge breakdown
 */

export interface SurchargeTier {
  minDays: number;
  maxDays: number;
  surchargePercent: number; // Extra cost percentage (e.g., 30 = +30% on top of base price)
}

export interface PricingConfig {
  peakSeasonMonths: number[]; // [12, 1, 2] for Dec, Jan, Feb
  peakSeasonSurcharges: SurchargeTier[];
  lowSeasonSurcharges: SurchargeTier[];
  minimumStayDays: number;
  maximumStayDays: number;
}

export interface BookingCalculation {
  baseDailyPrice: number;
  finalDailyPrice: number; // After surcharge
  season: 'peak' | 'low';
  nights: number;
  surchargePercent: number; // Internal use only - not shown to customer
  subtotal: number;
  total: number;
}

// Legacy interface for backwards compatibility
export interface DiscountTier {
  minDays: number;
  maxDays: number;
  discountPercent: number;
}

/**
 * Get default pricing configuration
 * These are SURCHARGES (extra costs) for shorter stays
 * Longer stays = lower surcharge = better value
 */
export function getDefaultPricingConfig(): PricingConfig {
  return {
    peakSeasonMonths: [12, 1, 2], // December, January, February
    peakSeasonSurcharges: [
      { minDays: 1, maxDays: 7, surchargePercent: 30 },   // +30% for 1-7 days
      { minDays: 8, maxDays: 14, surchargePercent: 20 },  // +20% for 8-14 days
      { minDays: 15, maxDays: 19, surchargePercent: 15 }, // +15% for 15-19 days
      { minDays: 20, maxDays: 30, surchargePercent: 0 },  // No surcharge for 20-30 days
    ],
    lowSeasonSurcharges: [
      { minDays: 1, maxDays: 7, surchargePercent: 20 },   // +20% for 1-7 days
      { minDays: 8, maxDays: 14, surchargePercent: 17 },  // +17% for 8-14 days
      { minDays: 15, maxDays: 19, surchargePercent: 13 }, // +13% for 15-19 days
      { minDays: 20, maxDays: 30, surchargePercent: 0 },  // No surcharge for 20-30 days
    ],
    minimumStayDays: 1,
    maximumStayDays: 30,
  };
}

/**
 * Check if a date falls in peak season
 */
export function isPeakSeason(date: Date, config: PricingConfig | null | undefined): boolean {
  const safeConfig = config || getDefaultPricingConfig();
  const month = date.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
  return safeConfig.peakSeasonMonths.includes(month);
}

/**
 * Get the season for a booking period
 * If any part of the booking is in peak season, use peak season pricing
 */
export function getSeason(checkIn: Date, checkOut: Date, config: PricingConfig | null | undefined): 'peak' | 'low' {
  const safeConfig = config || getDefaultPricingConfig();
  // Check if any day in the booking period is in peak season
  const currentDate = new Date(checkIn);
  while (currentDate < checkOut) {
    if (isPeakSeason(currentDate, safeConfig)) {
      return 'peak';
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return 'low';
}

/**
 * Calculate the number of nights between check-in and check-out
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get surcharge tier for a given number of nights
 */
export function getSurchargeTier(
  nights: number,
  season: 'peak' | 'low',
  config: PricingConfig | null | undefined
): SurchargeTier | null {
  const safeConfig = config || getDefaultPricingConfig();
  const surcharges = season === 'peak' 
    ? safeConfig.peakSeasonSurcharges 
    : safeConfig.lowSeasonSurcharges;

  // Find the matching tier
  for (const tier of surcharges) {
    if (nights >= tier.minDays && nights <= tier.maxDays) {
      return tier;
    }
  }

  // If nights exceed maximum tier, use the last tier (no surcharge)
  if (surcharges.length > 0 && nights > surcharges[surcharges.length - 1].maxDays) {
    return surcharges[surcharges.length - 1];
  }

  return null;
}

/**
 * Calculate base daily price from monthly price
 */
export function calculateDailyPrice(monthlyPrice: number): number {
  // Assuming 30 days per month for calculation
  return monthlyPrice / 30;
}

/**
 * Calculate total booking price
 * Surcharges are added internally but not exposed to customer
 */
export function calculateBookingPrice(
  monthlyPrice: number,
  checkIn: Date,
  checkOut: Date,
  config?: PricingConfig | null
): BookingCalculation {
  const safeConfig = config || getDefaultPricingConfig();
  const nights = calculateNights(checkIn, checkOut);
  const season = getSeason(checkIn, checkOut, safeConfig);
  const baseDailyPrice = calculateDailyPrice(monthlyPrice);
  
  // Get surcharge tier
  const surchargeTier = getSurchargeTier(nights, season, safeConfig);
  const surchargePercent = surchargeTier?.surchargePercent ?? 0;

  // Calculate final daily price with surcharge
  const finalDailyPrice = baseDailyPrice * (1 + surchargePercent / 100);

  // Calculate totals
  const subtotal = baseDailyPrice * nights; // Base price without surcharge (internal only)
  const total = finalDailyPrice * nights; // Final price customer pays

  return {
    baseDailyPrice,
    finalDailyPrice,
    season,
    nights,
    surchargePercent, // Internal - don't show to customer
    subtotal,
    total,
  };
}

/**
 * Format price for display
 */
export function formatRentalPrice(price: number, currency: string = 'THB'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'THB' ? 'THB' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Legacy compatibility - convert old discount config to new surcharge config
export function convertLegacyConfig(legacyConfig: any): PricingConfig {
  return {
    peakSeasonMonths: legacyConfig.peakSeasonMonths || [12, 1, 2],
    peakSeasonSurcharges: (legacyConfig.peakSeasonDiscounts || []).map((d: any) => ({
      minDays: d.minDays,
      maxDays: d.maxDays,
      surchargePercent: d.discountPercent, // Was incorrectly named "discount"
    })),
    lowSeasonSurcharges: (legacyConfig.lowSeasonDiscounts || []).map((d: any) => ({
      minDays: d.minDays,
      maxDays: d.maxDays,
      surchargePercent: d.discountPercent,
    })),
    minimumStayDays: legacyConfig.minimumStayDays || 1,
    maximumStayDays: legacyConfig.maximumStayDays || 30,
  };
}

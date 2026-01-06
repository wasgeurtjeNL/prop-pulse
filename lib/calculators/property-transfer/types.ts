/**
 * Thailand Property Transfer Fee Calculator - Types
 * 
 * Comprehensive type definitions for property transfer calculations
 * V2.0 - Extended with buyer nationality, fee distribution, property types
 */

export type SellerType = 'individual' | 'company' | 'developer';
export type BuyerType = 'thai' | 'foreigner' | 'company';
export type BuyerNationality = 'thai' | 'foreigner';
export type PropertyType = 'condo' | 'house_land' | 'land_only';
export type Currency = 'THB' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CNY' | 'RUB';

/**
 * Fee distribution configuration
 * Allows custom split of fees between buyer and seller
 */
export interface FeeDistribution {
  /** Buyer percentage (0-100) */
  buyerPercent: number;
  /** Seller percentage (0-100) */
  sellerPercent: number;
}

/**
 * Preset fee split configurations
 */
export type FeeSplitPreset = 'standard' | 'buyer_pays_all' | 'seller_pays_all' | 'developer_standard' | 'custom';

export interface FeeSplitConfig {
  transferFee: FeeDistribution;
  specificBusinessTax: FeeDistribution;
  stampDuty: FeeDistribution;
  withholdingTax: FeeDistribution;
  mortgageRegistration: FeeDistribution;
}

/**
 * Standard fee split presets
 */
export const FEE_SPLIT_PRESETS: Record<Exclude<FeeSplitPreset, 'custom'>, FeeSplitConfig> = {
  // Standard Thailand practice: ALL costs split 50/50 (except mortgage which buyer always pays)
  standard: {
    transferFee: { buyerPercent: 50, sellerPercent: 50 },
    specificBusinessTax: { buyerPercent: 50, sellerPercent: 50 },
    stampDuty: { buyerPercent: 50, sellerPercent: 50 },
    withholdingTax: { buyerPercent: 50, sellerPercent: 50 },
    mortgageRegistration: { buyerPercent: 100, sellerPercent: 0 }, // Buyer's mortgage
  },
  // Buyer pays all fees
  buyer_pays_all: {
    transferFee: { buyerPercent: 100, sellerPercent: 0 },
    specificBusinessTax: { buyerPercent: 100, sellerPercent: 0 },
    stampDuty: { buyerPercent: 100, sellerPercent: 0 },
    withholdingTax: { buyerPercent: 100, sellerPercent: 0 },
    mortgageRegistration: { buyerPercent: 100, sellerPercent: 0 },
  },
  // Seller pays all fees
  seller_pays_all: {
    transferFee: { buyerPercent: 0, sellerPercent: 100 },
    specificBusinessTax: { buyerPercent: 0, sellerPercent: 100 },
    stampDuty: { buyerPercent: 0, sellerPercent: 100 },
    withholdingTax: { buyerPercent: 0, sellerPercent: 100 },
    mortgageRegistration: { buyerPercent: 0, sellerPercent: 100 },
  },
  // Developer standard (developer often pays all transfer costs, buyer pays taxes)
  developer_standard: {
    transferFee: { buyerPercent: 0, sellerPercent: 100 }, // Developer pays transfer
    specificBusinessTax: { buyerPercent: 0, sellerPercent: 100 }, // Developer's tax
    stampDuty: { buyerPercent: 0, sellerPercent: 100 },
    withholdingTax: { buyerPercent: 0, sellerPercent: 100 }, // Developer's income tax
    mortgageRegistration: { buyerPercent: 100, sellerPercent: 0 }, // Buyer's mortgage
  },
};

export interface PropertyTransferInput {
  /** Purchase/sale price in THB */
  purchasePrice: number;
  
  /** Government registered/appraised value (often lower than purchase price) */
  registeredValue: number;
  
  /** Number of years the seller has owned the property */
  yearsOwned: number;
  
  /** Type of seller */
  sellerType: SellerType;
  
  /** Type of buyer */
  buyerType: BuyerType;
  
  /** Nationality of buyer - affects FET requirements and ownership restrictions */
  buyerNationality: BuyerNationality;
  
  /** Type of property - affects ownership options for foreigners */
  propertyType: PropertyType;
  
  /** Whether it's a new construction from developer */
  isNewBuild: boolean;
  
  /** Mortgage/loan amount if applicable */
  loanAmount?: number;
  
  /** Whether to apply the government incentive (properties ≤ 7M THB) */
  applyIncentive: boolean;
  
  /** Fee split preset or custom configuration */
  feeSplitPreset: FeeSplitPreset;
  
  /** Custom fee split (only used when feeSplitPreset is 'custom') */
  customFeeSplit?: FeeSplitConfig;
}

export interface TaxBreakdownItem {
  name: string;
  nameLocal: string;
  amount: number;
  rate: string;
  description: string;
  paidBy: 'buyer' | 'seller' | 'split';
  isApplicable: boolean;
  /** Buyer's portion based on fee distribution */
  buyerAmount: number;
  /** Seller's portion based on fee distribution */
  sellerAmount: number;
  /** Fee distribution percentages used */
  distribution: FeeDistribution;
}

export interface PropertyTransferResult {
  /** Individual tax/fee breakdowns */
  breakdown: {
    transferFee: TaxBreakdownItem;
    specificBusinessTax: TaxBreakdownItem;
    stampDuty: TaxBreakdownItem;
    withholdingTax: TaxBreakdownItem;
    mortgageRegistration: TaxBreakdownItem;
  };
  
  /** Summary totals */
  totals: {
    /** Total of all fees */
    grandTotal: number;
    /** Amount paid by buyer */
    buyerPays: number;
    /** Amount paid by seller */
    sellerPays: number;
  };
  
  /** Savings if incentive is applied */
  incentiveSavings: {
    /** Whether property qualifies for incentive */
    qualifies: boolean;
    /** Total without incentive */
    totalWithoutIncentive: number;
    /** Total with incentive */
    totalWithIncentive: number;
    /** Amount saved */
    amountSaved: number;
    /** Deadline for incentive */
    incentiveDeadline: string;
  };
  
  /** Foreigner-specific information and checklist */
  foreignerInfo?: {
    /** Whether FET form is required */
    fetRequired: boolean;
    /** Ownership type available */
    ownershipType: 'freehold' | 'leasehold' | 'not_allowed';
    /** Foreign ownership quota status */
    quotaWarning: string | null;
    /** Important requirements for foreigners */
    requirements: string[];
    /** Recommended steps */
    recommendedSteps: ForeignerStep[];
  };
  
  /** Fee split configuration used */
  feeSplit: FeeSplitConfig;
  
  /** Calculation metadata */
  meta: {
    calculatedAt: Date;
    currency: Currency;
    exchangeRate?: number;
  };
}

/** Step in foreigner buying process */
export interface ForeignerStep {
  phase: 'preparation' | 'due_diligence' | 'reservation' | 'transfer' | 'registration';
  step: number;
  title: string;
  description: string;
  important: boolean;
  documents?: string[];
}

export interface WithholdingTaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface DeductionRate {
  year: number;
  rate: number;
}

export interface ExchangeRates {
  THB: number;
  USD: number;
  EUR: number;
  GBP: number;
  AUD: number;
  CNY: number;
  RUB: number;
}

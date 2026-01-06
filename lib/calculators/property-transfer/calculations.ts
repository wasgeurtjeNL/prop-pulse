/**
 * Thailand Property Transfer Fee Calculator - Calculations
 * 
 * Core calculation functions for property transfer taxes and fees
 * V2.0 - Extended with fee distribution support
 */

import {
  PropertyTransferInput,
  PropertyTransferResult,
  TaxBreakdownItem,
  Currency,
  FeeSplitConfig,
  FEE_SPLIT_PRESETS,
  FeeDistribution,
  BuyerNationality,
  PropertyType,
  ForeignerStep,
} from './types';

import {
  TRANSFER_FEE_RATE,
  TRANSFER_FEE_RATE_INCENTIVE,
  SPECIFIC_BUSINESS_TAX_RATE,
  SBT_THRESHOLD_YEARS,
  STAMP_DUTY_RATE,
  MORTGAGE_REGISTRATION_RATE,
  MORTGAGE_REGISTRATION_RATE_INCENTIVE,
  WITHHOLDING_TAX_BRACKETS,
  WITHHOLDING_TAX_COMPANY_RATE,
  DEDUCTION_RATES,
  INCENTIVE_MAX_VALUE,
  INCENTIVE_DEADLINE,
  TAX_LABELS,
} from './constants';

/**
 * Get the deduction rate based on years of ownership
 */
function getDeductionRate(yearsOwned: number): number {
  const cappedYears = Math.min(Math.max(yearsOwned, 1), 8);
  const rate = DEDUCTION_RATES.find(r => r.year === cappedYears);
  return rate ? rate.rate : 0.50; // Default to 50% for 8+ years
}

/**
 * Calculate progressive withholding tax for individuals
 */
function calculateProgressiveWithholdingTax(
  registeredValue: number,
  yearsOwned: number
): number {
  // Step 1: Get deduction rate
  const deductionRate = getDeductionRate(yearsOwned);
  
  // Step 2: Calculate assessable income per year
  const assessableIncomePerYear = (registeredValue * deductionRate) / yearsOwned;
  
  // Step 3: Calculate tax per year using progressive rates
  let taxPerYear = 0;
  let remainingIncome = assessableIncomePerYear;
  
  for (const bracket of WITHHOLDING_TAX_BRACKETS) {
    if (remainingIncome <= 0) break;
    
    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min + 1
    );
    
    if (taxableInBracket > 0) {
      taxPerYear += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
  }
  
  // Step 4: Multiply by years owned
  return Math.round(taxPerYear * yearsOwned);
}

/**
 * Calculate transfer fee
 */
function calculateTransferFee(
  registeredValue: number,
  applyIncentive: boolean,
  qualifiesForIncentive: boolean
): { amount: number; rate: number } {
  const rate = applyIncentive && qualifiesForIncentive 
    ? TRANSFER_FEE_RATE_INCENTIVE 
    : TRANSFER_FEE_RATE;
  
  return {
    amount: Math.round(registeredValue * rate),
    rate,
  };
}

/**
 * Calculate specific business tax
 */
function calculateSpecificBusinessTax(
  purchasePrice: number,
  registeredValue: number,
  yearsOwned: number
): { amount: number; isApplicable: boolean } {
  // SBT applies if owned less than 5 years
  const isApplicable = yearsOwned < SBT_THRESHOLD_YEARS;
  
  if (!isApplicable) {
    return { amount: 0, isApplicable: false };
  }
  
  // Use the higher of purchase price or registered value
  const taxBase = Math.max(purchasePrice, registeredValue);
  
  return {
    amount: Math.round(taxBase * SPECIFIC_BUSINESS_TAX_RATE),
    isApplicable: true,
  };
}

/**
 * Calculate stamp duty
 * Tax base: Higher of purchase price or registered value (same as SBT)
 */
function calculateStampDuty(
  purchasePrice: number,
  registeredValue: number,
  sbtApplies: boolean
): { amount: number; isApplicable: boolean } {
  // Stamp duty only applies if SBT does NOT apply
  if (sbtApplies) {
    return { amount: 0, isApplicable: false };
  }
  
  // Use the higher of purchase price or registered value
  const taxBase = Math.max(purchasePrice, registeredValue);
  
  return {
    amount: Math.round(taxBase * STAMP_DUTY_RATE),
    isApplicable: true,
  };
}

/**
 * Calculate withholding tax
 */
function calculateWithholdingTax(
  purchasePrice: number,
  registeredValue: number,
  yearsOwned: number,
  sellerType: 'individual' | 'company'
): number {
  if (sellerType === 'company') {
    // Companies pay flat 1% on higher of purchase price or registered value
    const taxBase = Math.max(purchasePrice, registeredValue);
    return Math.round(taxBase * WITHHOLDING_TAX_COMPANY_RATE);
  }
  
  // Individuals use progressive tax calculation
  return calculateProgressiveWithholdingTax(registeredValue, yearsOwned);
}

/**
 * Calculate mortgage registration fee
 */
function calculateMortgageRegistration(
  loanAmount: number,
  applyIncentive: boolean,
  qualifiesForIncentive: boolean
): { amount: number; rate: number } {
  if (!loanAmount || loanAmount <= 0) {
    return { amount: 0, rate: 0 };
  }
  
  const rate = applyIncentive && qualifiesForIncentive
    ? MORTGAGE_REGISTRATION_RATE_INCENTIVE
    : MORTGAGE_REGISTRATION_RATE;
  
  return {
    amount: Math.round(loanAmount * rate),
    rate,
  };
}

/**
 * Check if property qualifies for government incentive
 */
function checkIncentiveEligibility(registeredValue: number): boolean {
  return registeredValue <= INCENTIVE_MAX_VALUE;
}

/**
 * Get fee split config based on input
 */
function getFeeSplitConfig(input: PropertyTransferInput): FeeSplitConfig {
  if (input.feeSplitPreset === 'custom' && input.customFeeSplit) {
    return input.customFeeSplit;
  }
  return FEE_SPLIT_PRESETS[input.feeSplitPreset === 'custom' ? 'standard' : input.feeSplitPreset];
}

/**
 * Calculate buyer and seller amounts based on distribution
 */
function applyDistribution(
  amount: number,
  distribution: FeeDistribution
): { buyerAmount: number; sellerAmount: number } {
  return {
    buyerAmount: Math.round(amount * (distribution.buyerPercent / 100)),
    sellerAmount: Math.round(amount * (distribution.sellerPercent / 100)),
  };
}

/**
 * Get paidBy label based on distribution
 */
function getPaidByLabel(distribution: FeeDistribution): 'buyer' | 'seller' | 'split' {
  if (distribution.buyerPercent === 100) return 'buyer';
  if (distribution.sellerPercent === 100) return 'seller';
  return 'split';
}

/**
 * Get foreigner-specific information
 */
function getForeignerInfo(
  buyerNationality: BuyerNationality,
  propertyType: PropertyType
): PropertyTransferResult['foreignerInfo'] {
  if (buyerNationality !== 'foreigner') {
    return undefined;
  }
  
  let ownershipType: 'freehold' | 'leasehold' | 'not_allowed';
  let quotaWarning: string | null = null;
  
  switch (propertyType) {
    case 'condo':
      ownershipType = 'freehold';
      quotaWarning = 'Verify foreign ownership quota (max 49%) has not been exceeded';
      break;
    case 'house_land':
      ownershipType = 'leasehold';
      break;
    case 'land_only':
      ownershipType = 'not_allowed';
      break;
  }
  
  const requirements = [
    'Foreign Exchange Transaction (FET) form required',
    'Funds must be transferred from abroad',
    'Bank account in Thailand required',
    'Original passport required at Land Office',
  ];
  
  if (propertyType === 'condo') {
    requirements.push('Verify condo foreign ownership quota (49%)');
  }
  
  return {
    fetRequired: true,
    ownershipType,
    quotaWarning,
    requirements,
    recommendedSteps: [], // Will be populated by the component
  };
}

/**
 * Main calculation function
 */
export function calculatePropertyTransferFees(
  input: PropertyTransferInput,
  currency: Currency = 'THB'
): PropertyTransferResult {
  const {
    purchasePrice,
    registeredValue,
    yearsOwned,
    sellerType,
    buyerNationality = 'foreigner',
    propertyType = 'condo',
    applyIncentive,
    loanAmount = 0,
  } = input;
  
  // Get fee split configuration
  const feeSplit = getFeeSplitConfig(input);
  
  // Check incentive eligibility
  const qualifiesForIncentive = checkIncentiveEligibility(registeredValue);
  const effectiveApplyIncentive = applyIncentive && qualifiesForIncentive;
  
  // Calculate each tax/fee
  const transferFee = calculateTransferFee(registeredValue, applyIncentive, qualifiesForIncentive);
  const sbt = calculateSpecificBusinessTax(purchasePrice, registeredValue, yearsOwned);
  const stampDuty = calculateStampDuty(purchasePrice, registeredValue, sbt.isApplicable);
  const withholdingTax = calculateWithholdingTax(purchasePrice, registeredValue, yearsOwned, sellerType === 'developer' ? 'company' : sellerType);
  const mortgageReg = calculateMortgageRegistration(loanAmount, applyIncentive, qualifiesForIncentive);
  
  // Calculate totals without incentive for comparison
  const transferFeeNoIncentive = calculateTransferFee(registeredValue, false, false);
  const mortgageRegNoIncentive = calculateMortgageRegistration(loanAmount, false, false);
  
  // Apply fee distributions
  const transferFeeDist = applyDistribution(transferFee.amount, feeSplit.transferFee);
  const sbtDist = applyDistribution(sbt.amount, feeSplit.specificBusinessTax);
  const stampDutyDist = applyDistribution(stampDuty.amount, feeSplit.stampDuty);
  const withholdingTaxDist = applyDistribution(withholdingTax, feeSplit.withholdingTax);
  const mortgageRegDist = applyDistribution(mortgageReg.amount, feeSplit.mortgageRegistration);
  
  // Build breakdown with distribution info
  const breakdown: PropertyTransferResult['breakdown'] = {
    transferFee: {
      name: TAX_LABELS.transferFee.en,
      nameLocal: TAX_LABELS.transferFee.th,
      amount: transferFee.amount,
      rate: effectiveApplyIncentive ? '0.01%' : '2%',
      description: 'Paid at the Land Department when transferring ownership',
      paidBy: getPaidByLabel(feeSplit.transferFee),
      isApplicable: true,
      buyerAmount: transferFeeDist.buyerAmount,
      sellerAmount: transferFeeDist.sellerAmount,
      distribution: feeSplit.transferFee,
    },
    specificBusinessTax: {
      name: TAX_LABELS.specificBusinessTax.en,
      nameLocal: TAX_LABELS.specificBusinessTax.th,
      amount: sbt.amount,
      rate: sbt.isApplicable ? '3.3%' : 'N/A',
      description: 'Applies if seller owned property for less than 5 years',
      paidBy: getPaidByLabel(feeSplit.specificBusinessTax),
      isApplicable: sbt.isApplicable,
      buyerAmount: sbtDist.buyerAmount,
      sellerAmount: sbtDist.sellerAmount,
      distribution: feeSplit.specificBusinessTax,
    },
    stampDuty: {
      name: TAX_LABELS.stampDuty.en,
      nameLocal: TAX_LABELS.stampDuty.th,
      amount: stampDuty.amount,
      rate: stampDuty.isApplicable ? '0.5%' : 'N/A',
      description: 'Applies only if Specific Business Tax does not apply',
      paidBy: getPaidByLabel(feeSplit.stampDuty),
      isApplicable: stampDuty.isApplicable,
      buyerAmount: stampDutyDist.buyerAmount,
      sellerAmount: stampDutyDist.sellerAmount,
      distribution: feeSplit.stampDuty,
    },
    withholdingTax: {
      name: TAX_LABELS.withholdingTax.en,
      nameLocal: TAX_LABELS.withholdingTax.th,
      amount: withholdingTax,
      rate: sellerType === 'company' || sellerType === 'developer' ? '1%' : 'Progressive (5-35%)',
      description: sellerType === 'company' || sellerType === 'developer'
        ? 'Flat 1% rate for company sellers'
        : 'Progressive rate based on assessable income',
      paidBy: getPaidByLabel(feeSplit.withholdingTax),
      isApplicable: true,
      buyerAmount: withholdingTaxDist.buyerAmount,
      sellerAmount: withholdingTaxDist.sellerAmount,
      distribution: feeSplit.withholdingTax,
    },
    mortgageRegistration: {
      name: TAX_LABELS.mortgageRegistration.en,
      nameLocal: TAX_LABELS.mortgageRegistration.th,
      amount: mortgageReg.amount,
      rate: loanAmount > 0 ? (effectiveApplyIncentive ? '0.01%' : '1%') : 'N/A',
      description: 'Fee for registering a mortgage with the Land Department',
      paidBy: getPaidByLabel(feeSplit.mortgageRegistration),
      isApplicable: loanAmount > 0,
      buyerAmount: mortgageRegDist.buyerAmount,
      sellerAmount: mortgageRegDist.sellerAmount,
      distribution: feeSplit.mortgageRegistration,
    },
  };
  
  // Calculate totals
  const grandTotal = 
    transferFee.amount + 
    sbt.amount + 
    stampDuty.amount + 
    withholdingTax + 
    mortgageReg.amount;
  
  // Calculate buyer/seller totals based on distribution
  const buyerPays = 
    transferFeeDist.buyerAmount + 
    sbtDist.buyerAmount + 
    stampDutyDist.buyerAmount + 
    withholdingTaxDist.buyerAmount + 
    mortgageRegDist.buyerAmount;
  
  const sellerPays = 
    transferFeeDist.sellerAmount + 
    sbtDist.sellerAmount + 
    stampDutyDist.sellerAmount + 
    withholdingTaxDist.sellerAmount + 
    mortgageRegDist.sellerAmount;
  
  // Calculate incentive savings
  const totalWithoutIncentive = 
    transferFeeNoIncentive.amount + 
    sbt.amount + 
    stampDuty.amount + 
    withholdingTax + 
    mortgageRegNoIncentive.amount;
  
  const amountSaved = totalWithoutIncentive - grandTotal;
  
  return {
    breakdown,
    totals: {
      grandTotal,
      buyerPays,
      sellerPays,
    },
    incentiveSavings: {
      qualifies: qualifiesForIncentive,
      totalWithoutIncentive,
      totalWithIncentive: grandTotal,
      amountSaved: effectiveApplyIncentive ? amountSaved : 0,
      incentiveDeadline: INCENTIVE_DEADLINE,
    },
    foreignerInfo: getForeignerInfo(buyerNationality, propertyType),
    feeSplit,
    meta: {
      calculatedAt: new Date(),
      currency,
    },
  };
}

/**
 * Format currency with proper symbol and separators
 */
export function formatCurrency(
  amount: number, 
  currency: Currency = 'THB',
  showDecimals: boolean = false
): string {
  const symbols: Record<Currency, string> = {
    THB: '฿',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CNY: '¥',
    RUB: '₽',
  };
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
  
  return `${symbols[currency]}${formatted}`;
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: Record<Currency, number>
): number {
  // Convert to THB first (base currency)
  const amountInTHB = fromCurrency === 'THB' 
    ? amount 
    : amount / rates[fromCurrency];
  
  // Convert from THB to target currency
  return toCurrency === 'THB'
    ? amountInTHB
    : amountInTHB * rates[toCurrency];
}

/**
 * Generate shareable URL with calculator parameters
 */
export function generateShareableURL(
  input: PropertyTransferInput,
  baseURL: string = 'https://www.psmphuket.com/tools/property-transfer-calculator'
): string {
  const params = new URLSearchParams({
    price: input.purchasePrice.toString(),
    registered: input.registeredValue.toString(),
    years: input.yearsOwned.toString(),
    seller: input.sellerType,
    buyer: input.buyerType,
    nationality: input.buyerNationality,
    property: input.propertyType,
    newbuild: input.isNewBuild ? '1' : '0',
    loan: (input.loanAmount || 0).toString(),
    incentive: input.applyIncentive ? '1' : '0',
    split: input.feeSplitPreset,
  });
  
  return `${baseURL}?${params.toString()}`;
}

/**
 * Parse URL parameters to calculator input
 */
export function parseURLParams(searchParams: URLSearchParams): Partial<PropertyTransferInput> {
  return {
    purchasePrice: parseInt(searchParams.get('price') || '0', 10),
    registeredValue: parseInt(searchParams.get('registered') || '0', 10),
    yearsOwned: parseInt(searchParams.get('years') || '1', 10),
    sellerType: (searchParams.get('seller') as 'individual' | 'company' | 'developer') || 'individual',
    buyerType: (searchParams.get('buyer') as 'thai' | 'foreigner' | 'company') || 'foreigner',
    buyerNationality: (searchParams.get('nationality') as 'thai' | 'foreigner') || 'foreigner',
    propertyType: (searchParams.get('property') as 'condo' | 'house_land' | 'land_only') || 'condo',
    isNewBuild: searchParams.get('newbuild') === '1',
    loanAmount: parseInt(searchParams.get('loan') || '0', 10),
    applyIncentive: searchParams.get('incentive') !== '0',
    feeSplitPreset: (searchParams.get('split') as 'standard' | 'buyer_pays_all' | 'seller_pays_all' | 'developer_standard' | 'custom') || 'standard',
  };
}

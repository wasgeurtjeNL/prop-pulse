/**
 * Thailand Property Transfer Fee Calculator - Constants
 * 
 * Official tax rates and incentive information
 * Last updated: January 2025
 */

import { WithholdingTaxBracket, DeductionRate } from './types';

// ============================================
// TRANSFER FEE
// ============================================

/** Standard transfer fee rate */
export const TRANSFER_FEE_RATE = 0.02; // 2%

/** Reduced transfer fee rate (government incentive) */
export const TRANSFER_FEE_RATE_INCENTIVE = 0.0001; // 0.01%

// ============================================
// SPECIFIC BUSINESS TAX (SBT)
// ============================================

/** Specific Business Tax rate (applies if owned < 5 years) */
export const SPECIFIC_BUSINESS_TAX_RATE = 0.033; // 3.3%

/** Years of ownership threshold for SBT */
export const SBT_THRESHOLD_YEARS = 5;

// ============================================
// STAMP DUTY
// ============================================

/** Stamp duty rate (applies if SBT does not apply) */
export const STAMP_DUTY_RATE = 0.005; // 0.5%

// ============================================
// MORTGAGE REGISTRATION
// ============================================

/** Standard mortgage registration fee rate */
export const MORTGAGE_REGISTRATION_RATE = 0.01; // 1%

/** Reduced mortgage registration rate (government incentive) */
export const MORTGAGE_REGISTRATION_RATE_INCENTIVE = 0.0001; // 0.01%

// ============================================
// WITHHOLDING TAX - PROGRESSIVE RATES (Individuals)
// ============================================

/** Progressive withholding tax brackets for individuals */
export const WITHHOLDING_TAX_BRACKETS: WithholdingTaxBracket[] = [
  { min: 0, max: 300000, rate: 0.05 },         // 5%
  { min: 300001, max: 500000, rate: 0.10 },    // 10%
  { min: 500001, max: 750000, rate: 0.15 },    // 15%
  { min: 750001, max: 1000000, rate: 0.20 },   // 20%
  { min: 1000001, max: 2000000, rate: 0.25 },  // 25%
  { min: 2000001, max: 5000000, rate: 0.30 },  // 30%
  { min: 5000001, max: Infinity, rate: 0.35 }, // 35%
];

/** Withholding tax rate for companies */
export const WITHHOLDING_TAX_COMPANY_RATE = 0.01; // 1%

// ============================================
// DEDUCTION RATES FOR WITHHOLDING TAX
// ============================================

/** 
 * Deduction rates based on years of ownership
 * Used to calculate the taxable base for withholding tax
 */
export const DEDUCTION_RATES: DeductionRate[] = [
  { year: 1, rate: 0.92 },  // 92% deduction
  { year: 2, rate: 0.84 },  // 84%
  { year: 3, rate: 0.77 },  // 77%
  { year: 4, rate: 0.71 },  // 71%
  { year: 5, rate: 0.65 },  // 65%
  { year: 6, rate: 0.60 },  // 60%
  { year: 7, rate: 0.55 },  // 55%
  { year: 8, rate: 0.50 },  // 50% (and beyond)
];

// ============================================
// GOVERNMENT INCENTIVE
// ============================================

/** Maximum property value eligible for incentive (in THB) */
export const INCENTIVE_MAX_VALUE = 7000000; // ฿7,000,000

/** Incentive program deadline */
export const INCENTIVE_DEADLINE = '2026-06-30';

/** Incentive program start date (current extension) */
export const INCENTIVE_START_DATE = '2024-04-01';

// ============================================
// DEFAULT EXCHANGE RATES (fallback)
// ============================================

export const DEFAULT_EXCHANGE_RATES = {
  THB: 1,
  USD: 0.029,    // ~34.5 THB per USD
  EUR: 0.027,    // ~37 THB per EUR
  GBP: 0.023,    // ~43.5 THB per GBP
  AUD: 0.044,    // ~22.7 THB per AUD
  CNY: 0.21,     // ~4.8 THB per CNY
  RUB: 2.6,      // ~0.38 THB per RUB
};

// ============================================
// CURRENCY FORMATTING
// ============================================

export const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CNY: '¥',
  RUB: '₽',
};

export const CURRENCY_NAMES: Record<string, string> = {
  THB: 'Thai Baht',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  RUB: 'Russian Ruble',
};

// ============================================
// UI LABELS (English)
// ============================================

export const TAX_LABELS = {
  transferFee: {
    en: 'Transfer Fee',
    th: 'ค่าธรรมเนียมการโอน',
  },
  specificBusinessTax: {
    en: 'Specific Business Tax',
    th: 'ภาษีธุรกิจเฉพาะ',
  },
  stampDuty: {
    en: 'Stamp Duty',
    th: 'อากรแสตมป์',
  },
  withholdingTax: {
    en: 'Withholding Tax',
    th: 'ภาษีเงินได้หัก ณ ที่จ่าย',
  },
  mortgageRegistration: {
    en: 'Mortgage Registration Fee',
    th: 'ค่าจดจำนอง',
  },
};

// ============================================
// OFFICIAL SOURCES
// ============================================

export interface OfficialSource {
  name: string;
  nameLocal: string;
  url: string;
  description: string;
}

export const OFFICIAL_SOURCES: Record<string, OfficialSource> = {
  transferFee: {
    name: 'Department of Lands',
    nameLocal: 'กรมที่ดิน',
    url: 'https://www.dol.go.th/Pages/default.aspx',
    description: 'Standard 2% transfer fee for property registration',
  },
  specificBusinessTax: {
    name: 'Revenue Department',
    nameLocal: 'กรมสรรพากร',
    url: 'https://www.rd.go.th/english/6043.html',
    description: '3.3% SBT applies when selling within 5 years of acquisition',
  },
  stampDuty: {
    name: 'Revenue Department',
    nameLocal: 'กรมสรรพากร',
    url: 'https://www.rd.go.th/english/6045.html',
    description: '0.5% stamp duty when SBT is not applicable',
  },
  withholdingTax: {
    name: 'Revenue Code Section 50',
    nameLocal: 'ประมวลรัษฎากร มาตรา 50',
    url: 'https://www.rd.go.th/english/23244.html',
    description: 'Progressive rates for individuals, 1% for companies',
  },
  mortgageRegistration: {
    name: 'Department of Lands',
    nameLocal: 'กรมที่ดิน',
    url: 'https://www.dol.go.th/Pages/default.aspx',
    description: '1% mortgage registration fee',
  },
  governmentIncentive: {
    name: 'Cabinet Resolution',
    nameLocal: 'มติคณะรัฐมนตรี',
    url: 'https://www.soc.go.th/',
    description: '0.01% reduced rate for properties ≤ ฿7M until June 2026',
  },
};

/**
 * Get official source for a tax type
 */
export function getOfficialSource(taxType: string): OfficialSource | null {
  const sourceMap: Record<string, string> = {
    'Transfer Fee': 'transferFee',
    'Specific Business Tax': 'specificBusinessTax',
    'Specific Business Tax (SBT)': 'specificBusinessTax',
    'Stamp Duty': 'stampDuty',
    'Withholding Tax': 'withholdingTax',
    'Mortgage Registration': 'mortgageRegistration',
    'Mortgage Registration Fee': 'mortgageRegistration',
  };
  
  const key = sourceMap[taxType];
  return key ? OFFICIAL_SOURCES[key] : null;
}

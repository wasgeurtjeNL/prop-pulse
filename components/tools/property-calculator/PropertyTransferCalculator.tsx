"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  PropertyTransferInput,
  PropertyTransferResult,
  Currency,
  BuyerNationality,
  PropertyType,
  FeeSplitPreset,
  FeeSplitConfig,
  calculatePropertyTransferFees,
  formatCurrency,
  generateShareableURL,
  parseURLParams,
  CURRENCY_SYMBOLS,
  Language,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  getTranslations,
  getPayerLabel,
  getTaxTypeName,
  getTaxTypeDescription,
  TranslationStrings,
  getOfficialSource,
  OFFICIAL_SOURCES,
} from "@/lib/calculators/property-transfer";
import { EmbedCodeGenerator } from "./EmbedCodeGenerator";
import { PrintableReport } from "./PrintableReport";
import { BestTimeToBuy } from "./BestTimeToBuy";
import { BuyersGuide } from "./BuyersGuide";
import { FeeSplitSelector } from "./FeeSplitSelector";
import { useCurrencyRates } from "@/hooks/use-currency-rates";
import { usePageTracking } from "@/hooks/use-page-tracking";

// ============================================
// COMPONENT: Language Selector
// ============================================

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
}

function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const languages: Language[] = ['en', 'nl', 'it', 'de', 'ru', 'fr', 'zh'];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-lg">{LANGUAGE_FLAGS[value]}</span>
        <span className="text-sm font-medium">{LANGUAGE_NAMES[value]}</span>
        <Icon icon="solar:alt-arrow-down-linear" className="w-4 h-4 text-gray-500" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onChange(lang);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    value === lang && "bg-primary/10 text-primary"
                  )}
                >
                  <span className="text-lg">{LANGUAGE_FLAGS[lang]}</span>
                  <span className="font-medium">{LANGUAGE_NAMES[lang]}</span>
                  {value === lang && (
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 ml-auto text-primary" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COMPONENT: Source Info Tooltip (Popover)
// ============================================

interface SourceInfoTooltipProps {
  taxType: string;
  t: TranslationStrings;
}

function SourceInfoTooltip({ taxType, t }: SourceInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const source = getOfficialSource(taxType);
  
  if (!source) return null;
  
  // Get translated source text based on tax type
  const getSourceText = () => {
    const sourceMap: Record<string, keyof TranslationStrings> = {
      'Transfer Fee': 'transferFeeSource',
      'Specific Business Tax': 'sbtSource',
      'Specific Business Tax (SBT)': 'sbtSource',
      'Stamp Duty': 'stampDutySource',
      'Withholding Tax': 'withholdingTaxSource',
      'Mortgage Registration': 'mortgageSource',
      'Mortgage Registration Fee': 'mortgageSource',
    };
    const key = sourceMap[taxType];
    return key && t[key] ? (t[key] as string) : source.description;
  };
  
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-1.5 p-0.5 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
        aria-label="View source"
      >
        <Icon icon="solar:info-circle-linear" className="w-4 h-4" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 top-full mt-2 w-72 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {/* Source Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon icon="solar:verified-check-bold" className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {source.name}
                </div>
                <div className="text-xs text-gray-500">
                  {source.nameLocal}
                </div>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {getSourceText()}
            </p>
            
            {/* Link to source */}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Icon icon="solar:link-round-bold" className="w-3.5 h-3.5" />
              {t.viewOfficialSource || 'View official source'}
              <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COMPONENT: Trust Badge
// ============================================

interface TrustBadgeProps {
  t: TranslationStrings;
  lastUpdated?: string;
}

function TrustBadge({ t, lastUpdated = 'January 2025' }: TrustBadgeProps) {
  const [showSources, setShowSources] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowSources(!showSources)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:border-green-300 dark:hover:border-green-700 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
            <Icon icon="solar:verified-check-bold" className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-green-800 dark:text-green-300">
              {t.verifiedByOfficialSources || 'Verified by Official Thai Government Sources'}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {t.lastVerified || 'Last verified'}: {lastUpdated}
            </div>
          </div>
        </div>
        <Icon 
          icon={showSources ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} 
          className="w-5 h-5 text-green-600 group-hover:text-green-700 transition-colors" 
        />
      </button>
      
      <AnimatePresence>
        {showSources && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Icon icon="solar:documents-bold" className="w-4 h-4 text-primary" />
                {t.officialSources || 'Official Sources'}
              </h4>
              
              <div className="space-y-3">
                {Object.entries(OFFICIAL_SOURCES).map(([key, source]) => (
                  <a
                    key={key}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <Icon icon="solar:link-round-bold" className="w-4 h-4 text-gray-400 group-hover:text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary">
                        {source.name}
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          ({source.nameLocal})
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {source.description}
                      </div>
                    </div>
                    <Icon icon="solar:arrow-right-up-linear" className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                  </a>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <a
                  href="/docs/property-transfer-calculator"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Icon icon="solar:document-text-bold" className="w-4 h-4" />
                  {t.viewFullDocumentation || 'View Full Documentation'}
                  <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COMPONENT: Currency Selector with Exchange Rate Display
// ============================================

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  exchangeRates?: { currency: string; rate: number; displayRate: string }[];
  isLoadingRates?: boolean;
  t: TranslationStrings;
}

function CurrencySelector({ value, onChange, exchangeRates, isLoadingRates, t }: CurrencySelectorProps) {
  const currencies: Currency[] = ['THB', 'USD', 'EUR', 'GBP', 'AUD'];
  
  // Get rate display for current currency
  const currentRate = exchangeRates?.find(r => r.currency === value);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {currencies.map((currency) => (
          <button
            key={currency}
            onClick={() => onChange(currency)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              value === currency
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {CURRENCY_SYMBOLS[currency]} {currency}
          </button>
        ))}
      </div>
      
      {/* Exchange Rate Display */}
      {value !== 'THB' && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Icon icon="mdi:currency-exchange" className="w-3.5 h-3.5" />
          {isLoadingRates ? (
            <span className="animate-pulse">{t.loadingRate}</span>
          ) : currentRate ? (
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {currentRate.displayRate}
              </span>
              <span className="ml-1 text-gray-400">({t.liveRate})</span>
            </span>
          ) : (
            <span>{t.rateUnavailable}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENT: Number Input with Formatting
// ============================================

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  currency?: Currency;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  icon?: string;
  error?: string;
  /** Selected display currency (for showing converted value) */
  displayCurrency?: Currency;
  /** Function to convert and format THB to display currency */
  convertToDisplay?: (amountInTHB: number) => string;
}

function NumberInput({
  label,
  value,
  onChange,
  currency = 'THB',
  min = 0,
  max = 999999999999, // Allow up to 999 billion
  step = 100000,
  helpText,
  icon,
  error,
  displayCurrency,
  convertToDisplay,
}: NumberInputProps) {
  // Format number with thousand separators (always use commas for consistency)
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  const [inputValue, setInputValue] = useState(formatNumber(value));
  
  useEffect(() => {
    setInputValue(formatNumber(value));
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const raw = e.target.value.replace(/[^\d]/g, '');
    
    if (raw === '') {
      setInputValue('');
      onChange(0);
      return;
    }
    
    const num = parseInt(raw, 10);
    
    if (!isNaN(num) && num <= max) {
      setInputValue(formatNumber(num));
      onChange(Math.min(Math.max(num, min), max));
    }
  };
  
  // Show converted value if a different display currency is selected
  const showConversion = displayCurrency && displayCurrency !== 'THB' && convertToDisplay && value > 0;
  
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {icon && <Icon icon={icon} className="w-4 h-4 text-primary" />}
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          {CURRENCY_SYMBOLS[currency]}
        </span>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          className={cn(
            "w-full pl-8 pr-4 py-3 rounded-xl border-2 transition-all",
            "bg-white dark:bg-gray-800",
            error 
              ? "border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20",
            "text-lg font-semibold text-gray-900 dark:text-white"
          )}
        />
        {/* Converted value badge - inside input on right */}
        {showConversion && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            ≈ {convertToDisplay(value)}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <Icon icon="solar:danger-triangle-linear" className="w-3.5 h-3.5" />
          {error}
        </p>
      ) : helpText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      ) : null}
      
      {/* Quick amount buttons */}
      <div className="flex flex-wrap gap-1.5">
        {[1000000, 3000000, 5000000, 7000000, 10000000].map((amount) => (
          <button
            key={amount}
            onClick={() => onChange(amount)}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition-all",
              value === amount
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {(amount / 1000000).toFixed(0)}M
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: Slider Input
// ============================================

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  helpText?: string;
  icon?: string;
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  helpText,
  icon,
}: SliderInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {icon && <Icon icon={icon} className="w-4 h-4 text-primary" />}
          {label}
        </label>
        <span className="text-lg font-bold text-primary">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min} {unit}</span>
        <span>{max}+ {unit}</span>
      </div>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}

// ============================================
// COMPONENT: Toggle Group
// ============================================

interface ToggleOption {
  value: string;
  label: string;
  icon?: string;
}

interface ToggleGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ToggleOption[];
  helpText?: string;
}

function ToggleGroup({ label, value, onChange, options, helpText }: ToggleGroupProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
              value === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            )}
          >
            {option.icon && <Icon icon={option.icon} className="w-5 h-5" />}
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}

// ============================================
// COMPONENT: Tax Breakdown Card
// ============================================

interface TaxBreakdownCardProps {
  name: string;
  amount: number;
  rate: string;
  description: string;
  paidBy: string;
  isApplicable: boolean;
  maxAmount: number;
  t: TranslationStrings;
  displayAmount: (amount: number) => string;
}

function TaxBreakdownCard({
  name,
  amount,
  rate,
  description,
  paidBy,
  isApplicable,
  maxAmount,
  t,
  displayAmount,
}: TaxBreakdownCardProps) {
  const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  const paidByLabel = getPayerLabel(paidBy, t);
  
  // Translate the tax name and description
  const translatedName = getTaxTypeName(name, t);
  const translatedDescription = getTaxTypeDescription(name, t) || description;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border transition-all",
        isApplicable
          ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h4 className="font-semibold text-gray-900 dark:text-white">{translatedName}</h4>
            <SourceInfoTooltip taxType={name} t={t} />
          </div>
          <p className="text-xs text-gray-500">{translatedDescription}</p>
        </div>
        <span className={cn(
          "px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-2",
          paidBy === 'buyer' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          paidBy === 'seller' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
          paidBy === 'split' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        )}>
          {paidByLabel}
        </span>
      </div>
      
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {isApplicable ? displayAmount(amount) : '—'}
        </span>
        <span className="text-sm text-gray-500">
          {rate}
        </span>
      </div>
      
      {isApplicable && (
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// COMPONENT: Incentive Badge
// ============================================

interface IncentiveBadgeProps {
  qualifies: boolean;
  amountSaved: number;
  deadline: string;
  regularRate: number;
  discountedRate: number;
  maxPropertyValue: number;
  t: TranslationStrings;
  displayAmount: (amount: number) => string;
}

function IncentiveBadge({ 
  qualifies, 
  amountSaved, 
  deadline, 
  regularRate,
  discountedRate,
  maxPropertyValue,
  t, 
  displayAmount 
}: IncentiveBadgeProps) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formattedDeadline = deadlineDate.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  if (!qualifies) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <div className="flex gap-3">
          <Icon icon="solar:info-circle-linear" className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{t.notApplicable}</strong> - {t.incentiveDescription}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t.incentiveRequirement || `Only for properties ≤ ฿${(maxPropertyValue/1000000).toFixed(0)}M`}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon icon="solar:gift-bold" className="w-6 h-6" />
            <span className="font-semibold">{t.governmentIncentive}</span>
          </div>
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
            {regularRate}% → {discountedRate}%
          </span>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-green-200 mb-1">{t.youSave || 'You save'}:</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {displayAmount(amountSaved)}
            </span>
            <span className="text-green-200">{t.onTransferFee || 'on transfer fee'}</span>
          </div>
        </div>
        
        {/* Explanation */}
        <div className="p-3 bg-white/10 rounded-lg mb-3">
          <p className="text-sm text-green-100">
            {t.incentiveExplanation || `Transfer fee reduced from ${regularRate}% to ${discountedRate}% for properties valued ≤ ฿${(maxPropertyValue/1000000).toFixed(0)} million.`}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-green-100">
            <Icon icon="solar:clock-circle-linear" className="w-4 h-4" />
            <span>
              {daysRemaining > 0 
                ? `${daysRemaining} ${t.daysRemaining}`
                : t.incentiveExpired
              }
            </span>
          </div>
          <span className="text-green-200 text-xs">
            {t.validUntil || 'Valid until'}: {formattedDeadline}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// COMPONENT: Results Summary
// ============================================

interface ResultsSummaryProps {
  result: PropertyTransferResult;
  t: TranslationStrings;
  displayAmount: (amount: number) => string;
  purchasePrice: number;
}

function ResultsSummary({ result, t, displayAmount, purchasePrice }: ResultsSummaryProps) {
  // Calculate buyer costs as percentage of purchase price
  const buyerPercentage = purchasePrice > 0 
    ? ((result.totals.buyerPays / purchasePrice) * 100).toFixed(2)
    : '0.00';
  
  return (
    <div className="space-y-4">
      {/* Trust Badge - Verified Sources */}
      <TrustBadge t={t} lastUpdated="January 2025" />
      
      {/* YOUR TOTAL - Prominent buyer-focused summary */}
      <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white">
        <div className="flex items-center gap-2 text-sm text-blue-200 mb-2">
          <Icon icon="solar:user-bold" className="w-5 h-5" />
          <span className="font-medium uppercase tracking-wide">{t.whatYouPay || 'What You Pay (Buyer)'}</span>
        </div>
        <div className="text-5xl font-bold mb-2">
          {displayAmount(result.totals.buyerPays)}
        </div>
        <div className="text-blue-200 text-sm">
          = {buyerPercentage}% {t.ofPurchasePrice || 'of purchase price'}
        </div>
        
        {/* Quick breakdown for buyer */}
        <div className="mt-4 pt-4 border-t border-blue-500/50">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {result.breakdown.transferFee.isApplicable && result.breakdown.transferFee.buyerAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-blue-200">{t.transferFee || 'Transfer Fee'}:</span>
                <span className="font-medium">{displayAmount(result.breakdown.transferFee.buyerAmount)}</span>
              </div>
            )}
            {result.breakdown.mortgageRegistration.isApplicable && result.breakdown.mortgageRegistration.amount > 0 && (
              <div className="flex justify-between">
                <span className="text-blue-200">{t.mortgageRegistration || 'Mortgage Fee'}:</span>
                <span className="font-medium">{displayAmount(result.breakdown.mortgageRegistration.amount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Total costs overview */}
      <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl text-white">
        <div className="text-sm text-gray-400 mb-1">{t.totalTransferCosts}</div>
        <div className="text-3xl font-bold mb-4">
          {displayAmount(result.totals.grandTotal)}
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 text-sm text-blue-400 mb-1">
              <Icon icon="solar:user-linear" className="w-4 h-4" />
              {t.buyerPays}
            </div>
            <div className="text-xl font-semibold">
              {displayAmount(result.totals.buyerPays)}
            </div>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-2 text-sm text-orange-400 mb-1">
              <Icon icon="solar:users-group-rounded-linear" className="w-4 h-4" />
              {t.sellerPays}
            </div>
            <div className="text-xl font-semibold">
              {displayAmount(result.totals.sellerPays)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Incentive savings */}
      <IncentiveBadge
        qualifies={result.incentiveSavings.qualifies}
        amountSaved={result.incentiveSavings.amountSaved}
        deadline={result.incentiveSavings.incentiveDeadline}
        regularRate={2}
        discountedRate={0.01}
        maxPropertyValue={7000000}
        t={t}
        displayAmount={displayAmount}
      />
    </div>
  );
}

// ============================================
// COMPONENT: Share Modal
// ============================================

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareURL: string;
  result: PropertyTransferResult;
  t: TranslationStrings;
  displayAmount: (amount: number) => string;
}

function ShareModal({ isOpen, onClose, shareURL, result, t, displayAmount }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareText = `${t.title} - ${t.totalTransferCosts}: ${displayAmount(result.totals.grandTotal)}`;
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.shareResults}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
            </button>
          </div>
          
          {/* Copy URL */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              {t.copyLink}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareURL}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm truncate"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                {copied ? t.copied : t.copyLink}
              </button>
            </div>
          </div>
          
          {/* Social share buttons */}
          <div className="grid grid-cols-4 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareURL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <Icon icon="logos:whatsapp-icon" className="w-6 h-6" />
              <span className="text-xs">WhatsApp</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareURL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Icon icon="logos:facebook" className="w-6 h-6" />
              <span className="text-xs">Facebook</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareURL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
            >
              <Icon icon="logos:twitter" className="w-6 h-6" />
              <span className="text-xs">Twitter</span>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(t.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareURL)}`}
              className="flex flex-col items-center gap-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Icon icon="solar:letter-linear" className="w-6 h-6" />
              <span className="text-xs">Email</span>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// COMPONENT: Foreigner Guide Section (Collapsible)
// ============================================

function ForeignerGuideSection({ t }: { t: TranslationStrings }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <Icon icon="solar:passport-bold" className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t.foreignerGuide}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.importantForForeigners}
            </p>
          </div>
        </div>
        <Icon 
          icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} 
          className="w-5 h-5 text-gray-400" 
        />
      </button>
      
      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
              <BuyersGuide 
                buyerNationality="foreigner"
                propertyType="condo"
                t={t}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PropertyTransferCalculator() {
  // Track page view
  usePageTracking({
    pageTitle: "Property Transfer Fee Calculator",
    pageType: "tool",
  });

  // State
  const [currency, setCurrency] = useState<Currency>('THB');
  const [language, setLanguage] = useState<Language>('en');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Get translations
  const t = useMemo(() => getTranslations(language), [language]);
  
  // Fetch live currency rates
  const { rates, isLoading: isLoadingRates, lastUpdated: ratesLastUpdated, isFallback, refetch: refetchRates, getRate } = useCurrencyRates();
  
  // Convert THB amount to selected currency and format
  const displayAmount = useCallback((amountInTHB: number): string => {
    if (currency === 'THB') {
      return formatCurrency(amountInTHB, 'THB');
    }
    const rate = getRate(currency);
    if (!rate || rate === 0) {
      return formatCurrency(amountInTHB, 'THB'); // Fallback to THB if no rate
    }
    const convertedAmount = amountInTHB * rate;
    return formatCurrency(convertedAmount, currency);
  }, [currency, getRate]);
  
  const [input, setInput] = useState<PropertyTransferInput>({
    purchasePrice: 5000000,
    registeredValue: 4500000,
    yearsOwned: 3,
    sellerType: 'individual',
    buyerType: 'foreigner',
    buyerNationality: 'foreigner',
    propertyType: 'condo',
    isNewBuild: false,
    loanAmount: 0,
    applyIncentive: true,
    feeSplitPreset: 'standard',
  });
  
  // Custom fee split config (only used when preset is 'custom')
  const [customFeeSplit, setCustomFeeSplit] = useState<FeeSplitConfig | undefined>(undefined);
  
  // Calculate results
  const result = useMemo(() => {
    const inputWithCustomSplit = {
      ...input,
      customFeeSplit: input.feeSplitPreset === 'custom' ? customFeeSplit : undefined,
    };
    return calculatePropertyTransferFees(inputWithCustomSplit, currency);
  }, [input, currency, customFeeSplit]);
  
  // Generate shareable URL
  const shareURL = useMemo(() => {
    return generateShareableURL(input);
  }, [input]);
  
  // Parse URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('price')) {
        const parsed = parseURLParams(params);
        setInput((prev) => ({ ...prev, ...parsed }));
      }
    }
  }, []);
  
  // Update handler
  const updateInput = useCallback(<K extends keyof PropertyTransferInput>(
    key: K,
    value: PropertyTransferInput[K]
  ) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);
  
  // Find max amount for progress bars
  const maxAmount = Math.max(
    result.breakdown.transferFee.amount,
    result.breakdown.specificBusinessTax.amount,
    result.breakdown.stampDuty.amount,
    result.breakdown.withholdingTax.amount,
    result.breakdown.mortgageRegistration.amount
  );
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Icon icon="solar:calculator-bold" className="w-4 h-4" />
          {t.freeCalculatorTool}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>
      
      {/* Currency & Language selectors */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <CurrencySelector 
            value={currency} 
            onChange={setCurrency} 
            exchangeRates={rates}
            isLoadingRates={isLoadingRates}
            t={t}
          />
          <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>
        
        {/* Rate info badge */}
        {!isLoadingRates && ratesLastUpdated && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Icon icon="solar:refresh-linear" className="w-3.5 h-3.5" />
            <span>
              {t.ratesUpdated}: {ratesLastUpdated.toLocaleTimeString()}
              {isFallback && <span className="ml-1 text-amber-500">({t.offlineRate})</span>}
            </span>
            <button
              onClick={refetchRates}
              className="ml-2 text-primary hover:underline"
            >
              {t.refresh}
            </button>
          </div>
        )}
      </div>
      
      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input Form */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Icon icon="solar:home-2-bold" className="w-5 h-5 text-primary" />
              {t.propertyDetails}
            </h2>
            
            <div className="space-y-6">
              <NumberInput
                label={t.purchasePrice}
                value={input.purchasePrice}
                onChange={(v) => updateInput('purchasePrice', v)}
                currency="THB"
                icon="solar:tag-price-linear"
                helpText={t.purchasePriceHelp}
                displayCurrency={currency}
                convertToDisplay={displayAmount}
              />
              
              <NumberInput
                label={t.registeredValue}
                value={input.registeredValue}
                onChange={(v) => updateInput('registeredValue', v)}
                currency="THB"
                icon="solar:document-linear"
                helpText={t.registeredValueHelp}
                displayCurrency={currency}
                convertToDisplay={displayAmount}
              />
              
              <ToggleGroup
                label={t.sellerType}
                value={input.sellerType}
                onChange={(v) => updateInput('sellerType', v as 'individual' | 'company' | 'developer')}
                options={[
                  { value: 'individual', label: t.individual, icon: 'solar:user-linear' },
                  { value: 'company', label: t.company, icon: 'solar:buildings-linear' },
                  { value: 'developer', label: t.developer, icon: 'solar:buildings-2-linear' },
                ]}
                helpText={t.sellerTypeHelp}
              />
              
              {/* Years Owned - Only show for Individual/Company sellers (not for Developer/New Build) */}
              {input.sellerType !== 'developer' && (
                <SliderInput
                  label={t.yearsOwned}
                  value={input.yearsOwned}
                  onChange={(v) => updateInput('yearsOwned', v)}
                  min={1}
                  max={10}
                  unit={t.years}
                  icon="solar:calendar-linear"
                  helpText={t.yearsOwnedHelp}
                />
              )}
              
              <NumberInput
                label={t.mortgageAmount}
                value={input.loanAmount || 0}
                onChange={(v) => updateInput('loanAmount', v)}
                currency="THB"
                icon="solar:bank-linear"
                helpText={t.mortgageAmountHelp}
                error={(input.loanAmount ?? 0) > input.purchasePrice ? t.mortgageExceedsPrice : undefined}
                displayCurrency={currency}
                convertToDisplay={displayAmount}
              />
              
              {/* Incentive toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <Icon icon="solar:gift-bold" className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t.applyIncentive}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t.incentiveDescription}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => updateInput('applyIncentive', !input.applyIncentive)}
                  className={cn(
                    "relative w-12 h-7 rounded-full transition-colors",
                    input.applyIncentive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <motion.div
                    animate={{ x: input.applyIncentive ? 22 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
              
              {/* Fee Split Selector */}
              <FeeSplitSelector
                preset={input.feeSplitPreset}
                customConfig={customFeeSplit}
                onPresetChange={(preset) => updateInput('feeSplitPreset', preset)}
                onCustomConfigChange={setCustomFeeSplit}
                isDeveloper={input.sellerType === 'developer'}
                t={t}
              />
            </div>
          </div>
        </div>
        
        {/* Right: Results */}
        <div className="space-y-6">
          {/* Summary */}
          <ResultsSummary 
            result={result} 
            t={t} 
            displayAmount={displayAmount} 
            purchasePrice={input.purchasePrice}
          />
          
          {/* Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon icon="solar:chart-2-bold" className="w-5 h-5 text-primary" />
              {t.costBreakdown}
            </h2>
            
            <div className="space-y-3">
              {Object.values(result.breakdown).map((item) => (
                <TaxBreakdownCard
                  key={item.name}
                  {...item}
                  maxAmount={maxAmount}
                  t={t}
                  displayAmount={displayAmount}
                />
              ))}
            </div>
          </div>
          
          {/* Exchange Rates */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon icon="solar:exchange-bold" className="w-5 h-5 text-primary" />
              {t.liveExchangeRates}
              {isLoadingRates && (
                <span className="ml-2 text-xs text-gray-400 animate-pulse">{t.loading}</span>
              )}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rates.map((rate) => (
                <div 
                  key={rate.currency}
                  className={cn(
                    "p-3 rounded-xl border transition-colors",
                    currency === rate.currency
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold">
                      {CURRENCY_SYMBOLS[rate.currency as Currency] || ''} {rate.currency}
                    </span>
                    {currency === rate.currency && (
                      <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                        {t.selected}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {rate.displayRate}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Icon icon="solar:clock-circle-linear" className="w-3 h-3" />
                    {rate.source === 'fallback' ? t.offlineRate : t.liveRate}
                  </div>
                </div>
              ))}
            </div>
            
            {isFallback && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Icon icon="solar:danger-triangle-linear" className="w-4 h-4" />
                {t.offlineRatesWarning}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Icon icon="solar:share-linear" className="w-5 h-5" />
              {t.shareResults}
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Icon icon="solar:document-text-linear" className="w-5 h-5" />
              {t.generateReport}
            </button>
          </div>
          
          {/* Embed button */}
          <button
            onClick={() => setShowEmbedModal(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20"
          >
            <Icon icon="solar:code-bold" className="w-5 h-5" />
            {t.embedCalculator}
          </button>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <div className="flex gap-3">
          <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{t.disclaimer}:</strong> {t.disclaimerText}
          </div>
        </div>
      </div>
      
      {/* Best Time to Buy Section */}
      <div className="mt-8">
        <BestTimeToBuy 
          currency={currency}
          budget={input.purchasePrice}
        />
      </div>
      
      {/* Buyer's Guide for Foreigners - Collapsible Info Section */}
      <ForeignerGuideSection t={t} />
      
      {/* Sources Footer */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon icon="solar:verified-check-bold" className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t.ratesBasedOn || 'All rates based on official Thai government regulations'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.rd.go.th/english/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              Revenue Dept
              <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
            </a>
            <a
              href="https://www.dol.go.th/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              Land Dept
              <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
            </a>
            <a
              href="/docs/property-transfer-calculator"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {t.viewFullDocumentation || 'View Full Documentation'}
              <Icon icon="solar:arrow-right-linear" className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareURL={shareURL}
        result={result}
        t={t}
        displayAmount={displayAmount}
      />
      
      {/* Embed Code Generator Modal */}
      <EmbedCodeGenerator
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        t={t}
      />
      
      {/* Printable Report Modal */}
      <PrintableReport
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        result={result}
        currency={currency}
        input={{
          purchasePrice: input.purchasePrice,
          registeredValue: input.registeredValue,
          yearsOwned: input.yearsOwned,
          sellerType: input.sellerType,
          loanAmount: input.loanAmount,
          applyIncentive: input.applyIncentive,
        }}
        t={t}
      />
    </div>
  );
}

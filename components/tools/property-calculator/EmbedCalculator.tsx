"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  PropertyTransferInput,
  PropertyTransferResult,
  Currency,
  calculatePropertyTransferFees,
  formatCurrency,
  parseURLParams,
  CURRENCY_SYMBOLS,
} from "@/lib/calculators/property-transfer";

// ============================================
// EMBED-SPECIFIC COMPONENTS (Compact versions)
// ============================================

function CompactNumberInput({
  label,
  value,
  onChange,
  currency = 'THB',
  helpText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  currency?: Currency;
  helpText?: string;
}) {
  const [inputValue, setInputValue] = useState(value.toLocaleString());
  
  useEffect(() => {
    setInputValue(value.toLocaleString());
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    const num = parseInt(raw, 10);
    
    if (!isNaN(num)) {
      setInputValue(num.toLocaleString());
      onChange(Math.min(Math.max(num, 0), 100000000));
    } else if (raw === '') {
      setInputValue('');
      onChange(0);
    }
  };
  
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {CURRENCY_SYMBOLS[currency]}
        </span>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          className={cn(
            "w-full pl-7 pr-3 py-2 rounded-lg border text-sm",
            "bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700",
            "focus:border-primary focus:ring-1 focus:ring-primary/20",
            "font-semibold text-gray-900 dark:text-white"
          )}
        />
      </div>
      {helpText && (
        <p className="text-[10px] text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

function CompactSliderInput({
  label,
  value,
  onChange,
  min,
  max,
  unit = '',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </label>
        <span className="text-sm font-bold text-primary">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

function CompactToggle({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-all",
              value === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPACT RESULT CARD
// ============================================

function CompactResultCard({
  result,
  currency,
}: {
  result: PropertyTransferResult;
  currency: Currency;
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl text-white">
      <div className="text-xs text-gray-400 mb-0.5">Total Transfer Costs</div>
      <div className="text-2xl font-bold mb-3">
        {formatCurrency(result.totals.grandTotal, currency)}
      </div>
      
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-700">
        <div>
          <div className="flex items-center gap-1 text-[10px] text-blue-400 mb-0.5">
            <Icon icon="solar:user-linear" className="w-3 h-3" />
            Buyer Pays
          </div>
          <div className="text-sm font-semibold">
            {formatCurrency(result.totals.buyerPays, currency)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[10px] text-orange-400 mb-0.5">
            <Icon icon="solar:users-group-rounded-linear" className="w-3 h-3" />
            Seller Pays
          </div>
          <div className="text-sm font-semibold">
            {formatCurrency(result.totals.sellerPays, currency)}
          </div>
        </div>
      </div>
      
      {result.incentiveSavings.qualifies && result.incentiveSavings.amountSaved > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-1.5 text-green-400">
            <Icon icon="solar:gift-bold" className="w-4 h-4" />
            <span className="text-xs">
              You save <strong>{formatCurrency(result.incentiveSavings.amountSaved, currency)}</strong> with incentive!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPACT BREAKDOWN
// ============================================

function CompactBreakdown({
  result,
  currency,
}: {
  result: PropertyTransferResult;
  currency: Currency;
}) {
  const items = Object.values(result.breakdown).filter(item => item.isApplicable);
  
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        Cost Breakdown
      </h3>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between py-1.5 px-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-700 dark:text-gray-300">{item.name}</span>
              <span className={cn(
                "px-1.5 py-0.5 text-[9px] font-medium rounded",
                item.paidBy === 'buyer' && "bg-blue-100 text-blue-700",
                item.paidBy === 'seller' && "bg-orange-100 text-orange-700",
                item.paidBy === 'split' && "bg-purple-100 text-purple-700"
              )}>
                {item.paidBy === 'split' ? '50/50' : item.paidBy}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">{item.rate}</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {formatCurrency(item.amount, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// POWERED BY BADGE - Hidden for white-label
// The iframe URL itself provides the backlink
// ============================================

function PoweredByBadge() {
  // Intentionally empty - the iframe src URL is the backlink
  // No visible branding to encourage competitor embeds
  return null;
}

// ============================================
// MAIN EMBED CALCULATOR COMPONENT
// ============================================

export function EmbedCalculator() {
  const [currency, setCurrency] = useState<Currency>('THB');
  
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
  
  // Calculate results
  const result = useMemo(() => {
    return calculatePropertyTransferFees(input, currency);
  }, [input, currency]);
  
  // Parse URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('price')) {
        const parsed = parseURLParams(params);
        setInput((prev) => ({ ...prev, ...parsed }));
      }
      // Check for theme param
      const theme = params.get('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
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
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="solar:calculator-bold" className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
            Thailand Property Transfer Calculator
          </h1>
        </div>
        
        {/* Currency selector */}
        <div className="flex gap-1">
          {(['THB', 'USD', 'EUR'] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                "px-2 py-1 text-[10px] font-medium rounded transition-all",
                currency === c
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Inputs */}
        <div className="space-y-3">
          <CompactNumberInput
            label="Purchase Price"
            value={input.purchasePrice}
            onChange={(v) => updateInput('purchasePrice', v)}
            currency={currency}
          />
          
          <CompactNumberInput
            label="Registered Value"
            value={input.registeredValue}
            onChange={(v) => updateInput('registeredValue', v)}
            currency={currency}
            helpText="Government appraised value"
          />
          
          <CompactSliderInput
            label="Years Owned"
            value={input.yearsOwned}
            onChange={(v) => updateInput('yearsOwned', v)}
            min={1}
            max={10}
            unit="years"
          />
          
          <CompactToggle
            label="Seller Type"
            value={input.sellerType}
            onChange={(v) => updateInput('sellerType', v as 'individual' | 'company')}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'company', label: 'Company' },
            ]}
          />
          
          {/* Incentive toggle */}
          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Icon icon="solar:gift-bold" className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Apply 0.01% Incentive
              </span>
            </div>
            <button
              onClick={() => updateInput('applyIncentive', !input.applyIncentive)}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors",
                input.applyIncentive ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <motion.div
                animate={{ x: input.applyIncentive ? 18 : 2 }}
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </div>
        
        {/* Right: Results */}
        <div className="space-y-3">
          <CompactResultCard result={result} currency={currency} />
          <CompactBreakdown result={result} currency={currency} />
        </div>
      </div>
      
      {/* Powered by badge - ESSENTIAL for backlinks */}
      <PoweredByBadge />
    </div>
  );
}

export default EmbedCalculator;

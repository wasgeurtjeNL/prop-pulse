"use client";

import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PropertyTransferInput,
  calculatePropertyTransferFees,
  formatCurrency,
} from "@/lib/calculators/property-transfer";

interface PropertyCalculatorWidgetProps {
  /** Property price in THB */
  propertyPrice: number;
  /** Property title for display */
  propertyTitle?: string;
  /** Property type */
  propertyType?: 'condo' | 'house_land' | 'land_only';
  /** Whether property is for sale (vs rent) */
  isForSale?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Compact calculator widget for property detail pages
 * Shows quick estimate of transfer costs with link to full calculator
 */
export default function PropertyCalculatorWidget({
  propertyPrice,
  propertyTitle,
  propertyType = 'condo',
  isForSale = true,
  className,
}: PropertyCalculatorWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [buyerNationality, setBuyerNationality] = useState<'thai' | 'foreigner'>('foreigner');

  // Calculate with standard assumptions
  const result = useMemo(() => {
    if (!propertyPrice || propertyPrice <= 0) return null;

    const input: PropertyTransferInput = {
      purchasePrice: propertyPrice,
      registeredValue: Math.round(propertyPrice * 0.85), // Typical 85% of purchase price
      yearsOwned: 3, // Assume average
      sellerType: 'individual',
      buyerType: buyerNationality,
      buyerNationality: buyerNationality,
      propertyType: propertyType,
      isNewBuild: false,
      loanAmount: 0,
      applyIncentive: propertyPrice <= 7000000,
      feeSplitPreset: 'standard',
    };

    try {
      return calculatePropertyTransferFees(input);
    } catch {
      return null;
    }
  }, [propertyPrice, buyerNationality, propertyType]);

  // Don't show for rentals or invalid prices
  if (!isForSale || !propertyPrice || propertyPrice <= 0) {
    return null;
  }

  const qualifiesForIncentive = propertyPrice <= 7000000;

  return (
    <div className={cn(
      "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      "border border-emerald-200 dark:border-emerald-800/50 rounded-2xl overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="flex items-center gap-2">
          <Icon icon="solar:calculator-bold" className="w-5 h-5" />
          <span className="font-semibold text-sm">Transfer Cost Estimate</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Buyer Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setBuyerNationality('thai')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              buyerNationality === 'thai'
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            )}
          >
            🇹🇭 Thai Buyer
          </button>
          <button
            onClick={() => setBuyerNationality('foreigner')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              buyerNationality === 'foreigner'
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            )}
          >
            🌍 Foreign Buyer
          </button>
        </div>

        {/* Quick Result */}
        {result && (
          <div className="space-y-3">
            {/* Your Cost */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Your Estimated Cost</span>
                {qualifiesForIncentive && (
                  <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                    Incentive Applied
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ฿{result.totals.buyerPays.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                ~{(result.totals.buyerPays / propertyPrice * 100).toFixed(1)}% of property price
              </div>
            </div>

            {/* Expandable Breakdown */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
            >
              <span>View breakdown</span>
              <Icon 
                icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} 
                className="w-4 h-4" 
              />
            </button>

            {isExpanded && (
              <div className="space-y-2 pt-2 border-t border-emerald-100 dark:border-emerald-800/50">
                {/* Transfer Fee */}
                {result.breakdown.transferFee.buyerAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Transfer Fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ฿{result.breakdown.transferFee.buyerAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {/* SBT or Stamp Duty */}
                {result.breakdown.specificBusinessTax.buyerAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Specific Business Tax</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ฿{result.breakdown.specificBusinessTax.buyerAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                {result.breakdown.stampDuty.buyerAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Stamp Duty</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ฿{result.breakdown.stampDuty.buyerAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Withholding Tax */}
                {result.breakdown.withholdingTax.buyerAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Withholding Tax</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ฿{result.breakdown.withholdingTax.buyerAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Incentive Savings */}
                {qualifiesForIncentive && result.incentiveSavings.amountSaved > 0 && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-dashed border-emerald-200 dark:border-emerald-800">
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Icon icon="solar:tag-bold" className="w-3 h-3" />
                      You Save
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ฿{result.incentiveSavings.amountSaved.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
          * Estimate based on standard 50/50 fee split. Actual costs may vary based on negotiations and specific circumstances.
        </p>

        {/* CTA to Full Calculator */}
        <Link
          href={`/tools/property-transfer-calculator?purchasePrice=${propertyPrice}&propertyType=${propertyType}&buyerNationality=${buyerNationality}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Icon icon="solar:calculator-bold" className="w-4 h-4" />
          Open Full Calculator
          <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Slider } from "@/components/ui/slider";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

// Format number as currency
function formatCurrency(amount: number, currency: string = "THB"): string {
  const symbols: Record<string, string> = {
    THB: "฿",
    EUR: "€",
    USD: "$",
  };
  return `${symbols[currency] || "฿"}${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

interface OwnerROICalculatorProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerROICalculator({ lang = "en" }: OwnerROICalculatorProps) {
  const t = getOwnerLandingTranslations(lang);
  const [propertyPrice, setPropertyPrice] = useState(15000000); // 15M THB default
  const [currency, setCurrency] = useState<"THB" | "EUR" | "USD">("THB");

  // Currency conversion rates (approximate)
  const rates: Record<string, number> = {
    THB: 1,
    EUR: 0.026,
    USD: 0.028,
  };

  // Calculate values
  const calculations = useMemo(() => {
    const monthlyMarketingCost = propertyPrice * 0.0025; // 0.25%
    const avgSellingTimeWithout = 11; // months
    const avgSellingTimeWith = 4; // months
    const monthsSaved = avgSellingTimeWithout - avgSellingTimeWith;
    
    // Monthly holding costs (estimated)
    const monthlyHoldingCost = propertyPrice * 0.005; // 0.5% per month
    const holdingCostsSaved = monthsSaved * monthlyHoldingCost;
    
    // Total marketing investment
    const totalMarketingCost = avgSellingTimeWith * monthlyMarketingCost;
    
    // Net benefit
    const netBenefit = holdingCostsSaved - totalMarketingCost;
    
    // ROI percentage
    const roiPercentage = totalMarketingCost > 0 
      ? Math.round((netBenefit / totalMarketingCost) * 100) 
      : 0;

    return {
      monthlyMarketingCost,
      avgSellingTimeWithout,
      avgSellingTimeWith,
      monthsSaved,
      monthlyHoldingCost,
      holdingCostsSaved,
      totalMarketingCost,
      netBenefit,
      roiPercentage,
    };
  }, [propertyPrice]);

  // Convert to selected currency
  const convertAmount = (amount: number) => {
    return amount * rates[currency];
  };

  return (
    <section id="roi-calculator" className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mb-4">
            <Icon icon="ph:calculator" className="w-4 h-4" />
            <span className="text-sm font-medium">{t.roiBadge}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {t.roiTitle1}{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{t.roiTitle2}</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {t.roiDescription}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Price Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div>
                <label className="block text-white/70 text-sm mb-2">{t.roiYourPrice}</label>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {formatCurrency(convertAmount(propertyPrice), currency)}
                </div>
              </div>
              
              {/* Currency Selector */}
              <div className="flex gap-2">
                {(["THB", "EUR", "USD"] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      currency === curr
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
            
            <Slider
              value={[propertyPrice]}
              onValueChange={(value) => setPropertyPrice(value[0])}
              min={5000000}
              max={100000000}
              step={500000}
              className="py-4"
            />
            
            <div className="flex justify-between text-sm text-white/50 mt-2">
              <span>฿5M</span>
              <span>฿100M</span>
            </div>
          </motion.div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Without Marketing */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-red-500/10 backdrop-blur-xl rounded-3xl p-8 border border-red-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Icon icon="ph:x-circle" className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold">{t.roiWithout}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/70">{t.roiEstTime}</span>
                  <span className="text-2xl font-bold text-red-400">{calculations.avgSellingTimeWithout} {t.roiMonths}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/70">{t.roiCostMonth}</span>
                  <span className="font-medium">{formatCurrency(convertAmount(calculations.monthlyHoldingCost), currency)}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="font-medium">{t.roiTotalCost}</span>
                  <span className="text-2xl font-bold text-red-400">
                    {formatCurrency(convertAmount(calculations.monthlyHoldingCost * calculations.avgSellingTimeWithout), currency)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* With Marketing */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-emerald-500/10 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/30 relative overflow-hidden"
            >
              {/* Recommended badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                  <Icon icon="ph:star-fill" className="w-3 h-3" />
                  {t.roiRecommended}
                </span>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Icon icon="ph:rocket-launch" className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold">{t.roiWith}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/70">{t.roiEstTime}</span>
                  <span className="text-2xl font-bold text-emerald-400">{calculations.avgSellingTimeWith} {t.roiMonths}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/70">{t.roiInvestment}</span>
                  <span className="font-medium">{formatCurrency(convertAmount(calculations.monthlyMarketingCost), currency)}{t.roiPerMonth}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="font-medium">{t.roiTotalInvestment}</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(convertAmount(calculations.totalMarketingCost), currency)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Results Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20"
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Icon icon="ph:trophy" className="w-6 h-6 text-amber-400" />
              {t.roiYourSavings}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-2">
                  <Icon icon="ph:clock" className="w-4 h-4" />
                  {t.roiTimeSaved}
                </div>
                <div className="text-3xl font-bold">
                  {calculations.monthsSaved}
                </div>
                <div className="text-white/70 text-sm">{t.roiMonths}</div>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-2">
                  <Icon icon="ph:piggy-bank" className="w-4 h-4" />
                  {t.roiCostSaved}
                </div>
                <div className="text-3xl font-bold">
                  {formatCurrency(convertAmount(calculations.holdingCostsSaved), currency)}
                </div>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 text-center">
                <div className="text-white/80 text-sm mb-2">{t.roiNetBenefit}</div>
                <div className="text-3xl font-bold text-emerald-200">
                  +{formatCurrency(convertAmount(calculations.netBenefit), currency)}
                </div>
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 text-center">
                <div className="text-white/80 text-sm mb-2">{t.roiROI}</div>
                <div className="text-3xl font-bold text-amber-300">
                  {calculations.roiPercentage}%
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-white/80 text-sm">
                <Icon icon="ph:info" className="w-4 h-4 inline mr-1" />
                {t.roiBasedOn}
              </div>
              <a
                href="#cta"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-semibold rounded-full hover:bg-white/90 transition-colors"
              >
                <Icon icon="ph:rocket-launch" className="w-5 h-5" />
                {t.roiStartNow}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

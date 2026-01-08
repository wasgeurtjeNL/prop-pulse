"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  price: string;
}

interface ROICalculatorProps {
  properties: Property[];
  lang: "en" | "nl";
  onUpgradeClick?: (propertyId: string) => void;
}

// Parse price string to number
function parsePriceToNumber(priceStr: string): number {
  const cleaned = priceStr.replace(/[฿$€£,\s]/g, "").replace(/THB/i, "");
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// Format number as currency
function formatCurrency(amount: number, currency: string = "THB"): string {
  const symbols: Record<string, string> = {
    THB: "฿",
    EUR: "€",
    USD: "$",
  };
  return `${symbols[currency] || "฿"}${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function ROICalculator({
  properties,
  lang,
  onUpgradeClick,
}: ROICalculatorProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    properties[0]?.id || ""
  );
  const [showDetails, setShowDetails] = useState(false);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const propertyPrice = selectedProperty ? parsePriceToNumber(selectedProperty.price) : 0;

  // Calculate values
  const calculations = useMemo(() => {
    const monthlyMarketingCost = propertyPrice * 0.0025; // 0.25%
    const avgSellingTimeWithout = 11; // months
    const avgSellingTimeWith = 4; // months
    const monthsSaved = avgSellingTimeWithout - avgSellingTimeWith;
    
    // Monthly holding costs (estimated)
    const monthlyHoldingCost = propertyPrice * 0.005; // 0.5% per month (maintenance, taxes, opportunity cost)
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

  const t = {
    en: {
      title: "ROI Calculator",
      subtitle: "See the financial benefit of marketing your property",
      selectProperty: "Select Property",
      currentSituation: "Current Situation",
      withMarketing: "With Marketing",
      estimatedSellingTime: "Estimated Selling Time",
      months: "months",
      holdingCostsPerMonth: "Holding Costs/Month",
      totalHoldingCosts: "Total Holding Costs",
      marketingInvestment: "Marketing Investment",
      perMonth: "/month",
      totalInvestment: "Total Investment",
      yourSavings: "Your Savings",
      timeSaved: "Time Saved",
      moneySaved: "Money Saved",
      netBenefit: "Net Benefit",
      roi: "Return on Investment",
      startMarketing: "Start Marketing Now",
      showCalculation: "Show Calculation",
      hideCalculation: "Hide Calculation",
      includes: "Holding costs include",
      maintenance: "Maintenance & utilities",
      taxes: "Property taxes",
      opportunityCost: "Opportunity cost",
      insurance: "Insurance",
    },
    nl: {
      title: "ROI Calculator",
      subtitle: "Bekijk het financiële voordeel van marketing voor uw woning",
      selectProperty: "Selecteer Woning",
      currentSituation: "Huidige Situatie",
      withMarketing: "Met Marketing",
      estimatedSellingTime: "Geschatte Verkooptijd",
      months: "maanden",
      holdingCostsPerMonth: "Kosten/Maand",
      totalHoldingCosts: "Totale Kosten",
      marketingInvestment: "Marketing Investering",
      perMonth: "/maand",
      totalInvestment: "Totale Investering",
      yourSavings: "Uw Besparing",
      timeSaved: "Tijd Bespaard",
      moneySaved: "Geld Bespaard",
      netBenefit: "Netto Voordeel",
      roi: "Return on Investment",
      startMarketing: "Start Nu Met Marketing",
      showCalculation: "Toon Berekening",
      hideCalculation: "Verberg Berekening",
      includes: "Kosten inclusief",
      maintenance: "Onderhoud & nutsvoorzieningen",
      taxes: "Onroerend goed belasting",
      opportunityCost: "Alternatieve kosten",
      insurance: "Verzekering",
    },
  }[lang];

  if (properties.length === 0) return null;

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
            <Calculator className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Property Selector */}
        {properties.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.selectProperty}</label>
            <div className="flex flex-wrap gap-2">
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPropertyId(p.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPropertyId === p.id
                      ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {p.listingNumber || p.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Without Marketing */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50"
          >
            <Badge variant="outline" className="mb-4">
              {t.currentSituation}
            </Badge>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.estimatedSellingTime}</span>
                <span className="font-bold text-xl text-red-600">
                  {calculations.avgSellingTimeWithout} {t.months}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.holdingCostsPerMonth}</span>
                <span className="font-medium">
                  {formatCurrency(calculations.monthlyHoldingCost)}
                </span>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.totalHoldingCosts}</span>
                  <span className="font-bold text-xl text-red-600">
                    {formatCurrency(calculations.monthlyHoldingCost * calculations.avgSellingTimeWithout)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* With Marketing */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
          >
            <Badge className="mb-4 bg-emerald-500">
              <Sparkles className="h-3 w-3 mr-1" />
              {t.withMarketing}
            </Badge>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.estimatedSellingTime}</span>
                <span className="font-bold text-xl text-emerald-600">
                  {calculations.avgSellingTimeWith} {t.months}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.marketingInvestment}</span>
                <span className="font-medium">
                  {formatCurrency(calculations.monthlyMarketingCost)}{t.perMonth}
                </span>
              </div>
              
              <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.totalInvestment}</span>
                  <span className="font-bold text-xl text-emerald-600">
                    {formatCurrency(calculations.totalMarketingCost)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Savings Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t.yourSavings}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <Clock className="h-4 w-4" />
                {t.timeSaved}
              </div>
              <div className="text-2xl font-bold">
                {calculations.monthsSaved} {t.months}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                {t.moneySaved}
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(calculations.holdingCostsSaved)}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-white/80 text-sm mb-1">
                {t.netBenefit}
              </div>
              <div className="text-2xl font-bold text-green-200">
                +{formatCurrency(calculations.netBenefit)}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-white/80 text-sm mb-1">
                {t.roi}
              </div>
              <div className="text-2xl font-bold text-green-200">
                {calculations.roiPercentage}%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Toggle */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? t.hideCalculation : t.showCalculation}
          </Button>
        </div>

        {/* Calculation Details */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm"
          >
            <h4 className="font-medium mb-3">{t.includes}:</h4>
            <div className="grid grid-cols-2 gap-2">
              {[t.maintenance, t.taxes, t.opportunityCost, t.insurance].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-2 text-muted-foreground">
              <p>• {lang === "nl" ? "Woningprijs" : "Property price"}: {formatCurrency(propertyPrice)}</p>
              <p>• {lang === "nl" ? "Marketing" : "Marketing"}: 0.25% = {formatCurrency(calculations.monthlyMarketingCost)}/mnd</p>
              <p>• {lang === "nl" ? "Kosten" : "Holding costs"}: 0.5% = {formatCurrency(calculations.monthlyHoldingCost)}/mnd</p>
              <p>• {lang === "nl" ? "Tijd bespaard" : "Time saved"}: {calculations.monthsSaved} × {formatCurrency(calculations.monthlyHoldingCost)} = {formatCurrency(calculations.holdingCostsSaved)}</p>
              <p>• {lang === "nl" ? "Netto" : "Net"}: {formatCurrency(calculations.holdingCostsSaved)} - {formatCurrency(calculations.totalMarketingCost)} = <span className="text-green-600 font-bold">{formatCurrency(calculations.netBenefit)}</span></p>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => onUpgradeClick?.(selectedPropertyId)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            {t.startMarketing}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

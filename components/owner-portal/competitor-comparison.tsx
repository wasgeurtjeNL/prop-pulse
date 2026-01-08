"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Home,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
}

interface CompetitorComparisonProps {
  properties: Property[];
  lang: "en" | "nl";
  onUpgradeClick?: () => void;
}

// Parse price string to number
function parsePriceToNumber(priceStr: string): number {
  const cleaned = priceStr.replace(/[฿$€£,\s]/g, "").replace(/THB/i, "");
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// Format number as currency
function formatCurrency(amount: number): string {
  return `฿${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function CompetitorComparison({
  properties,
  lang,
  onUpgradeClick,
}: CompetitorComparisonProps) {
  const property = properties[0];
  const propertyPrice = property ? parsePriceToNumber(property.price) : 0;

  // Simulated market data - in production, fetch from API
  const marketData = useMemo(() => {
    const avgPrice = propertyPrice * (0.9 + Math.random() * 0.2); // ±10% variation
    const minPrice = propertyPrice * 0.75;
    const maxPrice = propertyPrice * 1.25;
    const pricePerSqm = propertyPrice / (property?.sqft || 100);
    const avgPricePerSqm = pricePerSqm * (0.85 + Math.random() * 0.3);
    
    const priceDiffPercent = Math.round(((propertyPrice - avgPrice) / avgPrice) * 100);
    const competitorCount = Math.floor(Math.random() * 30) + 80;
    const priceRank = Math.floor(Math.random() * 20) + 40; // 40-60th percentile

    return {
      avgPrice,
      minPrice,
      maxPrice,
      pricePerSqm,
      avgPricePerSqm,
      priceDiffPercent,
      competitorCount,
      priceRank,
    };
  }, [property, propertyPrice]);

  const isOverpriced = marketData.priceDiffPercent > 5;
  const isUnderpriced = marketData.priceDiffPercent < -5;
  const isCompetitive = !isOverpriced && !isUnderpriced;

  const t = {
    en: {
      title: "Market Position",
      subtitle: "How your property compares to the competition",
      yourPrice: "Your Price",
      marketAvg: "Market Average",
      priceRange: "Price Range in Area",
      competitors: "Competing Properties",
      inYourPriceRange: "in your price range",
      pricePosition: "Your Price Position",
      percentile: "percentile",
      analysis: "Analysis",
      overpriced: "Your property is priced above market average",
      underpriced: "Your property is priced below market average",
      competitive: "Your price is competitive with the market",
      recommendation: "Recommendation",
      overpricedRec: "Consider price adjustment or invest in marketing to justify premium pricing",
      underpricedRec: "Great pricing! Consider marketing to attract more buyers quickly",
      competitiveRec: "Good positioning. Marketing can help you stand out from competitors",
      startMarketing: "Stand Out with Marketing",
      pricePerSqm: "Price per sqm",
      yourProperty: "Your Property",
      higherThan: "higher than avg",
      lowerThan: "lower than avg",
      atMarket: "at market rate",
    },
    nl: {
      title: "Marktpositie",
      subtitle: "Hoe uw woning zich verhoudt tot de concurrentie",
      yourPrice: "Uw Prijs",
      marketAvg: "Markt Gemiddelde",
      priceRange: "Prijsrange in Gebied",
      competitors: "Concurrerende Woningen",
      inYourPriceRange: "in uw prijsklasse",
      pricePosition: "Uw Prijspositie",
      percentile: "percentiel",
      analysis: "Analyse",
      overpriced: "Uw woning is boven het marktgemiddelde geprijsd",
      underpriced: "Uw woning is onder het marktgemiddelde geprijsd",
      competitive: "Uw prijs is concurrerend met de markt",
      recommendation: "Aanbeveling",
      overpricedRec: "Overweeg prijsaanpassing of investeer in marketing om premium prijs te rechtvaardigen",
      underpricedRec: "Goede prijsstelling! Overweeg marketing om sneller kopers aan te trekken",
      competitiveRec: "Goede positionering. Marketing kan u helpen opvallen tussen concurrenten",
      startMarketing: "Val Op met Marketing",
      pricePerSqm: "Prijs per m²",
      yourProperty: "Uw Woning",
      higherThan: "hoger dan gem.",
      lowerThan: "lager dan gem.",
      atMarket: "marktconform",
    },
  }[lang];

  if (!property) return null;

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl">
            <BarChart3 className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Price Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Your Price */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Home className="h-4 w-4" />
              {t.yourProperty}
            </div>
            <div className="text-3xl font-bold">{formatCurrency(propertyPrice)}</div>
            <div className="flex items-center gap-2 mt-2">
              {isOverpriced && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {Math.abs(marketData.priceDiffPercent)}% {t.higherThan}
                </Badge>
              )}
              {isUnderpriced && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {Math.abs(marketData.priceDiffPercent)}% {t.lowerThan}
                </Badge>
              )}
              {isCompetitive && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Minus className="h-3 w-3 mr-1" />
                  {t.atMarket}
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Market Average */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              {t.marketAvg}
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(marketData.avgPrice)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {t.priceRange}: {formatCurrency(marketData.minPrice)} - {formatCurrency(marketData.maxPrice)}
            </div>
          </motion.div>
        </div>

        {/* Competitor Count & Price Position */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Competitors */}
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700">{marketData.competitorCount}+</div>
                <div className="text-sm text-amber-600">{t.competitors} {t.inYourPriceRange}</div>
              </div>
            </div>
          </div>

          {/* Price Position */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t.pricePosition}</span>
              <span className="font-semibold">{marketData.priceRank}{t.percentile}</span>
            </div>
            <Progress value={marketData.priceRank} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{lang === "nl" ? "Laagste" : "Lowest"}</span>
              <span>{lang === "nl" ? "Hoogste" : "Highest"}</span>
            </div>
          </div>
        </div>

        {/* Analysis & Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl p-5 ${
            isOverpriced 
              ? "bg-amber-50 border-2 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" 
              : isUnderpriced
                ? "bg-green-50 border-2 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                : "bg-blue-50 border-2 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              isOverpriced ? "bg-amber-100" : isUnderpriced ? "bg-green-100" : "bg-blue-100"
            }`}>
              {isOverpriced ? (
                <TrendingUp className="h-5 w-5 text-amber-600" />
              ) : isUnderpriced ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold mb-1 ${
                isOverpriced ? "text-amber-800" : isUnderpriced ? "text-green-800" : "text-blue-800"
              }`}>
                {t.analysis}
              </h4>
              <p className={`text-sm mb-3 ${
                isOverpriced ? "text-amber-700" : isUnderpriced ? "text-green-700" : "text-blue-700"
              }`}>
                {isOverpriced ? t.overpriced : isUnderpriced ? t.underpriced : t.competitive}
              </p>
              
              <h4 className="font-semibold mb-1 text-slate-800 dark:text-slate-200">
                {t.recommendation}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isOverpriced ? t.overpricedRec : isUnderpriced ? t.underpricedRec : t.competitiveRec}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
          >
            <Target className="h-5 w-5 mr-2" />
            {t.startMarketing}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

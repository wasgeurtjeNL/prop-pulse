"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Rocket,
  Target,
  TrendingUp,
  Shield,
  CheckCircle2,
  Star,
  Zap,
  Award,
  Globe,
  Camera,
  Video,
  Users,
  Clock,
  Handshake,
  AlertCircle,
  ChevronRight,
  Eye,
  Phone,
  Mail,
  Sparkles,
  Crown,
  Timer,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  AlertTriangle,
  ThumbsUp,
  MessageCircle,
  Share2,
  Search,
  MousePointerClick,
  FileText,
  Calendar,
  CheckCircle,
  Circle,
  Play,
  Heart,
  Facebook,
  ExternalLink,
  Home,
  XCircle,
} from "lucide-react";
import { getOwnerPortalTranslations, OwnerPortalLanguage } from "@/lib/i18n/owner-portal-translations";
import { useCurrencyRates } from "@/hooks/use-currency-rates";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  price: string;
  type: "FOR_SALE" | "FOR_RENT";
  images?: { url: string }[];
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: { name: string } | null;
}

interface Subscription {
  id: string;
  propertyId: string;
  packageType: "MARKETING_FEE" | "EXCLUSIVE_CONTRACT" | "STANDARD";
  marketingPercentage: number | null;
  commissionPercentage: number | null;
  calculatedAmount: number | null;
  propertyPrice: number;
  status: string;
  signedAt: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    listingNumber: string | null;
    price: string;
  };
}

interface MarketingBoostProps {
  properties: Property[];
  lang: OwnerPortalLanguage;
  userName?: string;
}

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: "฿",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
};

// Parse price string to number
function parsePriceToNumber(priceStr: string): number {
  const cleaned = priceStr.replace(/[฿$€£,\s]/g, "").replace(/THB/i, "");
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// Format number with currency
function formatAmount(amount: number, currency: string = "THB"): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
}

// ============================================
// AD PREVIEW COMPONENTS
// ============================================

// Facebook Ad Preview
function FacebookAdPreview({ 
  property, 
  currency, 
  displayAmount,
  lang 
}: { 
  property: Property; 
  currency: string;
  displayAmount: (amount: number) => string;
  lang: OwnerPortalLanguage;
}) {
  const priceNum = parsePriceToNumber(property.price);
  const imageUrl = property.images?.[0]?.url || "/images/placeholder-property.jpg";
  const location = property.area?.name || "Phuket";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[400px]"
    >
      {/* Facebook Header */}
      <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
          PSM
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">PSM Phuket Real Estate</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>Sponsored</span>
            <span>·</span>
            <Globe className="h-3 w-3" />
          </div>
        </div>
        <div className="text-slate-400">•••</div>
      </div>

      {/* Ad Content */}
      <div className="p-3">
        <p className="text-sm mb-2">
          {lang === "nl" 
            ? `🏠 EXCLUSIEF: ${property.title} - Nu beschikbaar in ${location}!` 
            : `🏠 EXCLUSIVE: ${property.title} - Now available in ${location}!`}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {lang === "nl"
            ? `✨ Prachtige woning met ${property.bedrooms || 3} slaapkamers | ${property.bathrooms || 2} badkamers\n💰 Vraagprijs: ${displayAmount(priceNum)}\n📍 ${location}, Thailand`
            : `✨ Beautiful property with ${property.bedrooms || 3} bedrooms | ${property.bathrooms || 2} bathrooms\n💰 Asking price: ${displayAmount(priceNum)}\n📍 ${location}, Thailand`}
        </p>
      </div>

      {/* Property Image */}
      <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800">
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className="object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-white font-bold text-lg">{displayAmount(priceNum)}</div>
          <div className="text-white/80 text-sm">{property.title}</div>
        </div>
      </div>

      {/* Link Preview */}
      <div className="bg-slate-50 dark:bg-slate-800 p-3 border-t border-slate-100 dark:border-slate-700">
        <div className="text-xs text-slate-500 uppercase">psmphuket.com</div>
        <div className="font-semibold text-sm truncate">{property.title}</div>
        <div className="text-xs text-slate-500 truncate">
          {lang === "nl" ? "Bekijk deze exclusieve woning" : "View this exclusive property"}
        </div>
      </div>

      {/* Engagement Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-700 text-slate-500">
        <div className="flex items-center gap-1 text-xs">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <ThumbsUp className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <Heart className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <span className="ml-1">247</span>
        </div>
        <div className="text-xs">86 {lang === "nl" ? "reacties" : "comments"} · 34 {lang === "nl" ? "gedeeld" : "shares"}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-slate-100 dark:border-slate-700">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
          <ThumbsUp className="h-4 w-4" />
          <span>Like</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
          <MessageCircle className="h-4 w-4" />
          <span>{lang === "nl" ? "Reageer" : "Comment"}</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
          <Share2 className="h-4 w-4" />
          <span>{lang === "nl" ? "Delen" : "Share"}</span>
        </button>
      </div>
    </motion.div>
  );
}

// Google Ads Preview
function GoogleAdsPreview({ 
  property, 
  displayAmount,
  lang 
}: { 
  property: Property;
  displayAmount: (amount: number) => string;
  lang: OwnerPortalLanguage;
}) {
  const priceNum = parsePriceToNumber(property.price);
  const location = property.area?.name || "Phuket";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[500px]"
    >
      {/* Google Search Bar */}
      <div className="bg-slate-50 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {lang === "nl" ? "villa te koop phuket thailand" : "villa for sale phuket thailand"}
          </span>
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4 space-y-4">
        {/* Sponsored Ad */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 font-normal">
              {lang === "nl" ? "Gesponsord" : "Sponsored"}
            </Badge>
            <span className="text-xs text-slate-500">psmphuket.com</span>
          </div>
          <a href="#" className="block text-lg text-blue-600 hover:underline font-medium leading-tight">
            {property.title} - {displayAmount(priceNum)} | PSM Phuket
          </a>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
            {lang === "nl" 
              ? `${property.bedrooms || 3} slaapkamers · ${property.bathrooms || 2} badkamers · ${location}. Professionele Nederlandse service. Bekijk nu deze exclusieve woning. ✓ Direct contact ✓ Virtuele tour beschikbaar`
              : `${property.bedrooms || 3} bedrooms · ${property.bathrooms || 2} bathrooms · ${location}. Professional Dutch service. View this exclusive property now. ✓ Direct contact ✓ Virtual tour available`}
          </p>
          {/* Sitelinks */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-blue-600">
            <a href="#" className="hover:underline">{lang === "nl" ? "Bekijk Foto's" : "View Photos"}</a>
            <a href="#" className="hover:underline">{lang === "nl" ? "Virtual Tour" : "Virtual Tour"}</a>
            <a href="#" className="hover:underline">{lang === "nl" ? "Contact Opnemen" : "Contact Us"}</a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800"></div>

        {/* Organic Result (grayed out to show sponsored is highlighted) */}
        <div className="space-y-1 opacity-50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">competitor-site.com</span>
          </div>
          <a href="#" className="block text-lg text-blue-600/50 font-medium leading-tight">
            Villas for Sale in Phuket - Thailand Properties
          </a>
          <p className="text-sm text-slate-400 leading-snug">
            Browse our selection of villas for sale in Phuket. Contact us for more information about...
          </p>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-800 p-3">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">
            {lang === "nl" 
              ? "Uw advertentie verschijnt bovenaan de zoekresultaten" 
              : "Your ad appears at the top of search results"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Instagram Story Preview
function InstagramStoryPreview({ 
  property, 
  displayAmount,
  userName,
  lang 
}: { 
  property: Property;
  displayAmount: (amount: number) => string;
  userName?: string;
  lang: OwnerPortalLanguage;
}) {
  const priceNum = parsePriceToNumber(property.price);
  const imageUrl = property.images?.[0]?.url || "/images/placeholder-property.jpg";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-[200px] h-[356px] bg-black rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Story Image */}
      <Image
        src={imageUrl}
        alt={property.title}
        fill
        className="object-cover"
      />
      
      {/* Story Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40">
        {/* Story Progress Bar */}
        <div className="flex gap-1 p-2">
          <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Story Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[8px] font-bold">
              PSM
            </div>
          </div>
          <div className="text-white text-xs font-semibold">psmphuket</div>
        </div>

        {/* Story Content */}
        <div className="absolute bottom-14 left-0 right-0 p-3 text-white">
          <div className="text-2xl font-bold mb-1">{displayAmount(priceNum)}</div>
          <div className="text-sm font-medium truncate">{property.title}</div>
          <div className="text-xs opacity-80 mt-1">
            {property.bedrooms || 3} 🛏️ · {property.bathrooms || 2} 🛁
          </div>
        </div>

        {/* Swipe Up */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-flex flex-col items-center text-white"
          >
            <ChevronRight className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-[10px] uppercase tracking-wider">Swipe Up</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// ROADMAP COMPONENT
// ============================================

function MarketingRoadmap({ 
  packageType, 
  lang,
  userName 
}: { 
  packageType: "MARKETING_FEE" | "EXCLUSIVE_CONTRACT"; 
  lang: OwnerPortalLanguage;
  userName?: string;
}) {
  const steps = packageType === "MARKETING_FEE" ? [
    {
      day: lang === "nl" ? "Dag 1" : "Day 1",
      title: lang === "nl" ? "Aanvraag & Contact" : "Request & Contact",
      description: lang === "nl" 
        ? `${userName ? `${userName}, u` : "U"} selecteert het pakket en wij nemen binnen 24 uur contact op`
        : `${userName ? `${userName}, you` : "You"} select the package and we contact you within 24 hours`,
      icon: Phone,
      color: "blue",
    },
    {
      day: lang === "nl" ? "Dag 2-5" : "Day 2-5",
      title: lang === "nl" ? "Content Creatie" : "Content Creation",
      description: lang === "nl" 
        ? "Professionele fotoshoot, video tour & optimalisatie woningteksten"
        : "Professional photoshoot, video tour & property text optimization",
      icon: Camera,
      color: "purple",
    },
    {
      day: lang === "nl" ? "Dag 6-7" : "Day 6-7",
      title: lang === "nl" ? "Campagne Lancering" : "Campaign Launch",
      description: lang === "nl" 
        ? "Google Ads, Facebook & Instagram campagnes gaan live"
        : "Google Ads, Facebook & Instagram campaigns go live",
      icon: Rocket,
      color: "green",
    },
    {
      day: lang === "nl" ? "Doorlopend" : "Ongoing",
      title: lang === "nl" ? "Optimalisatie & Rapportage" : "Optimization & Reporting",
      description: lang === "nl" 
        ? "Wekelijkse updates, A/B testen en continu optimaliseren"
        : "Weekly updates, A/B testing and continuous optimization",
      icon: BarChart3,
      color: "orange",
    },
  ] : [
    {
      day: lang === "nl" ? "Dag 1" : "Day 1",
      title: lang === "nl" ? "Contract & Strategie" : "Contract & Strategy",
      description: lang === "nl" 
        ? `${userName ? `${userName}, u` : "U"} tekent het exclusiviteitscontract en we plannen een strategie sessie`
        : `${userName ? `${userName}, you` : "You"} sign the exclusivity contract and we plan a strategy session`,
      icon: FileText,
      color: "emerald",
    },
    {
      day: lang === "nl" ? "Week 1" : "Week 1",
      title: lang === "nl" ? "Premium Content" : "Premium Content",
      description: lang === "nl" 
        ? "Professionele shoot, drone video, virtual tour & premium teksten"
        : "Professional shoot, drone video, virtual tour & premium copy",
      icon: Video,
      color: "purple",
    },
    {
      day: lang === "nl" ? "Week 2+" : "Week 2+",
      title: lang === "nl" ? "Volledige Marketing" : "Full Marketing",
      description: lang === "nl" 
        ? "Wij investeren ons eigen budget in alle advertentiekanalen"
        : "We invest our own budget in all advertising channels",
      icon: Target,
      color: "blue",
    },
    {
      day: lang === "nl" ? "6 Maanden" : "6 Months",
      title: lang === "nl" ? "Dedicated Service" : "Dedicated Service",
      description: lang === "nl" 
        ? "Uw persoonlijke accountmanager + prioriteit in alle listings"
        : "Your personal account manager + priority in all listings",
      icon: Crown,
      color: "amber",
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-pink-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-amber-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-yellow-500",
  };

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
      
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative flex gap-4"
          >
            {/* Timeline Node */}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[step.color]} flex items-center justify-center text-white shadow-lg z-10`}>
              <step.icon className="h-5 w-5" />
            </div>
            
            {/* Content */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">{step.day}</Badge>
              </div>
              <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function MarketingBoost({ properties, lang, userName }: MarketingBoostProps) {
  const t = getOwnerPortalTranslations(lang);
  
  // Currency rates
  const { rates, isLoading: isLoadingRates, getRate } = useCurrencyRates();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("THB");
  
  // State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [selectedPreviewProperty, setSelectedPreviewProperty] = useState<Property | null>(null);
  const [activeAdType, setActiveAdType] = useState<"facebook" | "google" | "instagram">("facebook");
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const [roadmapType, setRoadmapType] = useState<"MARKETING_FEE" | "EXCLUSIVE_CONTRACT">("MARKETING_FEE");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<"MARKETING_FEE" | "EXCLUSIVE_CONTRACT" | "STANDARD" | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [ownerNote, setOwnerNote] = useState("");
  const [exclusivityTermsAccepted, setExclusivityTermsAccepted] = useState(false);
  const [showExclusivityTermsDetail, setShowExclusivityTermsDetail] = useState(false);

  // Filter only FOR_SALE properties
  const saleProperties = useMemo(() => 
    properties.filter(p => p.type === "FOR_SALE"), 
    [properties]
  );

  // Set default preview property
  useEffect(() => {
    if (saleProperties.length > 0 && !selectedPreviewProperty) {
      setSelectedPreviewProperty(saleProperties[0]);
    }
  }, [saleProperties, selectedPreviewProperty]);

  // Convert amount to selected currency
  const convertAmount = useCallback((amountInTHB: number): number => {
    if (selectedCurrency === "THB") return amountInTHB;
    const rate = getRate(selectedCurrency);
    return rate > 0 ? amountInTHB * rate : amountInTHB;
  }, [selectedCurrency, getRate]);

  // Format amount in selected currency
  const displayAmount = useCallback((amountInTHB: number): string => {
    const converted = convertAmount(amountInTHB);
    return formatAmount(converted, selectedCurrency);
  }, [convertAmount, selectedCurrency]);

  // Testimonials
  const testimonials = useMemo(() => [
    {
      name: "Marcus V.",
      property: "Villa in Rawai",
      days: 45,
      quote: lang === "nl" 
        ? "Binnen 6 weken verkocht! De advertenties brachten precies de juiste kopers."
        : "Sold within 6 weeks! The ads brought exactly the right buyers.",
    },
    {
      name: "Lisa & Johan",
      property: "Condo Patong",
      days: 28,
      quote: lang === "nl"
        ? "Het exclusiviteitspakket was de beste beslissing. Geen risico, maximaal resultaat."
        : "The exclusivity package was the best decision. No risk, maximum result.",
    },
    {
      name: "Robert K.",
      property: "Pool Villa Chalong",
      days: 62,
      quote: lang === "nl"
        ? "De video tour maakte het verschil. Internationale kopers konden de villa 'ervaren'."
        : "The video tour made the difference. International buyers could 'experience' the villa.",
    },
  ], [lang]);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Auto-play carousel for ad types
  const adTypes: ("facebook" | "google" | "instagram")[] = ["facebook", "google", "instagram"];
  const AD_DURATION = 5000; // 5 seconds per ad
  const PROGRESS_INTERVAL = 50; // Update progress every 50ms

  useEffect(() => {
    if (isCarouselPaused || saleProperties.length === 0) return;

    // Progress animation
    const progressInterval = setInterval(() => {
      setCarouselProgress((prev) => {
        const newProgress = prev + (100 / (AD_DURATION / PROGRESS_INTERVAL));
        if (newProgress >= 100) {
          return 0;
        }
        return newProgress;
      });
    }, PROGRESS_INTERVAL);

    // Switch to next ad type
    const adInterval = setInterval(() => {
      setActiveAdType((prev) => {
        const currentIndex = adTypes.indexOf(prev);
        const nextIndex = (currentIndex + 1) % adTypes.length;
        return adTypes[nextIndex];
      });
      setCarouselProgress(0);
    }, AD_DURATION);

    return () => {
      clearInterval(progressInterval);
      clearInterval(adInterval);
    };
  }, [isCarouselPaused, saleProperties.length]);

  // Reset progress when manually changing ad type
  const handleAdTypeChange = (type: "facebook" | "google" | "instagram") => {
    setActiveAdType(type);
    setCarouselProgress(0);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/owner-portal/marketing-subscription");
      const data = await response.json();
      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const openPackageModal = (packageType: "MARKETING_FEE" | "EXCLUSIVE_CONTRACT" | "STANDARD") => {
    setSelectedPackage(packageType);
    setSelectedPropertyId("");
    setOwnerNote("");
    setExclusivityTermsAccepted(false);
    setShowExclusivityTermsDetail(false);
    setModalOpen(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPropertyId || !selectedPackage) {
      toast.error(lang === "nl" ? "Selecteer een woning" : "Please select a property");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/owner-portal/marketing-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          packageType: selectedPackage,
          ownerNote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setModalOpen(false);
        fetchSubscriptions();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error(lang === "nl" ? "Er is een fout opgetreden" : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedProperty = (): Property | undefined => {
    return saleProperties.find(p => p.id === selectedPropertyId);
  };

  const getSelectedPropertyPrice = (): number => {
    const property = getSelectedProperty();
    return property ? parsePriceToNumber(property.price) : 0;
  };

  const getAvailableProperties = () => {
    const subscribedPropertyIds = subscriptions
      .filter(s => s.status === "PENDING" || s.status === "ACTIVE")
      .map(s => s.propertyId);
    return saleProperties.filter(p => !subscribedPropertyIds.includes(p.id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          {lang === "nl" ? "In Behandeling" : "Pending"}
        </Badge>;
      case "ACTIVE":
        return <Badge className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {lang === "nl" ? "Actief" : "Active"}
        </Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-500">
          <Award className="h-3 w-3 mr-1" />
          {lang === "nl" ? "Voltooid" : "Completed"}
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const availableProperties = getAvailableProperties();
  const selectedPrice = getSelectedPropertyPrice();
  const marketingFeeAmount = selectedPrice * 0.0025; // 0.25%
  const exclusiveCommission = selectedPrice * 0.15; // 15%

  // Calculate for preview property
  const previewPrice = selectedPreviewProperty ? parsePriceToNumber(selectedPreviewProperty.price) : 0;
  const previewMarketingFee = previewPrice * 0.0025;

  // No FOR_SALE properties
  if (saleProperties.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Rocket className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {lang === "nl" 
              ? "Marketing Boost is beschikbaar voor koopwoningen" 
              : "Marketing Boost is available for sale properties"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {lang === "nl"
              ? "Dit pakket is speciaal ontworpen om uw koopwoning sneller te verkopen."
              : "This package is specially designed to help sell your property faster."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ============================================ */}
      {/* PERSONALIZED HERO */}
      {/* ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-500/30 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-white/10 text-white border-white/20 mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              {lang === "nl" ? "Exclusief voor Eigenaren" : "Exclusive for Property Owners"}
            </Badge>
            
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
              {userName 
                ? (lang === "nl" 
                    ? `${userName}, maak van uw woning een topverkoper` 
                    : `${userName}, make your property a top seller`)
                : (lang === "nl" 
                    ? "Maak van uw woning een topverkoper" 
                    : "Make your property a top seller")}
            </h1>
            
            <p className="text-base md:text-lg text-slate-300 max-w-2xl mb-6">
              {lang === "nl"
                ? `Met onze bewezen marketingstrategie verkopen woningen gemiddeld 47% sneller. ${userName ? `${userName}, ` : ""}ontdek hoe wij uw ${saleProperties[0]?.title || "woning"} in de spotlight zetten.`
                : `With our proven marketing strategy, properties sell 47% faster on average. ${userName ? `${userName}, ` : ""}discover how we'll spotlight your ${saleProperties[0]?.title || "property"}.`}
            </p>

            {/* Currency Selector */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                <span className="text-xs text-slate-400 px-2">
                  {lang === "nl" ? "Valuta:" : "Currency:"}
                </span>
                {["THB", "EUR", "USD", "GBP"].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      selectedCurrency === curr
                        ? "bg-white text-slate-900"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {CURRENCY_SYMBOLS[curr]} {curr}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8"
          >
            {[
              { icon: Award, value: "15+", label: lang === "nl" ? "Jaar Ervaring" : "Years Experience", color: "blue" },
              { icon: CheckCircle2, value: "523", label: lang === "nl" ? "Woningen Verkocht" : "Properties Sold", color: "emerald" },
              { icon: Eye, value: "12K+", label: lang === "nl" ? "Maandelijkse Bezoekers" : "Monthly Visitors", color: "purple" },
              { icon: TrendingUp, value: "47%", label: lang === "nl" ? "Sneller Verkocht" : "Faster Sales", color: "orange" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-3.5 w-3.5 text-${stat.color}-400`} />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ============================================ */}
      {/* AD PREVIEW SECTION */}
      {/* ============================================ */}
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                {lang === "nl" 
                  ? `Zo ziet uw woning eruit in onze advertenties` 
                  : `This is how your property looks in our ads`}
              </CardTitle>
              <CardDescription>
                {userName 
                  ? (lang === "nl" 
                      ? `${userName}, bekijk live hoe we uw woning promoten`
                      : `${userName}, see live how we'll promote your property`)
                  : (lang === "nl" 
                      ? "Bekijk live hoe we uw woning promoten"
                      : "See live how we'll promote your property")}
              </CardDescription>
            </div>
            
            {/* Property Selector */}
            {saleProperties.length > 1 && (
              <Select 
                value={selectedPreviewProperty?.id || ""} 
                onValueChange={(id) => setSelectedPreviewProperty(saleProperties.find(p => p.id === id) || null)}
              >
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder={lang === "nl" ? "Selecteer woning" : "Select property"} />
                </SelectTrigger>
                <SelectContent>
                  {saleProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.listingNumber || p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Carousel Progress Bars */}
          <div className="flex gap-2 mb-4">
            {[
              { id: "facebook", label: "Facebook", icon: ThumbsUp },
              { id: "google", label: "Google Ads", icon: Search },
              { id: "instagram", label: "Instagram", icon: Camera },
            ].map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => handleAdTypeChange(tab.id as any)}
                className="flex-1 group"
              >
                {/* Progress Bar */}
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className={`h-full rounded-full ${
                      activeAdType === tab.id
                        ? "bg-primary"
                        : adTypes.indexOf(activeAdType) > idx
                          ? "bg-primary"
                          : "bg-transparent"
                    }`}
                    style={{
                      width: activeAdType === tab.id 
                        ? `${carouselProgress}%` 
                        : adTypes.indexOf(activeAdType) > idx 
                          ? "100%" 
                          : "0%"
                    }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
                {/* Label */}
                <div className={`flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                  activeAdType === tab.id
                    ? "text-primary"
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}>
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Pause/Play indicator */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setIsCarouselPaused(!isCarouselPaused)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCarouselPaused ? (
                <>
                  <Play className="h-3 w-3" />
                  <span>{lang === "nl" ? "Afspelen" : "Play"}</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>{lang === "nl" ? "Auto-afspeelt..." : "Auto-playing..."}</span>
                </>
              )}
            </button>
          </div>

          {/* Ad Preview with hover pause */}
          <div 
            className="flex justify-center"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            <AnimatePresence mode="wait">
              {selectedPreviewProperty && (
                <>
                  {activeAdType === "facebook" && (
                    <FacebookAdPreview 
                      key="facebook"
                      property={selectedPreviewProperty}
                      currency={selectedCurrency}
                      displayAmount={displayAmount}
                      lang={lang}
                    />
                  )}
                  {activeAdType === "google" && (
                    <GoogleAdsPreview 
                      key="google"
                      property={selectedPreviewProperty}
                      displayAmount={displayAmount}
                      lang={lang}
                    />
                  )}
                  {activeAdType === "instagram" && (
                    <InstagramStoryPreview 
                      key="instagram"
                      property={selectedPreviewProperty}
                      displayAmount={displayAmount}
                      userName={userName}
                      lang={lang}
                    />
                  )}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Carousel Navigation Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {adTypes.map((type, idx) => (
              <button
                key={type}
                onClick={() => handleAdTypeChange(type)}
                className={`transition-all duration-300 ${
                  activeAdType === type
                    ? "w-8 h-2 bg-primary rounded-full"
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* Investment Calculation */}
          {selectedPreviewProperty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-2xl p-6"
            >
              <h3 className="font-bold text-lg mb-4 text-center">
                {lang === "nl" 
                  ? `Marketing investering voor ${selectedPreviewProperty.listingNumber || selectedPreviewProperty.title}`
                  : `Marketing investment for ${selectedPreviewProperty.listingNumber || selectedPreviewProperty.title}`}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">
                    {lang === "nl" ? "Vraagprijs" : "Asking Price"}
                  </div>
                  <div className="text-2xl font-bold">{displayAmount(previewPrice)}</div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border-2 border-blue-200 dark:border-blue-700">
                  <div className="text-sm text-muted-foreground mb-1">
                    {lang === "nl" ? "Marketing Budget (0.25%)" : "Marketing Budget (0.25%)"}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{displayAmount(previewMarketingFee)}</div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground mb-1">
                    {lang === "nl" ? "Of: Exclusiviteit" : "Or: Exclusivity"}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {displayAmount(0)} <span className="text-sm font-normal">{lang === "nl" ? "vooraf" : "upfront"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* PROBLEM SECTION */}
      {/* ============================================ */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                {userName 
                  ? (lang === "nl" 
                      ? `${userName}, wist u dit over de Phuket markt?` 
                      : `${userName}, did you know this about the Phuket market?`)
                  : (lang === "nl" 
                      ? "De realiteit van de Phuket markt" 
                      : "The reality of the Phuket market")}
              </h3>
              <p className="text-amber-700 dark:text-amber-300 mb-4">
                {lang === "nl"
                  ? "Er zijn momenteel meer dan 3.000 woningen te koop in Phuket. Zonder gerichte marketing kan uw woning maanden onopgemerkt blijven."
                  : "There are currently over 3,000 properties for sale in Phuket. Without targeted marketing, your property can go unnoticed for months."}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-amber-700 dark:text-amber-300">
                    {lang === "nl" ? "Zonder marketing: 8-14 maanden" : "Without marketing: 8-14 months"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-amber-700 dark:text-amber-300">
                    {lang === "nl" ? "Met marketing: 3-5 maanden" : "With marketing: 3-5 months"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <Card className="border-0 shadow-none bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">
              {lang === "nl" ? "Wat andere eigenaren zeggen" : "What other owners say"}
            </span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <blockquote className="text-lg italic text-slate-700 dark:text-slate-300 mb-4">
                "{testimonials[activeTestimonial].quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonials[activeTestimonial].name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{testimonials[activeTestimonial].name}</div>
                  <div className="text-sm text-muted-foreground">{testimonials[activeTestimonial].property}</div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {lang === "nl" ? "Verkocht in" : "Sold in"} {testimonials[activeTestimonial].days} {lang === "nl" ? "dagen" : "days"}
                </Badge>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeTestimonial ? "w-6 bg-primary" : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* INNOVATION BANNER */}
      {/* ============================================ */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex-shrink-0">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-2">
                {lang === "nl" 
                  ? "🚀 Innovatief: Uniek in de Phuket Vastgoedmarkt" 
                  : "🚀 Innovative: Unique in the Phuket Real Estate Market"}
              </h3>
              <p className="text-purple-700 dark:text-purple-300 mb-3">
                {lang === "nl"
                  ? "Traditionele makelaars bieden alleen een standaard listing aan en wachten af. PSM Phuket gaat verder: wij bieden u de mogelijkheid om actief te investeren in de verkoop van uw woning. Dit model wordt door geen enkele andere agency in Phuket aangeboden."
                  : "Traditional agencies only offer a standard listing and wait. PSM Phuket goes further: we offer you the opportunity to actively invest in selling your property. This model is not offered by any other agency in Phuket."}
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                <BadgeCheck className="h-4 w-4" />
                <span>{lang === "nl" ? "Eerste in Phuket met dit model" : "First in Phuket with this model"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* PACKAGE CARDS */}
      {/* ============================================ */}
      <div id="packages" className="scroll-mt-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {userName 
              ? (lang === "nl" 
                  ? `${userName}, kies uw marketingstrategie` 
                  : `${userName}, choose your marketing strategy`)
              : (lang === "nl" 
                  ? "Kies uw marketingstrategie" 
                  : "Choose your marketing strategy")}
          </h2>
          <p className="text-muted-foreground">
            {lang === "nl"
              ? "Drie opties: van standaard tot maximale zichtbaarheid"
              : "Three options: from standard to maximum visibility"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Standard Listing (No Extra Marketing) */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-slate-500"></div>
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <Home className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-600 dark:text-slate-400">
                      {lang === "nl" ? "Standaard Listing" : "Standard Listing"}
                    </CardTitle>
                    <CardDescription>
                      {lang === "nl" ? "Basis vermelding, geen extra marketing" : "Basic listing, no extra marketing"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      {lang === "nl" ? "Extra Kosten" : "Extra Costs"}
                    </div>
                    <div className="text-5xl font-bold text-slate-500">
                      {displayAmount(0)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {lang === "nl" ? "per maand" : "per month"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { text: lang === "nl" ? "Vermelding op onze website" : "Listing on our website", included: true },
                    { text: lang === "nl" ? "Basis foto's" : "Basic photos", included: true },
                    { text: "Google Ads", included: false },
                    { text: "Facebook & Instagram Ads", included: false },
                    { text: lang === "nl" ? "Premium portals" : "Premium portals", included: false },
                    { text: lang === "nl" ? "Professionele fotografie" : "Professional photography", included: false },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {item.included ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${!item.included ? "text-slate-400 line-through" : ""}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {lang === "nl"
                        ? "Gemiddelde verkooptijd: 8-14 maanden. Uw woning concurreert met 3.000+ andere listings."
                        : "Average selling time: 8-14 months. Your property competes with 3,000+ other listings."}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => openPackageModal("STANDARD")}
                  variant="outline"
                  className="w-full h-12"
                  disabled={availableProperties.length === 0}
                >
                  {lang === "nl" ? "Doorgaan Zonder Extra Marketing" : "Continue Without Extra Marketing"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Marketing Budget Package */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden border-2 hover:border-blue-400 transition-all h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              
              {/* Recommended Badge */}
              <div className="absolute -top-0 -right-0">
                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {lang === "nl" ? "AANBEVOLEN" : "RECOMMENDED"}
                </div>
              </div>
              
              <CardHeader className="pb-4 pt-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-lg">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Marketing Budget</CardTitle>
                    <CardDescription>
                      {lang === "nl" ? "U investeert maandelijks, wij adverteren" : "You invest monthly, we advertise"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      {lang === "nl" ? "Uw Maandelijkse Investering" : "Your Monthly Investment"}
                    </div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      0.25%
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {lang === "nl" ? "PER MAAND" : "PER MONTH"}
                      </Badge>
                    </div>
                    
                    {selectedPreviewProperty && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-left">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{lang === "nl" ? "Vraagprijs" : "Asking price"}:</span>
                          <span className="font-medium">{displayAmount(previewPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-blue-600">
                          <span>{lang === "nl" ? "Per maand" : "Per month"}:</span>
                          <span>{displayAmount(previewMarketingFee)}/mnd</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-center">
                          {lang === "nl" 
                            ? "Gefactureerd per maand tot verkoop" 
                            : "Billed monthly until sale"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    lang === "nl" ? "Alles van Standaard +" : "Everything from Standard +",
                    lang === "nl" ? "Google Ads campagnes" : "Google Ads campaigns",
                    "Facebook & Instagram Ads",
                    lang === "nl" ? "Premium vastgoedportals" : "Premium property portals",
                    lang === "nl" ? "Professionele fotografie" : "Professional photography",
                    lang === "nl" ? "Virtual tour video" : "Virtual tour video",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className={`text-sm ${idx === 0 ? "font-semibold" : ""}`}>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {lang === "nl"
                        ? "Gemiddelde verkooptijd: 3-5 maanden. 47% sneller dan zonder marketing!"
                        : "Average selling time: 3-5 months. 47% faster than without marketing!"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setRoadmapType("MARKETING_FEE");
                      setShowRoadmap(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {lang === "nl" ? "Bekijk Roadmap" : "View Roadmap"}
                  </Button>
                  
                  <Button 
                    onClick={() => openPackageModal("MARKETING_FEE")}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg shadow-lg"
                    disabled={availableProperties.length === 0}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {lang === "nl" ? "Start Campagne" : "Start Campaign"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Exclusive Contract Package */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden border-2 border-emerald-400 shadow-xl h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              
              <div className="absolute -top-0 -right-0">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  {lang === "nl" ? "MEEST GEKOZEN" : "MOST POPULAR"}
                </div>
              </div>
              
              <CardHeader className="pb-4 pt-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
                    <Handshake className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {lang === "nl" ? "Exclusiviteit Deal" : "Exclusivity Deal"}
                    </CardTitle>
                    <CardDescription>
                      {lang === "nl" ? "Wij nemen het risico" : "We take the risk"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      {lang === "nl" ? "Nu Betalen" : "Pay Now"}
                    </div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {displayAmount(0)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      15% {lang === "nl" ? "commissie alleen bij verkoop" : "commission only on sale"}
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                      <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold">
                        <Shield className="h-4 w-4" />
                        {lang === "nl" ? "Geen verkoop = Geen kosten" : "No sale = No cost"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXCLUSIVE BENEFITS - Categorized */}
                <div className="space-y-3">
                  {/* Category: Network & Events */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-sm text-purple-800 dark:text-purple-200">
                        {lang === "nl" ? "Exclusief Netwerk" : "Exclusive Network"}
                      </span>
                    </div>
                    <div className="space-y-1.5 pl-6">
                      {[
                        lang === "nl" 
                          ? "Uitnodiging exclusieve investeerders events" 
                          : "Invitation to exclusive investor events",
                        lang === "nl" 
                          ? "Presentatie aan 500+ actieve investeerders" 
                          : "Presentation to 500+ active investors",
                        lang === "nl" 
                          ? "Cross-listing bij 15+ Phuket agencies" 
                          : "Cross-listing with 15+ Phuket agencies",
                        lang === "nl" 
                          ? "Internationaal netwerk exposure" 
                          : "International network exposure",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-purple-700 dark:text-purple-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category: Marketing */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                        {lang === "nl" ? "Premium Marketing" : "Premium Marketing"}
                      </span>
                    </div>
                    <div className="space-y-1.5 pl-6">
                      {[
                        lang === "nl" 
                          ? "Alle Marketing Budget voordelen inclusief" 
                          : "All Marketing Budget benefits included",
                        lang === "nl" 
                          ? "€5.000+ investering vooraf door ons" 
                          : "€5,000+ upfront investment by us",
                        lang === "nl" 
                          ? "Drone video & 3D virtual tour" 
                          : "Drone video & 3D virtual tour",
                        lang === "nl" 
                          ? "Featured op homepage & social media" 
                          : "Featured on homepage & social media",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-blue-700 dark:text-blue-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category: VIP Service */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-200">
                        {lang === "nl" ? "VIP Service" : "VIP Service"}
                      </span>
                    </div>
                    <div className="space-y-1.5 pl-6">
                      {[
                        lang === "nl" 
                          ? "Dedicated accountmanager" 
                          : "Dedicated account manager",
                        lang === "nl" 
                          ? "Wekelijkse voortgangsrapportage" 
                          : "Weekly progress reports",
                        lang === "nl" 
                          ? "Prioriteit bij bezichtigingen" 
                          : "Priority for viewings",
                        lang === "nl" 
                          ? "Juridische ondersteuning" 
                          : "Legal support",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-emerald-700 dark:text-emerald-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Important Contract Terms Warning */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 border-l-4 border-amber-500">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
                        {lang === "nl" ? "Belangrijke Voorwaarde" : "Important Condition"}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {lang === "nl"
                          ? "Door onze grote marketing-exposure is er kans dat een andere agency uw woning verkoopt. In dat geval verwijst u deze naar ons door."
                          : "Due to our extensive marketing exposure, another agency may sell your property. In that case, you must refer them to us."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setRoadmapType("EXCLUSIVE_CONTRACT");
                      setShowRoadmap(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {lang === "nl" ? "Bekijk Roadmap" : "View Roadmap"}
                  </Button>
                  
                  <Button 
                    onClick={() => openPackageModal("EXCLUSIVE_CONTRACT")}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg shadow-lg"
                    disabled={availableProperties.length === 0}
                  >
                    <Handshake className="h-5 w-5 mr-2" />
                    {lang === "nl" ? "Teken Contract" : "Sign Contract"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ACTIVE SUBSCRIPTIONS */}
      {/* ============================================ */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              {lang === "nl" ? "Uw Actieve Pakketten" : "Your Active Packages"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      sub.packageType === "MARKETING_FEE" 
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
                        : "bg-gradient-to-br from-emerald-500 to-teal-500"
                    }`}>
                      {sub.packageType === "MARKETING_FEE" ? (
                        <Target className="h-5 w-5 text-white" />
                      ) : (
                        <Handshake className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {sub.property.listingNumber} - {sub.property.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sub.packageType === "MARKETING_FEE" 
                          ? `Marketing: ${displayAmount(sub.calculatedAmount || 0)}`
                          : `${lang === "nl" ? "Exclusiviteit" : "Exclusivity"}: 15%`
                        }
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No properties warning */}
      {availableProperties.length === 0 && saleProperties.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {lang === "nl" 
                  ? "Al uw woningen hebben al een marketing pakket." 
                  : "All your properties already have a marketing package."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* ROADMAP DIALOG */}
      {/* ============================================ */}
      <Dialog open={showRoadmap} onOpenChange={setShowRoadmap}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {lang === "nl" ? "Wat gebeurt er na akkoord?" : "What happens after agreement?"}
            </DialogTitle>
            <DialogDescription>
              {userName 
                ? (lang === "nl" 
                    ? `${userName}, dit is uw persoonlijke roadmap`
                    : `${userName}, this is your personal roadmap`)
                : (lang === "nl" 
                    ? "Uw stapsgewijze roadmap naar een snelle verkoop"
                    : "Your step-by-step roadmap to a fast sale")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <MarketingRoadmap 
              packageType={roadmapType} 
              lang={lang} 
              userName={userName}
            />
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowRoadmap(false)} variant="outline">
              {lang === "nl" ? "Sluiten" : "Close"}
            </Button>
            <Button 
              onClick={() => {
                setShowRoadmap(false);
                openPackageModal(roadmapType);
              }}
              className={roadmapType === "MARKETING_FEE" 
                ? "bg-gradient-to-r from-blue-600 to-cyan-600" 
                : "bg-gradient-to-r from-emerald-600 to-teal-600"
              }
            >
              {lang === "nl" ? "Start Nu" : "Start Now"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* PACKAGE SELECTION MODAL */}
      {/* ============================================ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selectedPackage === "MARKETING_FEE" ? (
                <>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  {lang === "nl" ? "Marketing Budget Activeren" : "Activate Marketing Budget"}
                </>
              ) : selectedPackage === "EXCLUSIVE_CONTRACT" ? (
                <>
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                    <Handshake className="h-5 w-5 text-white" />
                  </div>
                  {lang === "nl" ? "Exclusiviteit Deal Tekenen" : "Sign Exclusivity Deal"}
                </>
              ) : (
                <>
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <Home className="h-5 w-5 text-slate-500" />
                  </div>
                  {lang === "nl" ? "Standaard Listing Bevestigen" : "Confirm Standard Listing"}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPackage === "STANDARD" ? (
                lang === "nl" 
                  ? "U kiest ervoor om zonder extra marketing door te gaan. U kunt dit later altijd wijzigen."
                  : "You choose to continue without extra marketing. You can always change this later."
              ) : (
                userName 
                  ? (lang === "nl" 
                      ? `${userName}, selecteer de woning waarvoor u dit pakket wilt activeren.`
                      : `${userName}, select the property for which you want to activate this package.`)
                  : (lang === "nl" 
                      ? "Selecteer de woning waarvoor u dit pakket wilt activeren."
                      : "Select the property for which you want to activate this package.")
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Info for Standard Package */}
            {selectedPackage === "STANDARD" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      {lang === "nl" ? "Wat dit betekent:" : "What this means:"}
                    </h4>
                    <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                      <li>• {lang === "nl" ? "Geen actieve Google/Facebook advertenties" : "No active Google/Facebook ads"}</li>
                      <li>• {lang === "nl" ? "Alleen basis vermelding op onze website" : "Only basic listing on our website"}</li>
                      <li>• {lang === "nl" ? "Gemiddelde verkooptijd: 8-14 maanden" : "Average selling time: 8-14 months"}</li>
                      <li>• {lang === "nl" ? "U kunt altijd upgraden naar een marketing pakket" : "You can always upgrade to a marketing package"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Currency Selector - only for paid packages */}
            {selectedPackage !== "STANDARD" && (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {lang === "nl" ? "Valuta:" : "Currency:"}
                </span>
                <div className="flex gap-1">
                  {["THB", "EUR", "USD"].map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        selectedCurrency === curr
                          ? "bg-primary text-white"
                          : "bg-white dark:bg-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {CURRENCY_SYMBOLS[curr]} {curr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-base">
                {lang === "nl" ? "Selecteer Woning" : "Select Property"}
              </Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={lang === "nl" ? "Kies een woning..." : "Choose a property..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.listingNumber || property.title} - {property.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPropertyId && selectedPackage !== "STANDARD" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl ${
                  selectedPackage === "MARKETING_FEE" 
                    ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200" 
                    : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200"
                }`}
              >
                <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-muted-foreground mb-1">
                    {lang === "nl" ? "Vraagprijs Woning" : "Property Asking Price"}
                  </div>
                  <div className="text-2xl font-bold">{displayAmount(selectedPrice)}</div>
                </div>
                
                {selectedPackage === "MARKETING_FEE" ? (
                  <>
                    <div className="text-sm text-muted-foreground mb-1">
                      {lang === "nl" ? "Uw Maandelijkse Marketing Investering" : "Your Monthly Marketing Investment"} (0.25%)
                    </div>
                    <div className="text-4xl font-bold text-blue-600">
                      {displayAmount(marketingFeeAmount)}<span className="text-lg font-normal text-muted-foreground">/mnd</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {lang === "nl" 
                        ? "Gefactureerd per maand tot verkoop. U kunt op elk moment opzeggen." 
                        : "Billed monthly until sale. You can cancel at any time."}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground mb-1">
                      {lang === "nl" ? "Nu Betalen" : "Pay Now"}
                    </div>
                    <div className="text-4xl font-bold text-emerald-600">{displayAmount(0)}</div>
                    <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        {lang === "nl" ? "Bij Verkoop" : "On Sale"} (15%)
                      </div>
                      <div className="text-xl font-bold text-emerald-600">{displayAmount(exclusiveCommission)}</div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* EXCLUSIVITY TERMS - Only for Exclusive Contract */}
            {selectedPackage === "EXCLUSIVE_CONTRACT" && selectedPropertyId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-3">
                        {lang === "nl" 
                          ? "⚠️ Exclusiviteitsvoorwaarden - Lees Zorgvuldig" 
                          : "⚠️ Exclusivity Terms - Read Carefully"}
                      </h4>
                      
                      <div className="text-sm text-amber-700 dark:text-amber-300 space-y-3">
                        <p>
                          {lang === "nl"
                            ? "PSM Phuket investeert aanzienlijke middelen (€5.000+) in de marketing van uw woning. Door onze grote bekendheid, uitgebreide exposure en samenwerking met 15+ partner agencies bereiken wij duizenden potentiële kopers."
                            : "PSM Phuket invests significant resources (€5,000+) in marketing your property. Through our large reputation, extensive exposure and collaboration with 15+ partner agencies, we reach thousands of potential buyers."}
                        </p>
                        
                        <button
                          type="button"
                          onClick={() => setShowExclusivityTermsDetail(!showExclusivityTermsDetail)}
                          className="text-amber-600 dark:text-amber-400 font-medium underline text-sm"
                        >
                          {showExclusivityTermsDetail 
                            ? (lang === "nl" ? "Verberg details ▲" : "Hide details ▲")
                            : (lang === "nl" ? "Toon volledige voorwaarden ▼" : "Show full terms ▼")}
                        </button>

                        {showExclusivityTermsDetail && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="border-t border-amber-300 dark:border-amber-600 pt-3 mt-2"
                          >
                            <p className="font-medium mb-2">
                              {lang === "nl" ? "Dit betekent concreet:" : "This specifically means:"}
                            </p>
                            
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">1.</span>
                                <span>
                                  {lang === "nl"
                                    ? "Door onze explosieve marketing en groot netwerk is de kans groot dat uw woning wordt verkocht via een van onze partner agencies of andere makelaars die profiteren van ons marketingverkeer."
                                    : "Due to our explosive marketing and large network, there is a high chance your property will be sold through one of our partner agencies or other agents benefiting from our marketing traffic."}
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">2.</span>
                                <span>
                                  {lang === "nl"
                                    ? "Als een andere agency contact met u opneemt over een potentiële koper, bent u verplicht deze agency direct naar PSM Phuket door te verwijzen."
                                    : "If another agency contacts you about a potential buyer, you are required to immediately refer that agency to PSM Phuket."}
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">3.</span>
                                <span>
                                  {lang === "nl"
                                    ? "U mag uw woning niet verkopen via een andere makelaar zonder tussenkomst van PSM Phuket. Wij regelen de zakelijke afhandeling met de betreffende agency."
                                    : "You may not sell your property through another agent without PSM Phuket's involvement. We will handle the business arrangements with the relevant agency."}
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">4.</span>
                                <span>
                                  {lang === "nl"
                                    ? "Dit beschermt onze marketing-investering en zorgt ervoor dat u profiteert van onze expertise gedurende het hele verkoopproces."
                                    : "This protects our marketing investment and ensures you benefit from our expertise throughout the entire sales process."}
                                </span>
                              </li>
                            </ul>
                            
                            <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                                {lang === "nl"
                                  ? "💡 Waarom is dit belangrijk? Wij investeren duizenden euro's vooraf in uw marketing. Als een andere makelaar uw woning verkoopt dankzij onze marketing-inspanningen, moeten wij dit zakelijk kunnen afwikkelen om verliezen te voorkomen."
                                  : "💡 Why is this important? We invest thousands of euros upfront in your marketing. If another agent sells your property thanks to our marketing efforts, we need to handle this commercially to prevent losses."}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Required Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="exclusivity-terms"
                    checked={exclusivityTermsAccepted}
                    onChange={(e) => setExclusivityTermsAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="exclusivity-terms" className="text-sm cursor-pointer">
                    <span className="font-medium">
                      {lang === "nl"
                        ? "Ik heb de exclusiviteitsvoorwaarden gelezen en begrepen"
                        : "I have read and understood the exclusivity terms"}
                    </span>
                    <span className="block text-muted-foreground mt-1">
                      {lang === "nl"
                        ? "Ik begrijp dat ik verplicht ben om andere agencies die mij benaderen door te verwijzen naar PSM Phuket, en dat ik mijn woning niet mag verkopen via een andere makelaar zonder tussenkomst van PSM Phuket."
                        : "I understand that I am required to refer any other agencies that approach me to PSM Phuket, and that I may not sell my property through another agent without PSM Phuket's involvement."}
                    </span>
                  </label>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label>{lang === "nl" ? "Opmerking (optioneel)" : "Note (optional)"}</Label>
              <Textarea
                value={ownerNote}
                onChange={(e) => setOwnerNote(e.target.value)}
                placeholder={selectedPackage === "STANDARD" 
                  ? (lang === "nl" ? "Waarom geen extra marketing?" : "Why no extra marketing?")
                  : (lang === "nl" ? "Eventuele opmerkingen..." : "Any comments...")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              {lang === "nl" ? "Annuleren" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubscribe} 
              disabled={
                submitting || 
                !selectedPropertyId || 
                (selectedPackage === "EXCLUSIVE_CONTRACT" && !exclusivityTermsAccepted)
              }
              className={
                selectedPackage === "MARKETING_FEE" 
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600" 
                  : selectedPackage === "EXCLUSIVE_CONTRACT"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                    : "bg-slate-600 hover:bg-slate-700"
              }
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {selectedPackage === "STANDARD" 
                ? (lang === "nl" ? "Doorgaan Zonder Marketing" : "Continue Without Marketing")
                : selectedPackage === "EXCLUSIVE_CONTRACT"
                  ? (lang === "nl" ? "Teken Exclusief Contract" : "Sign Exclusive Contract")
                  : (lang === "nl" ? "Bevestigen" : "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

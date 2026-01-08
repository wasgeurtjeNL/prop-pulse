"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Home,
  DollarSign,
  CheckCircle2,
  Clock,
  MapPin,
  Bed,
  Bath,
  Square,
  ExternalLink,
  AlertTriangle,
  Phone,
  Minus,
  Plus,
  BarChart3,
  Calendar,
  MessageCircle,
  Rocket,
  Lightbulb,
  Settings,
  Gift,
  Gavel,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPropertyUrl } from "@/lib/property-url";
import {
  OwnerPortalLanguage,
  detectOwnerPortalLanguage,
  getOwnerPortalTranslations,
  ownerPortalLanguages,
} from "@/lib/i18n/owner-portal-translations";
import PropertyStats from "./property-stats";
import PropertyAvailability from "./property-availability";
import MessageCenter from "./message-center";
import MarketingBoost from "./marketing-boost";
import OffersTab from "./offers-tab";
import UrgencyDashboard from "./urgency-dashboard";
import ROICalculator from "./roi-calculator";
import SuccessStories from "./success-stories";
import ReferralProgram from "./referral-program";
import SalesProgress from "./sales-progress";
import CompetitorComparison from "./competitor-comparison";
import NotificationPreferences from "./notification-preferences";

interface Property {
  id: string;
  title: string;
  slug: string;
  provinceSlug: string | null;
  areaSlug: string | null;
  listingNumber: string | null;
  location: string;
  price: string;
  status: "ACTIVE" | "INACTIVE" | "SOLD" | "RENTED";
  type: "FOR_SALE" | "FOR_RENT";
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  createdAt: string;
  updatedAt: string;
  biddingEnabled?: boolean;
  pendingPriceRequest?: {
    requestedPrice: string;
    status: string;
    createdAt: string;
  };
}

interface OwnerPortalContentProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Price step values in THB
const PRICE_STEPS = {
  SMALL: 500000,  // 500K
  LARGE: 1000000, // 1M
};

// Parse price string to number (handles various formats)
function parsePriceToNumber(priceStr: string): number {
  // Remove currency symbols, commas, spaces
  const cleaned = priceStr.replace(/[฿$€£,\s]/g, "").replace(/THB/i, "");
  // Extract just the number part
  const match = cleaned.match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  return 0;
}

// Format number as THB price
function formatPrice(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OwnerPortalContent({ user }: OwnerPortalContentProps) {
  // Language state
  const [lang, setLang] = useState<OwnerPortalLanguage>("en");
  const t = getOwnerPortalTranslations(lang);

  // Initialize language on mount
  useEffect(() => {
    const browserLang = detectOwnerPortalLanguage();
    setLang(browserLang);
  }, []);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Price change modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerNote, setOwnerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [priceChangeResult, setPriceChangeResult] = useState<{
    requiresApproval: boolean;
    percentageChange: number;
  } | null>(null);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Active tab and selected property for stats/availability
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<Property | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/owner-portal/properties");
      const data = await response.json();

      if (response.ok) {
        setProperties(data.properties || []);
      } else {
        toast.error(data.error || "Failed to fetch properties");
      }
    } catch (error) {
      toast.error("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  const openPriceModal = (property: Property) => {
    setSelectedProperty(property);
    // Parse current price to start with
    const currentPrice = parsePriceToNumber(property.price);
    setNewPriceValue(currentPrice);
    setOwnerPhone("");
    setOwnerNote("");
    setPriceChangeResult(null);
    setPriceModalOpen(true);
  };

  const openStatusModal = (property: Property) => {
    setSelectedProperty(property);
    setNewStatus("");
    setStatusModalOpen(true);
  };

  const adjustPrice = (amount: number) => {
    setNewPriceValue((prev) => {
      const newValue = prev + amount;
      // Don't allow negative prices
      return newValue > 0 ? newValue : prev;
    });
  };

  const getCurrentPrice = (): number => {
    if (!selectedProperty) return 0;
    return parsePriceToNumber(selectedProperty.price);
  };

  const getPriceChange = (): { amount: number; percentage: number } => {
    const currentPrice = getCurrentPrice();
    const amount = newPriceValue - currentPrice;
    const percentage = currentPrice > 0 ? (amount / currentPrice) * 100 : 0;
    return { amount, percentage };
  };

  const handlePriceChange = async () => {
    if (!selectedProperty || newPriceValue <= 0) {
      toast.error(t.enterValidPrice);
      return;
    }

    const currentPrice = getCurrentPrice();
    if (newPriceValue === currentPrice) {
      toast.error(t.priceSameAsCurrent);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/owner-portal/properties/${selectedProperty.id}/price`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPrice: formatPrice(newPriceValue),
            ownerPhone: ownerPhone || null,
            ownerNote: ownerNote || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.applied) {
          toast.success(t.priceUpdated);
          setPriceModalOpen(false);
          fetchProperties();
        } else {
          toast.success(t.requestSubmitted);
          setPriceModalOpen(false);
          fetchProperties();
        }
      } else {
        if (data.requiresApproval && !ownerPhone) {
          setPriceChangeResult({
            requiresApproval: true,
            percentageChange: data.percentageChange,
          });
          toast.error(t.enterPhoneForChange);
        } else {
          toast.error(data.error || t.failedToUpdatePrice);
        }
      }
    } catch (error) {
      toast.error(t.failedToUpdatePrice);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedProperty || !newStatus) {
      toast.error(t.selectStatusError);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/owner-portal/properties/${selectedProperty.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(`${t.markedAs} ${newStatus.toLowerCase()}`);
        setStatusModalOpen(false);
        fetchProperties();
      } else {
        toast.error(data.error || t.failedToUpdateStatus);
      }
    } catch (error) {
      toast.error(t.failedToUpdateStatus);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">{t.active}</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">{t.inactive}</Badge>;
      case "SOLD":
        return <Badge className="bg-blue-500">{t.sold}</Badge>;
      case "RENTED":
        return <Badge className="bg-purple-500">{t.rented}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Build property URL using the utility function
  const getPropertyLink = (property: Property): string => {
    return getPropertyUrl({
      provinceSlug: property.provinceSlug,
      areaSlug: property.areaSlug,
      slug: property.slug,
    });
  };

  const handleLanguageChange = (newLang: OwnerPortalLanguage) => {
    setLang(newLang);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const priceChange = getPriceChange();

  return (
    <div className="space-y-8">
      {/* Language Selector */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t.language}:</span>
          <div className="flex gap-1">
            {ownerPortalLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                  ${
                    lang === language.code
                      ? "bg-primary text-white"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
              >
                <span>{language.flag}</span>
                <span>{language.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.welcome}, {user.name}</h1>
          <p className="text-muted-foreground mt-1">
            {t.subtitle}
          </p>
        </div>
        <Badge variant="outline" className="text-sm py-2 px-4">
          <Home className="h-4 w-4 mr-2" />
          {properties.length} {properties.length !== 1 ? t.propertiesCount : t.propertyCount}
        </Badge>
      </div>

      {/* Main Tabs - Improved Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-2 mb-6 overflow-x-auto">
          <TabsList className="flex w-full bg-transparent gap-1 h-auto min-w-max">
            <TabsTrigger 
              value="overview" 
              className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl transition-all"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t.tabOverview}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl transition-all"
              disabled={properties.length === 0}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{lang === "nl" ? "Inzichten" : "Insights"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl transition-all"
              disabled={properties.length === 0}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t.tabStatistics}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t.tabMessages}</span>
            </TabsTrigger>
            {/* Marketing Tab - Only show if there are FOR_SALE properties */}
            {properties.some(p => p.type === "FOR_SALE") && (
              <TabsTrigger 
                value="marketing" 
                className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl transition-all relative group"
              >
                <Rocket className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">{t.tabMarketing}</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse group-data-[state=active]:bg-white"></span>
              </TabsTrigger>
            )}
            {/* Offers Tab - Only show if there are FOR_SALE properties */}
            {properties.some(p => p.type === "FOR_SALE") && (
              <TabsTrigger 
                value="offers" 
                className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl transition-all"
              >
                <Gavel className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">{lang === "nl" ? "Biedingen" : "Offers"}</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="referral" 
              className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl transition-all"
            >
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{lang === "nl" ? "Referral" : "Referral"}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl transition-all"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{lang === "nl" ? "Instellingen" : "Settings"}</span>
            </TabsTrigger>
            {properties.filter(p => p.type === "FOR_RENT").length > 0 && (
              <TabsTrigger 
                value="availability" 
                className="flex items-center justify-center gap-2 py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-xl transition-all"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{t.tabAvailability}</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Overview Tab - With Urgency Dashboard */}
        <TabsContent value="overview" className="space-y-6">
          {/* Urgency Dashboard - Only show if there are FOR_SALE properties */}
          {properties.some(p => p.type === "FOR_SALE") && (
            <UrgencyDashboard
              properties={properties.filter(p => p.type === "FOR_SALE").map(p => ({
                id: p.id,
                title: p.title,
                listingNumber: p.listingNumber,
                price: p.price,
                type: p.type,
                status: p.status,
              }))}
              userName={user.name}
              lang={lang}
              onUpgradeClick={() => setActiveTab("marketing")}
            />
          )}

          {/* Sales Progress */}
          {properties.some(p => p.type === "FOR_SALE") && (
            <SalesProgress
              properties={properties.filter(p => p.type === "FOR_SALE").map(p => ({
                id: p.id,
                title: p.title,
                listingNumber: p.listingNumber,
                status: p.status,
                createdAt: p.createdAt,
              }))}
              lang={lang}
              onUpgradeClick={() => setActiveTab("marketing")}
            />
          )}

          {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Home className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mt-4">{t.noPropertiesTitle}</h2>
            <p className="text-muted-foreground mt-2">
              {t.noPropertiesDesc}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              {/* Property Image */}
              <div className="relative h-48 bg-muted">
                <Image
                  src={property.image || "/placeholder-property.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3">
                  {getStatusBadge(property.status)}
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs">
                    {property.listingNumber || "N/A"}
                  </Badge>
                </div>
                {property.pendingPriceRequest && (
                  <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/90 text-white py-2 px-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {t.priceChangeInProgress}: {property.pendingPriceRequest.requestedPrice}
                    </span>
                  </div>
                )}
              </div>

              {/* Property Info */}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {property.location}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price & Type */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{property.price}</span>
                  <Badge variant="outline">
                    {property.type === "FOR_SALE" ? t.forSale : t.forRent}
                  </Badge>
                </div>

                {/* Property Stats */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" /> {property.beds} {t.bedrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" /> {property.baths} {t.bathrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Square className="h-4 w-4" /> {property.sqft} m²
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {property.status === "ACTIVE" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openPriceModal(property)}
                        disabled={!!property.pendingPriceRequest}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        {t.adjustPrice}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => openStatusModal(property)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {property.type === "FOR_SALE" ? t.markAsSold : t.markAsRented}
                      </Button>
                    </>
                  )}
                  {(property.status === "SOLD" || property.status === "RENTED") && (
                    <div className="flex-1 text-center py-2 text-sm text-muted-foreground">
                      {property.status === "SOLD" ? t.propertyIsSold : t.propertyIsRented}
                    </div>
                  )}
                </div>

                {/* Quick Action Links */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedPropertyForDetails(property);
                      setActiveTab("statistics");
                    }}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {t.tabStatistics}
                  </Button>
                  {property.type === "FOR_RENT" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setSelectedPropertyForDetails(property);
                        setActiveTab("availability");
                      }}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {t.tabAvailability}
                    </Button>
                  )}
                </div>

                {/* View Link - using correct URL */}
                <Link
                  href={getPropertyLink(property)}
                  target="_blank"
                  className="text-sm text-primary hover:underline flex items-center gap-1 justify-center"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t.viewOnWebsite}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          {properties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t.noPropertiesDesc}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Property Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.statsTitle}</CardTitle>
                  <CardDescription>{t.statsSubtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedPropertyForDetails?.id || ""}
                    onValueChange={(id) => {
                      const prop = properties.find((p) => p.id === id);
                      setSelectedPropertyForDetails(prop || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property..." />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.listingNumber || prop.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedPropertyForDetails ? (
                <PropertyStats
                  propertyId={selectedPropertyForDetails.id}
                  propertyTitle={selectedPropertyForDetails.title}
                  lang={lang}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Select a property to view statistics
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability">
          {properties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t.noPropertiesDesc}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Property Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.availabilityTitle}</CardTitle>
                  <CardDescription>{t.availabilitySubtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedPropertyForDetails?.id || ""}
                    onValueChange={(id) => {
                      const prop = properties.find((p) => p.id === id);
                      setSelectedPropertyForDetails(prop || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property..." />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.filter(p => p.type === "FOR_RENT").map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.listingNumber || prop.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedPropertyForDetails ? (
                <PropertyAvailability
                  propertyId={selectedPropertyForDetails.id}
                  propertyTitle={selectedPropertyForDetails.title}
                  propertyType={selectedPropertyForDetails.type}
                  lang={lang}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Select a rental property to manage availability
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <MessageCenter
            lang={lang}
            properties={properties.map((p) => ({
              id: p.id,
              title: p.title,
              listingNumber: p.listingNumber,
            }))}
          />
        </TabsContent>

        {/* Marketing Boost Tab - Only for FOR_SALE properties */}
        <TabsContent value="marketing">
          <MarketingBoost
            lang={lang}
            userName={user.name}
            properties={properties.map((p) => ({
              id: p.id,
              title: p.title,
              listingNumber: p.listingNumber,
              price: p.price,
              type: p.type,
              images: p.image ? [{ url: p.image }] : [],
              bedrooms: p.beds,
              bathrooms: p.baths,
              area: p.location ? { name: p.location.split(",")[0] } : null,
            }))}
          />
        </TabsContent>

        {/* Offers Tab - Bidding system */}
        <TabsContent value="offers">
          <OffersTab
            properties={properties.filter(p => p.type === "FOR_SALE").map(p => ({
              id: p.id,
              title: p.title,
              listingNumber: p.listingNumber,
              price: p.price,
              type: p.type,
              biddingEnabled: p.biddingEnabled,
            }))}
            lang={lang}
          />
        </TabsContent>

        {/* Insights Tab - ROI Calculator, Competitor Comparison, Success Stories */}
        <TabsContent value="insights" className="space-y-6">
          {/* ROI Calculator */}
          <ROICalculator
            properties={properties.filter(p => p.type === "FOR_SALE").map(p => ({
              id: p.id,
              title: p.title,
              listingNumber: p.listingNumber,
              price: p.price,
            }))}
            lang={lang}
            onUpgradeClick={() => setActiveTab("marketing")}
          />

          {/* Competitor Comparison */}
          <CompetitorComparison
            properties={properties.filter(p => p.type === "FOR_SALE").map(p => ({
              id: p.id,
              title: p.title,
              listingNumber: p.listingNumber,
              price: p.price,
              location: p.location,
              beds: p.beds,
              baths: p.baths,
              sqft: p.sqft,
            }))}
            lang={lang}
            onUpgradeClick={() => setActiveTab("marketing")}
          />

          {/* Success Stories */}
          <SuccessStories lang={lang} />
        </TabsContent>

        {/* Referral Tab */}
        <TabsContent value="referral">
          <ReferralProgram
            userName={user.name}
            userId={user.id}
            lang={lang}
          />
        </TabsContent>

        {/* Settings Tab - Notification Preferences */}
        <TabsContent value="settings">
          <NotificationPreferences
            userId={user.id}
            lang={lang}
          />
        </TabsContent>
      </Tabs>

      {/* Price Change Modal */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.priceModalTitle}</DialogTitle>
            <DialogDescription>
              {t.priceModalDesc} {selectedProperty?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-4">
              {/* Current Price */}
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{t.currentPrice}</p>
                <p className="text-2xl font-bold">{selectedProperty.price}</p>
              </div>

              {/* New Price Display */}
              <div className="bg-primary/5 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">{t.newPrice}</p>
                <p className="text-3xl font-bold text-primary">
                  ฿{formatPrice(newPriceValue)}
                </p>
                {priceChange.amount !== 0 && (
                  <p className={`text-sm mt-1 ${priceChange.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {priceChange.amount > 0 ? "+" : ""}฿{formatPrice(priceChange.amount)} ({priceChange.percentage.toFixed(1)}%)
                  </p>
                )}
              </div>

              {/* Price Adjustment Buttons */}
              <div className="space-y-3">
                <Label>{t.adjustPriceLabel}</Label>
                
                {/* Large steps: 1 Million */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => adjustPrice(-PRICE_STEPS.LARGE)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    1.000.000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                    onClick={() => adjustPrice(PRICE_STEPS.LARGE)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    1.000.000
                  </Button>
                </div>

                {/* Small steps: 500K */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => adjustPrice(-PRICE_STEPS.SMALL)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    500.000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                    onClick={() => adjustPrice(PRICE_STEPS.SMALL)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    500.000
                  </Button>
                </div>

                {/* Manual input for custom amount */}
                <div className="pt-2">
                  <Label htmlFor="customPrice" className="text-xs text-muted-foreground">
                    {t.orEnterExactPrice}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <span className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">฿</span>
                    <Input
                      id="customPrice"
                      type="number"
                      placeholder="12500000"
                      className="rounded-l-none"
                      value={newPriceValue || ""}
                      onChange={(e) => setNewPriceValue(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {priceChangeResult?.requiresApproval && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-500">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {t.approvalRequired}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {t.approvalRequiredDesc} (
                        {priceChangeResult.percentageChange.toFixed(1)}%) {t.approvalRequiredDesc2}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ownerPhone">
                  <Phone className="h-3 w-3 inline mr-1" />
                  {t.phoneNumber} {priceChangeResult?.requiresApproval && "*"}
                </Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  placeholder="+66 XX XXX XXXX"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerNote">{t.noteOptional}</Label>
                <Textarea
                  id="ownerNote"
                  placeholder={t.notePlaceholder}
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPriceModalOpen(false)}
                  disabled={submitting}
                >
                  {t.cancel}
                </Button>
                <Button onClick={handlePriceChange} disabled={submitting || newPriceValue === getCurrentPrice()}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  {t.adjustPrice}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.statusModalTitle}</DialogTitle>
            <DialogDescription>
              {t.statusModalDesc} {selectedProperty?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.newStatus}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProperty.type === "FOR_SALE" ? (
                      <SelectItem value="SOLD">{t.sold}</SelectItem>
                    ) : (
                      <SelectItem value="RENTED">{t.rented}</SelectItem>
                    )}
                    <SelectItem value="INACTIVE">{t.temporarilyOffMarket}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{lang === "nl" ? "Let op:" : "Note:"}</strong> {t.statusNote}
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setStatusModalOpen(false)}
                  disabled={submitting}
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleStatusChange}
                  disabled={submitting || !newStatus}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {t.confirm}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

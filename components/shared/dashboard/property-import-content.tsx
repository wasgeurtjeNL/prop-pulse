"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Search, 
  Download, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Home,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Tag,
  Image as ImageIcon,
  Sparkles,
  List,
  FileText,
  X,
  CheckCircle,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Building,
  Globe
} from "lucide-react";
import Image from "next/image";
import { getPropertyUrl } from "@/lib/property-url";

interface PropertyData {
  title: string;
  slug: string; // SEO-optimized slug
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  type: "FOR_SALE" | "FOR_RENT";
  category: "LUXURY_VILLA" | "APARTMENT" | "RESIDENTIAL_HOME" | "OFFICE_SPACES";
  tag: string;
  shortDescription: string;
  content: string;
  contentHtml?: string;
  descriptionParagraphs?: string[];
  propertyFeatures?: Array<{ title: string; description: string; icon: string }>;
  amenities: string[];
  amenitiesWithIcons: Array<{ name: string; icon: string }>;
  images: string[];
  garage?: number;
  lotSize?: number;
  yearBuilt?: number;
  sourceUrl: string;
  isOptimized?: boolean;
  relatedProperties?: Array<{ title: string; slug: string; price: string; image: string }>;
}

interface ScrapeResult {
  success: boolean;
  data: PropertyData;
  validation: {
    isValid: boolean;
    issues: string[];
  };
  stats: {
    textLength: number;
    imagesFound: number;
    contentOptimized?: boolean;
    companyProfileUsed?: boolean;
  };
}

interface ImportResult {
  success: boolean;
  id: string;
  slug: string;
  provinceSlug: string | null;
  areaSlug: string | null;
  imagesUploaded: number;
  message: string;
}

interface BulkItem {
  url: string;
  status: "pending" | "processing" | "success" | "error" | "skipped";
  title?: string;
  slug?: string;
  error?: string;
  data?: PropertyData;
}

interface BulkProgress {
  total: number;
  processed: number;
  success: number;
  errors: number;
  skipped: number;
}

interface ListingItem {
  url: string;
  title: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  image: string;
  type: "FOR_RENT" | "FOR_SALE";
}

export default function PropertyImportContent() {
  // Single import state
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk import state
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false); // Ref for use in async loop
  const [bulkProgress, setBulkProgress] = useState<BulkProgress>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    skipped: 0,
  });
  const [activeTab, setActiveTab] = useState("single");

  // Rental listing scrape state
  const [listingUrl, setListingUrl] = useState("");
  const [listingPages, setListingPages] = useState(1);
  const [isScrapingListings, setIsScrapingListings] = useState(false);
  const [scrapedListings, setScrapedListings] = useState<ListingItem[]>([]);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [rentalBulkItems, setRentalBulkItems] = useState<BulkItem[]>([]);
  const [isRentalProcessing, setIsRentalProcessing] = useState(false);
  const isRentalPausedRef = useRef(false);
  const [rentalProgress, setRentalProgress] = useState<BulkProgress>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    skipped: 0,
  });

  // Single rental import state
  const [rentalMode, setRentalMode] = useState<"single" | "overview">("single");
  const [singleRentalUrl, setSingleRentalUrl] = useState("");
  const [isSingleRentalLoading, setIsSingleRentalLoading] = useState(false);
  const [isSingleRentalImporting, setIsSingleRentalImporting] = useState(false);
  const [singleRentalResult, setSingleRentalResult] = useState<ScrapeResult | null>(null);
  const [singleRentalImportResult, setSingleRentalImportResult] = useState<ImportResult | null>(null);
  const [singleRentalError, setSingleRentalError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setScrapeResult(null);
    setImportResult(null);

    try {
      const response = await fetch("/api/properties/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to scrape property");
      }

      setScrapeResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!scrapeResult?.data) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/properties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapeResult.data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import property");
      }

      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LUXURY_VILLA: "Luxury Villa",
      APARTMENT: "Apartment",
      RESIDENTIAL_HOME: "Residential Home",
      OFFICE_SPACES: "Office Space",
    };
    return labels[category] || category;
  };

  // Parse bulk URLs from textarea
  // Parse bulk URLs and merge with existing items (preserving completed ones)
  const parseBulkUrls = (forceReset = false) => {
    const urls = bulkUrls
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.startsWith("http"));
    
    if (forceReset) {
      // Full reset - all items become pending
      const items: BulkItem[] = urls.map(url => ({
        url,
        status: "pending" as const,
      }));
      
      setBulkItems(items);
      setBulkProgress({
        total: items.length,
        processed: 0,
        success: 0,
        errors: 0,
        skipped: 0,
      });
    } else {
      // Merge mode - preserve completed items, add new as pending
      const existingUrls = new Map(bulkItems.map(item => [item.url, item]));
      
      const items: BulkItem[] = urls.map(url => {
        const existing = existingUrls.get(url);
        if (existing && existing.status !== "pending") {
          return existing; // Keep completed/error/skipped items
        }
        return { url, status: "pending" as const };
      });
      
      // Calculate new progress based on merged items
      const completed = items.filter(i => i.status !== "pending");
      
      setBulkItems(items);
      setBulkProgress({
        total: items.length,
        processed: completed.length,
        success: completed.filter(i => i.status === "success").length,
        errors: completed.filter(i => i.status === "error").length,
        skipped: completed.filter(i => i.status === "skipped").length,
      });
    }
  };

  // Process single URL in bulk mode
  const processBulkItem = async (item: BulkItem, index: number): Promise<BulkItem> => {
    try {
      // Scrape the property
      const scrapeResponse = await fetch("/api/properties/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json();
        return { ...item, status: "error", error: errorData.error || "Failed to scrape" };
      }

      const scrapeData = await scrapeResponse.json();
      
      if (!scrapeData.validation?.isValid) {
        return { 
          ...item, 
          status: "error", 
          error: `Validation failed: ${scrapeData.validation?.issues?.join(", ") || "Unknown validation error"}`,
          data: scrapeData.data,
        };
      }

      // Import the property
      const importResponse = await fetch("/api/properties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapeData.data),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        if (errorData.error?.includes("already exists")) {
          return { 
            ...item, 
            status: "skipped", 
            error: "Property already exists",
            title: scrapeData.data?.title,
          };
        }
        return { 
          ...item, 
          status: "error", 
          error: errorData.error || "Failed to import",
          data: scrapeData.data,
        };
      }

      const importData = await importResponse.json();
      
      return {
        ...item,
        status: "success",
        title: scrapeData.data?.title,
        slug: importData.slug,
        data: scrapeData.data,
      };
    } catch (err) {
      return {
        ...item,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  };

  // Start bulk processing
  const startBulkImport = async () => {
    // Always re-parse URLs to pick up any new additions
    parseBulkUrls();
    
    // Wait a tick for state to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setIsBulkProcessing(true);
    setIsPaused(false);
    isPausedRef.current = false;

    // Get current pending items from the latest bulkUrls
    const urls = bulkUrls
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.startsWith("http"));
    
    // Create a map of existing items to preserve their status
    const existingItems = new Map(bulkItems.map(item => [item.url, item]));
    
    // Filter to only pending items
    const pendingItems: BulkItem[] = urls
      .filter(url => {
        const existing = existingItems.get(url);
        return !existing || existing.status === "pending";
      })
      .map(url => ({ url, status: "pending" as const }));
    
    for (let i = 0; i < pendingItems.length; i++) {
      // Check if paused using ref (ref is updated immediately, unlike state)
      if (isPausedRef.current) {
        break;
      }

      const currentUrl = pendingItems[i].url;
      
      // Update status to processing
      setBulkItems(prev => prev.map(item => 
        item.url === currentUrl ? { ...item, status: "processing" } : item
      ));

      // Process the item
      const result = await processBulkItem(pendingItems[i], i);
      
      // Update the item with result
      setBulkItems(prev => prev.map(item => 
        item.url === currentUrl ? result : item
      ));

      // Update progress
      setBulkProgress(prev => ({
        ...prev,
        processed: prev.processed + 1,
        success: prev.success + (result.status === "success" ? 1 : 0),
        errors: prev.errors + (result.status === "error" ? 1 : 0),
        skipped: prev.skipped + (result.status === "skipped" ? 1 : 0),
      }));

      // Small delay between requests to avoid rate limiting
      if (i < pendingItems.length - 1 && !isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsBulkProcessing(false);
  };

  // Pause/Resume bulk processing
  const togglePause = () => {
    const newPausedState = !isPausedRef.current;
    isPausedRef.current = newPausedState;
    setIsPaused(newPausedState);
  };

  // Reset bulk import
  const resetBulkImport = () => {
    isPausedRef.current = false;
    setBulkItems([]);
    setBulkUrls("");
    setBulkProgress({
      total: 0,
      processed: 0,
      success: 0,
      errors: 0,
      skipped: 0,
    });
    setIsBulkProcessing(false);
    setIsPaused(false);
  };

  // Retry failed items
  const retryFailed = () => {
    setBulkItems(prev => prev.map(item => 
      item.status === "error" ? { ...item, status: "pending", error: undefined } : item
    ));
    setBulkProgress(prev => ({
      ...prev,
      processed: prev.processed - prev.errors,
      errors: 0,
    }));
  };

  // ============ RENTAL LISTING FUNCTIONS ============

  // Scrape listings from overview page
  const scrapeListings = async () => {
    if (!listingUrl.trim()) return;

    setIsScrapingListings(true);
    setScrapedListings([]);
    setSelectedListings(new Set());

    try {
      const response = await fetch("/api/properties/scrape-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: listingUrl, 
          pages: listingPages,
          type: "FOR_RENT"
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to scrape listings");
      }

      setScrapedListings(result.properties);
      // Select all by default
      setSelectedListings(new Set(result.properties.map((p: ListingItem) => p.url)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsScrapingListings(false);
    }
  };

  // Toggle listing selection
  const toggleListingSelection = (url: string) => {
    setSelectedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedListings.size === scrapedListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(scrapedListings.map(p => p.url)));
    }
  };

  // Process rental item
  const processRentalItem = async (item: BulkItem): Promise<BulkItem> => {
    try {
      // Scrape with rental optimization
      const scrapeResponse = await fetch("/api/properties/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: item.url,
          isRental: true,
          forceType: "FOR_RENT"
        }),
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json();
        return { ...item, status: "error", error: errorData.error || "Failed to scrape" };
      }

      const scrapeData = await scrapeResponse.json();
      
      if (!scrapeData.validation?.isValid) {
        return { 
          ...item, 
          status: "error", 
          error: `Validation failed: ${scrapeData.validation?.issues?.join(", ") || "Unknown"}`,
        };
      }

      // Import the property
      const importResponse = await fetch("/api/properties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapeData.data),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        if (errorData.error?.includes("already exists")) {
          return { ...item, status: "skipped", error: "Already exists", title: scrapeData.data?.title };
        }
        return { ...item, status: "error", error: errorData.error || "Failed to import" };
      }

      const importData = await importResponse.json();
      
      return {
        ...item,
        status: "success",
        title: scrapeData.data?.title,
        slug: importData.slug,
      };
    } catch (err) {
      return { ...item, status: "error", error: err instanceof Error ? err.message : "Unknown error" };
    }
  };

  // Start rental import
  const startRentalImport = async () => {
    const selectedUrls = Array.from(selectedListings);
    if (selectedUrls.length === 0) return;

    const items: BulkItem[] = selectedUrls.map(url => ({ url, status: "pending" as const }));
    setRentalBulkItems(items);
    setRentalProgress({
      total: items.length,
      processed: 0,
      success: 0,
      errors: 0,
      skipped: 0,
    });

    setIsRentalProcessing(true);
    isRentalPausedRef.current = false;

    for (let i = 0; i < items.length; i++) {
      if (isRentalPausedRef.current) break;

      const currentUrl = items[i].url;
      
      setRentalBulkItems(prev => prev.map(item => 
        item.url === currentUrl ? { ...item, status: "processing" } : item
      ));

      const result = await processRentalItem(items[i]);
      
      setRentalBulkItems(prev => prev.map(item => 
        item.url === currentUrl ? result : item
      ));

      setRentalProgress(prev => ({
        ...prev,
        processed: prev.processed + 1,
        success: prev.success + (result.status === "success" ? 1 : 0),
        errors: prev.errors + (result.status === "error" ? 1 : 0),
        skipped: prev.skipped + (result.status === "skipped" ? 1 : 0),
      }));

      // Delay between requests
      if (i < items.length - 1 && !isRentalPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsRentalProcessing(false);
  };

  // Reset rental import
  const resetRentalImport = () => {
    setListingUrl("");
    setScrapedListings([]);
    setSelectedListings(new Set());
    setRentalBulkItems([]);
    setRentalProgress({ total: 0, processed: 0, success: 0, errors: 0, skipped: 0 });
    setIsRentalProcessing(false);
    isRentalPausedRef.current = false;
  };

  // ============ SINGLE RENTAL FUNCTIONS ============

  // Scrape single rental property
  const handleSingleRentalScrape = async () => {
    if (!singleRentalUrl.trim()) return;

    setIsSingleRentalLoading(true);
    setSingleRentalError(null);
    setSingleRentalResult(null);
    setSingleRentalImportResult(null);

    try {
      const response = await fetch("/api/properties/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: singleRentalUrl,
          isRental: true,
          forceType: "FOR_RENT"
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to scrape property");
      }

      setSingleRentalResult(result);
    } catch (err) {
      setSingleRentalError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSingleRentalLoading(false);
    }
  };

  // Import single rental property
  const handleSingleRentalImport = async () => {
    if (!singleRentalResult?.data) return;

    setIsSingleRentalImporting(true);
    setSingleRentalError(null);

    try {
      const response = await fetch("/api/properties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleRentalResult.data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import property");
      }

      setSingleRentalImportResult(result);
    } catch (err) {
      setSingleRentalError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSingleRentalImporting(false);
    }
  };

  // Reset single rental
  const resetSingleRental = () => {
    setSingleRentalUrl("");
    setSingleRentalResult(null);
    setSingleRentalImportResult(null);
    setSingleRentalError(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabs for Single/Bulk/Rental Import */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Single Import
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Bulk Import
          </TabsTrigger>
          <TabsTrigger value="rental" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Rental Import
          </TabsTrigger>
        </TabsList>

        {/* Single Import Tab */}
        <TabsContent value="single" className="mt-6 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Paste a property listing URL and AI will extract all the data automatically</span>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="url"
                    placeholder="https://example.com/property/luxury-villa..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                    disabled={isLoading || isImporting}
                    className="h-12 text-base"
                  />
                </div>
                <Button
                  onClick={handleScrape}
                  disabled={!url.trim() || isLoading || isImporting}
                  className="h-12 px-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="p-4 border-destructive bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Import Success */}
          {importResult && (
            <Card className="p-6 border-green-500 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    Property Imported Successfully!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    {importResult.message} • {importResult.imagesUploaded} images uploaded
                  </p>
                </div>
                <Button asChild variant="outline" className="border-green-500 text-green-700">
                  <a href={getPropertyUrl(importResult)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Property
                  </a>
                </Button>
              </div>
            </Card>
          )}

          {/* Preview Results */}
          {scrapeResult && !importResult && (
            <div className="space-y-6">
              {/* Validation Status */}
              <Card className={`p-4 ${scrapeResult.validation.isValid ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {scrapeResult.validation.isValid ? (
                      <>
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-400">
                          All data validated successfully
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">
                          {scrapeResult.validation.issues.length} validation warning(s)
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {scrapeResult.stats.contentOptimized && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Optimized
                      </Badge>
                    )}
                    {scrapeResult.stats.companyProfileUsed && (
                      <Badge variant="outline" className="text-xs">
                        Company Profile Used
                      </Badge>
                    )}
                    <span>{scrapeResult.stats.textLength.toLocaleString()} chars • {scrapeResult.stats.imagesFound} images</span>
                  </div>
                </div>
                {scrapeResult.validation.issues.length > 0 && (
                  <ul className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                    {scrapeResult.validation.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Property Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <Card className="lg:col-span-2 p-6 space-y-6">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">{scrapeResult.data.title}</h2>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{scrapeResult.data.location}</span>
                        </div>
                        {scrapeResult.data.slug && (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-mono">
                              🔗 /properties/{scrapeResult.data.slug}
                            </Badge>
                            <span className="text-xs text-muted-foreground">SEO-optimized URL</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{scrapeResult.data.price}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={scrapeResult.data.type === "FOR_SALE" ? "default" : "secondary"}>
                            {scrapeResult.data.type === "FOR_SALE" ? "For Sale" : "For Rent"}
                          </Badge>
                          <Badge variant="outline">{getCategoryLabel(scrapeResult.data.category)}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-4 gap-4 py-4 border-y">
                    <div className="text-center">
                      <Bed className="h-5 w-5 mx-auto text-muted-foreground" />
                      <div className="font-semibold mt-1">{scrapeResult.data.beds}</div>
                      <div className="text-xs text-muted-foreground">Bedrooms</div>
                    </div>
                    <div className="text-center">
                      <Bath className="h-5 w-5 mx-auto text-muted-foreground" />
                      <div className="font-semibold mt-1">{scrapeResult.data.baths}</div>
                      <div className="text-xs text-muted-foreground">Bathrooms</div>
                    </div>
                    <div className="text-center">
                      <Maximize className="h-5 w-5 mx-auto text-muted-foreground" />
                      <div className="font-semibold mt-1">{scrapeResult.data.sqft}</div>
                      <div className="text-xs text-muted-foreground">m²</div>
                    </div>
                    <div className="text-center">
                      <Home className="h-5 w-5 mx-auto text-muted-foreground" />
                      <div className="font-semibold mt-1">{scrapeResult.data.garage || "-"}</div>
                      <div className="text-xs text-muted-foreground">Garage</div>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div>
                    <h3 className="font-semibold mb-2">Short Description</h3>
                    <p className="text-muted-foreground">{scrapeResult.data.shortDescription}</p>
                  </div>

                  {/* Full Description - Show HTML if optimized */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Full Description</h3>
                      {scrapeResult.data.isOptimized && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Rewritten - Unique Content
                        </Badge>
                      )}
                    </div>
                    {scrapeResult.data.contentHtml ? (
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-3 [&>ul]:my-2 [&>ul]:pl-5 [&>li]:mb-1"
                        dangerouslySetInnerHTML={{ __html: scrapeResult.data.contentHtml }}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                        {scrapeResult.data.content}
                      </p>
                    )}
                  </div>

                  {/* Property Features/Highlights (if optimized) */}
                  {scrapeResult.data.propertyFeatures && scrapeResult.data.propertyFeatures.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Property Highlights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {scrapeResult.data.propertyFeatures.map((feature, i) => (
                          <div key={i} className="p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              <span className="font-medium text-sm">{feature.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  <div>
                    <h3 className="font-semibold mb-3">Amenities ({scrapeResult.data.amenities?.length || 0})</h3>
                    <div className="flex flex-wrap gap-2">
                      {scrapeResult.data.amenities?.map((amenity, i) => (
                        <Badge key={i} variant="secondary" className="py-1">
                          <Tag className="h-3 w-3 mr-1" />
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Related Properties (Internal Links) */}
                  {scrapeResult.data.relatedProperties && scrapeResult.data.relatedProperties.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Home className="h-4 w-4 text-blue-500" />
                        Related Properties (Internal Links)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scrapeResult.data.relatedProperties.slice(0, 4).map((property, i) => (
                          <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="font-medium text-sm text-blue-900 dark:text-blue-100 truncate">{property.title}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{property.price}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">/properties/{property.slug}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ✨ These properties will be automatically linked in the description for better SEO.
                      </p>
                    </div>
                  )}
                </Card>

                {/* Images Sidebar */}
                <Card className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images ({scrapeResult.data.images?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {scrapeResult.data.images?.map((imageUrl, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                        <Image
                          src={imageUrl}
                          alt={`Property image ${i + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Import Button */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleImport}
                      disabled={isImporting || !scrapeResult.validation.isValid}
                      className="w-full h-12"
                      size="lg"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Importing & Uploading Images...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          Import Property
                        </>
                      )}
                    </Button>
                    {!scrapeResult.validation.isValid && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Fix validation issues before importing
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Empty State for Single Import */}
          {!scrapeResult && !error && !isLoading && (
            <Card className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Download className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Import Properties from Any Website</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Paste a property listing URL above and our AI will automatically extract the title, price, 
                bedrooms, bathrooms, amenities, images, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="outline">phuketpropertyservice.com</Badge>
                <Badge variant="outline">thailand-property.com</Badge>
                <Badge variant="outline">fazwaz.com</Badge>
                <Badge variant="outline">+ Any property website</Badge>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Bulk Import Tab */}
        <TabsContent value="bulk" className="mt-6 space-y-6">
          {/* Bulk URL Input */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <List className="h-4 w-4" />
                  <span>Paste multiple property URLs (one per line) for batch import</span>
                </div>
                {bulkItems.length > 0 && !isBulkProcessing && (
                  <Button variant="ghost" size="sm" onClick={resetBulkImport}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              
              <Textarea
                placeholder={`https://example.com/property/villa-1\nhttps://example.com/property/villa-2\nhttps://example.com/property/villa-3`}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                disabled={isBulkProcessing}
                className="min-h-[150px] font-mono text-sm"
              />
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const detectedCount = bulkUrls.split("\n").filter(line => line.trim().startsWith("http")).length;
                    const pendingCount = bulkItems.filter(i => i.status === "pending").length;
                    const newUrls = detectedCount - bulkItems.length;
                    
                    if (bulkItems.length > 0 && newUrls > 0) {
                      return `${detectedCount} URLs detected (${newUrls} new)`;
                    }
                    if (bulkItems.length > 0 && pendingCount > 0) {
                      return `${pendingCount} of ${bulkItems.length} pending`;
                    }
                    return `${detectedCount} URLs detected`;
                  })()}
                </p>
                <div className="flex gap-2">
                  {bulkItems.length === 0 ? (
                    <Button
                      onClick={() => parseBulkUrls(true)}
                      disabled={!bulkUrls.trim() || isBulkProcessing}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Analyze URLs
                    </Button>
                  ) : !isBulkProcessing ? (
                    <>
                      {bulkProgress.errors > 0 && (
                        <Button variant="outline" onClick={retryFailed}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Retry Failed ({bulkProgress.errors})
                        </Button>
                      )}
                      <Button onClick={startBulkImport}>
                        <Play className="mr-2 h-4 w-4" />
                        {(() => {
                          const detectedCount = bulkUrls.split("\n").filter(line => line.trim().startsWith("http")).length;
                          const processedUrls = new Set(bulkItems.filter(i => i.status !== "pending").map(i => i.url));
                          const pendingCount = detectedCount - processedUrls.size;
                          
                          if (pendingCount > 0 && bulkProgress.processed > 0) {
                            return `Continue Import (${pendingCount} remaining)`;
                          }
                          return `Start Import (${detectedCount})`;
                        })()}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={togglePause}>
                      {isPaused ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Bulk Progress */}
          {bulkItems.length > 0 && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Import Progress</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {bulkProgress.success} Success
                    </span>
                    <span className="flex items-center gap-1">
                      <X className="h-4 w-4 text-red-500" />
                      {bulkProgress.errors} Errors
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      {bulkProgress.skipped} Skipped
                    </span>
                  </div>
                </div>
                
                <Progress 
                  value={(bulkProgress.processed / bulkProgress.total) * 100} 
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {bulkProgress.processed} of {bulkProgress.total} processed
                  {isBulkProcessing && !isPaused && " • Processing..."}
                  {isPaused && " • Paused"}
                </p>
              </div>
            </Card>
          )}

          {/* Bulk Items List */}
          {bulkItems.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Properties ({bulkItems.length})</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {bulkItems.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      item.status === "success" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                      item.status === "error" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" :
                      item.status === "skipped" ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800" :
                      item.status === "processing" ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" :
                      "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                          {item.status === "processing" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                          {item.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {item.status === "error" && <X className="h-4 w-4 text-red-500" />}
                          {item.status === "skipped" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          
                          <span className="font-medium text-sm truncate">
                            {item.title || `Property ${index + 1}`}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {item.url}
                        </p>
                        
                        {item.status === "success" && item.slug && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ Imported as /properties/{item.slug}
                          </p>
                        )}
                        
                        {item.status === "error" && item.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            ✗ {item.error}
                          </p>
                        )}
                        
                        {item.status === "skipped" && item.error && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            ⚠ {item.error}
                          </p>
                        )}
                      </div>
                      
                      <Badge 
                        variant={
                          item.status === "success" ? "default" :
                          item.status === "error" ? "destructive" :
                          item.status === "skipped" ? "secondary" :
                          "outline"
                        }
                        className="shrink-0"
                      >
                        {item.status === "processing" ? "Processing..." : item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty State for Bulk Import */}
          {bulkItems.length === 0 && !bulkUrls.trim() && (
            <Card className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <List className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Bulk Import Multiple Properties</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Paste multiple property listing URLs above (one per line) and import them all at once.
                The AI will process each URL sequentially with a 2-second delay between imports.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="secondary">✓ AI Content Optimization</Badge>
                <Badge variant="secondary">✓ SEO-Optimized Slugs</Badge>
                <Badge variant="secondary">✓ Auto Image Upload</Badge>
                <Badge variant="secondary">✓ Internal Linking</Badge>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Rental Import Tab */}
        <TabsContent value="rental" className="mt-6 space-y-6">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant={rentalMode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setRentalMode("single")}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Single Property
            </Button>
            <Button
              variant={rentalMode === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setRentalMode("overview")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Overview Page
            </Button>
          </div>

          {/* Single Rental Mode */}
          {rentalMode === "single" && (
            <>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Paste a single rental property URL to import it directly</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="url"
                        placeholder="https://psmphuket.com/property/stunning-modern-tropical-villa-500-sq-m/"
                        value={singleRentalUrl}
                        onChange={(e) => setSingleRentalUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSingleRentalScrape()}
                        disabled={isSingleRentalLoading || isSingleRentalImporting}
                        className="h-12 text-base"
                      />
                    </div>
                    <Button
                      onClick={handleSingleRentalScrape}
                      disabled={!singleRentalUrl.trim() || isSingleRentalLoading || isSingleRentalImporting}
                      className="h-12 px-6"
                    >
                      {isSingleRentalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Error Display */}
              {singleRentalError && (
                <Card className="p-4 border-destructive bg-destructive/10">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>{singleRentalError}</span>
                  </div>
                </Card>
              )}

              {/* Import Success */}
              {singleRentalImportResult && (
                <Card className="p-6 border-green-500 bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-700 dark:text-green-400">
                        Rental Property Imported Successfully!
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        {singleRentalImportResult.message} • {singleRentalImportResult.imagesUploaded} images uploaded
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="border-green-500 text-green-700">
                        <a href={getPropertyUrl(singleRentalImportResult)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Property
                        </a>
                      </Button>
                      <Button variant="outline" onClick={resetSingleRental}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Import Another
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Preview Results */}
              {singleRentalResult && !singleRentalImportResult && (
                <div className="space-y-6">
                  {/* Validation Status */}
                  <Card className={`p-4 ${singleRentalResult.validation.isValid ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {singleRentalResult.validation.isValid ? (
                          <>
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-700 dark:text-green-400">
                              All data validated successfully
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-yellow-700 dark:text-yellow-400">
                              {singleRentalResult.validation.issues.length} validation warning(s)
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          For Rent
                        </Badge>
                        {singleRentalResult.stats.contentOptimized && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Optimized
                          </Badge>
                        )}
                        <span>{singleRentalResult.stats.textLength.toLocaleString()} chars • {singleRentalResult.stats.imagesFound} images</span>
                      </div>
                    </div>
                    {singleRentalResult.validation.issues.length > 0 && (
                      <ul className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                        {singleRentalResult.validation.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </Card>

                  {/* Property Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <Card className="lg:col-span-2 p-6 space-y-6">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-bold">{singleRentalResult.data.title}</h2>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{singleRentalResult.data.location}</span>
                            </div>
                            {singleRentalResult.data.slug && (
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-mono">
                                  🔗 /properties/{singleRentalResult.data.slug}
                                </Badge>
                                <span className="text-xs text-muted-foreground">SEO-optimized URL</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{singleRentalResult.data.price}</div>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                For Rent
                              </Badge>
                              <Badge variant="outline">{getCategoryLabel(singleRentalResult.data.category)}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Stats */}
                      <div className="grid grid-cols-4 gap-4 py-4 border-y">
                        <div className="text-center">
                          <Bed className="h-5 w-5 mx-auto text-muted-foreground" />
                          <div className="font-semibold mt-1">{singleRentalResult.data.beds}</div>
                          <div className="text-xs text-muted-foreground">Bedrooms</div>
                        </div>
                        <div className="text-center">
                          <Bath className="h-5 w-5 mx-auto text-muted-foreground" />
                          <div className="font-semibold mt-1">{singleRentalResult.data.baths}</div>
                          <div className="text-xs text-muted-foreground">Bathrooms</div>
                        </div>
                        <div className="text-center">
                          <Maximize className="h-5 w-5 mx-auto text-muted-foreground" />
                          <div className="font-semibold mt-1">{singleRentalResult.data.sqft}</div>
                          <div className="text-xs text-muted-foreground">m²</div>
                        </div>
                        <div className="text-center">
                          <Home className="h-5 w-5 mx-auto text-muted-foreground" />
                          <div className="font-semibold mt-1">{singleRentalResult.data.garage || "-"}</div>
                          <div className="text-xs text-muted-foreground">Garage</div>
                        </div>
                      </div>

                      {/* Short Description */}
                      <div>
                        <h3 className="font-semibold mb-2">Short Description</h3>
                        <p className="text-muted-foreground">{singleRentalResult.data.shortDescription}</p>
                      </div>

                      {/* Full Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Full Description</h3>
                          {singleRentalResult.data.isOptimized && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Rewritten - Unique Content
                            </Badge>
                          )}
                        </div>
                        {singleRentalResult.data.contentHtml ? (
                          <div 
                            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-3 [&>ul]:my-2 [&>ul]:pl-5 [&>li]:mb-1"
                            dangerouslySetInnerHTML={{ __html: singleRentalResult.data.contentHtml }}
                          />
                        ) : (
                          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                            {singleRentalResult.data.content}
                          </p>
                        )}
                      </div>

                      {/* Amenities */}
                      <div>
                        <h3 className="font-semibold mb-3">Amenities ({singleRentalResult.data.amenities?.length || 0})</h3>
                        <div className="flex flex-wrap gap-2">
                          {singleRentalResult.data.amenities?.map((amenity, i) => (
                            <Badge key={i} variant="secondary" className="py-1">
                              <Tag className="h-3 w-3 mr-1" />
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>

                    {/* Images Sidebar */}
                    <Card className="p-6 space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Images ({singleRentalResult.data.images?.length || 0})
                      </h3>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {singleRentalResult.data.images?.map((imageUrl, i) => (
                          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                            <Image
                              src={imageUrl}
                              alt={`Property image ${i + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 400px"
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Import Button */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleSingleRentalImport}
                          disabled={isSingleRentalImporting || !singleRentalResult.validation.isValid}
                          className="w-full h-12"
                          size="lg"
                        >
                          {isSingleRentalImporting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Importing & Uploading Images...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-5 w-5" />
                              Import Rental
                            </>
                          )}
                        </Button>
                        {!singleRentalResult.validation.isValid && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Fix validation issues before importing
                          </p>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Empty State for Single Rental Import */}
              {!singleRentalResult && !singleRentalError && !isSingleRentalLoading && (
                <Card className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <Building className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Import Single Rental Property</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Paste a direct URL to a rental property listing above. The AI will extract all the data 
                    and mark it as a rental property automatically.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      ✓ Marked as &quot;For Rent&quot;
                    </Badge>
                    <Badge variant="secondary">✓ AI Content Optimization</Badge>
                    <Badge variant="secondary">✓ Auto Image Upload</Badge>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Overview Mode */}
          {rentalMode === "overview" && (
            <>
              {/* Listing URL Input */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>Enter a rental listing overview URL to scrape all available properties</span>
                    </div>
                    {(scrapedListings.length > 0 || rentalBulkItems.length > 0) && !isRentalProcessing && (
                      <Button variant="ghost" size="sm" onClick={resetRentalImport}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="url"
                        placeholder="https://psmphuket.com/properties-search/?status=for-rent"
                        value={listingUrl}
                        onChange={(e) => setListingUrl(e.target.value)}
                        disabled={isScrapingListings || isRentalProcessing}
                        className="h-12"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={listingPages}
                        onChange={(e) => setListingPages(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                        disabled={isScrapingListings || isRentalProcessing}
                        className="h-12 text-center"
                        title="Number of pages to scrape (max 50)"
                      />
                    </div>
                    <Button
                      onClick={scrapeListings}
                      disabled={!listingUrl.trim() || isScrapingListings || isRentalProcessing}
                      className="h-12 px-6"
                    >
                      {isScrapingListings ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Find Rentals
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Pages to scrape: {listingPages} • Works with psmphuket.com, fazwaz.com, and similar sites
                  </p>
                </div>
              </Card>

              {/* Scraped Listings */}
              {scrapedListings.length > 0 && rentalBulkItems.length === 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-500" />
                      Found {scrapedListings.length} Rental Properties
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                        {selectedListings.size === scrapedListings.length ? "Deselect All" : "Select All"}
                      </Button>
                      <Badge variant="secondary">
                        {selectedListings.size} selected
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                    {scrapedListings.map((listing, index) => (
                      <div
                        key={listing.url}
                        onClick={() => toggleListingSelection(listing.url)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedListings.has(listing.url)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            selectedListings.has(listing.url)
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300"
                          }`}>
                            {selectedListings.has(listing.url) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{listing.title || `Property ${index + 1}`}</p>
                            <p className="text-sm text-primary font-semibold mt-1">{listing.price}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              {listing.beds > 0 && (
                                <span className="flex items-center gap-1">
                                  <Bed className="h-3 w-3" /> {listing.beds}
                                </span>
                              )}
                              {listing.baths > 0 && (
                                <span className="flex items-center gap-1">
                                  <Bath className="h-3 w-3" /> {listing.baths}
                                </span>
                              )}
                              {listing.sqft && (
                                <span className="flex items-center gap-1">
                                  <Maximize className="h-3 w-3" /> {listing.sqft}m²
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button
                      onClick={startRentalImport}
                      disabled={selectedListings.size === 0}
                      className="h-12 px-8"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Import {selectedListings.size} Rentals
                    </Button>
                  </div>
                </Card>
              )}

              {/* Rental Import Progress */}
              {rentalBulkItems.length > 0 && (
                <>
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Rental Import Progress</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {rentalProgress.success} Success
                          </span>
                          <span className="flex items-center gap-1">
                            <X className="h-4 w-4 text-red-500" />
                            {rentalProgress.errors} Errors
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            {rentalProgress.skipped} Skipped
                          </span>
                        </div>
                      </div>
                      
                      <Progress 
                        value={(rentalProgress.processed / rentalProgress.total) * 100} 
                        className="h-2"
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        {rentalProgress.processed} of {rentalProgress.total} processed
                        {isRentalProcessing && " • Processing..."}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Rental Properties ({rentalBulkItems.length})</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {rentalBulkItems.map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border ${
                            item.status === "success" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                            item.status === "error" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" :
                            item.status === "skipped" ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800" :
                            item.status === "processing" ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" :
                            "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {item.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                                {item.status === "processing" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                                {item.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {item.status === "error" && <X className="h-4 w-4 text-red-500" />}
                                {item.status === "skipped" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                
                                <span className="font-medium text-sm truncate">
                                  {item.title || `Rental ${index + 1}`}
                                </span>
                                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                  For Rent
                                </Badge>
                              </div>
                              
                              <p className="text-xs text-muted-foreground truncate font-mono">
                                {item.url}
                              </p>
                              
                              {item.status === "success" && item.slug && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  ✓ Imported as /properties/{item.slug}
                                </p>
                              )}
                              
                              {item.status === "error" && item.error && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  ✗ {item.error}
                                </p>
                              )}
                              
                              {item.status === "skipped" && item.error && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                  ⚠ {item.error}
                                </p>
                              )}
                            </div>
                            
                            <Badge 
                              variant={
                                item.status === "success" ? "default" :
                                item.status === "error" ? "destructive" :
                                item.status === "skipped" ? "secondary" :
                                "outline"
                              }
                              className="shrink-0"
                            >
                              {item.status === "processing" ? "Processing..." : item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Empty State for Overview Rental Import */}
              {scrapedListings.length === 0 && rentalBulkItems.length === 0 && !isScrapingListings && (
                <Card className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <Building className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Import Multiple Rental Properties</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Enter a rental listing overview URL (like psmphuket.com/properties-search/?status=for-rent) 
                    and we&apos;ll find all available rental properties automatically.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      ✓ Rental-Optimized Content
                    </Badge>
                    <Badge variant="secondary">✓ Multi-Page Scraping</Badge>
                    <Badge variant="secondary">✓ Select Which to Import</Badge>
                    <Badge variant="secondary">✓ Expat/Digital Nomad Focus</Badge>
                  </div>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

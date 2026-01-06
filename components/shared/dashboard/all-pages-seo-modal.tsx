"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Page {
  id: string;
  url: string;
  title: string;
  category: string;
  type: "static" | "database";
  source: string;
  metaTitle: string | null;
  metaDescription: string | null;
  seoStatus: "code" | "auto" | "good" | "partial" | "missing";
  published: boolean;
  updatedAt: string | null;
  canEdit: boolean;
}

interface AllPagesSeoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: Page | null;
  onSave: () => void;
}

// Extract keyword from URL path
function extractKeywordFromUrl(url: string): string {
  if (!url || url === "/") return "real estate Phuket";
  
  // Remove leading/trailing slashes and split
  const path = url.replace(/^\/|\/$/g, "");
  const segments = path.split("/");
  
  // Get the most specific segment (last one)
  const lastSegment = segments[segments.length - 1] || "";
  
  // Convert slug to words (e.g., "property-transfer-calculator" -> "property transfer calculator")
  const words = lastSegment.replace(/-/g, " ").replace(/_/g, " ");
  
  return words || path.replace(/-/g, " ");
}

// Build context description from page data
function buildPageContext(page: Page): string {
  const contexts: Record<string, string> = {
    "/": "Homepage of PSM Phuket, showcasing luxury real estate, featured properties, and investment opportunities in Phuket, Thailand. The main landing page for international investors and expats looking for premium villas, condos, and investment properties.",
    "/about": "About PSM Phuket - Our story, team, expertise in Phuket real estate, and what makes us the trusted choice for property investment in Thailand.",
    "/contact": "Contact PSM Phuket - Get in touch with our real estate experts for property inquiries, viewing requests, and investment consultations in Phuket.",
    "/properties": "Browse our complete collection of luxury properties for sale in Phuket - villas, condos, townhouses, and land for investment.",
    "/services": "Our real estate services - property management, investment advisory, legal support, and rental services in Phuket.",
    "/tools": "Free real estate tools and calculators for property investors in Thailand.",
    "/blogs": "Latest news, guides, and insights about Phuket real estate market, property investment, and living in Thailand.",
    "/guides": "Comprehensive guides for buying property in Thailand - legal requirements, investment tips, and market insights.",
    "/faq": "Frequently asked questions about buying property in Phuket, Thailand - legal, financial, and practical information.",
  };
  
  // Check for exact match first
  if (contexts[page.url]) {
    return contexts[page.url];
  }
  
  // Generate context based on category and URL
  const category = page.category || "main";
  const urlKeywords = extractKeywordFromUrl(page.url);
  
  const categoryContexts: Record<string, string> = {
    main: `Main page about ${urlKeywords} on the PSM Phuket real estate website.`,
    tools: `Interactive tool for ${urlKeywords} - helping property investors and buyers in Thailand.`,
    auth: `${page.title} page for PSM Phuket user accounts.`,
    docs: `Documentation and information about ${urlKeywords} for PSM Phuket clients.`,
    legal: `Legal information and ${urlKeywords} for PSM Phuket website users.`,
    landing: `Landing page focused on ${urlKeywords} - targeted content for property seekers in Phuket.`,
    blog: `Blog article about ${urlKeywords} - insights and information for property investors.`,
    property: `Property listing - ${urlKeywords} available through PSM Phuket.`,
  };
  
  return categoryContexts[category] || `Page about ${urlKeywords} on PSM Phuket real estate website.`;
}

export default function AllPagesSeoModal({
  open,
  onOpenChange,
  page,
  onSave,
}: AllPagesSeoModalProps) {
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Check if this page type supports slug editing
  const canEditSlug = page?.source !== "nextjs";

  // Reset form when page changes
  useEffect(() => {
    if (page) {
      setMetaTitle(page.metaTitle || "");
      setMetaDescription(page.metaDescription || "");
      setSlug(page.url || "");
      setOriginalSlug(page.url || "");
      setSlugError("");
      setSlugAvailable(null);
    }
  }, [page]);

  // Debounced slug validation
  useEffect(() => {
    if (!canEditSlug || slug === originalSlug) {
      setSlugError("");
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (slug.length < 2) {
        setSlugError("URL must be at least 2 characters");
        setSlugAvailable(false);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const response = await fetch(
          `/api/all-pages/${page?.id}/slug?url=${encodeURIComponent(slug)}&source=${page?.source}`
        );
        const data = await response.json();
        
        if (data.available) {
          setSlugError("");
          setSlugAvailable(true);
        } else {
          setSlugError("This URL is already in use");
          setSlugAvailable(false);
        }
      } catch {
        setSlugError("Could not check URL availability");
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, originalSlug, canEditSlug, page?.id, page?.source]);

  // Character counters
  const metaTitleLength = metaTitle?.length || 0;
  const metaDescriptionLength = metaDescription?.length || 0;

  // Status helpers
  const getTitleStatus = () => {
    if (metaTitleLength === 0) return { color: "text-gray-400", label: "Not set", barColor: "bg-gray-300" };
    if (metaTitleLength < 40) return { color: "text-orange-500", label: "Too short", barColor: "bg-orange-400" };
    if (metaTitleLength > 60) return { color: "text-red-500", label: "Too long", barColor: "bg-red-500" };
    if (metaTitleLength >= 50) return { color: "text-green-500", label: "Excellent", barColor: "bg-green-500" };
    return { color: "text-green-500", label: "Good", barColor: "bg-green-500" };
  };

  const getDescriptionStatus = () => {
    if (metaDescriptionLength === 0) return { color: "text-gray-400", label: "Not set", barColor: "bg-gray-300" };
    if (metaDescriptionLength < 120) return { color: "text-orange-500", label: "Too short", barColor: "bg-orange-400" };
    if (metaDescriptionLength > 160) return { color: "text-red-500", label: "Too long", barColor: "bg-red-500" };
    if (metaDescriptionLength >= 145) return { color: "text-green-500", label: "Excellent", barColor: "bg-green-500" };
    return { color: "text-green-500", label: "Good", barColor: "bg-green-500" };
  };

  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();

  // Calculate SEO score
  const seoScore = useMemo(() => {
    let score = 0;
    
    if (metaTitle) {
      const titleLen = metaTitle.length;
      if (titleLen >= 50 && titleLen <= 60) score += 35;
      else if (titleLen >= 40 && titleLen <= 70) score += 20;
      else if (titleLen > 0) score += 10;
    }
    
    if (metaDescription) {
      const descLen = metaDescription.length;
      if (descLen >= 145 && descLen <= 155) score += 35;
      else if (descLen >= 120 && descLen <= 160) score += 20;
      else if (descLen > 0) score += 10;
    }
    
    // Bonus for both being set
    if (metaTitle && metaDescription) score += 30;
    
    return Math.min(score, 100);
  }, [metaTitle, metaDescription]);

  // Generate SEO Title with AI
  const generateSEOTitle = async () => {
    if (!page?.title) {
      toast.error("Page title is required");
      return;
    }

    setIsGeneratingTitle(true);
    try {
      // Build context from page data
      const pageContext = buildPageContext(page);
      
      const response = await fetch("/api/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page.title,
          type: "title",
          excerpt: pageContext,
          targetKeyword: extractKeywordFromUrl(page.url),
          url: page.url, // Pass URL so API knows if it's homepage
        }),
      });

      if (response.ok) {
        const { result } = await response.json();
        setMetaTitle(result);
        toast.success("SEO title generated!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Generation failed");
      }
    } catch (error) {
      toast.error("Could not generate SEO title");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Generate Meta Description with AI
  const generateMetaDescription = async () => {
    if (!page?.title) {
      toast.error("Page title is required");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      // Build context from page data
      const pageContext = buildPageContext(page);
      
      const response = await fetch("/api/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page.title,
          type: "description",
          excerpt: pageContext,
          targetKeyword: extractKeywordFromUrl(page.url),
          url: page.url, // Pass URL so API knows if it's homepage
        }),
      });

      if (response.ok) {
        const { result } = await response.json();
        setMetaDescription(result);
        toast.success("Meta description generated!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Generation failed");
      }
    } catch (error) {
      toast.error("Could not generate meta description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Save SEO changes
  const handleSave = async () => {
    if (!page) return;

    // Validate slug if changed
    if (canEditSlug && slug !== originalSlug) {
      if (slugError || slugAvailable === false) {
        toast.error("Please fix the URL error before saving");
        return;
      }
    }

    setIsSaving(true);
    try {
      // First, update SEO settings
      const seoResponse = await fetch(`/api/all-pages/${page.id}/seo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: page.source,
          metaTitle,
          metaDescription,
          url: slug || page.url, // Use new slug if changed
        }),
      });

      if (!seoResponse.ok) {
        const error = await seoResponse.json();
        throw new Error(error.error || "Failed to save SEO settings");
      }

      // If slug changed, update it and create redirect
      if (canEditSlug && slug !== originalSlug) {
        const slugResponse = await fetch(`/api/all-pages/${page.id}/slug`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: page.source,
            oldUrl: originalSlug,
            newUrl: slug,
          }),
        });

        if (!slugResponse.ok) {
          const error = await slugResponse.json();
          throw new Error(error.error || "Failed to update URL");
        }

        const slugData = await slugResponse.json();
        if (slugData.redirectCreated) {
          toast.success("SEO settings saved! A 301 redirect was created from the old URL.");
        } else {
          toast.success("SEO settings saved!");
        }
      } else {
        toast.success("SEO settings saved!");
      }

      onSave();
    } catch (error: any) {
      toast.error(error.message || "Failed to save SEO settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!page) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2">
              <Icon icon="ph:magnifying-glass" className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle>SEO Settings</DialogTitle>
              <DialogDescription className="line-clamp-1">
                {page.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SEO Score */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white",
                seoScore >= 80 ? "bg-green-500" : seoScore >= 60 ? "bg-yellow-500" : seoScore >= 40 ? "bg-orange-500" : "bg-red-500"
              )}>
                {seoScore}
              </div>
              <div>
                <p className="font-semibold">SEO Score</p>
                <p className="text-sm text-muted-foreground">
                  {seoScore >= 80 ? "Excellent!" : seoScore >= 60 ? "Good" : seoScore >= 40 ? "Needs improvement" : "Improve this"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {page.source === "nextjs" ? "Static Page" :
               page.source === "landing_page" ? "Landing Page" : 
               page.source === "blog" ? "Blog" : 
               page.source === "property" ? "Property" : page.source}
            </Badge>
          </div>

          {/* Google Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Google Preview
            </Label>
            <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Icon icon="ph:globe" className="h-4 w-4" />
                <span className="truncate">{slug || page.url}</span>
              </div>
              <h4 className="text-xl text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer font-normal line-clamp-1">
                {metaTitle || page.title || "Add a title"}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {metaDescription || "Add a meta description to show what this page contains..."}
              </p>
            </div>
          </div>

          {/* URL Slug Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="urlSlug" className="text-sm font-medium">
                URL Slug
              </Label>
              {slug !== originalSlug && (
                <Badge variant="outline" className="text-xs gap-1 text-orange-600 border-orange-300">
                  <Icon icon="ph:arrow-right" className="h-3 w-3" />
                  Will create redirect
                </Badge>
              )}
            </div>

            <div className="relative">
              <Input
                id="urlSlug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="/your-page-url"
                className={cn(
                  "pr-10",
                  !canEditSlug && "opacity-50 cursor-not-allowed",
                  slugError && "border-red-500 focus-visible:ring-red-500",
                  slugAvailable && "border-green-500 focus-visible:ring-green-500"
                )}
                disabled={!canEditSlug}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingSlug ? (
                  <Icon icon="ph:spinner" className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : slugAvailable === true ? (
                  <Icon icon="ph:check-circle" className="h-4 w-4 text-green-500" />
                ) : slugAvailable === false ? (
                  <Icon icon="ph:x-circle" className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            </div>

            {slugError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <Icon icon="ph:warning" className="h-3 w-3" />
                {slugError}
              </p>
            )}

            {!canEditSlug && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon icon="ph:info" className="h-3 w-3" />
                Static page URLs are defined in the code and cannot be changed here.
              </p>
            )}

            {slug !== originalSlug && canEditSlug && !slugError && (
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-400">
                  <Icon icon="ph:arrow-u-up-right" className="h-4 w-4" />
                  301 Redirect will be created
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-500">
                  <span className="line-through">{originalSlug}</span>
                  <Icon icon="ph:arrow-right" className="h-3 w-3 inline mx-1" />
                  <span className="font-medium">{slug}</span>
                </p>
                <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
                  Old links will automatically redirect to preserve SEO value.
                </p>
              </div>
            )}
          </div>

          {/* SEO Title */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaTitle" className="text-sm font-medium">
                SEO Title
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={generateSEOTitle}
                disabled={isGeneratingTitle}
              >
                {isGeneratingTitle ? (
                  <Icon icon="ph:spinner" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon icon="ph:magic-wand" className="h-3.5 w-3.5" />
                )}
                {isGeneratingTitle ? "Generating..." : "AI Generate"}
              </Button>
            </div>

            <div className="relative">
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO title for search engines"
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className={cn(
                  "text-xs font-medium",
                  metaTitleLength > 60 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {metaTitleLength}/60
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-300 rounded-full", titleStatus.barColor)}
                  style={{ width: `${Math.min((metaTitleLength / 60) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={titleStatus.color}>{titleStatus.label}</span>
                <span className="text-muted-foreground">Ideal: 50-60 characters</span>
              </div>
            </div>
          </div>

          {/* Meta Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaDescription" className="text-sm font-medium">
                Meta Description
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={generateMetaDescription}
                disabled={isGeneratingDescription}
              >
                {isGeneratingDescription ? (
                  <Icon icon="ph:spinner" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon icon="ph:magic-wand" className="h-3.5 w-3.5" />
                )}
                {isGeneratingDescription ? "Generating..." : "AI Generate"}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Write a short, compelling description that encourages users to click..."
                rows={3}
                className="resize-none pr-16"
              />
              <div className="absolute right-3 bottom-3">
                <span className={cn(
                  "text-xs font-medium",
                  metaDescriptionLength > 160 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {metaDescriptionLength}/160
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-300 rounded-full", descriptionStatus.barColor)}
                  style={{ width: `${Math.min((metaDescriptionLength / 160) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={descriptionStatus.color}>{descriptionStatus.label}</span>
                <span className="text-muted-foreground">Ideal: 145-155 characters</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Icon icon="ph:spinner" className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="ph:floppy-disk" className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

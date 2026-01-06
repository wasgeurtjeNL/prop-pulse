"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SeoTemplate {
  id: string;
  name: string;
  displayName: string;
  category: string | null;
  description?: string;
}

interface LandingPageSeoPanelProps {
  title: string;
  slug: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  targetKeywords: string[];
  onSlugChange: (slug: string) => void;
  onMetaTitleChange: (metaTitle: string) => void;
  onMetaDescriptionChange: (metaDescription: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  onSeoScoreChange?: (score: number) => void;
  siteUrl?: string;
  siteName?: string;
}

// Variable snippets for SEO title
const titleVariables = [
  { label: "Titel", value: "{{title}}", description: "Page title" },
  { label: "Locatie", value: "{{location}}", description: "Location name" },
  { label: "Keyword", value: "{{keyword}}", description: "Primary keyword" },
  { label: "Merk", value: "{{brand}}", description: "Brand name (PSM Phuket)" },
];

const separators = ["|", "-", "•", "–", "—", "·"];

// Slugify function
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Extract a likely keyword from a title
function extractKeywordFromTitle(title: string): string {
  // Remove common words and extract key terms
  const stopWords = ["the", "a", "an", "in", "on", "at", "for", "to", "of", "and", "or", "&", "|", "-"];
  const words = title.toLowerCase().split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  
  // Return first 2-3 significant words as keyword phrase
  return words.slice(0, 3).join(" ");
}

export default function LandingPageSeoPanel({
  title,
  slug,
  category,
  metaTitle,
  metaDescription,
  targetKeywords,
  onSlugChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onKeywordsChange,
  onSeoScoreChange,
  siteUrl = "https://psmphuket.com",
  siteName = "PSM Phuket",
}: LandingPageSeoPanelProps) {
  const [localSlug, setLocalSlug] = useState(slug);
  const [selectedSeparator, setSelectedSeparator] = useState("|");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [templates, setTemplates] = useState<SeoTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [newKeyword, setNewKeyword] = useState("");
  const [aiGeneratedFields, setAiGeneratedFields] = useState<{
    metaTitle?: boolean;
    metaDescription?: boolean;
    slug?: boolean;
  }>({});

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Sync local slug
  useEffect(() => {
    setLocalSlug(slug);
  }, [slug]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/seo-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        // Auto-select template based on category
        const matchingTemplate = data.find((t: SeoTemplate) => t.category === category);
        const defaultTemplate = data.find((t: SeoTemplate) => t.name === "default");
        setSelectedTemplateId(matchingTemplate?.id || defaultTemplate?.id || "");
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  // Calculate SEO Score
  const seoScore = useMemo(() => {
    let score = 0;
    
    // Title checks (max 30 points)
    if (metaTitle) {
      const titleLen = metaTitle.length;
      if (titleLen >= 50 && titleLen <= 60) score += 20; // Perfect length
      else if (titleLen >= 40 && titleLen <= 70) score += 10; // Acceptable
      
      // Keyword in title
      if (targetKeywords.length > 0 && metaTitle.toLowerCase().includes(targetKeywords[0]?.toLowerCase())) {
        score += 10;
      }
    }
    
    // Description checks (max 30 points)
    if (metaDescription) {
      const descLen = metaDescription.length;
      if (descLen >= 145 && descLen <= 155) score += 20; // Perfect length
      else if (descLen >= 120 && descLen <= 160) score += 10; // Acceptable
      
      // Keyword in first 25 chars
      if (targetKeywords.length > 0 && 
          metaDescription.toLowerCase().slice(0, 50).includes(targetKeywords[0]?.toLowerCase())) {
        score += 10;
      }
    }
    
    // Slug checks (max 20 points)
    if (localSlug) {
      if (localSlug.length <= 50) score += 10;
      if (targetKeywords.length > 0 && localSlug.includes(targetKeywords[0]?.toLowerCase().replace(/\s+/g, "-"))) {
        score += 10;
      }
    }
    
    // Keywords (max 20 points)
    if (targetKeywords.length >= 1) score += 10;
    if (targetKeywords.length >= 3) score += 10;
    
    return score;
  }, [metaTitle, metaDescription, localSlug, targetKeywords]);

  // Update parent with SEO score
  useEffect(() => {
    onSeoScoreChange?.(seoScore);
  }, [seoScore, onSeoScoreChange]);

  // Generate SEO Title with AI
  const generateSEOTitle = async () => {
    if (!title) {
      toast.error("Voeg eerst een titel toe");
      return;
    }

    // Warn if no keywords defined
    if (targetKeywords.length === 0) {
      toast.warning("Tip: Voeg eerst target keywords toe voor betere optimalisatie");
    }

    setIsGeneratingTitle(true);
    try {
      const locationMatch = title.match(/(Kamala|Patong|Rawai|Kata|Karon|Bang Tao|Surin|Phuket|Bangkok|Pattaya|Chiang Mai)/i);
      const location = locationMatch ? locationMatch[0] : "Phuket";

      // Use first keyword or extract from title
      const primaryKeyword = targetKeywords[0] || extractKeywordFromTitle(title);

      const response = await fetch("/api/seo-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId || undefined,
          type: "metaTitle",
          variables: {
            title,
            location,
            category,
            keyword: primaryKeyword,
            primaryKeyword: primaryKeyword,
            secondaryKeywords: targetKeywords.slice(1).join(", "),
            brand: siteName,
          },
        }),
      });

      if (response.ok) {
        const { result } = await response.json();
        onMetaTitleChange(result);
        setAiGeneratedFields((prev) => ({ ...prev, metaTitle: true }));
        toast.success("SEO titel gegenereerd!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Generation failed");
      }
    } catch (error) {
      toast.error("Kon SEO titel niet genereren");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Generate Meta Description with AI
  const generateMetaDescription = async () => {
    if (!title) {
      toast.error("Voeg eerst een titel toe");
      return;
    }

    // Warn if no keywords defined
    if (targetKeywords.length === 0) {
      toast.warning("Tip: Voeg eerst target keywords toe voor betere optimalisatie");
    }

    setIsGeneratingDescription(true);
    try {
      const locationMatch = title.match(/(Kamala|Patong|Rawai|Kata|Karon|Bang Tao|Surin|Phuket|Bangkok|Pattaya|Chiang Mai)/i);
      const location = locationMatch ? locationMatch[0] : "Phuket";

      // Use first keyword or extract from title
      const primaryKeyword = targetKeywords[0] || extractKeywordFromTitle(title);

      const response = await fetch("/api/seo-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId || undefined,
          type: "metaDescription",
          variables: {
            title,
            location,
            category,
            keyword: primaryKeyword,
            primaryKeyword: primaryKeyword,
            secondaryKeywords: targetKeywords.slice(1).join(", "),
            usp: "Expert guidance for foreign buyers",
            brand: siteName,
          },
        }),
      });

      if (response.ok) {
        const { result } = await response.json();
        onMetaDescriptionChange(result);
        setAiGeneratedFields((prev) => ({ ...prev, metaDescription: true }));
        toast.success("Meta description gegenereerd!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Generation failed");
      }
    } catch (error) {
      toast.error("Kon meta description niet genereren");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Generate slug from title
  const generateSlug = useCallback(() => {
    if (title) {
      const newSlug = slugify(title);
      setLocalSlug(newSlug);
      onSlugChange(newSlug);
      setAiGeneratedFields((prev) => ({ ...prev, slug: true }));
    }
  }, [title, onSlugChange]);

  const handleSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s+/g, "-");
    setLocalSlug(normalized);
  };

  const handleSlugBlur = () => {
    let finalSlug = slugify(localSlug);
    if (!finalSlug && title) {
      finalSlug = slugify(title);
    }
    setLocalSlug(finalSlug);
    onSlugChange(finalSlug);
  };

  const addKeyword = () => {
    if (newKeyword && !targetKeywords.includes(newKeyword.toLowerCase())) {
      onKeywordsChange([...targetKeywords, newKeyword.toLowerCase()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    onKeywordsChange(targetKeywords.filter((k) => k !== keyword));
  };

  // Character counters
  const metaTitleLength = metaTitle?.length || 0;
  const metaDescriptionLength = metaDescription?.length || 0;

  // Status helpers
  const getTitleStatus = () => {
    if (metaTitleLength === 0) return { color: "text-gray-400", label: "Niet ingesteld", barColor: "bg-gray-300" };
    if (metaTitleLength < 40) return { color: "text-orange-500", label: "Te kort", barColor: "bg-orange-400" };
    if (metaTitleLength > 60) return { color: "text-red-500", label: "Te lang", barColor: "bg-red-500" };
    if (metaTitleLength >= 50) return { color: "text-green-500", label: "Uitstekend", barColor: "bg-green-500" };
    return { color: "text-green-500", label: "Goed", barColor: "bg-green-500" };
  };

  const getDescriptionStatus = () => {
    if (metaDescriptionLength === 0) return { color: "text-gray-400", label: "Niet ingesteld", barColor: "bg-gray-300" };
    if (metaDescriptionLength < 120) return { color: "text-orange-500", label: "Te kort", barColor: "bg-orange-400" };
    if (metaDescriptionLength > 160) return { color: "text-red-500", label: "Te lang", barColor: "bg-red-500" };
    if (metaDescriptionLength >= 145) return { color: "text-green-500", label: "Uitstekend", barColor: "bg-green-500" };
    return { color: "text-green-500", label: "Goed", barColor: "bg-green-500" };
  };

  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();

  // Get category URL prefix
  const getCategoryPrefix = () => {
    const prefixes: Record<string, string> = {
      location: "/locations/",
      guide: "/guides/",
      service: "/services/",
      faq: "/faq/",
    };
    return prefixes[category] || "/";
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex items-center gap-2">
          <Icon icon="ph:magnifying-glass" className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">SEO Instellingen</h3>
        </div>
        <p className="text-purple-200 text-sm mt-1">
          Optimaliseer hoe je pagina eruitziet in zoekmachines
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* SEO Score */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white",
              seoScore >= 80 ? "bg-green-500" : seoScore >= 60 ? "bg-yellow-500" : seoScore >= 40 ? "bg-orange-500" : "bg-red-500"
            )}>
              {seoScore}
            </div>
            <div>
              <p className="font-semibold">SEO Score</p>
              <p className="text-sm text-muted-foreground">
                {seoScore >= 80 ? "Uitstekend!" : seoScore >= 60 ? "Goed" : seoScore >= 40 ? "Kan beter" : "Verbeter dit"}
              </p>
            </div>
          </div>
          {aiGeneratedFields.metaTitle || aiGeneratedFields.metaDescription ? (
            <Badge className="bg-purple-100 text-purple-700 gap-1">
              <Icon icon="ph:magic-wand" className="h-3 w-3" />
              AI gegenereerd
            </Badge>
          ) : null}
        </div>

        {/* SEO Template Selector */}
        <div className="space-y-2">
          <Label>SEO Template</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Kies een template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.displayName}</span>
                    {template.category && (
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Templates bepalen de AI-regels voor SEO generatie.{" "}
            <a href="/dashboard/seo-templates" className="text-primary hover:underline">
              Templates beheren →
            </a>
          </p>
        </div>

        {/* Target Keywords */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Doel Keywords</Label>
            {targetKeywords.length === 0 && title && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-purple-600"
                onClick={() => {
                  // Auto-suggest keywords from title
                  const suggested = extractKeywordFromTitle(title);
                  if (suggested) {
                    onKeywordsChange([suggested]);
                    toast.success("Keyword voorgesteld op basis van titel");
                  }
                }}
              >
                <Icon icon="ph:magic-wand" className="h-3 w-3" />
                Stel voor
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Voeg keyword toe..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
              <Icon icon="ph:plus" className="h-4 w-4" />
            </Button>
          </div>
          {targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {targetKeywords.map((keyword, i) => (
                <Badge 
                  key={keyword} 
                  variant={i === 0 ? "default" : "secondary"} 
                  className="gap-1"
                >
                  {i === 0 && <Icon icon="ph:star" className="h-3 w-3" />}
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-red-500"
                  >
                    <Icon icon="ph:x" className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Eerste keyword is het primaire keyword (wordt prominent geplaatst).
            {targetKeywords.length < 2 && " Voeg meerdere keywords toe voor betere SEO score."}
          </p>
        </div>

        {/* Google Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Google Voorbeeld
          </Label>
          <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon icon="ph:globe" className="h-4 w-4" />
              <span>{siteUrl}{getCategoryPrefix()}{localSlug || "..."}</span>
            </div>
            <h4 className="text-xl text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer font-normal">
              {metaTitle || title || "Voeg een titel toe"}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {metaDescription || "Voeg een meta beschrijving toe om te laten zien wat deze pagina bevat..."}
            </p>
          </div>
        </div>

        {/* SEO Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaTitle" className="text-sm font-medium">
              SEO Titel
              {aiGeneratedFields.metaTitle && (
                <Badge variant="outline" className="ml-2 text-xs">
                  <Icon icon="ph:magic-wand" className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={generateSEOTitle}
              disabled={isGeneratingTitle || !title}
            >
              {isGeneratingTitle ? (
                <Icon icon="ph:spinner" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon icon="ph:magic-wand" className="h-3.5 w-3.5" />
              )}
              {isGeneratingTitle ? "Genereren..." : "AI Genereer"}
            </Button>
          </div>

          <div className="relative">
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => {
                onMetaTitleChange(e.target.value);
                setAiGeneratedFields((prev) => ({ ...prev, metaTitle: false }));
              }}
              placeholder="SEO titel voor zoekmachines"
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
              <span className="text-muted-foreground">Ideaal: 50-60 tekens</span>
            </div>
          </div>
        </div>

        {/* Slug / URL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="slug" className="text-sm font-medium">
              URL Slug
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
              onClick={generateSlug}
            >
              <Icon icon="ph:arrow-clockwise" className="h-3.5 w-3.5" />
              Regenereren
            </Button>
          </div>

          <div className="flex items-center gap-0 rounded-md border bg-muted/30 overflow-hidden">
            <div className="px-3 py-2 bg-muted text-sm text-muted-foreground border-r shrink-0">
              {siteUrl}{getCategoryPrefix()}
            </div>
            <Input
              id="slug"
              value={localSlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={handleSlugBlur}
              placeholder="jouw-pagina-url"
              className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Gebruik korte, beschrijvende woorden gescheiden door streepjes. Plaats het primaire keyword vooraan.
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription" className="text-sm font-medium">
              Meta Beschrijving
              {aiGeneratedFields.metaDescription && (
                <Badge variant="outline" className="ml-2 text-xs">
                  <Icon icon="ph:magic-wand" className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={generateMetaDescription}
              disabled={isGeneratingDescription || !title}
            >
              {isGeneratingDescription ? (
                <Icon icon="ph:spinner" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon icon="ph:magic-wand" className="h-3.5 w-3.5" />
              )}
              {isGeneratingDescription ? "Genereren..." : "AI Genereer"}
            </Button>
          </div>

          <div className="relative">
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => {
                onMetaDescriptionChange(e.target.value);
                setAiGeneratedFields((prev) => ({ ...prev, metaDescription: false }));
              }}
              placeholder="Schrijf een korte, overtuigende beschrijving die gebruikers aanmoedigt om te klikken..."
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
              <span className="text-muted-foreground">Ideaal: 145-155 tekens</span>
            </div>
          </div>
        </div>

        {/* SEO Best Practices Checklist */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">SEO Checklist</Label>
          <div className="space-y-2">
            {[
              { 
                check: metaTitleLength >= 50 && metaTitleLength <= 60, 
                text: "Meta titel heeft ideale lengte (50-60 tekens)" 
              },
              { 
                check: targetKeywords.length > 0 && metaTitle?.toLowerCase().includes(targetKeywords[0]?.toLowerCase()), 
                text: "Primair keyword staat in de titel" 
              },
              { 
                check: metaDescriptionLength >= 145 && metaDescriptionLength <= 155, 
                text: "Meta beschrijving heeft ideale lengte (145-155 tekens)" 
              },
              { 
                check: targetKeywords.length > 0 && metaDescription?.toLowerCase().slice(0, 50).includes(targetKeywords[0]?.toLowerCase()), 
                text: "Primair keyword staat in eerste 50 tekens van beschrijving" 
              },
              { 
                check: localSlug && localSlug.length <= 50, 
                text: "URL slug is kort en beschrijvend" 
              },
              { 
                check: targetKeywords.length >= 2, 
                text: "Meerdere target keywords gedefinieerd" 
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  item.check ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                )}>
                  <Icon icon={item.check ? "ph:check" : "ph:x"} className="h-3 w-3" />
                </div>
                <span className={item.check ? "text-foreground" : "text-muted-foreground"}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Separator Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Scheidingsteken (voor templates)</Label>
          <div className="flex flex-wrap gap-2">
            {separators.map((sep) => (
              <Button
                key={sep}
                type="button"
                variant={selectedSeparator === sep ? "default" : "outline"}
                size="sm"
                className="w-10 h-10 text-lg"
                onClick={() => setSelectedSeparator(sep)}
              >
                {sep}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

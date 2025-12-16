"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sparkles,
  Smile,
  ChevronDown,
  Globe,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface SEOPanelProps {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  metaTitle: string;
  metaDescription: string;
  onSlugChange: (slug: string) => void;
  onMetaTitleChange: (metaTitle: string) => void;
  onMetaDescriptionChange: (metaDescription: string) => void;
  siteUrl?: string;
  siteName?: string;
}

// Variable snippets for SEO title
const titleVariables = [
  { label: "Titel", value: "%%title%%", description: "Blog post title" },
  { label: "Pagina", value: "%%page%%", description: "Page number" },
  { label: "Scheidingsteken", value: "%%sep%%", description: "Separator (|, -, •)" },
  { label: "Website titel", value: "%%sitename%%", description: "Site name" },
];

const separators = ["|", "-", "•", "–", "—", "·"];

// Slugify function
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, ""); // Trim - from start/end
}

export default function SEOPanel({
  title,
  slug,
  excerpt = "",
  content = "",
  metaTitle,
  metaDescription,
  onSlugChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  siteUrl = "https://psmphuket.com",
  siteName = "Real Estate Pulse",
}: SEOPanelProps) {
  const [localSlug, setLocalSlug] = useState(slug);
  const [selectedSeparator, setSelectedSeparator] = useState("|");
  const [showVariablesPopover, setShowVariablesPopover] = useState(false);
  const [metaTitleFocused, setMetaTitleFocused] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Generate SEO Title with AI
  const generateSEOTitle = async () => {
    if (!title) {
      toast.error("Voeg eerst een titel toe");
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch("/api/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          type: "title",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const { result } = await response.json();
      onMetaTitleChange(result);
      toast.success("SEO titel gegenereerd!");
    } catch (error) {
      console.error("SEO Title Generation Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon SEO titel niet genereren"
      );
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

    setIsGeneratingDescription(true);
    try {
      const response = await fetch("/api/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          type: "description",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const { result } = await response.json();
      onMetaDescriptionChange(result);
      toast.success("Meta description gegenereerd!");
    } catch (error) {
      console.error("Meta Description Generation Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Kon meta description niet genereren"
      );
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Sync local slug with prop when it changes externally
  useEffect(() => {
    setLocalSlug(slug);
  }, [slug]);

  // Generate slug from title
  const generateSlug = useCallback(() => {
    if (title) {
      const newSlug = slugify(title);
      setLocalSlug(newSlug);
      onSlugChange(newSlug);
    }
  }, [title, onSlugChange]);

  // Auto-generate slug if empty when title changes
  useEffect(() => {
    if (!slug && title) {
      const newSlug = slugify(title);
      setLocalSlug(newSlug);
      onSlugChange(newSlug);
    }
  }, [title, slug, onSlugChange]);

  // Handle slug input change - allow free typing
  const handleSlugChange = (value: string) => {
    // Allow typing but normalize for URL (lowercase, replace spaces with hyphens)
    const normalized = value
      .toLowerCase()
      .replace(/\s+/g, "-");
    setLocalSlug(normalized);
  };

  // Handle slug blur - finalize and slugify
  const handleSlugBlur = () => {
    let finalSlug = slugify(localSlug);
    
    // If slug is empty after slugifying, regenerate from title
    if (!finalSlug && title) {
      finalSlug = slugify(title);
    }
    
    setLocalSlug(finalSlug);
    onSlugChange(finalSlug);
  };

  // Process meta title with variables
  const processedMetaTitle = useCallback(() => {
    let processed = metaTitle || title;
    processed = processed
      .replace(/%%title%%/g, title)
      .replace(/%%page%%/g, "1")
      .replace(/%%sep%%/g, selectedSeparator)
      .replace(/%%sitename%%/g, siteName);
    return processed;
  }, [metaTitle, title, selectedSeparator, siteName]);

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    const newTitle = metaTitle ? `${metaTitle} ${variable}` : variable;
    onMetaTitleChange(newTitle);
    setShowVariablesPopover(false);
  };

  // Character counters
  const metaTitleLength = processedMetaTitle().length;
  const metaDescriptionLength = metaDescription?.length || 0;

  // SEO score indicators
  const getTitleStatus = () => {
    if (metaTitleLength === 0) return { color: "text-gray-400", label: "Niet ingesteld" };
    if (metaTitleLength < 30) return { color: "text-orange-500", label: "Te kort" };
    if (metaTitleLength > 60) return { color: "text-red-500", label: "Te lang" };
    return { color: "text-green-500", label: "Goed" };
  };

  const getDescriptionStatus = () => {
    if (metaDescriptionLength === 0) return { color: "text-gray-400", label: "Niet ingesteld" };
    if (metaDescriptionLength < 120) return { color: "text-orange-500", label: "Te kort" };
    if (metaDescriptionLength > 160) return { color: "text-red-500", label: "Te lang" };
    return { color: "text-green-500", label: "Goed" };
  };

  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">SEO Instellingen</h3>
        </div>
        <p className="text-purple-200 text-sm mt-1">
          Optimaliseer hoe je blogpost eruitziet in zoekmachines
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Google Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Google Voorbeeld
          </Label>
          <div className="rounded-lg border bg-white p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="h-4 w-4" />
              <span>{siteUrl}/blogs/{localSlug || "..."}</span>
            </div>
            <h4 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-normal">
              {processedMetaTitle() || title || "Voeg een titel toe"}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {metaDescription || "Voeg een meta beschrijving toe om te laten zien wat deze pagina bevat..."}
            </p>
          </div>
        </div>

        {/* SEO Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaTitle" className="text-sm font-medium">
              SEO Titel
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={generateSEOTitle}
                disabled={isGeneratingTitle || !title}
              >
                {isGeneratingTitle ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isGeneratingTitle ? "Genereren..." : "Genereer SEO titel"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Popover open={showVariablesPopover} onOpenChange={setShowVariablesPopover}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                  >
                    Variabele invoegen
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-1">
                    {titleVariables.map((variable) => (
                      <button
                        key={variable.value}
                        type="button"
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm"
                        onClick={() => insertVariable(variable.value)}
                      >
                        <div className="font-medium">{variable.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {variable.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Variable Badges */}
          <div className="flex flex-wrap gap-2">
            {titleVariables.map((variable) => (
              <Badge
                key={variable.value}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => insertVariable(variable.value)}
              >
                {variable.label}
              </Badge>
            ))}
          </div>

          <div className="relative">
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => onMetaTitleChange(e.target.value)}
              onFocus={() => setMetaTitleFocused(true)}
              onBlur={() => setMetaTitleFocused(false)}
              placeholder="%%title%% %%sep%% %%sitename%%"
              className="pr-20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  metaTitleLength > 60 ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {metaTitleLength}/60
              </span>
            </div>
          </div>

          {/* Character Progress Bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  metaTitleLength < 30
                    ? "bg-orange-400"
                    : metaTitleLength > 60
                    ? "bg-red-500"
                    : "bg-green-500"
                )}
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
              Slug (URL)
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
              onClick={generateSlug}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenereren
            </Button>
          </div>

          <div className="flex items-center gap-0 rounded-md border bg-muted/30 overflow-hidden">
            <div className="px-3 py-2 bg-muted text-sm text-muted-foreground border-r shrink-0">
              {siteUrl}/blogs/
            </div>
            <Input
              id="slug"
              value={localSlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={handleSlugBlur}
              placeholder="jouw-blog-url"
              className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            De slug is het deel van de URL dat na /blogs/ komt. Gebruik korte, beschrijvende woorden gescheiden door streepjes.
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription" className="text-sm font-medium">
              Meta Beschrijving
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={generateMetaDescription}
                disabled={isGeneratingDescription || !title}
              >
                {isGeneratingDescription ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isGeneratingDescription ? "Genereren..." : "Genereer meta description"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                  >
                    Variabele invoegen
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-1">
                    {titleVariables.slice(0, 2).map((variable) => (
                      <button
                        key={variable.value}
                        type="button"
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm"
                        onClick={() => {
                          const newDesc = metaDescription
                            ? `${metaDescription} ${variable.value}`
                            : variable.value;
                          onMetaDescriptionChange(newDesc);
                        }}
                      >
                        <div className="font-medium">{variable.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {variable.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="relative">
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              placeholder="Schrijf een korte, overtuigende beschrijving van je blogpost die gebruikers aanmoedigt om te klikken..."
              rows={3}
              className="resize-none pr-16"
            />
            <div className="absolute right-3 bottom-3">
              <span
                className={cn(
                  "text-xs font-medium",
                  metaDescriptionLength > 160 ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {metaDescriptionLength}/160
              </span>
            </div>
          </div>

          {/* Character Progress Bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  metaDescriptionLength < 120
                    ? "bg-orange-400"
                    : metaDescriptionLength > 160
                    ? "bg-red-500"
                    : "bg-green-500"
                )}
                style={{
                  width: `${Math.min((metaDescriptionLength / 160) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={descriptionStatus.color}>{descriptionStatus.label}</span>
              <span className="text-muted-foreground">Ideaal: 120-160 tekens</span>
            </div>
          </div>
        </div>

        {/* Separator Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Scheidingsteken</Label>
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
          <p className="text-xs text-muted-foreground">
            Het scheidingsteken wordt gebruikt tussen de titel en de sitenaam in de SEO titel.
          </p>
        </div>
      </div>
    </div>
  );
}


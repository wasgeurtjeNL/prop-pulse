"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Lightbulb,
  Zap,
  Eye,
  RotateCcw,
  Play,
  ChevronRight,
  Search,
  BarChart3,
  Target,
  TrendingUp,
  ArrowRight,
  Check,
  X,
  ArrowUpCircle,
} from "lucide-react";
import { BlogUpgrade } from "./BlogUpgrade";
import { motion, AnimatePresence } from "framer-motion";

// AI Creation benefits for display during waiting
const AI_CREATION_BENEFITS = [
  {
    icon: "🎯",
    title: "SEO-Geoptimaliseerd",
    description: "Automatisch meta tags, structured data en keywords toegevoegd"
  },
  {
    icon: "🖼️",
    title: "Professionele Hero Afbeeldingen",
    description: "AI genereert unieke, high-quality beelden perfect afgestemd op je content"
  },
  {
    icon: "⚡",
    title: "Instant Internal Linking",
    description: "Direct gekoppeld aan relevante blogs voor betere link juice"
  },
  {
    icon: "🎨",
    title: "Geoptimaliseerde Visuals",
    description: "Automatisch gecomprimeerd, responsive en WebP-ready voor snelle laadtijden"
  },
  {
    icon: "📊",
    title: "Conversie-Gericht",
    description: "CTA's en lead magnets strategisch geplaatst"
  },
  {
    icon: "✨",
    title: "Unieke Merkidentiteit",
    description: "Afbeeldingen in consistente stijl die bij je merk passen"
  },
  {
    icon: "🌍",
    title: "Meertalig Ready",
    description: "Klaar voor uitbreiding naar andere talen"
  },
  {
    icon: "📱",
    title: "Mobile-First",
    description: "Responsive design out-of-the-box"
  },
  {
    icon: "🔗",
    title: "Automatische Backlinks",
    description: "Bestaande blogs worden direct bijgewerkt met links"
  },
  {
    icon: "🚀",
    title: "CDN Optimalisatie",
    description: "Afbeeldingen direct op ImageKit CDN voor wereldwijde snelheid"
  }
];

const CREATION_STEPS = [
  { id: 1, label: "Content analyseren...", duration: 2000 },
  { id: 2, label: "SEO keywords bepalen...", duration: 1500 },
  { id: 3, label: "Pagina structuur maken...", duration: 2000 },
  { id: 4, label: "Content genereren...", duration: 3000 },
  { id: 5, label: "🎨 AI afbeeldingen genereren (3 stuks)...", duration: 25000, isImage: true },
  { id: 6, label: "🖼️ Afbeeldingen optimaliseren & uploaden...", duration: 20000, isImage: true },
  { id: 7, label: "Internal links toevoegen...", duration: 2000 },
  { id: 8, label: "Opslaan en valideren...", duration: 1500 }
];

// Types
interface InternalLink {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  keywords: string;
  priority: number;
  usageCount: number;
  isActive: boolean;
  pageExists: boolean;
  lastChecked?: string;
}

interface LandingPageSuggestion {
  id: string;
  suggestedUrl: string;
  suggestedTitle: string;
  description: string;
  category: string;
  reason: string;
  mentionCount: number;
  status: "PENDING" | "APPROVED" | "CREATED" | "DISMISSED";
}

interface BlogCandidate {
  id: string;
  title: string;
  slug: string;
  wordCount: number;
  actualLinkCount: number;
  idealRange: { min: number; max: number };
  status: "good" | "needs_optimization" | "over_optimized";
  lastOptimized?: string;
}

interface BatchPreview {
  blogId: string;
  blogTitle: string;
  injections: any[];
  previewSnippets: { before: string; after: string }[];
}

export function LinkManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Link state
  const [links, setLinks] = useState<InternalLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<LandingPageSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [creatingSuggestionId, setCreatingSuggestionId] = useState<string | null>(null);
  const [showCreationDialog, setShowCreationDialog] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [createdPageResult, setCreatedPageResult] = useState<{
    title: string;
    url: string;
    linksAdded: number;
    hasImage: boolean;
  } | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  
  // Blog analysis state
  const [blogCandidates, setBlogCandidates] = useState<BlogCandidate[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  
  // Batch optimization state
  const [batchStats, setBatchStats] = useState<any>(null);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [batchPreviews, setBatchPreviews] = useState<BatchPreview[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);
  
  // Filter state
  const [linkFilter, setLinkFilter] = useState<"all" | "valid" | "invalid">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Load links on mount
  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const response = await fetch("/api/smart-blog/internal-links?includeUsage=true");
      const data = await response.json();
      if (response.ok) {
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error("Failed to load links:", error);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const validateLinks = async () => {
    setIsValidating(true);
    try {
      const response = await fetch("/api/smart-blog/links/validate", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Validated ${data.summary.total} links: ${data.summary.valid} valid, ${data.summary.invalid} invalid`);
        loadLinks();
      } else {
        toast.error(data.error || "Validation failed");
      }
    } catch (error) {
      toast.error("Failed to validate links");
    } finally {
      setIsValidating(false);
    }
  };

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch("/api/smart-blog/links/suggestions");
      const data = await response.json();
      if (response.ok) {
        const allSuggestions = [
          ...(data.suggestions?.pending || []),
          ...(data.suggestions?.approved || [])
        ];
        setSuggestions(allSuggestions);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const generateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch("/api/smart-blog/links/suggestions", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Generated ${data.results?.newSuggestions || 0} new suggestions`);
        loadSuggestions();
      } else {
        toast.error(data.error || "Failed to generate suggestions");
      }
    } catch (error) {
      toast.error("Failed to generate suggestions");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const updateSuggestionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/smart-blog/links/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (response.ok) {
        toast.success(`Suggestion ${status.toLowerCase()}`);
        loadSuggestions();
        if (status === "CREATED") {
          loadLinks();
        }
      }
    } catch (error) {
      toast.error("Failed to update suggestion");
    }
  };

  const createLandingPage = async (id: string) => {
    const suggestion = suggestions.find(s => s.id === id);
    setCreatingSuggestionId(id);
    setShowCreationDialog(true);
    setCreationStep(0);
    setCurrentBenefitIndex(0);
    
    // Realistic step timing - image steps take much longer!
    // Steps 0-3: quick (content analysis/generation) ~2s each
    // Steps 4-5: slow (image generation/upload) ~25s each  
    // Steps 6-7: quick (links/save) ~2s each
    const stepTimings = [2000, 1500, 2000, 3000, 25000, 20000, 2000, 1500]; // Total ~58s realistic
    let currentStepIndex = 0;
    let stepTimeout: NodeJS.Timeout;
    
    const advanceStep = () => {
      if (currentStepIndex < CREATION_STEPS.length - 1) {
        currentStepIndex++;
        setCreationStep(currentStepIndex);
        // Schedule next step with appropriate timing
        if (currentStepIndex < CREATION_STEPS.length - 1) {
          stepTimeout = setTimeout(advanceStep, stepTimings[currentStepIndex]);
        }
      }
    };
    
    // Start first step advancement
    stepTimeout = setTimeout(advanceStep, stepTimings[0]);
    
    // Rotate benefits
    const benefitInterval = setInterval(() => {
      setCurrentBenefitIndex(prev => (prev + 1) % AI_CREATION_BENEFITS.length);
    }, 3000);
    
    try {
      const response = await fetch("/api/smart-blog/links/suggestions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      
      clearTimeout(stepTimeout);
      clearInterval(benefitInterval);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create landing page");
      }
      
      // Set completion step
      setCreationStep(CREATION_STEPS.length);
      
      // Brief pause to show completion
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setShowCreationDialog(false);
      setCreatedPageResult({
        title: suggestion?.suggestedTitle || data.page?.title || "Nieuwe pagina",
        url: suggestion?.suggestedUrl || data.page?.url || "/",
        linksAdded: data.linksAdded || 0,
        hasImage: data.hasImage !== false // Assume true unless explicitly false
      });
      setShowCompletionDialog(true);
      
      await loadSuggestions();
      await loadLinks();
    } catch (error: any) {
      clearTimeout(stepTimeout);
      clearInterval(benefitInterval);
      setShowCreationDialog(false);
      toast.error(error.message || "Failed to create landing page");
    } finally {
      setCreatingSuggestionId(null);
    }
  };

  const loadBlogAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const response = await fetch("/api/smart-blog/links/analyze");
      const data = await response.json();
      if (response.ok) {
        const allBlogs = [
          ...(data.blogs?.needsOptimization || []),
          ...(data.blogs?.good || []),
          ...(data.blogs?.overOptimized || [])
        ];
        setBlogCandidates(allBlogs);
      }
    } catch (error) {
      console.error("Failed to load analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const loadBatchStats = async () => {
    setIsLoadingBatch(true);
    try {
      const response = await fetch("/api/smart-blog/links/batch");
      const data = await response.json();
      if (response.ok) {
        setBatchStats(data);
      }
    } catch (error) {
      console.error("Failed to load batch stats:", error);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const runBatchPreview = async () => {
    setIsProcessingBatch(true);
    setBatchPreviews([]);
    try {
      const body: any = { preview: true };
      if (selectedBlogIds.length > 0) {
        body.blogIds = selectedBlogIds;
      } else {
        body.limit = 5;
      }
      
      const response = await fetch("/api/smart-blog/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok) {
        setBatchPreviews(data.previews || []);
        toast.success(`Preview generated for ${data.summary?.success || 0} blogs`);
      } else {
        toast.error(data.error || "Preview failed");
      }
    } catch (error) {
      toast.error("Failed to generate preview");
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const applyBatchOptimization = async () => {
    setIsProcessingBatch(true);
    try {
      const blogIds = batchPreviews.map(p => p.blogId);
      const response = await fetch("/api/smart-blog/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogIds, forceApprove: true })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Applied ${data.summary?.totalLinksInjected || 0} links to ${data.summary?.success || 0} blogs`);
        setBatchPreviews([]);
        loadBlogAnalysis();
        loadBatchStats();
      } else {
        toast.error(data.error || "Apply failed");
      }
    } catch (error) {
      toast.error("Failed to apply optimization");
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // Filter links
  const filteredLinks = links.filter(link => {
    if (linkFilter === "valid" && !link.pageExists) return false;
    if (linkFilter === "invalid" && link.pageExists) return false;
    if (categoryFilter !== "all" && link.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(links.map(l => l.category).filter(Boolean))];
  const validCount = links.filter(l => l.pageExists).length;
  const invalidCount = links.filter(l => !l.pageExists).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{links.length}</p>
                <p className="text-xs text-muted-foreground">Total Links</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{validCount}</p>
                <p className="text-xs text-muted-foreground">Valid Links</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{invalidCount}</p>
                <p className="text-xs text-muted-foreground">Missing Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{suggestions.length}</p>
                <p className="text-xs text-muted-foreground">Suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Link2 className="h-4 w-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2" onClick={loadSuggestions}>
            <Lightbulb className="h-4 w-4" />
            Suggesties
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2" onClick={loadBlogAnalysis}>
            <BarChart3 className="h-4 w-4" />
            Analyse
          </TabsTrigger>
          <TabsTrigger value="optimize" className="gap-2" onClick={loadBatchStats}>
            <Zap className="h-4 w-4" />
            Optimaliseren
          </TabsTrigger>
          <TabsTrigger value="upgrade" className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Upgrade
          </TabsTrigger>
        </TabsList>

        {/* Links Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={linkFilter} onValueChange={(v: any) => setLinkFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle links</SelectItem>
                  <SelectItem value="valid">Geldig</SelectItem>
                  <SelectItem value="invalid">Ontbrekend</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadLinks} disabled={isLoadingLinks}>
                {isLoadingLinks ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button onClick={validateLinks} disabled={isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Valideren...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valideer Links
                  </>
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredLinks.map(link => (
                <Card key={link.id} className={`${!link.pageExists ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}`}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {link.pageExists ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="font-medium truncate">{link.title}</span>
                          <Badge variant="outline" className="text-xs">{link.category}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {link.usageCount}x gebruikt
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">{link.url}</p>
                        {link.keywords && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Keywords: {link.keywords}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredLinks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Geen links gevonden</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ontbrekende Landingspagina Suggesties</h3>
              <p className="text-sm text-muted-foreground">
                AI-gegenereerde suggesties voor pagina's die je zou moeten maken
              </p>
            </div>
            <Button onClick={generateSuggestions} disabled={isGeneratingSuggestions}>
              {isGeneratingSuggestions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyseren...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Genereer Suggesties
                </>
              )}
            </Button>
          </div>

          {isLoadingSuggestions ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Geen suggesties beschikbaar</p>
                <p className="text-sm text-muted-foreground">
                  Klik op "Genereer Suggesties" om te starten
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {suggestions.map(suggestion => (
                  <Card key={suggestion.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{suggestion.suggestedTitle}</span>
                            <Badge variant="outline">{suggestion.category}</Badge>
                            {suggestion.mentionCount > 1 && (
                              <Badge variant="secondary">{suggestion.mentionCount}x genoemd</Badge>
                            )}
                          </div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                            {suggestion.suggestedUrl}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.description}
                          </p>
                          {suggestion.reason && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              💡 {suggestion.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => createLandingPage(suggestion.id)}
                            disabled={creatingSuggestionId === suggestion.id}
                          >
                            {creatingSuggestionId === suggestion.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Create with AI
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => updateSuggestionStatus(suggestion.id, "CREATED")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Gemaakt
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => updateSuggestionStatus(suggestion.id, "DISMISSED")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Afwijzen
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Blog Link Analyse</h3>
              <p className="text-sm text-muted-foreground">
                Overzicht van blogs en hun internal linking status
              </p>
            </div>
            <Button variant="outline" onClick={loadBlogAnalysis} disabled={isLoadingAnalysis}>
              {isLoadingAnalysis ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isLoadingAnalysis ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : blogCandidates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Geen blogs gevonden</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {blogCandidates.map(blog => (
                  <Card key={blog.id} className={`
                    ${blog.status === 'needs_optimization' ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' : ''}
                    ${blog.status === 'over_optimized' ? 'border-purple-200 bg-purple-50 dark:bg-purple-950/20' : ''}
                  `}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {blog.status === 'good' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {blog.status === 'needs_optimization' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                            {blog.status === 'over_optimized' && <Target className="h-4 w-4 text-purple-500" />}
                            <span className="font-medium truncate">{blog.title}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{blog.wordCount} woorden</span>
                            <span>
                              {blog.actualLinkCount} links 
                              <span className="text-xs ml-1">
                                (ideaal: {blog.idealRange.min}-{blog.idealRange.max})
                              </span>
                            </span>
                            {blog.lastOptimized && (
                              <span className="text-xs">
                                Laatst: {new Date(blog.lastOptimized).toLocaleDateString('nl-NL')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <input
                            type="checkbox"
                            checked={selectedBlogIds.includes(blog.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBlogIds([...selectedBlogIds, blog.id]);
                              } else {
                                setSelectedBlogIds(selectedBlogIds.filter(id => id !== blog.id));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedBlogIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span>{selectedBlogIds.length} blog(s) geselecteerd</span>
              <Button onClick={runBatchPreview} disabled={isProcessingBatch}>
                {isProcessingBatch ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Preview Optimalisatie
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-4">
          {batchStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold">{batchStats.stats.totalBlogs}</p>
                  <p className="text-xs text-muted-foreground">Totaal Blogs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{batchStats.stats.optimizedBlogs}</p>
                  <p className="text-xs text-muted-foreground">Geoptimaliseerd</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{batchStats.stats.needsOptimization}</p>
                  <p className="text-xs text-muted-foreground">Te Optimaliseren</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold">{batchStats.stats.optimizationRate}%</p>
                  <p className="text-xs text-muted-foreground">Optimalisatie Rate</p>
                </CardContent>
              </Card>
            </div>
          )}

          {batchPreviews.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Batch Optimalisatie
                </CardTitle>
                <CardDescription>
                  Optimaliseer meerdere blogs tegelijk met AI-gestuurde link injectie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Hoe het werkt:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>AI analyseert je blogs voor link opportunities</li>
                    <li>Je krijgt een preview van alle wijzigingen</li>
                    <li>Na goedkeuring worden links automatisch toegevoegd</li>
                    <li>Je kunt altijd terugdraaien naar de originele content</li>
                  </ol>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={runBatchPreview} disabled={isProcessingBatch} className="flex-1">
                    {isProcessingBatch ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyseren...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview (5 blogs)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Preview: {batchPreviews.length} blogs</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setBatchPreviews([])}>
                    Annuleren
                  </Button>
                  <Button onClick={applyBatchOptimization} disabled={isProcessingBatch}>
                    {isProcessingBatch ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Toepassen...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Alles Toepassen
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {batchPreviews.map(preview => (
                    <Card key={preview.blogId}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">{preview.blogTitle}</CardTitle>
                        <CardDescription>
                          {preview.injections.length} link(s) worden toegevoegd
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2">
                          {preview.previewSnippets.map((snippet, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 line-through">{snippet.before}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span 
                                  className="text-green-600"
                                  dangerouslySetInnerHTML={{ __html: snippet.after }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>

        {/* Upgrade Tab */}
        <TabsContent value="upgrade" className="space-y-4">
          <BlogUpgrade />
        </TabsContent>
      </Tabs>

      {/* AI Creation Progress Dialog */}
      <Dialog open={showCreationDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              AI Creëert je Landingspagina
            </DialogTitle>
            <DialogDescription>
              Even geduld terwijl we een professionele pagina voor je maken
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {/* Progress Steps */}
            <div className="space-y-3">
              {CREATION_STEPS.map((step, index) => {
                const isImageStep = 'isImage' in step && step.isImage;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0.4 }}
                    animate={{ 
                      opacity: index <= creationStep ? 1 : 0.4,
                    }}
                    className={`flex items-center gap-3 ${isImageStep && index === creationStep ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 -mx-2 px-2 py-1.5 rounded-lg' : ''}`}
                  >
                    <div className={`
                      h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300
                      ${index < creationStep 
                        ? 'bg-green-500 text-white' 
                        : index === creationStep 
                          ? isImageStep 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white animate-pulse' 
                            : 'bg-violet-500 text-white animate-pulse' 
                          : 'bg-muted text-muted-foreground'}
                    `}>
                      {index < creationStep ? (
                        <Check className="h-3 w-3" />
                      ) : index === creationStep ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className={`text-sm ${index === creationStep ? 'font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                    {isImageStep && index === creationStep && (
                      <Badge variant="outline" className="ml-auto text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300">
                        Dit kan even duren
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={(creationStep / CREATION_STEPS.length) * 100} 
                className="h-2"
              />
              <p className="text-xs text-center text-muted-foreground">
                {Math.round((creationStep / CREATION_STEPS.length) * 100)}% voltooid
              </p>
            </div>

            {/* Image Generation Info - Shows when on image steps */}
            {creationStep >= 4 && creationStep <= 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <span className="text-xl">{creationStep === 4 ? "🎨" : "🖼️"}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-amber-900 dark:text-amber-100">
                      {creationStep === 4 
                        ? "AI genereert 3 unieke afbeeldingen..."
                        : "Afbeeldingen optimaliseren & uploaden..."}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {creationStep === 4 
                        ? "Professionele hero images worden speciaal voor elke sectie gemaakt met AI. Elke afbeelding is uniek en perfect afgestemd op de content - dit duurt even maar is het wachten waard!"
                        : "Alle afbeeldingen worden gecomprimeerd naar WebP formaat, responsive gemaakt in meerdere formaten en geüpload naar ons wereldwijde CDN voor razendsnelle laadtijden."}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Check className="h-3 w-3" />
                    4K Kwaliteit
                  </div>
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Check className="h-3 w-3" />
                    3 Unieke Visuals
                  </div>
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Check className="h-3 w-3" />
                    Royalty-free
                  </div>
                </div>
                {/* Extra info about why it takes time */}
                <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-700/50">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {creationStep === 4 
                      ? "AI-beeldgeneratie duurt 20-40 seconden per afbeelding..."
                      : "Optimalisatie & CDN upload voor 3 afbeeldingen..."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Rotating Benefits - Shows when NOT on image steps */}
            {(creationStep < 4 || creationStep > 5) && (
              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 rounded-xl p-4 border border-violet-200/50 dark:border-violet-800/50">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wide">
                  ✨ Waarom AI-gegenereerde pagina's beter zijn
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBenefitIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-2xl">{AI_CREATION_BENEFITS[currentBenefitIndex].icon}</span>
                    <div>
                      <p className="font-medium text-sm">{AI_CREATION_BENEFITS[currentBenefitIndex].title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {AI_CREATION_BENEFITS[currentBenefitIndex].description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Benefit indicators */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {AI_CREATION_BENEFITS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentBenefitIndex 
                          ? 'w-4 bg-violet-500' 
                          : 'w-1.5 bg-violet-300 dark:bg-violet-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fun facts - rotating based on step */}
            <p className="text-xs text-center text-muted-foreground italic">
              {creationStep >= 4 && creationStep <= 5 
                ? "🖼️ Wist je dat? Pagina's met unieke AI-afbeeldingen krijgen 47% meer engagement dan stockfoto's"
                : "💡 Tip: AI-gegenereerde pagina's converteren gemiddeld 23% beter dan handmatig gemaakte pagina's"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Success Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              Pagina Succesvol Aangemaakt! 🎉
            </DialogTitle>
          </DialogHeader>
          
          {createdPageResult && (
            <div className="py-4 space-y-4">
              {/* Created page info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{createdPageResult.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Link2 className="h-3 w-3" />
                  <span>{createdPageResult.url}</span>
                </div>
              </div>

              {/* Stats */}
              <div className={`grid gap-3 ${createdPageResult.hasImage ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">1</p>
                  <p className="text-xs text-muted-foreground">Pagina gemaakt</p>
                </div>
                {createdPageResult.hasImage && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">3</p>
                    <p className="text-xs text-muted-foreground">AI Afbeeldingen</p>
                  </div>
                )}
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {createdPageResult.linksAdded || "∞"}
                  </p>
                  <p className="text-xs text-muted-foreground">Links toegevoegd</p>
                </div>
              </div>

              {/* Image Created Banner */}
              {createdPageResult.hasImage && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-sm">🖼️</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                        3 Unieke AI-afbeeldingen gegenereerd!
                      </p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        4K Kwaliteit • WebP geoptimaliseerd • CDN geüpload
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* What's included */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Wat is er gemaakt:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500" />
                    SEO meta tags
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500" />
                    Structured data
                  </div>
                  {createdPageResult.hasImage && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Check className="h-3 w-3 text-amber-500" />
                      AI Hero afbeelding
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500" />
                    Hero sectie
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500" />
                    CTA buttons
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500" />
                    Internal links
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500" />
                    Mobile responsive
                  </div>
                  {createdPageResult.hasImage && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Check className="h-3 w-3 text-green-500" />
                      OG social image
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompletionDialog(false)}
              className="w-full sm:w-auto"
            >
              Sluiten
            </Button>
            {createdPageResult && (
              <Button
                onClick={() => {
                  window.open(createdPageResult.url, '_blank');
                  setShowCompletionDialog(false);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Bekijk Pagina
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


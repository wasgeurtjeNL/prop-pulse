"use client";
// CALENDAR TAB TEST - v5 - 2024-12-13

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Wand2, 
  TrendingUp, 
  Zap, 
  Globe, 
  FileText,
  Loader2,
  ArrowRight,
  RefreshCw,
  Copy,
  Save,
  ExternalLink,
  Lightbulb,
  Target,
  Clock,
  BarChart3,
  Settings,
  Search,
  Link2,
  Building2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CalendarDays,
  ImageIcon,
  X
} from "lucide-react";
import { BlogCalendar } from "@/components/smart-blog/BlogCalendar";
import { LinkManagement } from "@/components/smart-blog/LinkManagement";

interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "trending" | "evergreen" | "seasonal";
  difficulty: "easy" | "medium" | "hard";
  estimatedImpact: "high" | "medium" | "low";
  status: "AVAILABLE" | "SCHEDULED" | "USED" | "SKIPPED";
  matchesExistingBlog?: boolean;
  existingBlogId?: string;
  existingBlogSlug?: string;
  existingBlogPublished?: boolean;
  isScheduled?: boolean;
  scheduledFor?: string;
}

interface GeneratedBlog {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  suggestedTags: string[];
  suggestedSlug: string;
  sources?: string[];
  coverImage?: string;
  coverImageAlt?: string;
}

interface CoverImageStats {
  generationTime: string;
  originalSize: string;
  compressedSize: string;
  savings: string;
}

interface CompanyProfile {
  companyName: string;
  tagline: string;
  description: string;
  tone: string;
  writingStyle: string;
  targetAudience: string;
  targetLocations: string[];
  usps: string[];
  expertise: string[];
  contentThemes: string[];
  brandKeywords: string[];
  avoidTopics: string[];
  competitors: string[];
  websiteUrl: string;
  lastAnalyzedAt: string | null;
}

interface InternalLink {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  keywords: string;
  priority: number;
  usageCount: number;
  isActive?: boolean;
}

export default function SmartBlogGeneratorPage() {
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState("generate");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<"en" | "nl">("en");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [tone, setTone] = useState<"professional" | "friendly" | "luxury" | "educational">("professional");
  const [includeResearch, setIncludeResearch] = useState(true);
  const [publishOnSave, setPublishOnSave] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  // Cover Image Generation State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [coverImageStats, setCoverImageStats] = useState<CoverImageStats | null>(null);
  const [imageStyle, setImageStyle] = useState<"professional" | "luxury" | "modern" | "lifestyle">("professional");
  
  // Profile & Settings State
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    tagline: "",
    description: "",
    tone: "professional",
    writingStyle: "",
    targetAudience: "",
    targetLocations: [],
    usps: [],
    expertise: [],
    contentThemes: [],
    brandKeywords: [],
    avoidTopics: [],
    competitors: [],
    websiteUrl: "",
    lastAnalyzedAt: null
  });
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSyncingLinks, setIsSyncingLinks] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // New link form
  const [newLink, setNewLink] = useState({ url: "", title: "", category: "page", keywords: "" });
  const [showAddLink, setShowAddLink] = useState(false);
  
  // Use ref to track loading state to prevent race conditions
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Loading messages voor topic suggestions
  const topicLoadingMessages = [
    { icon: "🔍", text: "Analyzing current market trends..." },
    { icon: "📊", text: "AI scans 1000+ data points for the best topics" },
    { icon: "🎯", text: "Finding high-impact topics for your niche" },
    { icon: "📈", text: "Topics are ranked by SEO potential" },
    { icon: "💡", text: "Personalized to your company profile" },
    { icon: "🌐", text: "Checking trending real estate searches" },
    { icon: "⚡", text: "One click = complete SEO-optimized blog" },
    { icon: "🏆", text: "Outrank competitors with data-driven content" },
    { icon: "🧠", text: "AI is thinking deeply about your niche..." },
    { icon: "✨", text: "Almost there, generating top ideas..." },
  ];

  // Loading messages voor blog generation
  const blogLoadingMessages = [
    { icon: "🔬", text: "Researching your topic online..." },
    { icon: "📚", text: "Gathering data from trusted sources" },
    { icon: "✍️", text: "Writing engaging, SEO-optimized content" },
    { icon: "🔗", text: "Adding internal links to your other blogs" },
    { icon: "📖", text: "Creating FAQ section for featured snippets" },
    { icon: "🎨", text: "Formatting with professional styling" },
    { icon: "📊", text: "Including statistics and data points" },
    { icon: "🏅", text: "Optimizing for Google rankings" },
  ];

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoadingTopics || isGenerating) {
      interval = setInterval(() => {
        const messages = isLoadingTopics ? topicLoadingMessages : blogLoadingMessages;
        setLoadingMessageIndex((prev) => (prev + 1) % messages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoadingTopics, isGenerating]);

  // Load topic suggestions - using useCallback to prevent stale closures
  const loadTopics = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate calls using ref (more reliable than state)
    if (isLoadingRef.current) {
      console.log("Already loading topics, skipping...");
      return;
    }
    
    // Skip if already loaded (unless forced refresh)
    if (hasLoadedRef.current && !forceRefresh) {
      console.log("Topics already loaded, skipping...");
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoadingTopics(true);
    setLoadingMessageIndex(0);
    
    try {
      // Very long timeout of 5 minutes (300 seconds) to ensure AI has time to complete
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      
      // If not forcing refresh, first try to get stored topics from database
      // If forcing refresh OR no stored topics, generate new ones
      const url = forceRefresh 
        ? `/api/smart-blog/topics?language=${language}&refresh=true`
        : `/api/smart-blog/topics?language=${language}&stored=true`;
      
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to load topics");
      }
      
      const loadedTopics = Array.isArray(data.topics) ? data.topics : [];
      
      // If no stored topics found and we weren't forcing refresh, generate new ones
      if (loadedTopics.length === 0 && !forceRefresh) {
        console.log("No stored topics found, generating new ones...");
        // Recursive call with forceRefresh=true to generate new topics
        isLoadingRef.current = false;
        await loadTopics(true);
        return;
      }
      
      setTopics(loadedTopics);
      hasLoadedRef.current = true;
      
      if (forceRefresh) {
        toast.success("🆕 Nieuwe topic suggesties gegenereerd!");
      } else if (data.fromDatabase && loadedTopics.length > 0) {
        toast.success(`📋 ${loadedTopics.length} opgeslagen topics geladen`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error("Request timed out after 5 minutes. Please try again.");
      } else {
        toast.error(error.message || "Failed to load topics");
      }
      console.error("Load topics error:", error);
      // Don't set hasLoadedRef so user can retry
    } finally {
      isLoadingRef.current = false;
      setIsLoadingTopics(false);
    }
  }, [language]);

  // Auto-load topics when switching to Discover tab
  useEffect(() => {
    if (activeTab === "discover") {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        loadTopics();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, loadTopics]);

  // Generate blog
  const generateBlog = async (selectedTopic?: string) => {
    const blogTopic = selectedTopic || topic;
    
    if (!blogTopic.trim()) {
      toast.error("Please enter a topic or select one from suggestions");
      return;
    }

    setIsGenerating(true);
    setGeneratedBlog(null);

    try {
      const response = await fetch("/api/smart-blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: blogTopic,
          language,
          length,
          tone,
          includeResearch
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate blog");
      }

      setGeneratedBlog(data.blog);
      setActiveTab("preview");
      toast.success("Blog generated successfully! 🎉");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate blog");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate AI Cover Image (hyperrealistic)
  const generateCoverImage = async () => {
    if (!generatedBlog) return;

    setIsGeneratingImage(true);
    setCoverImageStats(null);

    try {
      const variationKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const response = await fetch("/api/generate-blog-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: generatedBlog.title,
          style: imageStyle,
          quality: "standard",
          variationKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      // Update the generated blog with the new cover image
      setGeneratedBlog((prev) =>
        prev
          ? {
              ...prev,
              coverImage: data.imageUrl,
              coverImageAlt: data.alt,
            }
          : null
      );

      setCoverImageStats(data.stats);
      toast.success("Cover image gegenereerd! ✨");
    } catch (error: any) {
      toast.error(error.message || "Kon cover image niet genereren");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Remove cover image
  const removeCoverImage = () => {
    setGeneratedBlog((prev) =>
      prev
        ? {
            ...prev,
            coverImage: undefined,
            coverImageAlt: undefined,
          }
        : null
    );
    setCoverImageStats(null);
  };

  // Save blog (draft or publish)
  const saveBlog = async () => {
    if (!generatedBlog) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedBlog.title,
          slug: generatedBlog.suggestedSlug,
          excerpt: generatedBlog.excerpt,
          content: generatedBlog.content,
          metaTitle: generatedBlog.metaTitle,
          metaDescription: generatedBlog.metaDescription,
          tag: generatedBlog.suggestedTags?.[0] || "",
          coverImage: generatedBlog.coverImage,
          coverImageAlt: generatedBlog.coverImageAlt,
          isPublished: publishOnSave
        })
      });

      if (!response.ok) {
        const data = await response.json();
        // If the blog already exists, try to navigate to it
        if (response.status === 409 && typeof data?.error === "string") {
          const match = data.error.match(/\/blogs\/([a-z0-9-]+)/i);
          if (match?.[1]) {
            toast.success("Blog already exists — opening it.");
            router.push(`/blogs/${match[1]}`);
            return;
          }
        }
        throw new Error(data.error || "Failed to save blog");
      }

      toast.success(publishOnSave ? "Blog published!" : "Blog saved as draft!");
      router.push(publishOnSave ? "/blogs" : "/dashboard/blogs");
    } catch (error: any) {
      toast.error(error.message || "Failed to save blog");
    } finally {
      setIsSaving(false);
    }
  };

  // Load company profile
  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/smart-blog/profile");
      const data = await response.json();
      
      if (response.ok && data.profile) {
        setProfile(data.profile);
        setInternalLinks(data.internalLinks || []);
        setScanUrl(data.profile.websiteUrl || "");
        setProfileLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Scan website
  const scanWebsite = async () => {
    if (!scanUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/smart-blog/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: scanUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan website");
      }

      setScanResult(data);
      
      // Update profile with analysis results
      if (data.analysis) {
        setProfile(prev => ({
          ...prev,
          companyName: data.analysis.companyName || prev.companyName,
          tagline: data.analysis.tagline || prev.tagline,
          description: data.analysis.description || prev.description,
          tone: data.analysis.tone || prev.tone,
          writingStyle: data.analysis.writingStyle || prev.writingStyle,
          targetAudience: data.analysis.targetAudience || prev.targetAudience,
          targetLocations: data.analysis.targetLocations || prev.targetLocations,
          usps: data.analysis.usps || prev.usps,
          expertise: data.analysis.expertise || prev.expertise,
          contentThemes: data.analysis.contentThemes || prev.contentThemes,
          brandKeywords: data.analysis.brandKeywords || prev.brandKeywords,
          avoidTopics: data.analysis.avoidTopics || prev.avoidTopics,
          competitors: data.analysis.competitors || prev.competitors,
          websiteUrl: data.websiteUrl,
          lastAnalyzedAt: data.analyzedAt
        }));

        // Add suggested internal links
        if (data.analysis.suggestedInternalLinks?.length > 0) {
          const newLinks = data.analysis.suggestedInternalLinks.map((link: any) => ({
            id: `temp-${Math.random()}`,
            url: link.url,
            title: link.title,
            description: "",
            category: link.category || "page",
            keywords: link.keywords?.join(", ") || "",
            priority: 2,
            usageCount: 0
          }));
          setInternalLinks(prev => [...prev, ...newLinks]);
        }
      }

      toast.success(`Website analyzed! ${data.pagesAnalyzed} pages scanned.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to scan website");
    } finally {
      setIsScanning(false);
    }
  };

  // Save profile
  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/smart-blog/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          profile: {
            ...profile,
            pagesAnalyzed: scanResult?.pagesAnalyzed,
            confidence: scanResult?.analysis?.confidence
          }, 
          internalLinks: internalLinks.filter(l => l.url && l.title) 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      toast.success("Profile saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Sync internal links from existing content
  const syncInternalLinks = async () => {
    setIsSyncingLinks(true);
    try {
      const response = await fetch("/api/smart-blog/internal-links", {
        method: "PATCH"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync links");
      }

      // Reload profile to get updated links
      await loadProfile();
      toast.success(`Synced ${data.message}. Total: ${data.totalLinks} links`);
    } catch (error: any) {
      toast.error(error.message || "Failed to sync links");
    } finally {
      setIsSyncingLinks(false);
    }
  };

  // Add new internal link
  const addInternalLink = async () => {
    if (!newLink.url || !newLink.title) {
      toast.error("URL and title are required");
      return;
    }

    try {
      const response = await fetch("/api/smart-blog/internal-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add link");
      }

      setInternalLinks(prev => [...prev, data.link]);
      setNewLink({ url: "", title: "", category: "page", keywords: "" });
      setShowAddLink(false);
      toast.success("Link added!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add link");
    }
  };

  // Delete internal link
  const deleteInternalLink = async (id: string) => {
    try {
      const response = await fetch(`/api/smart-blog/internal-links?id=${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete link");
      }

      setInternalLinks(prev => prev.filter(l => l.id !== id));
      toast.success("Link deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete link");
    }
  };

  // Priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "trending": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "evergreen": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "seasonal": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-blue-600";
      case "medium": return "text-amber-600";
      case "low": return "text-gray-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Smart Blog AI
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered blog creation with automatic research and SEO optimization
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
            <span>Developed by</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">Jack Wullems</span>
            <span>• Powered by GPT-4o</span>
          </p>
        </div>
        <Link href="/dashboard/blogs">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 max-w-4xl">
          <TabsTrigger value="generate" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="h-4 w-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2" disabled={!generatedBlog}>
            <FileText className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Input */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  One-Click Blog Generation
                </CardTitle>
                <CardDescription>
                  Enter any topic and let AI create a complete, researched blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-base font-medium">
                    What do you want to write about?
                  </Label>
                  <div className="relative">
                    <Input
                      id="topic"
                      placeholder="e.g., Best areas to invest in Phuket 2025"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="text-lg py-6 pr-12"
                      onKeyDown={(e) => e.key === "Enter" && generateBlog()}
                    />
                    <Lightbulb className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Just type a topic, keyword, or question - AI will research and write everything
                  </p>
                </div>

                <Button 
                  onClick={() => generateBlog()} 
                  disabled={isGenerating || !topic.trim()}
                  className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Blog...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Complete Blog
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full border-3 border-purple-200 dark:border-purple-800"></div>
                        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-3 border-transparent border-t-purple-500 animate-spin"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">
                          {blogLoadingMessages[loadingMessageIndex].icon}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="font-medium text-purple-700 dark:text-purple-300">
                          {blogLoadingMessages[loadingMessageIndex].text}
                        </p>
                        <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1.5">
                          <div 
                            className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${((loadingMessageIndex + 1) / blogLoadingMessages.length) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Creating your SEO-optimized blog with internal links, sources & FAQ...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "nl")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Length</Label>
                  <Select value={length} onValueChange={(v) => setLength(v as "short" | "medium" | "long")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (800-1200 words)</SelectItem>
                      <SelectItem value="medium">Medium (1500-2000 words)</SelectItem>
                      <SelectItem value="long">Long (2500-3500 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Web Research</Label>
                    <p className="text-xs text-muted-foreground">
                      Include current data & trends
                    </p>
                  </div>
                  <Switch 
                    checked={includeResearch} 
                    onCheckedChange={setIncludeResearch}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    AI Topic Suggestions
                  </CardTitle>
                  <CardDescription>
                    AI-powered topic ideas based on trends and your niche
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {topics.length > 0 && (
                    <div className="flex items-center gap-2 text-xs mr-4">
                      <Badge variant="outline" className="gap-1 bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        {topics.filter(t => t.status === "AVAILABLE" && !t.matchesExistingBlog).length} beschikbaar
                      </Badge>
                      <Badge variant="outline" className="gap-1 bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">
                        <Calendar className="h-3 w-3" />
                        {topics.filter(t => t.status === "SCHEDULED").length} ingepland
                      </Badge>
                      <Badge variant="outline" className="gap-1 bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-950/30 dark:border-gray-800 dark:text-gray-400">
                        <FileText className="h-3 w-3" />
                        {topics.filter(t => t.status === "USED" || t.matchesExistingBlog).length} voltooid
                      </Badge>
                    </div>
                  )}
                  <Button onClick={() => loadTopics(true)} disabled={isLoadingTopics} variant="outline">
                    {isLoadingTopics ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Nieuwe Topics</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTopics ? (
                <div className="py-12 space-y-6">
                  {/* Animated loader */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-purple-200 dark:border-purple-900"></div>
                      <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
                        {topicLoadingMessages[loadingMessageIndex % topicLoadingMessages.length].icon}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dynamic message */}
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-purple-600 dark:text-purple-400 animate-pulse">
                      {topicLoadingMessages[loadingMessageIndex % topicLoadingMessages.length].text}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This may take up to a minute, please wait...
                    </p>
                  </div>

                  {/* Benefits list */}
                  <div className="max-w-md mx-auto bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-4">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">✨ What Smart Blog AI does for you:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Analyzes trending topics in your niche</li>
                      <li>• Ranks by SEO potential & impact</li>
                      <li>• Avoids duplicating your existing content</li>
                      <li>• Personalized to your company profile</li>
                    </ul>
                    <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">
                      Smart Blog AI by Jack Wullems
                    </p>
                  </div>
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No topics loaded yet. Click to get AI-powered suggestions.
                  </p>
                  <Button onClick={() => loadTopics(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Topic Ideas
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {topics.map((t, i) => {
                    const isUsed = t.status === "USED" || t.matchesExistingBlog;
                    const isScheduled = t.status === "SCHEDULED";
                    const isAvailable = t.status === "AVAILABLE" && !t.matchesExistingBlog;
                    
                    return (
                      <div 
                        key={t.id || i}
                        className={`p-4 border rounded-xl transition-all ${
                          isUsed 
                            ? "opacity-50 bg-muted/30 cursor-not-allowed" 
                            : isScheduled
                              ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20"
                              : "hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md cursor-pointer group"
                        }`}
                        onClick={() => {
                          if (isAvailable) {
                            setTopic(t.title);
                            setActiveTab("generate");
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {isUsed && (
                              <Check className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                            {isScheduled && (
                              <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                            )}
                            <h3 className={`font-semibold ${
                              isUsed ? "line-through text-muted-foreground" : 
                              isScheduled ? "text-blue-700 dark:text-blue-300" :
                              "group-hover:text-purple-600"
                            } transition-colors`}>
                              {t.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {isUsed && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                ✅ Voltooid
                              </Badge>
                            )}
                            {isScheduled && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                📅 {t.scheduledFor ? new Date(t.scheduledFor).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : 'Ingepland'}
                              </Badge>
                            )}
                            <Badge className={getPriorityColor(t.priority)} variant="secondary">
                              {t.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className={`text-sm mb-3 ${isUsed ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                          {t.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {t.category}
                          </span>
                          <span className={`flex items-center gap-1 ${isUsed ? "text-muted-foreground/60" : getImpactColor(t.estimatedImpact)}`}>
                            <BarChart3 className="h-3 w-3" />
                            {t.estimatedImpact} impact
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {t.difficulty}
                          </span>
                        </div>
                        {isAvailable && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="flex-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateBlog(t.title);
                              }}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Generate Now
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab("calendar");
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        )}
                        {isUsed && (t.existingBlogSlug || t.existingBlogId) && (
                          <div className="flex gap-2 mt-3">
                            {t.existingBlogPublished && t.existingBlogSlug ? (
                              <Link href={`/blogs/${t.existingBlogSlug}`} target="_blank">
                                <Button size="sm" variant="outline" className="text-green-600">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Bekijk Blog
                                </Button>
                              </Link>
                            ) : t.existingBlogId ? (
                              <Link href={`/dashboard/blogs/edit/${t.existingBlogId}`}>
                                <Button size="sm" variant="outline" className="text-amber-700">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open Draft
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        )}
                        {isScheduled && (
                          <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Wordt automatisch gepubliceerd op {t.scheduledFor ? new Date(t.scheduledFor).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }) : 'geplande datum'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📅 Blog Schedule</CardTitle>
              <CardDescription>Dit is de Schedule tab - BlogCalendar wordt hier geladen</CardDescription>
            </CardHeader>
            <CardContent>
              <BlogCalendar 
                topics={topics}
                onTopicScheduled={(topicId) => {
                  // Update local topic state
                  setTopics(prev => prev.map(t => 
                    t.id === topicId ? { ...t, status: "SCHEDULED" as const } : t
                  ));
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-6">
          <LinkManagement />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {generatedBlog && (
            <>
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Publish immediately</p>
                    <p className="text-xs text-muted-foreground">Show on /blogs after saving</p>
                  </div>
                  <Switch checked={publishOnSave} onCheckedChange={setPublishOnSave} />
                </div>
                <Button onClick={saveBlog} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {publishOnSave ? "Publish" : "Save as Draft"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigator.clipboard.writeText(generatedBlog.content)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Content
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setActiveTab("generate");
                    setGeneratedBlog(null);
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate New
                </Button>
              </div>

              {/* Meta Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">SEO Title</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{generatedBlog.metaTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {generatedBlog.metaTitle.length} characters
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Meta Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{generatedBlog.metaDescription}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {generatedBlog.metaDescription.length} characters
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cover Image Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-500" />
                    Cover Image
                  </CardTitle>
                  <CardDescription>
                    Genereer een hyperrealistische AI-afbeelding gebaseerd op het blog onderwerp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedBlog.coverImage ? (
                    <div className="space-y-4">
                      {/* Preview */}
                      <div className="relative group">
                        <img
                          src={generatedBlog.coverImage}
                          alt={generatedBlog.coverImageAlt || "Blog cover"}
                          className="w-full max-w-2xl rounded-lg border shadow-sm"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={removeCoverImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Alt Text */}
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">ALT:</span>
                        <span>{generatedBlog.coverImageAlt}</span>
                      </div>

                      {/* Stats */}
                      {coverImageStats && (
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>⏱️ {coverImageStats.generationTime}</span>
                          <span>📦 {coverImageStats.compressedSize} WebP</span>
                          <span>💾 {coverImageStats.savings} bespaard</span>
                        </div>
                      )}

                      {/* Regenerate Button */}
                      <Button
                        variant="outline"
                        onClick={generateCoverImage}
                        disabled={isGeneratingImage}
                        className="gap-2"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Genereren...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Nieuwe Image Genereren
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Style Selector */}
                      <div className="flex items-center gap-4">
                        <Label>Stijl:</Label>
                        <Select
                          value={imageStyle}
                          onValueChange={(v: "professional" | "luxury" | "modern" | "lifestyle") => setImageStyle(v)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">🏢 Professional</SelectItem>
                            <SelectItem value="luxury">✨ Luxury</SelectItem>
                            <SelectItem value="modern">🏗️ Modern</SelectItem>
                            <SelectItem value="lifestyle">🌴 Lifestyle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={generateCoverImage}
                        disabled={isGeneratingImage}
                        className="gap-2"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Hyperrealistische image genereren...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Genereer Cover Image
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground">
                        💡 De afbeelding wordt automatisch geoptimaliseerd naar WebP formaat met SEO-geoptimaliseerde ALT tekst.
                        Kosten: ~$0.04 per afbeelding.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {generatedBlog.suggestedTags && generatedBlog.suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Suggested Tags:</span>
                  {generatedBlog.suggestedTags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Sources */}
              {generatedBlog.sources && generatedBlog.sources.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Research Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {generatedBlog.sources.map((source, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          {source}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Content Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>{generatedBlog.title}</CardTitle>
                  <CardDescription>{generatedBlog.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="blog-details prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: generatedBlog.content }}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Website Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                Website Scanner
              </CardTitle>
              <CardDescription>
                Scan your website to automatically detect your company profile, tone, and content strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="https://your-website.com"
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                    className="text-base"
                  />
                </div>
                <Button 
                  onClick={scanWebsite} 
                  disabled={isScanning || !scanUrl.trim()}
                  className="gap-2 min-w-[140px]"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Scan Website
                    </>
                  )}
                </Button>
              </div>

              {isScanning && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-300">Analyzing your website...</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        AI is scanning multiple pages to understand your brand
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {scanResult && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-700 dark:text-green-300">
                        Scan Complete!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Analyzed {scanResult.pagesAnalyzed} pages • Confidence: {Math.round((scanResult.analysis?.confidence || 0) * 100)}%
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {scanResult.pagesScanned?.slice(0, 5).map((url: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {new URL(url).pathname || "/"}
                          </Badge>
                        ))}
                        {scanResult.pagesScanned?.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{scanResult.pagesScanned.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profile.lastAnalyzedAt && !scanResult && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last scanned: {new Date(profile.lastAnalyzedAt).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Company Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-500" />
                    Company Profile
                  </CardTitle>
                  <CardDescription>
                    This information is used to personalize all generated content
                  </CardDescription>
                </div>
                <Button 
                  onClick={saveProfile} 
                  disabled={isSavingProfile}
                  className="gap-2"
                >
                  {isSavingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={profile.companyName}
                    onChange={(e) => setProfile(p => ({ ...p, companyName: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={profile.tagline}
                    onChange={(e) => setProfile(p => ({ ...p, tagline: e.target.value }))}
                    placeholder="Your company tagline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Description</Label>
                <Textarea
                  value={profile.description}
                  onChange={(e) => setProfile(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your company, what you do, and what makes you unique..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tone of Voice</Label>
                  <Select 
                    value={profile.tone} 
                    onValueChange={(v) => setProfile(p => ({ ...p, tone: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input
                    value={profile.targetAudience}
                    onChange={(e) => setProfile(p => ({ ...p, targetAudience: e.target.value }))}
                    placeholder="e.g., International investors, expats"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Unique Selling Points (USPs)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.usps.map((usp, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {usp}
                      <button 
                        onClick={() => setProfile(p => ({ 
                          ...p, 
                          usps: p.usps.filter((_, idx) => idx !== i) 
                        }))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type a USP and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (value) {
                        setProfile(p => ({ 
                          ...p, 
                          usps: [...p.usps, value] 
                        }));
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Brand Keywords</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.brandKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      {kw}
                      <button 
                        onClick={() => setProfile(p => ({ 
                          ...p, 
                          brandKeywords: p.brandKeywords.filter((_, idx) => idx !== i) 
                        }))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type a keyword and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (value) {
                        setProfile(p => ({ 
                          ...p, 
                          brandKeywords: [...p.brandKeywords, value] 
                        }));
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Themes</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.contentThemes.map((theme, i) => (
                    <Badge key={i} className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {theme}
                      <button 
                        onClick={() => setProfile(p => ({ 
                          ...p, 
                          contentThemes: p.contentThemes.filter((_, idx) => idx !== i) 
                        }))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type a theme and press Enter (e.g., Investment, Lifestyle)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (value) {
                        setProfile(p => ({ 
                          ...p, 
                          contentThemes: [...p.contentThemes, value] 
                        }));
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Internal Links */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-blue-500" />
                    Internal Links
                  </CardTitle>
                  <CardDescription>
                    URLs to link to in generated blog posts for better SEO
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={syncInternalLinks}
                    disabled={isSyncingLinks}
                    className="gap-2"
                  >
                    {isSyncingLinks ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sync from Content
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAddLink(!showAddLink)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Link
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddLink && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">URL Path</Label>
                      <Input
                        placeholder="/properties/luxury-villa"
                        value={newLink.url}
                        onChange={(e) => setNewLink(l => ({ ...l, url: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Anchor Text</Label>
                      <Input
                        placeholder="luxury villa in Phuket"
                        value={newLink.title}
                        onChange={(e) => setNewLink(l => ({ ...l, title: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Select 
                        value={newLink.category}
                        onValueChange={(v) => setNewLink(l => ({ ...l, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property">Property</SelectItem>
                          <SelectItem value="blog">Blog</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="page">Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Keywords (comma-separated)</Label>
                      <Input
                        placeholder="villa, luxury, investment"
                        value={newLink.keywords}
                        onChange={(e) => setNewLink(l => ({ ...l, keywords: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addInternalLink} className="gap-2">
                      <Check className="h-4 w-4" />
                      Add Link
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddLink(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {internalLinks.length === 0 ? (
                <div className="text-center py-8">
                  <Link2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-3">
                    No internal links configured yet
                  </p>
                  <Button variant="outline" onClick={syncInternalLinks} disabled={isSyncingLinks}>
                    {isSyncingLinks ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Auto-detect from existing content
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {internalLinks.map((link) => (
                    <div 
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{link.title}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {link.category}
                          </Badge>
                          {link.usageCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Used {link.usageCount}x
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteInternalLink(link.id)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                💡 Tip: Internal links are automatically integrated into your blog posts based on relevance and keywords.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Branding */}
      <div className="mt-8 pt-6 border-t border-dashed">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span>Smart Blog AI</span>
            <span className="text-muted-foreground/50">•</span>
            <span>v1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Created with ❤️ by</span>
            <a 
              href="mailto:jackwullems18@gmail.com" 
              className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Jack Wullems
            </a>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <span>Powered by</span>
            <span className="font-medium">OpenAI GPT-4o</span>
            {includeResearch && (
              <>
                <span>+</span>
                <span className="font-medium">Perplexity</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


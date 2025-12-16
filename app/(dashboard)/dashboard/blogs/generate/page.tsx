"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  FileText,
  CheckCircle,
  Pencil,
  ChevronRight,
  RefreshCw,
  Wand2,
  Globe,
  Users,
  FileCheck,
} from "lucide-react";
import { createBlog } from "@/lib/actions/blog.actions";

interface Subsection {
  heading: string;
  description: string;
}

interface Section {
  heading: string;
  description: string;
  keyPoints: string[];
  subsections?: Subsection[];
}

interface Outline {
  title: string;
  excerpt: string;
  sections: Section[];
  suggestedKeywords: string[];
  estimatedWordCount: number;
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  metaDescription: string;
  suggestedKeywords: string[];
}

type Step = "input" | "outline" | "content";

export default function BlogGeneratorPage() {
  const router = useRouter();
  
  // Form state
  const [keyword, setKeyword] = useState("");
  const [language, setLanguage] = useState<"en" | "nl">("en");
  const [targetAudience, setTargetAudience] = useState("");
  const [blogLength, setBlogLength] = useState<"short" | "medium" | "long">("medium");
  
  // Process state
  const [currentStep, setCurrentStep] = useState<Step>("input");
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Generated content
  const [outline, setOutline] = useState<Outline | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // Generate outline
  const handleGenerateOutline = async () => {
    if (!keyword.trim()) {
      toast.error("Voer een keyword of onderwerp in");
      return;
    }

    setIsGeneratingOutline(true);
    try {
      const response = await fetch("/api/generate-blog/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          language,
          targetAudience: targetAudience.trim() || undefined,
          blogLength,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error: Onverwachte response. Controleer of de server correct draait.");
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate outline");
      }
      setOutline(data.outline);
      setCurrentStep("outline");
      toast.success("Outline gegenereerd!");
    } catch (error) {
      console.error("Outline generation error:", error);
      toast.error(error instanceof Error ? error.message : "Kon outline niet genereren");
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Generate full content from outline
  const handleGenerateContent = async () => {
    if (!outline) {
      toast.error("Geen outline beschikbaar");
      return;
    }

    setIsGeneratingContent(true);
    try {
      const response = await fetch("/api/generate-blog/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outline,
          language,
          blogLength,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error: Onverwachte response. Controleer of de server correct draait.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content");
      }
      setGeneratedContent(data);
      setCurrentStep("content");
      toast.success("Blog content gegenereerd!");
    } catch (error) {
      console.error("Content generation error:", error);
      toast.error(error instanceof Error ? error.message : "Kon content niet genereren");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Save as draft
  const handleSaveAsDraft = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    try {
      await createBlog({
        title: generatedContent.title,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        metaTitle: generatedContent.seoTitle,
        metaDescription: generatedContent.metaDescription,
        tag: generatedContent.suggestedKeywords?.[0] || undefined,
        published: false,
      });

      toast.success("Blog opgeslagen als concept!");
      router.push("/dashboard/blogs");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Kon blog niet opslaan");
    } finally {
      setIsSaving(false);
    }
  };

  // Save and redirect to edit page
  const handleSaveAndEdit = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    try {
      const result = await createBlog({
        title: generatedContent.title,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        metaTitle: generatedContent.seoTitle,
        metaDescription: generatedContent.metaDescription,
        tag: generatedContent.suggestedKeywords?.[0] || undefined,
        published: false,
      });

      toast.success("Blog opgeslagen! Doorsturen naar editor...");
      router.push(`/dashboard/blogs/edit/${result.blog.id}`);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Kon blog niet opslaan");
    } finally {
      setIsSaving(false);
    }
  };

  // Update outline section
  const updateSection = (index: number, field: keyof Section, value: string | string[]) => {
    if (!outline) return;
    
    const newSections = [...outline.sections];
    newSections[index] = {
      ...newSections[index],
      [field]: value,
    };
    
    setOutline({
      ...outline,
      sections: newSections,
    });
  };

  // Render step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { step: "input", label: "Invoer", icon: FileText },
        { step: "outline", label: "Outline", icon: FileCheck },
        { step: "content", label: "Content", icon: Wand2 },
      ].map((item, idx) => {
        const Icon = item.icon;
        const isActive = currentStep === item.step;
        const isCompleted = 
          (item.step === "input" && (currentStep === "outline" || currentStep === "content")) ||
          (item.step === "outline" && currentStep === "content");
        
        return (
          <div key={item.step} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {idx < 2 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/blogs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI Blog Generator
          </h1>
          <p className="text-muted-foreground">
            Genereer professionele blogposts met AI
          </p>
        </div>
      </div>

      <StepIndicator />

      {/* Step 1: Input */}
      {currentStep === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Stap 1: Onderwerp & Instellingen
            </CardTitle>
            <CardDescription>
              Voer een keyword of onderwerp in en kies je voorkeuren
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Keyword/Topic */}
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-base font-medium">
                Keyword of Onderwerp *
              </Label>
              <Input
                id="keyword"
                placeholder="bijv. 'Investeren in vastgoed Phuket 2025' of 'Best areas to buy property in Thailand'"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="text-lg py-6"
              />
              <p className="text-sm text-muted-foreground">
                Wees specifiek voor betere resultaten. Je kunt een vraag, keyword of onderwerp invoeren.
              </p>
            </div>

            {/* Language & Length */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Taal
                </Label>
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
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Blog Lengte
                </Label>
                <Select value={blogLength} onValueChange={(v) => setBlogLength(v as "short" | "medium" | "long")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Kort (600-800 woorden)</SelectItem>
                    <SelectItem value="medium">Medium (1200-1500 woorden)</SelectItem>
                    <SelectItem value="long">Lang (2000-2500 woorden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Audience (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="audience" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Doelgroep (optioneel)
              </Label>
              <Input
                id="audience"
                placeholder="bijv. 'Expats die naar Thailand willen verhuizen' of 'First-time property investors'"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Laat leeg om de standaard doelgroep uit je instellingen te gebruiken.
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateOutline}
              disabled={isGeneratingOutline || !keyword.trim()}
              size="lg"
              className="w-full gap-2"
            >
              {isGeneratingOutline ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Outline genereren...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Genereer Outline
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Outline Review */}
      {currentStep === "outline" && outline && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Stap 2: Review & Edit Outline
              </CardTitle>
              <CardDescription>
                Bekijk de outline en pas aan waar nodig. Klik daarna op &ldquo;Genereer Content&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label>Blog Titel</Label>
                <Input
                  value={outline.title}
                  onChange={(e) => setOutline({ ...outline, title: e.target.value })}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label>Excerpt / Samenvatting</Label>
                <Textarea
                  value={outline.excerpt}
                  onChange={(e) => setOutline({ ...outline, excerpt: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Secties</Label>
                {outline.sections.map((section, idx) => (
                  <Card key={idx} className="border-l-4 border-l-primary/50">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          H2
                        </span>
                        <Input
                          value={section.heading}
                          onChange={(e) => updateSection(idx, "heading", e.target.value)}
                          className="font-medium"
                        />
                      </div>
                      
                      <Textarea
                        value={section.description}
                        onChange={(e) => updateSection(idx, "description", e.target.value)}
                        rows={2}
                        placeholder="Beschrijving van deze sectie..."
                        className="text-sm"
                      />

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Key Points</Label>
                        <div className="flex flex-wrap gap-2">
                          {section.keyPoints.map((point, pointIdx) => (
                            <span
                              key={pointIdx}
                              className="px-2 py-1 text-xs bg-muted rounded-md"
                            >
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>

                      {section.subsections && section.subsections.length > 0 && (
                        <div className="pl-4 space-y-2 border-l-2 border-muted">
                          {section.subsections.map((sub, subIdx) => (
                            <div key={subIdx} className="flex items-center gap-2">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                H3
                              </span>
                              <span className="text-sm">{sub.heading}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Voorgestelde Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {outline.suggestedKeywords?.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Estimated word count */}
              <p className="text-sm text-muted-foreground">
                Geschatte lengte: ~{outline.estimatedWordCount} woorden
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("input")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateOutline}
                disabled={isGeneratingOutline}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingOutline ? "animate-spin" : ""}`} />
                Nieuwe Outline
              </Button>
            </div>

            <Button
              onClick={handleGenerateContent}
              disabled={isGeneratingContent}
              size="lg"
              className="gap-2"
            >
              {isGeneratingContent ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Content genereren...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Genereer Content
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Content */}
      {currentStep === "content" && generatedContent && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Stap 3: Gegenereerde Content
              </CardTitle>
              <CardDescription>
                Je blog is klaar! Review de content en sla op als concept.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title & Meta */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Titel</Label>
                  <p className="font-semibold text-lg">{generatedContent.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">SEO Titel</Label>
                  <p className="text-sm">{generatedContent.seoTitle}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Meta Description</Label>
                  <p className="text-sm">{generatedContent.metaDescription}</p>
                </div>
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <Label>Content Preview</Label>
                <div 
                  className="blog-details prose prose-sm max-w-none p-6 border rounded-xl bg-white dark:bg-gray-950 max-h-[600px] overflow-y-auto shadow-inner"
                  dangerouslySetInnerHTML={{ __html: generatedContent.content }}
                />
              </div>

              {/* Word count estimate */}
              <p className="text-sm text-muted-foreground">
                Ongeveer {Math.round(generatedContent.content.split(/\s+/).length * 0.8)} woorden
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("outline")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar Outline
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateContent}
                disabled={isGeneratingContent}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingContent ? "animate-spin" : ""}`} />
                Opnieuw Genereren
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Opslaan als Concept
              </Button>
              <Button
                onClick={handleSaveAndEdit}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                Opslaan & Bewerken
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


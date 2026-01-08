"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  BarChart3,
  FileText,
  Link2,
  ExternalLink,
  Lightbulb,
  RefreshCw,
  Loader2,
  Wand2,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface SeoCheck {
  id: string;
  name: string;
  passed: boolean;
  importance: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  details?: string;
}

interface SeoAnalysisResult {
  score: number;
  keywordDensity: number;
  wordCount: number;
  readabilityScore: number;
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasH1WithKeyword: boolean;
    h2sWithKeyword: number;
    h3sWithKeyword: number;
  };
  checks: SeoCheck[];
  suggestions: string[];
}

interface ResearchData {
  content: string;
  sources: string[];
  provider: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
}

interface ContentSeoAnalyzerProps {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  researchData?: ResearchData;
  onKeywordChange?: (primary: string, secondary: string[]) => void;
  onOptimize?: (type: 'h2' | 'content' | 'meta', optimizedContent: string) => void;
}

export function ContentSeoAnalyzer({
  title,
  metaTitle,
  metaDescription,
  content,
  primaryKeyword: initialPrimaryKeyword,
  secondaryKeywords: initialSecondaryKeywords,
  researchData,
  onKeywordChange,
  onOptimize
}: ContentSeoAnalyzerProps) {
  const [primaryKeyword, setPrimaryKeyword] = useState(initialPrimaryKeyword || researchData?.primaryKeyword || "");
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(
    initialSecondaryKeywords || researchData?.secondaryKeywords || []
  );
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState("");
  const [analysis, setAnalysis] = useState<SeoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [copiedSource, setCopiedSource] = useState<string | null>(null);

  // Analyze content when it changes
  useEffect(() => {
    if (content && primaryKeyword) {
      analyzeContent();
    }
  }, [content, title, metaTitle, metaDescription, primaryKeyword]);

  // Notify parent of keyword changes
  useEffect(() => {
    onKeywordChange?.(primaryKeyword, secondaryKeywords);
  }, [primaryKeyword, secondaryKeywords]);

  const analyzeContent = async () => {
    if (!content) return;
    
    setIsAnalyzing(true);
    
    try {
      // Perform analysis on client side using the library
      const response = await fetch("/api/smart-blog/analyze-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          metaTitle,
          metaDescription,
          content,
          primaryKeyword,
          secondaryKeywords,
          externalSources: researchData?.sources?.map(url => ({ url }))
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        console.error("Failed to analyze content");
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addSecondaryKeyword = () => {
    if (newSecondaryKeyword.trim() && !secondaryKeywords.includes(newSecondaryKeyword.trim())) {
      setSecondaryKeywords([...secondaryKeywords, newSecondaryKeyword.trim()]);
      setNewSecondaryKeyword("");
    }
  };

  const removeSecondaryKeyword = (keyword: string) => {
    setSecondaryKeywords(secondaryKeywords.filter(k => k !== keyword));
  };

  const handleOptimize = async (type: 'h2' | 'content' | 'meta') => {
    setIsOptimizing(type);
    
    try {
      const response = await fetch("/api/smart-blog/optimize-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          content,
          metaTitle,
          metaDescription,
          primaryKeyword,
          secondaryKeywords
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        onOptimize?.(type, data.optimized);
        toast.success(`${type.toUpperCase()} geoptimaliseerd!`);
        // Re-analyze after optimization
        setTimeout(analyzeContent, 500);
      } else {
        toast.error("Optimalisatie mislukt");
      }
    } catch (error) {
      toast.error("Er ging iets mis");
    } finally {
      setIsOptimizing(null);
    }
  };

  const copySourceLink = (url: string) => {
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">bron</a>`;
    navigator.clipboard.writeText(linkHtml);
    setCopiedSource(url);
    toast.success("Link gekopieerd!");
    setTimeout(() => setCopiedSource(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    if (score >= 40) return "from-orange-500 to-amber-500";
    return "from-red-500 to-rose-500";
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const passedChecks = analysis?.checks.filter(c => c.passed).length || 0;
  const totalChecks = analysis?.checks.length || 0;

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Content SEO Analyzer
            </CardTitle>
            <CardDescription>
              Real-time SEO analyse voor optimale rankings
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={analyzeContent}
            disabled={isAnalyzing || !content}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Score Display */}
        {analysis && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                  {analysis.score}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>SEO Score</div>
                  <div className="text-xs">{passedChecks}/{totalChecks} checks passed</div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{analysis.wordCount} woorden</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{analysis.keywordDensity.toFixed(2)}% density</span>
                </div>
              </div>
            </div>
            <Progress 
              value={analysis.score} 
              className={`h-2 bg-gray-200 dark:bg-gray-700`}
            />
          </div>
        )}

        {/* Keyword Settings */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Primair Keyword
            </Label>
            <Input
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder="bijv. phuket luxury villa investment"
              className="font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Secundaire Keywords</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {secondaryKeywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1">
                  {kw}
                  <button
                    onClick={() => removeSecondaryKeyword(kw)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSecondaryKeyword}
                onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                placeholder="Voeg keyword toe"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSecondaryKeyword())}
              />
              <Button variant="outline" size="sm" onClick={addSecondaryKeyword}>
                +
              </Button>
            </div>
          </div>
        </div>

        {/* SEO Checks */}
        {analysis && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <span className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                SEO Checklist ({passedChecks}/{totalChecks})
              </span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {analysis.checks.map((check) => (
                <Tooltip 
                  key={check.id}
                  side="left"
                  content={
                    <div className="max-w-[300px]">
                      <p className="font-medium">{check.message}</p>
                      {check.details && <p className="text-xs opacity-80 mt-1">{check.details}</p>}
                    </div>
                  }
                >
                  <div className={`flex items-center justify-between p-2 rounded-lg cursor-help ${
                    check.passed 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : 'bg-red-50 dark:bg-red-950/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <span className="text-sm">{check.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${getImportanceColor(check.importance)}`}>
                        {check.importance}
                      </Badge>
                      {check.details && (
                        <Info className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Tooltip>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Suggestions & Quick Actions */}
        {analysis && analysis.suggestions.length > 0 && (
          <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <span className="font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Suggesties ({analysis.suggestions.length})
              </span>
              {showSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {analysis.suggestions.map((suggestion, i) => (
                <div key={i} className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </div>
              ))}
              
              {/* Quick Optimize Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleOptimize('h2')}
                  disabled={isOptimizing !== null}
                  className="gap-1"
                >
                  {isOptimizing === 'h2' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Optimaliseer H2s
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleOptimize('meta')}
                  disabled={isOptimizing !== null}
                  className="gap-1"
                >
                  {isOptimizing === 'meta' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Optimaliseer Meta
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Research Sources */}
        {researchData?.sources && researchData.sources.length > 0 && (
          <Collapsible open={showSources} onOpenChange={setShowSources}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <span className="font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                Research Bronnen ({researchData.sources.length})
              </span>
              {showSources ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground mb-2">
                💡 Gebruik 2-3 van deze bronnen als externe links in je content
              </p>
              {researchData.sources.map((source, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                  <a 
                    href={source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate flex-1 mr-2"
                  >
                    {new URL(source).hostname}
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copySourceLink(source)}
                    className="shrink-0"
                  >
                    {copiedSource === source ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Provider Badge */}
        {researchData?.provider && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Research via{" "}
            <span className={researchData.provider === "perplexity" ? "text-purple-600" : "text-green-600"}>
              {researchData.provider === "perplexity" ? "Perplexity AI" : "OpenAI"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContentSeoAnalyzer;

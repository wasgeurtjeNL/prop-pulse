"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface Variable {
  key: string;
  description: string;
  example?: string;
}

interface SeoTemplate {
  id: string;
  name: string;
  displayName: string;
  availableVariables: Variable[];
}

interface GenerationResult {
  result: string;
  seoScore: number;
  characterCount: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SeoTemplateTestPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [template, setTemplate] = useState<SeoTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Variable values
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Results
  const [results, setResults] = useState<{
    metaTitle?: GenerationResult;
    metaDescription?: GenerationResult;
    urlSlug?: GenerationResult;
  }>({});

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/seo-templates/${id}`);
      if (response.ok) {
        const data: SeoTemplate = await response.json();
        setTemplate(data);
        
        // Pre-fill variables with examples
        const initialVars: Record<string, string> = {};
        data.availableVariables.forEach((v) => {
          const key = v.key.replace(/[{}]/g, "");
          initialVars[key] = v.example || "";
        });
        setVariables(initialVars);
      } else {
        toast.error("Template not found");
        router.push("/dashboard/seo-templates");
      }
    } catch {
      toast.error("Failed to load template");
    } finally {
      setIsLoading(false);
    }
  };

  const generate = async (type: "metaTitle" | "metaDescription" | "urlSlug") => {
    setGenerating(type);
    try {
      const response = await fetch("/api/seo-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: id,
          type,
          variables,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults((prev) => ({
          ...prev,
          [type]: {
            result: data.result,
            seoScore: data.seoScore,
            characterCount: data.characterCount,
          },
        }));
        toast.success(`${type} generated successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Generation failed");
      }
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    await generate("metaTitle");
    await generate("metaDescription");
    await generate("urlSlug");
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getCharCountColor = (count: number, min: number, max: number) => {
    if (count >= min && count <= max) return "text-green-600";
    if (count < min) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="ph:spinner" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/seo-templates/${id}`}>
            <Button variant="ghost" size="icon">
              <Icon icon="ph:arrow-left" className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Test: {template.displayName}
            </h1>
            <p className="text-muted-foreground">
              Test your template with sample data
            </p>
          </div>
        </div>
        <Button onClick={generateAll} disabled={generating !== null} className="gap-2">
          {generating ? (
            <>
              <Icon icon="ph:spinner" className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Icon icon="ph:magic-wand" className="h-4 w-4" />
              Generate All
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Variables Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="ph:code" className="h-5 w-5 text-primary" />
              Test Variables
            </CardTitle>
            <CardDescription>
              Enter values for each variable to test the template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.availableVariables.map((variable) => {
              const key = variable.key.replace(/[{}]/g, "");
              return (
                <div key={key} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {variable.key}
                    </code>
                    <span className="text-muted-foreground text-xs">
                      {variable.description}
                    </span>
                  </Label>
                  <Input
                    value={variables[key] || ""}
                    onChange={(e) =>
                      setVariables((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={variable.example || "Enter value..."}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {/* Meta Title Result */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="ph:text-h-one" className="h-5 w-5 text-primary" />
                  Meta Title
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate("metaTitle")}
                  disabled={generating !== null}
                  className="gap-2"
                >
                  {generating === "metaTitle" ? (
                    <Icon icon="ph:spinner" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon="ph:magic-wand" className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.metaTitle ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{results.metaTitle.result}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge className={getSeoScoreColor(results.metaTitle.seoScore)}>
                      SEO Score: {results.metaTitle.seoScore}%
                    </Badge>
                    <span className={getCharCountColor(results.metaTitle.characterCount, 50, 60)}>
                      {results.metaTitle.characterCount} / 50-60 chars
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Click Generate to test meta title generation
                </p>
              )}
            </CardContent>
          </Card>

          {/* Meta Description Result */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="ph:text-aa" className="h-5 w-5 text-primary" />
                  Meta Description
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate("metaDescription")}
                  disabled={generating !== null}
                  className="gap-2"
                >
                  {generating === "metaDescription" ? (
                    <Icon icon="ph:spinner" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon="ph:magic-wand" className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.metaDescription ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{results.metaDescription.result}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge className={getSeoScoreColor(results.metaDescription.seoScore)}>
                      SEO Score: {results.metaDescription.seoScore}%
                    </Badge>
                    <span className={getCharCountColor(results.metaDescription.characterCount, 145, 155)}>
                      {results.metaDescription.characterCount} / 145-155 chars
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Click Generate to test meta description generation
                </p>
              )}
            </CardContent>
          </Card>

          {/* URL Slug Result */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="ph:link" className="h-5 w-5 text-primary" />
                  URL Slug
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate("urlSlug")}
                  disabled={generating !== null}
                  className="gap-2"
                >
                  {generating === "urlSlug" ? (
                    <Icon icon="ph:spinner" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon="ph:magic-wand" className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.urlSlug ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg font-mono">
                    <p>/{results.urlSlug.result}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge className={getSeoScoreColor(results.urlSlug.seoScore)}>
                      SEO Score: {results.urlSlug.seoScore}%
                    </Badge>
                    <span className="text-muted-foreground">
                      {results.urlSlug.result.split("-").length} words
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Click Generate to test URL slug generation
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview Card */}
          {results.metaTitle && results.metaDescription && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="ph:eye" className="h-5 w-5 text-primary" />
                  Google Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border space-y-1">
                  <p className="text-blue-700 dark:text-blue-400 text-lg font-medium hover:underline cursor-pointer">
                    {results.metaTitle.result}
                  </p>
                  <p className="text-green-700 dark:text-green-500 text-sm">
                    psmphuket.com{results.urlSlug ? `/${results.urlSlug.result}` : ""}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {results.metaDescription.result}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

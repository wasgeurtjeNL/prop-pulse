"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  description: string | null;
  category: string | null;
  metaTitlePrompt: string;
  metaDescriptionPrompt: string;
  urlSlugRules: string;
  contentPrompt: string | null;
  faqPrompt: string | null;
  seoRules: Record<string, unknown>;
  availableVariables: Variable[];
  isActive: boolean;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SeoTemplateEditPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "new";

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("prompts");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    category: "",
    metaTitlePrompt: "",
    metaDescriptionPrompt: "",
    urlSlugRules: "",
    contentPrompt: "",
    faqPrompt: "",
    seoRules: {},
    availableVariables: [] as Variable[],
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    if (!isNew) {
      fetchTemplate();
    } else {
      // Set defaults for new template
      setFormData((prev) => ({
        ...prev,
        availableVariables: [
          { key: "{{title}}", description: "Page title", example: "Luxury Villas" },
          { key: "{{location}}", description: "Target location", example: "Kamala" },
          { key: "{{primaryKeyword}}", description: "Main SEO keyword", example: "luxury villas phuket" },
          { key: "{{brand}}", description: "Brand name", example: "PSM Phuket" },
        ],
      }));
    }
  }, [id, isNew]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/seo-templates/${id}`);
      if (response.ok) {
        const data: SeoTemplate = await response.json();
        setFormData({
          name: data.name,
          displayName: data.displayName,
          description: data.description || "",
          category: data.category || "",
          metaTitlePrompt: data.metaTitlePrompt,
          metaDescriptionPrompt: data.metaDescriptionPrompt,
          urlSlugRules: data.urlSlugRules,
          contentPrompt: data.contentPrompt || "",
          faqPrompt: data.faqPrompt || "",
          seoRules: data.seoRules,
          availableVariables: data.availableVariables,
          isActive: data.isActive,
          isDefault: data.isDefault,
        });
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

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.displayName) {
      toast.error("Name and display name are required");
      return;
    }
    if (!formData.metaTitlePrompt || !formData.metaDescriptionPrompt || !formData.urlSlugRules) {
      toast.error("Meta title, description, and URL prompts are required");
      return;
    }

    setIsSaving(true);
    try {
      const url = isNew ? "/api/seo-templates" : `/api/seo-templates/${id}`;
      const method = isNew ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(isNew ? "Template created" : "Template saved");
        if (isNew) {
          const data = await response.json();
          router.push(`/dashboard/seo-templates/${data.id}`);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save template");
      }
    } catch {
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const addVariable = () => {
    setFormData((prev) => ({
      ...prev,
      availableVariables: [
        ...prev.availableVariables,
        { key: "{{newVariable}}", description: "", example: "" },
      ],
    }));
  };

  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    setFormData((prev) => {
      const newVars = [...prev.availableVariables];
      newVars[index] = { ...newVars[index], [field]: value };
      return { ...prev, availableVariables: newVars };
    });
  };

  const removeVariable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      availableVariables: prev.availableVariables.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="ph:spinner" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/seo-templates">
            <Button variant="ghost" size="icon">
              <Icon icon="ph:arrow-left" className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New SEO Template" : formData.displayName || "Edit Template"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Create a new AI prompt template" : `Editing: ${formData.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isNew && (
            <Link href={`/dashboard/seo-templates/${id}/test`}>
              <Button variant="outline" className="gap-2">
                <Icon icon="ph:flask" className="h-4 w-4" />
                Test Template
              </Button>
            </Link>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Icon icon="ph:spinner" className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="ph:floppy-disk" className="h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="prompts" className="gap-2">
                <Icon icon="ph:chat-text" className="h-4 w-4" />
                AI Prompts
              </TabsTrigger>
              <TabsTrigger value="variables" className="gap-2">
                <Icon icon="ph:code" className="h-4 w-4" />
                Variables
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-2">
                <Icon icon="ph:gear" className="h-4 w-4" />
                SEO Rules
              </TabsTrigger>
            </TabsList>

            {/* Prompts Tab */}
            <TabsContent value="prompts" className="space-y-6">
              {/* Meta Title Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="ph:text-h-one" className="h-5 w-5 text-primary" />
                    Meta Title Prompt
                  </CardTitle>
                  <CardDescription>
                    AI instructions for generating SEO meta titles (50-60 chars)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.metaTitlePrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaTitlePrompt: e.target.value }))
                    }
                    placeholder="Enter the AI prompt for generating meta titles..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* Meta Description Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="ph:text-aa" className="h-5 w-5 text-primary" />
                    Meta Description Prompt
                  </CardTitle>
                  <CardDescription>
                    AI instructions for generating meta descriptions (145-155 chars)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.metaDescriptionPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaDescriptionPrompt: e.target.value }))
                    }
                    placeholder="Enter the AI prompt for generating meta descriptions..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* URL Slug Rules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="ph:link" className="h-5 w-5 text-primary" />
                    URL Slug Rules
                  </CardTitle>
                  <CardDescription>
                    AI instructions for generating SEO-friendly URL slugs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.urlSlugRules}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, urlSlugRules: e.target.value }))
                    }
                    placeholder="Enter the AI prompt for generating URL slugs..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* Content Prompt (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="ph:article" className="h-5 w-5 text-primary" />
                    Content Prompt
                    <Badge variant="outline">Optional</Badge>
                  </CardTitle>
                  <CardDescription>
                    AI instructions for generating page content (HTML)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.contentPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contentPrompt: e.target.value }))
                    }
                    placeholder="Enter the AI prompt for generating page content..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* FAQ Prompt (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="ph:question" className="h-5 w-5 text-primary" />
                    FAQ Prompt
                    <Badge variant="outline">Optional</Badge>
                  </CardTitle>
                  <CardDescription>
                    AI instructions for generating FAQ questions and answers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.faqPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, faqPrompt: e.target.value }))
                    }
                    placeholder="Enter the AI prompt for generating FAQ content..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Available Variables</CardTitle>
                      <CardDescription>
                        Define variables that can be used in your prompts with {"{{variable}}"} syntax
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addVariable} className="gap-2">
                      <Icon icon="ph:plus" className="h-4 w-4" />
                      Add Variable
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.availableVariables.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon icon="ph:code" className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No variables defined yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.availableVariables.map((variable, index) => (
                        <div key={index} className="grid gap-4 p-4 border rounded-lg sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Variable Key</Label>
                            <Input
                              value={variable.key}
                              onChange={(e) => updateVariable(index, "key", e.target.value)}
                              placeholder="{{variableName}}"
                              className="font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={variable.description}
                              onChange={(e) => updateVariable(index, "description", e.target.value)}
                              placeholder="What this variable represents"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Example</Label>
                            <div className="flex gap-2">
                              <Input
                                value={variable.example || ""}
                                onChange={(e) => updateVariable(index, "example", e.target.value)}
                                placeholder="Example value"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariable(index)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                              >
                                <Icon icon="ph:trash" className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Rules (JSON)</CardTitle>
                  <CardDescription>
                    Define validation rules for generated content. Used for SEO score calculation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(formData.seoRules, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData((prev) => ({ ...prev, seoRules: parsed }));
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder={`{
  "metaTitle": {
    "minLength": 50,
    "maxLength": 60,
    "keywordPosition": "first_3_words"
  },
  "metaDescription": {
    "minLength": 145,
    "maxLength": 155
  }
}`}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name (ID)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  placeholder="my-template"
                  disabled={!isNew}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier, lowercase with dashes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="My Template"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What this template is used for..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Category Filter</Label>
                <Select
                  value={formData.category || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All categories</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="property-type">Property Type</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only show this template for specific page categories
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Template can be used for generation
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Default Template</Label>
                  <p className="text-xs text-muted-foreground">
                    Used when no template is selected
                  </p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isDefault: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Meta Title</p>
                <p>50-60 characters, keyword in first 3 words</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Meta Description</p>
                <p>145-155 characters, include CTA</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">URL Slug</p>
                <p>Max 5 words, keyword first, lowercase</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

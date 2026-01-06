"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import Link from "next/link";

interface SeoTemplate {
  id: string;
  name: string;
  displayName: string;
  category: string | null;
}

interface Section {
  heading: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  position: "left" | "right";
}

interface LandingPageContent {
  intro: string;
  sections: Section[];
}

interface FaqItem {
  question: string;
  answer: string;
}

interface LandingPage {
  id: string;
  url: string;
  title: string;
  category: string;
  metaTitle: string | null;
  metaDescription: string | null;
  content: string;
  faq: any;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  // AI fields
  aiGenerated?: boolean;
  aiGeneratedAt?: Date;
  seoScore?: number | null;
  targetKeywords?: string[];
  seoTemplateId?: string | null;
}

interface LandingPageEditFormProps {
  page: LandingPage;
}

export default function LandingPageEditForm({ page }: LandingPageEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<SeoTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(page.seoTemplateId || "");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [seoScore, setSeoScore] = useState<number | null>(page.seoScore ?? null);
  const [targetKeywords, setTargetKeywords] = useState<string[]>(page.targetKeywords || []);
  const [newKeyword, setNewKeyword] = useState("");

  // Fetch SEO templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/seo-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        // Set default template if none selected
        if (!selectedTemplateId) {
          const defaultTemplate = data.find((t: SeoTemplate) => t.name === "default");
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  // Generate SEO content with AI
  const generateSeo = useCallback(async (type: "metaTitle" | "metaDescription" | "urlSlug") => {
    if (!formData.title) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGenerating(type);
    try {
      // Extract location from title or category
      const locationMatch = formData.title.match(/(Kamala|Patong|Rawai|Kata|Karon|Bang Tao|Surin|Phuket)/i);
      const location = locationMatch ? locationMatch[0] : "Phuket";

      const response = await fetch("/api/seo-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId || undefined,
          type,
          variables: {
            title: formData.title,
            location,
            category: formData.category,
            primaryKeyword: targetKeywords[0] || formData.title.toLowerCase(),
            secondaryKeywords: targetKeywords.slice(1).join(", "),
            brand: "PSM Phuket",
            usp: "Expert guidance for foreign buyers",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (type === "metaTitle") {
          setFormData((prev) => ({ ...prev, metaTitle: data.result }));
        } else if (type === "metaDescription") {
          setFormData((prev) => ({ ...prev, metaDescription: data.result }));
        }
        
        setSeoScore(data.seoScore);
        toast.success(`${type === "metaTitle" ? "Meta title" : type === "metaDescription" ? "Meta description" : "URL"} generated!`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Generation failed");
      }
    } catch {
      toast.error("Generation failed");
    } finally {
      setIsGenerating(null);
    }
  }, [formData.title, formData.category, selectedTemplateId, targetKeywords]);

  const addKeyword = () => {
    if (newKeyword && !targetKeywords.includes(newKeyword.toLowerCase())) {
      setTargetKeywords([...targetKeywords, newKeyword.toLowerCase()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setTargetKeywords(targetKeywords.filter((k) => k !== keyword));
  };

  // Parse content
  const parseContent = (): LandingPageContent => {
    try {
      const parsed = JSON.parse(page.content);
      return {
        intro: parsed.intro || "",
        sections: parsed.sections || [],
      };
    } catch {
      return { intro: page.content, sections: [] };
    }
  };

  // Parse FAQ
  const parseFaq = (): FaqItem[] => {
    if (Array.isArray(page.faq)) {
      return page.faq as FaqItem[];
    }
    return [];
  };

  // Form state
  const [formData, setFormData] = useState({
    title: page.title,
    category: page.category,
    metaTitle: page.metaTitle || "",
    metaDescription: page.metaDescription || "",
    published: page.published,
  });

  const [content, setContent] = useState<LandingPageContent>(parseContent());
  const [faq, setFaq] = useState<FaqItem[]>(parseFaq());

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIntroChange = (value: string) => {
    setContent((prev) => ({ ...prev, intro: value }));
  };

  const handleSectionChange = (
    index: number,
    field: keyof Section,
    value: string
  ) => {
    setContent((prev) => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], [field]: value };
      return { ...prev, sections: newSections };
    });
  };

  const handleFaqChange = (index: number, field: keyof FaqItem, value: string) => {
    setFaq((prev) => {
      const newFaq = [...prev];
      newFaq[index] = { ...newFaq[index], [field]: value };
      return newFaq;
    });
  };

  const addFaqItem = () => {
    setFaq((prev) => [...prev, { question: "", answer: "" }]);
  };

  const removeFaqItem = (index: number) => {
    setFaq((prev) => prev.filter((_, i) => i !== index));
  };

  const addSection = () => {
    setContent((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          heading: "",
          content: "",
          imageUrl: "",
          imageAlt: "",
          position: prev.sections.length % 2 === 0 ? "left" : "right",
        },
      ],
    }));
  };

  const removeSection = (index: number) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/landing-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          content: JSON.stringify(content),
          faq: faq.filter((item) => item.question && item.answer),
          // AI fields
          seoTemplateId: selectedTemplateId || null,
          seoScore,
          targetKeywords,
          aiGenerated: seoScore !== null,
          aiGeneratedAt: seoScore !== null ? new Date() : undefined,
        }),
      });

      if (response.ok) {
        toast.success("Page saved successfully");
        router.refresh();
      } else {
        toast.error("Failed to save page");
      }
    } catch (error) {
      toast.error("Failed to save page");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/pages">
          <Button variant="ghost" className="gap-2">
            <Icon icon="ph:arrow-left" className="h-4 w-4" />
            Back to Pages
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <Link href={page.url} target="_blank">
            <Button variant="outline" className="gap-2">
              <Icon icon="ph:eye" className="h-4 w-4" />
              View Page
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
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
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Page Details</CardTitle>
              <CardDescription>Basic information about the landing page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Page title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <Icon icon="ph:link" className="h-4 w-4" />
                  {page.url}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content - Intro */}
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
              <CardDescription>
                The intro paragraph shown at the top of the page (HTML supported)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content.intro}
                onChange={(e) => handleIntroChange(e.target.value)}
                placeholder="<p>Your introduction text here...</p>"
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Content Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Sections</CardTitle>
                  <CardDescription>
                    Sections with alternating image/text layout
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addSection} className="gap-2">
                  <Icon icon="ph:plus" className="h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {content.sections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon icon="ph:article" className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No sections yet. Add a section to get started.</p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-4">
                  {content.sections.map((section, index) => (
                    <AccordionItem
                      key={index}
                      value={`section-${index}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-sm">#{index + 1}</span>
                          <span className="font-medium">
                            {section.heading || "Untitled Section"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Heading</Label>
                          <Input
                            value={section.heading}
                            onChange={(e) =>
                              handleSectionChange(index, "heading", e.target.value)
                            }
                            placeholder="Section heading"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Content (HTML)</Label>
                          <Textarea
                            value={section.content}
                            onChange={(e) =>
                              handleSectionChange(index, "content", e.target.value)
                            }
                            placeholder="<p>Section content...</p>"
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                              value={section.imageUrl || ""}
                              onChange={(e) =>
                                handleSectionChange(index, "imageUrl", e.target.value)
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Image Alt Text</Label>
                            <Input
                              value={section.imageAlt || ""}
                              onChange={(e) =>
                                handleSectionChange(index, "imageAlt", e.target.value)
                              }
                              placeholder="Image description"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Image Position</Label>
                          <Select
                            value={section.position}
                            onValueChange={(value: "left" | "right") =>
                              handleSectionChange(index, "position", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSection(index)}
                          className="gap-2"
                        >
                          <Icon icon="ph:trash" className="h-4 w-4" />
                          Remove Section
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>FAQ Section</CardTitle>
                  <CardDescription>Questions and answers for this page</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addFaqItem} className="gap-2">
                  <Icon icon="ph:plus" className="h-4 w-4" />
                  Add FAQ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {faq.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon icon="ph:question" className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No FAQ items yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {faq.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                              value={item.question}
                              onChange={(e) =>
                                handleFaqChange(index, "question", e.target.value)
                              }
                              placeholder="What is...?"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              value={item.answer}
                              onChange={(e) =>
                                handleFaqChange(index, "answer", e.target.value)
                              }
                              placeholder="The answer is..."
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFaqItem(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Icon icon="ph:trash" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Status */}
          <Card>
            <CardHeader>
              <CardTitle>Publication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.published
                      ? "Page is visible to visitors"
                      : "Page is hidden from visitors"}
                  </p>
                </div>
                <Switch
                  checked={formData.published}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, published: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* AI SEO Generation */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon icon="ph:magic-wand" className="h-5 w-5 text-primary" />
                AI SEO Generator
              </CardTitle>
              <CardDescription>
                Generate optimized SEO content with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selector */}
              <div className="space-y-2">
                <Label>SEO Template</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.displayName}
                        {template.category && (
                          <span className="text-muted-foreground ml-2">
                            ({template.category})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link href="/dashboard/seo-templates" className="text-xs text-primary hover:underline">
                  Manage templates →
                </Link>
              </div>

              {/* Target Keywords */}
              <div className="space-y-2">
                <Label>Target Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
                    <Icon icon="ph:plus" className="h-4 w-4" />
                  </Button>
                </div>
                {targetKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {targetKeywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1">
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
              </div>

              {/* SEO Score */}
              {seoScore !== null && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">SEO Score</span>
                    <Badge className={
                      seoScore >= 80 ? "bg-green-500" :
                      seoScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                    }>
                      {seoScore}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        seoScore >= 80 ? "bg-green-500" :
                        seoScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${seoScore}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => generateSeo("metaTitle")}
                    disabled={isGenerating !== null}
                    className="h-7 gap-1 text-xs"
                  >
                    {isGenerating === "metaTitle" ? (
                      <Icon icon="ph:spinner" className="h-3 w-3 animate-spin" />
                    ) : (
                      <Icon icon="ph:magic-wand" className="h-3 w-3" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  placeholder="SEO title"
                />
                <p className={`text-xs ${
                  formData.metaTitle.length >= 50 && formData.metaTitle.length <= 60
                    ? "text-green-600"
                    : formData.metaTitle.length > 60
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}>
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => generateSeo("metaDescription")}
                    disabled={isGenerating !== null}
                    className="h-7 gap-1 text-xs"
                  >
                    {isGenerating === "metaDescription" ? (
                      <Icon icon="ph:spinner" className="h-3 w-3 animate-spin" />
                    ) : (
                      <Icon icon="ph:magic-wand" className="h-3 w-3" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
                <p className={`text-xs ${
                  formData.metaDescription.length >= 145 && formData.metaDescription.length <= 155
                    ? "text-green-600"
                    : formData.metaDescription.length > 160
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}>
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Page Info */}
          <Card>
            <CardHeader>
              <CardTitle>Page Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(page.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sections</span>
                <span>{content.sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FAQ Items</span>
                <span>{faq.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




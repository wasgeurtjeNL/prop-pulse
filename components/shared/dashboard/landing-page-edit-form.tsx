"use client";

import { useState } from "react";
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
import LandingPageSeoPanel from "@/components/shared/forms/landing-page-seo-panel";

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
  
  // Parse content helper
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

  // Parse FAQ helper
  const parseFaq = (): FaqItem[] => {
    if (Array.isArray(page.faq)) {
      return page.faq as FaqItem[];
    }
    return [];
  };

  // Form state - MUST be defined before useCallback that uses it
  const [formData, setFormData] = useState({
    title: page.title,
    category: page.category,
    metaTitle: page.metaTitle || "",
    metaDescription: page.metaDescription || "",
    published: page.published,
  });

  const [content, setContent] = useState<LandingPageContent>(parseContent());
  const [faq, setFaq] = useState<FaqItem[]>(parseFaq());
  
  // Other state
  const [isSaving, setIsSaving] = useState(false);
  const [seoScore, setSeoScore] = useState<number | null>(page.seoScore ?? null);
  const [targetKeywords, setTargetKeywords] = useState<string[]>(page.targetKeywords || []);

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
              <CardTitle>Publicatie Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Gepubliceerd</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.published
                      ? "Pagina is zichtbaar voor bezoekers"
                      : "Pagina is verborgen voor bezoekers"}
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

          {/* Yoast-style SEO Panel */}
          <LandingPageSeoPanel
            title={formData.title}
            slug={page.url.split("/").pop() || ""}
            category={formData.category}
            metaTitle={formData.metaTitle}
            metaDescription={formData.metaDescription}
            targetKeywords={targetKeywords}
            onSlugChange={(slug) => {
              // Note: URL slug updates would need API support
              console.log("Slug changed to:", slug);
            }}
            onMetaTitleChange={(metaTitle) =>
              setFormData((prev) => ({ ...prev, metaTitle }))
            }
            onMetaDescriptionChange={(metaDescription) =>
              setFormData((prev) => ({ ...prev, metaDescription }))
            }
            onKeywordsChange={setTargetKeywords}
            onSeoScoreChange={setSeoScore}
          />

          {/* Page Info */}
          <Card>
            <CardHeader>
              <CardTitle>Pagina Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aangemaakt</span>
                <span>{new Date(page.createdAt).toLocaleDateString("nl-NL")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Laatst bijgewerkt</span>
                <span>{new Date(page.updatedAt).toLocaleDateString("nl-NL")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Secties</span>
                <span>{content.sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FAQ Items</span>
                <span>{faq.length}</span>
              </div>
              {page.aiGenerated && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Gegenereerd</span>
                  <Badge variant="outline" className="text-xs">
                    <Icon icon="ph:magic-wand" className="h-3 w-3 mr-1" />
                    {page.aiGeneratedAt
                      ? new Date(page.aiGeneratedAt).toLocaleDateString("nl-NL")
                      : "Ja"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




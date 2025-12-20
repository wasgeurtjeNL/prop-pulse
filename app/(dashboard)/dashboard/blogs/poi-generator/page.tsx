'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, MapPin, Home, ArrowRight, ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface Template {
  template: {
    id: string;
    titleTemplate: string;
    type: string;
    description: string;
    suggestedTags: string[];
  };
  estimatedProperties: number;
  canGenerate: boolean;
}

interface District {
  district: string;
  propertyCount: number;
}

interface GeneratedBlog {
  id: string;
  slug: string;
  title: string;
  published: boolean;
}

export default function PoiBlogGeneratorPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [generateImages, setGenerateImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Fetch templates and districts on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [templatesRes, districtsRes] = await Promise.all([
          fetch('/api/smart-blog/poi-generate?action=templates'),
          fetch('/api/smart-blog/poi-generate?action=districts'),
        ]);

        const templatesData = await templatesRes.json();
        const districtsData = await districtsRes.json();

        if (templatesData.success) {
          setTemplates(templatesData.data);
        }
        if (districtsData.success) {
          setDistricts(districtsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load templates');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch preview when template or district changes
  useEffect(() => {
    async function fetchPreview() {
      if (!selectedTemplate) {
        setPreviewData(null);
        return;
      }

      try {
        const params = new URLSearchParams({
          action: 'preview',
          templateId: selectedTemplate,
        });
        if (selectedDistrict) {
          params.set('district', selectedDistrict);
        }

        const res = await fetch(`/api/smart-blog/poi-generate?${params}`);
        const data = await res.json();

        if (data.success) {
          setPreviewData(data.data);
        } else {
          setPreviewData(null);
        }
      } catch (err) {
        console.error('Failed to fetch preview:', err);
      }
    }

    fetchPreview();
  }, [selectedTemplate, selectedDistrict]);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedBlog(null);

    try {
      const response = await fetch('/api/smart-blog/poi-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          overrides: selectedDistrict ? { district: selectedDistrict } : undefined,
          language: 'en',
          autoPublish: false,
          generateImages: generateImages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedBlog(data.blog);
      } else {
        setError(data.error || 'Failed to generate blog');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError('Failed to generate blog');
    } finally {
      setGenerating(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.template.id === selectedTemplate);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">POI Blog Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate data-driven blog posts based on property locations and nearby points of interest.
        </p>
      </div>

      {/* Template Selection */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Select Template</CardTitle>
            <CardDescription>
              Choose a blog template type based on POI data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates
                  .filter(t => t.canGenerate)
                  .map(t => (
                    <SelectItem key={t.template.id} value={t.template.id}>
                      <div className="flex items-center gap-2">
                        <span>{t.template.titleTemplate.replace(/\{[^}]+\}/g, '...')}</span>
                        <Badge variant="secondary" className="text-xs">
                          {t.estimatedProperties} properties
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedTemplateData && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">
                  Type: <Badge>{selectedTemplateData.template.type}</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplateData.template.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplateData.template.suggestedTags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Filter by District (Optional)</CardTitle>
            <CardDescription>
              Focus the blog on a specific area
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedDistrict || "all"} onValueChange={(val) => setSelectedDistrict(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="All districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All districts</SelectItem>
                {districts.map(d => (
                  <SelectItem key={d.district} value={d.district}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{d.district}</span>
                      <Badge variant="secondary" className="text-xs">
                        {d.propertyCount}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Preview: {previewData.generatedTitle}
            </CardTitle>
            <CardDescription>
              {previewData.properties.length} properties will be featured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {previewData.properties.slice(0, 6).map((property: any) => (
                <div
                  key={property.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm line-clamp-1 flex-1">{property.title}</p>
                    <Badge 
                      variant={property.type === 'FOR_SALE' ? 'default' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {property.type === 'FOR_SALE' ? 'Sale' : 'Rent'}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-primary">{property.price}</p>
                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    <span>{property.beds} bed</span>
                    <span>•</span>
                    <span>{property.baths} bath</span>
                    <span>•</span>
                    <span>{property.sqft} sqm</span>
                  </div>
                  {property.nearestPois.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {property.nearestPois[0].name}: {property.nearestPois[0].distanceFormatted}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              {/* Price stats - separated by type */}
              <div className="grid gap-2 md:grid-cols-2">
                {previewData.stats.saleCount > 0 && (
                  <div className="p-3 bg-background rounded border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      For Sale ({previewData.stats.saleCount})
                    </p>
                    <p className="font-bold">Avg ฿{previewData.stats.avgSalePrice?.toLocaleString()}</p>
                    {previewData.stats.salePriceRange && (
                      <p className="text-xs text-muted-foreground">
                        ฿{previewData.stats.salePriceRange.min.toLocaleString()} - ฿{previewData.stats.salePriceRange.max.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                {previewData.stats.rentCount > 0 && (
                  <div className="p-3 bg-background rounded border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      For Rent ({previewData.stats.rentCount})
                    </p>
                    <p className="font-bold">Avg ฿{previewData.stats.avgRentPrice?.toLocaleString()}/mo</p>
                    {previewData.stats.rentPriceRange && (
                      <p className="text-xs text-muted-foreground">
                        ฿{previewData.stats.rentPriceRange.min.toLocaleString()} - ฿{previewData.stats.rentPriceRange.max.toLocaleString()}/mo
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Score stats */}
              <div className="grid gap-2 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Beach Score</p>
                  <p className="font-bold">{previewData.stats.avgBeachScore || 'N/A'}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Family Score</p>
                  <p className="font-bold">{previewData.stats.avgFamilyScore || 'N/A'}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quietness Score</p>
                  <p className="font-bold">{previewData.stats.avgQuietnessScore || 'N/A'}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Convenience Score</p>
                  <p className="font-bold">{previewData.stats.avgConvenienceScore || 'N/A'}/100</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options & Generate Button */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Image Generation Option */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="generateImages" 
                checked={generateImages} 
                onCheckedChange={(checked) => setGenerateImages(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="generateImages" className="flex items-center gap-2 cursor-pointer">
                  <ImageIcon className="h-4 w-4" />
                  Generate AI Images
                </Label>
                <p className="text-sm text-muted-foreground">
                  Creates hyperrealistic cover and section images using AI. 
                  <span className="text-amber-600 dark:text-amber-400"> (~$0.12-0.20 per blog)</span>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {generatedBlog && (
            <div className="mb-4 p-4 bg-green-500/10 text-green-700 rounded-lg">
              <p className="font-medium">✓ Blog generated successfully!</p>
              <p className="text-sm mt-1">{generatedBlog.title}</p>
              <Link
                href={`/dashboard/blogs/edit/${generatedBlog.id}`}
                className="inline-flex items-center gap-1 mt-2 text-sm underline"
              >
                Edit blog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplate || generating}
            size="lg"
            className="w-full md:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate POI Blog
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


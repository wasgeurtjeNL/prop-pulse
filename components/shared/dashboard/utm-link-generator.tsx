"use client";

import { useState, useEffect, useMemo } from "react";
import { Copy, Check, Link2, ExternalLink, Plus, Trash2, Search, X } from "lucide-react";
import { getPropertyUrl } from "@/lib/property-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Property {
  id: string;
  title: string;
  slug: string;
  listingNumber: string | null;
  location?: string;
  areaSlug?: string | null;
  provinceSlug?: string | null;
}

// Preset sources for common platforms
const PRESET_SOURCES = [
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "google", label: "Google", icon: "🔍" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "📺" },
  { value: "line", label: "LINE", icon: "💬" },
  { value: "whatsapp", label: "WhatsApp", icon: "💚" },
  { value: "partner", label: "Partner Website", icon: "🤝" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "custom", label: "Custom", icon: "✏️" },
];

const PRESET_MEDIUMS = [
  { value: "marketplace", label: "Marketplace" },
  { value: "social", label: "Social Media" },
  { value: "ads", label: "Paid Ads" },
  { value: "organic", label: "Organic" },
  { value: "email", label: "Email" },
  { value: "referral", label: "Referral" },
  { value: "partner", label: "Partner" },
  { value: "qr", label: "QR Code" },
];

interface GeneratedLink {
  id: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  property: string;
  createdAt: Date;
}

export function UtmLinkGenerator() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Property search
  const [propertySearch, setPropertySearch] = useState<string>("");

  // Form state
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [customSource, setCustomSource] = useState<string>("");
  const [medium, setMedium] = useState<string>("");
  const [campaign, setCampaign] = useState<string>("");
  const [term, setTerm] = useState<string>("");
  const [content, setContent] = useState<string>("");

  // Generated links history (stored in localStorage)
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [generatedUrl, setGeneratedUrl] = useState<string>("");

  // Filter properties based on search
  const filteredProperties = useMemo(() => {
    if (!propertySearch.trim()) return properties;
    
    const search = propertySearch.toLowerCase();
    return properties.filter((p) => 
      p.title.toLowerCase().includes(search) ||
      p.listingNumber?.toLowerCase().includes(search) ||
      p.location?.toLowerCase().includes(search) ||
      p.slug.toLowerCase().includes(search)
    );
  }, [properties, propertySearch]);

  // Load properties
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties?limit=100");
        const data = await res.json();
        if (data.properties) {
          setProperties(data.properties);
        }
      } catch (error) {
        console.error("Failed to load properties:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();

    // Load saved links from localStorage
    const saved = localStorage.getItem("utm_generated_links");
    if (saved) {
      try {
        setGeneratedLinks(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Generate URL when form changes
  useEffect(() => {
    if (!selectedProperty) {
      setGeneratedUrl("");
      return;
    }

    const property = properties.find((p) => p.id === selectedProperty);
    if (!property) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.psmphuket.com";
    const propertyPath = getPropertyUrl(property);
    const propertyUrl = `${baseUrl}${propertyPath}`;

    const params = new URLSearchParams();
    const actualSource = source === "custom" ? customSource : source;
    
    if (actualSource) params.set("utm_source", actualSource);
    if (medium) params.set("utm_medium", medium);
    if (campaign) params.set("utm_campaign", campaign);
    if (term) params.set("utm_term", term);
    if (content) params.set("utm_content", content);

    const queryString = params.toString();
    setGeneratedUrl(queryString ? `${propertyUrl}?${queryString}` : propertyUrl);
  }, [selectedProperty, source, customSource, medium, campaign, term, content, properties]);

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id || "current");
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const saveLink = () => {
    if (!generatedUrl || !selectedProperty) {
      toast.error("Please generate a link first");
      return;
    }

    const property = properties.find((p) => p.id === selectedProperty);
    const actualSource = source === "custom" ? customSource : source;

    const newLink: GeneratedLink = {
      id: Date.now().toString(),
      url: generatedUrl,
      source: actualSource,
      medium,
      campaign,
      property: property?.title || "",
      createdAt: new Date(),
    };

    const updatedLinks = [newLink, ...generatedLinks].slice(0, 20); // Keep last 20
    setGeneratedLinks(updatedLinks);
    localStorage.setItem("utm_generated_links", JSON.stringify(updatedLinks));
    toast.success("Link saved to history!");
  };

  const deleteLink = (id: string) => {
    const updatedLinks = generatedLinks.filter((l) => l.id !== id);
    setGeneratedLinks(updatedLinks);
    localStorage.setItem("utm_generated_links", JSON.stringify(updatedLinks));
    toast.success("Link removed");
  };

  const getSourceIcon = (src: string) => {
    const preset = PRESET_SOURCES.find((p) => p.value === src);
    return preset?.icon || "🔗";
  };

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            UTM Link Generator
          </CardTitle>
          <CardDescription>
            Create trackable links for marketing campaigns. Use these when posting
            properties on Facebook Marketplace, Instagram, partner websites, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property Selection with Search */}
          <div className="space-y-2">
            <Label>Property</Label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PP number, title, or location..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {propertySearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setPropertySearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Property Dropdown */}
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading..." : "Select a property"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredProperties.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {loading ? "Loading properties..." : propertySearch ? "No properties found" : "No properties available"}
                  </div>
                ) : (
                  filteredProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <span className="flex items-center gap-2">
                        {property.listingNumber && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {property.listingNumber}
                          </Badge>
                        )}
                        <span className="truncate">{property.title}</span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {/* Show count */}
            {propertySearch && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredProperties.length} of {properties.length} properties
              </p>
            )}
          </div>

          {/* Source & Medium Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Traffic Source *</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Where will you post?" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_SOURCES.map((src) => (
                    <SelectItem key={src.value} value={src.value}>
                      {src.icon} {src.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {source === "custom" && (
                <Input
                  placeholder="Enter custom source name"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Medium *</Label>
              <Select value={medium} onValueChange={setMedium}>
                <SelectTrigger>
                  <SelectValue placeholder="Type of traffic" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_MEDIUMS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campaign Name */}
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              placeholder="e.g., december_2024, villa_promo, new_year_sale"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
            />
            <p className="text-xs text-muted-foreground">
              Use underscores instead of spaces. This helps group your traffic by campaign.
            </p>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Term (optional)</Label>
              <Input
                placeholder="Keywords if from paid search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content (optional)</Label>
              <Input
                placeholder="For A/B testing variants"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>

          {/* Generated URL */}
          {generatedUrl && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Generated URL</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedUrl}
                  readOnly
                  className="font-mono text-sm bg-background"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatedUrl)}
                >
                  {copied === "current" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(generatedUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={saveLink} variant="secondary" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Save to History
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Copy Section */}
      {selectedProperty && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Generate for Popular Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { source: "facebook", medium: "marketplace", label: "FB Marketplace" },
                { source: "instagram", medium: "social", label: "Instagram" },
                { source: "tiktok", medium: "social", label: "TikTok" },
                { source: "line", medium: "social", label: "LINE" },
              ].map((preset) => {
                const property = properties.find((p) => p.id === selectedProperty);
                if (!property) return null;
                
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.psmphuket.com";
                const propertyPath = getPropertyUrl(property);
                const quickUrl = `${baseUrl}${propertyPath}?utm_source=${preset.source}&utm_medium=${preset.medium}&utm_campaign=${campaign || "general"}`;
                
                return (
                  <Button
                    key={preset.source}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1"
                    onClick={() => copyToClipboard(quickUrl, preset.source)}
                  >
                    <span>{getSourceIcon(preset.source)}</span>
                    <span className="text-xs">{preset.label}</span>
                    {copied === preset.source && (
                      <Check className="h-3 w-3 text-green-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {generatedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Links</CardTitle>
            <CardDescription>Your recently generated tracking links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{link.property}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getSourceIcon(link.source)} {link.source}
                      </Badge>
                      {link.medium && (
                        <Badge variant="secondary" className="text-xs">
                          {link.medium}
                        </Badge>
                      )}
                      {link.campaign && (
                        <Badge variant="secondary" className="text-xs">
                          {link.campaign}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(link.url, link.id)}
                    >
                      {copied === link.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


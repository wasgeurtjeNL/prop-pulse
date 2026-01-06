"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Server, Bell, Send, Loader2, CheckCircle, XCircle, Sparkles, Building2, Users, MessageSquare, Tag, Ban, Database, Globe, Scan } from "lucide-react";
import CacheManager from "@/components/shared/dashboard/cache-manager";

interface Settings {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFromName: string | null;
  smtpFromEmail: string | null;
  siteName: string | null;
  siteEmail: string | null;
  adminNotifyEmail: string | null;
  notifyOnSubmission: boolean;
  notifyOnImageUpload: boolean;
  hasSmtpPassword?: boolean;
  // AI Content Settings
  companyDescription: string | null;
  companyTone: string | null;
  companyUSPs: string | null;
  targetAudience: string | null;
  brandKeywords: string | null;
  avoidTopics: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    smtpFromName: "Real Estate Pulse",
    smtpFromEmail: "",
    siteName: "Real Estate Pulse",
    siteEmail: "",
    adminNotifyEmail: "",
    notifyOnSubmission: true,
    notifyOnImageUpload: true,
    // AI Content Settings
    companyDescription: "",
    companyTone: "professional",
    companyUSPs: "",
    targetAudience: "",
    brandKeywords: "",
    avoidTopics: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        toast.success("Settings saved!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Scan website to auto-fill company profile
  const handleScanWebsite = async () => {
    setScanning(true);
    try {
      // Use the live website URL
      const websiteUrl = "https://www.psmphuket.com";
      
      toast.info("Scanning website... This may take a moment.");
      
      const response = await fetch("/api/smart-blog/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // API returns data under 'analysis', not 'profile'
        const profile = data.analysis || data.profile;
        
        if (profile) {
          // Update settings with scanned data
          setSettings(prev => ({
            ...prev,
            companyDescription: profile.description || prev.companyDescription,
            companyTone: profile.tone || prev.companyTone,
            targetAudience: profile.targetAudience || prev.targetAudience,
            companyUSPs: Array.isArray(profile.usps) ? profile.usps.join("\n") : (profile.usps || prev.companyUSPs),
            brandKeywords: Array.isArray(profile.brandKeywords) ? profile.brandKeywords.join(", ") : (profile.brandKeywords || prev.brandKeywords),
            avoidTopics: Array.isArray(profile.avoidTopics) ? profile.avoidTopics.join("\n") : (profile.avoidTopics || prev.avoidTopics),
          }));
          
          toast.success(`Website scanned! ${data.pagesAnalyzed || 0} pages analyzed. Don't forget to save!`);
        } else {
          toast.warning("Scan completed but no profile data found");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to scan website");
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan website");
    } finally {
      setScanning(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "test-smtp",
          testEmail: testEmail || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Test mislukt");
    } finally {
      setTesting(false);
    }
  };

  const updateField = (field: keyof Settings, value: string | boolean | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure email and site settings
        </p>
      </div>

      {/* SMTP Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <CardTitle>SMTP Email Configuratie</CardTitle>
          </div>
          <CardDescription>
            Configure your SMTP server to send automated emails to clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Server</Label>
              <Input
                id="smtpHost"
                placeholder="smtp.gmail.com"
                value={settings.smtpHost || ""}
                onChange={(e) => updateField("smtpHost", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Port</Label>
              <Input
                id="smtpPort"
                type="number"
                placeholder="587"
                value={settings.smtpPort || ""}
                onChange={(e) => updateField("smtpPort", parseInt(e.target.value) || 587)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Username / Email</Label>
              <Input
                id="smtpUser"
                type="email"
                placeholder="your-email@gmail.com"
                value={settings.smtpUser || ""}
                onChange={(e) => updateField("smtpUser", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">
                Password / App Password
                {settings.hasSmtpPassword && (
                  <span className="ml-2 text-green-600 text-xs">(saved)</span>
                )}
              </Label>
              <Input
                id="smtpPassword"
                type="password"
                placeholder={settings.hasSmtpPassword ? "••••••••" : "Your password"}
                value={settings.smtpPassword || ""}
                onChange={(e) => updateField("smtpPassword", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="smtpSecure"
              checked={settings.smtpSecure}
              onCheckedChange={(checked) => updateField("smtpSecure", checked as boolean)}
            />
            <Label htmlFor="smtpSecure" className="text-sm">
              Use SSL/TLS (on for port 465, off for port 587)
            </Label>
          </div>

          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-medium mb-3 block">Sender Settings</Label>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpFromName">Sender Name</Label>
                <Input
                  id="smtpFromName"
                  placeholder="Real Estate Pulse"
                  value={settings.smtpFromName || ""}
                  onChange={(e) => updateField("smtpFromName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpFromEmail">Sender Email</Label>
                <Input
                  id="smtpFromEmail"
                  type="email"
                  placeholder="noreply@yoursite.com"
                  value={settings.smtpFromEmail || ""}
                  onChange={(e) => updateField("smtpFromEmail", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Test SMTP */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-medium mb-3 block">Test SMTP Connection</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="test@example.com (optioneel)"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleTestSmtp} 
                disabled={testing || !settings.smtpHost}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Leave the email field empty to only test the connection, or enter an email to receive a test email
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
          <CardDescription>
            Configure when you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminNotifyEmail">Admin Notification Email</Label>
            <Input
              id="adminNotifyEmail"
              type="email"
              placeholder="admin@yoursite.com"
              value={settings.adminNotifyEmail || ""}
              onChange={(e) => updateField("adminNotifyEmail", e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Receive notifications when new property submissions come in
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyOnSubmission"
                checked={settings.notifyOnSubmission}
                onCheckedChange={(checked) => updateField("notifyOnSubmission", checked as boolean)}
              />
              <Label htmlFor="notifyOnSubmission" className="text-sm">
                Notification for new property request
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyOnImageUpload"
                checked={settings.notifyOnImageUpload}
                onCheckedChange={(checked) => updateField("notifyOnImageUpload", checked as boolean)}
              />
              <Label htmlFor="notifyOnImageUpload" className="text-sm">
                Notification when client uploads photos
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <CardTitle>General Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                placeholder="Real Estate Pulse"
                value={settings.siteName || ""}
                onChange={(e) => updateField("siteName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteEmail">Contact Email</Label>
              <Input
                id="siteEmail"
                type="email"
                placeholder="info@yoursite.com"
                value={settings.siteEmail || ""}
                onChange={(e) => updateField("siteEmail", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Content Settings */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-purple-900 dark:text-purple-100">AI Content Settings</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanWebsite}
              disabled={scanning}
              className="border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/30"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Scan Website
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Configure how the AI content generator writes content for your business. 
            Click &quot;Scan Website&quot; to automatically analyze psmphuket.com and fill in the profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Company Description */}
          <div className="space-y-2">
            <Label htmlFor="companyDescription" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Company Description
            </Label>
            <Textarea
              id="companyDescription"
              placeholder="Describe your company, services, and what makes you unique. This helps the AI write content that matches your brand identity.

Example: 'PSM Phuket is a premium real estate agency specializing in luxury villas and investment properties in Phuket, Thailand. We help international investors and expats find their dream home or profitable investment.'"
              value={settings.companyDescription || ""}
              onChange={(e) => updateField("companyDescription", e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              The more detailed, the better the AI understands your business.
            </p>
          </div>

          {/* Writing Tone */}
          <div className="space-y-2">
            <Label htmlFor="companyTone" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Tone of Voice / Writing Style
            </Label>
            <Select 
              value={settings.companyTone || "professional"} 
              onValueChange={(value) => updateField("companyTone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a writing style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">
                  <div className="flex flex-col">
                    <span>Professional</span>
                    <span className="text-xs text-muted-foreground">Business-like, trustworthy, expert</span>
                  </div>
                </SelectItem>
                <SelectItem value="friendly">
                  <div className="flex flex-col">
                    <span>Friendly</span>
                    <span className="text-xs text-muted-foreground">Warm, approachable, personal</span>
                  </div>
                </SelectItem>
                <SelectItem value="luxury">
                  <div className="flex flex-col">
                    <span>Luxury / Premium</span>
                    <span className="text-xs text-muted-foreground">Exclusive, refined, high-end</span>
                  </div>
                </SelectItem>
                <SelectItem value="casual">
                  <div className="flex flex-col">
                    <span>Casual / Informal</span>
                    <span className="text-xs text-muted-foreground">Relaxed, conversational</span>
                  </div>
                </SelectItem>
                <SelectItem value="educational">
                  <div className="flex flex-col">
                    <span>Educational</span>
                    <span className="text-xs text-muted-foreground">Informative, explanatory, teaching</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Target Audience
            </Label>
            <Textarea
              id="targetAudience"
              placeholder="Describe your ideal customer/reader.

Example: 'International investors (40-65 years) looking for profitable real estate investments in Thailand. Also expats planning to relocate to Phuket and wanting to buy or rent a property.'"
              value={settings.targetAudience || ""}
              onChange={(e) => updateField("targetAudience", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* USPs */}
          <div className="space-y-2">
            <Label htmlFor="companyUSPs" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              Unique Selling Points (USPs)
            </Label>
            <Textarea
              id="companyUSPs"
              placeholder="What makes you unique? One USP per line.

Example:
15+ years experience in Phuket real estate
Multilingual team (EN, DE, RU, TH)
Complete property management services
Proven ROI of 8-12% per year"
              value={settings.companyUSPs || ""}
              onChange={(e) => updateField("companyUSPs", e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              The AI will naturally incorporate these points in content where relevant.
            </p>
          </div>

          {/* Brand Keywords */}
          <div className="space-y-2">
            <Label htmlFor="brandKeywords" className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Brand Keywords
            </Label>
            <Input
              id="brandKeywords"
              placeholder="luxury, investment, Phuket, villa, ROI, expat"
              value={settings.brandKeywords || ""}
              onChange={(e) => updateField("brandKeywords", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Keywords that should frequently appear in your content (comma-separated).
            </p>
          </div>

          {/* Avoid Topics */}
          <div className="space-y-2">
            <Label htmlFor="avoidTopics" className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-muted-foreground" />
              Topics to Avoid
            </Label>
            <Textarea
              id="avoidTopics"
              placeholder="Topics the AI should NEVER mention.

Example:
Competing businesses
Negative news about Thailand
Political topics"
              value={settings.avoidTopics || ""}
              onChange={(e) => updateField("avoidTopics", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      {/* Cache Management */}
      <div className="border-t pt-8 mt-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cache Beheer
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Beheer de website cache en forceer content updates
          </p>
        </div>
        <CacheManager />
      </div>
    </div>
  );
}



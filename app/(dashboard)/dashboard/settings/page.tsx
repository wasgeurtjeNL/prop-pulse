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
import { Mail, Server, Bell, Send, Loader2, CheckCircle, XCircle, Sparkles, Building2, Users, MessageSquare, Tag, Ban } from "lucide-react";

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
        toast.success("Instellingen opgeslagen!");
      } else {
        toast.error("Opslaan mislukt");
      }
    } catch (error) {
      toast.error("Opslaan mislukt");
    } finally {
      setSaving(false);
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
          Instellingen
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configureer email en site instellingen
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
            Configureer je SMTP server om automatische emails te versturen naar klanten
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
              <Label htmlFor="smtpUser">Gebruikersnaam / Email</Label>
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
                Wachtwoord / App Password
                {settings.hasSmtpPassword && (
                  <span className="ml-2 text-green-600 text-xs">(opgeslagen)</span>
                )}
              </Label>
              <Input
                id="smtpPassword"
                type="password"
                placeholder={settings.hasSmtpPassword ? "••••••••" : "Je wachtwoord"}
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
              Gebruik SSL/TLS (aan voor port 465, uit voor port 587)
            </Label>
          </div>

          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-medium mb-3 block">Afzender Instellingen</Label>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpFromName">Afzender Naam</Label>
                <Input
                  id="smtpFromName"
                  placeholder="Real Estate Pulse"
                  value={settings.smtpFromName || ""}
                  onChange={(e) => updateField("smtpFromName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpFromEmail">Afzender Email</Label>
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
            <Label className="text-sm font-medium mb-3 block">Test SMTP Verbinding</Label>
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
                Test Verbinding
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Laat het email veld leeg om alleen de verbinding te testen, of vul een email in om een test email te ontvangen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notificatie Instellingen</CardTitle>
          </div>
          <CardDescription>
            Stel in wanneer je notificaties wilt ontvangen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminNotifyEmail">Admin Notificatie Email</Label>
            <Input
              id="adminNotifyEmail"
              type="email"
              placeholder="admin@yoursite.com"
              value={settings.adminNotifyEmail || ""}
              onChange={(e) => updateField("adminNotifyEmail", e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Ontvang notificaties wanneer er nieuwe property submissions binnenkomen
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
                Notificatie bij nieuwe property aanvraag
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyOnImageUpload"
                checked={settings.notifyOnImageUpload}
                onCheckedChange={(checked) => updateField("notifyOnImageUpload", checked as boolean)}
              />
              <Label htmlFor="notifyOnImageUpload" className="text-sm">
                Notificatie wanneer klant foto&apos;s uploadt
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
            <CardTitle>Algemene Instellingen</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Naam</Label>
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
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-purple-900 dark:text-purple-100">AI Content Instellingen</CardTitle>
          </div>
          <CardDescription>
            Configureer hoe de AI blog generator content schrijft voor jouw bedrijf
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Company Description */}
          <div className="space-y-2">
            <Label htmlFor="companyDescription" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Bedrijfsomschrijving
            </Label>
            <Textarea
              id="companyDescription"
              placeholder="Beschrijf je bedrijf, diensten, en wat jullie uniek maakt. Dit helpt de AI om content te schrijven die past bij jullie identiteit.

Voorbeeld: 'PSM Phuket is een premium vastgoedkantoor gespecialiseerd in luxe villa's en investeringspanden in Phuket, Thailand. Wij helpen internationale investeerders en expats bij het vinden van hun droomwoning of rendabele investering.'"
              value={settings.companyDescription || ""}
              onChange={(e) => updateField("companyDescription", e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Hoe gedetailleerder, hoe beter de AI je bedrijf begrijpt.
            </p>
          </div>

          {/* Writing Tone */}
          <div className="space-y-2">
            <Label htmlFor="companyTone" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Schrijfstijl / Tone of Voice
            </Label>
            <Select 
              value={settings.companyTone || "professional"} 
              onValueChange={(value) => updateField("companyTone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een schrijfstijl" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">
                  <div className="flex flex-col">
                    <span>Professioneel</span>
                    <span className="text-xs text-muted-foreground">Zakelijk, betrouwbaar, deskundig</span>
                  </div>
                </SelectItem>
                <SelectItem value="friendly">
                  <div className="flex flex-col">
                    <span>Vriendelijk</span>
                    <span className="text-xs text-muted-foreground">Warm, toegankelijk, persoonlijk</span>
                  </div>
                </SelectItem>
                <SelectItem value="luxury">
                  <div className="flex flex-col">
                    <span>Luxe / Premium</span>
                    <span className="text-xs text-muted-foreground">Exclusief, verfijnd, high-end</span>
                  </div>
                </SelectItem>
                <SelectItem value="casual">
                  <div className="flex flex-col">
                    <span>Casual / Informeel</span>
                    <span className="text-xs text-muted-foreground">Relaxed, conversationeel</span>
                  </div>
                </SelectItem>
                <SelectItem value="educational">
                  <div className="flex flex-col">
                    <span>Educatief</span>
                    <span className="text-xs text-muted-foreground">Informatief, uitleggen, leren</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Doelgroep
            </Label>
            <Textarea
              id="targetAudience"
              placeholder="Beschrijf je ideale klant/lezer.

Voorbeeld: 'Internationale investeerders (40-65 jaar) die op zoek zijn naar rendabele vastgoedinvesteringen in Thailand. Ook expats die van plan zijn om naar Phuket te verhuizen en een woning willen kopen of huren.'"
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
              placeholder="Wat maakt jullie uniek? Eén USP per regel.

Voorbeeld:
15+ jaar ervaring in Phuket vastgoed
Meertalig team (EN, DE, RU, TH)
Complete property management services
Bewezen ROI van 8-12% per jaar"
              value={settings.companyUSPs || ""}
              onChange={(e) => updateField("companyUSPs", e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              De AI zal deze punten natuurlijk verwerken in de content waar relevant.
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
              Keywords die vaak in je content moeten voorkomen (komma-gescheiden).
            </p>
          </div>

          {/* Avoid Topics */}
          <div className="space-y-2">
            <Label htmlFor="avoidTopics" className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-muted-foreground" />
              Vermijd deze onderwerpen
            </Label>
            <Textarea
              id="avoidTopics"
              placeholder="Onderwerpen die de AI NIET mag benoemen.

Voorbeeld:
Concurrerende bedrijven
Negatief nieuws over Thailand
Politieke onderwerpen"
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
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}



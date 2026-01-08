"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Eye,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NotificationPreferencesProps {
  userId: string;
  lang: "en" | "nl";
}

interface NotificationSetting {
  id: string;
  icon: any;
  title: { en: string; nl: string };
  description: { en: string; nl: string };
  email: boolean;
  whatsapp: boolean;
  push: boolean;
}

export default function NotificationPreferences({
  userId,
  lang,
}: NotificationPreferencesProps) {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "viewing_request",
      icon: Calendar,
      title: { en: "Viewing Requests", nl: "Bezichtigingsaanvragen" },
      description: { en: "When a buyer requests to view your property", nl: "Wanneer een koper uw woning wil bezichtigen" },
      email: true,
      whatsapp: true,
      push: true,
    },
    {
      id: "new_inquiry",
      icon: MessageSquare,
      title: { en: "New Inquiries", nl: "Nieuwe Aanvragen" },
      description: { en: "When someone sends a message about your property", nl: "Wanneer iemand een bericht stuurt over uw woning" },
      email: true,
      whatsapp: true,
      push: true,
    },
    {
      id: "property_views",
      icon: Eye,
      title: { en: "Property Views", nl: "Woning Weergaven" },
      description: { en: "Weekly summary of property views", nl: "Wekelijks overzicht van woning weergaven" },
      email: true,
      whatsapp: false,
      push: false,
    },
    {
      id: "price_changes",
      icon: DollarSign,
      title: { en: "Price Approval", nl: "Prijs Goedkeuring" },
      description: { en: "When your price change request is processed", nl: "Wanneer uw prijswijziging is verwerkt" },
      email: true,
      whatsapp: true,
      push: true,
    },
    {
      id: "market_updates",
      icon: Users,
      title: { en: "Market Updates", nl: "Markt Updates" },
      description: { en: "Monthly market insights for your area", nl: "Maandelijkse markt inzichten voor uw gebied" },
      email: true,
      whatsapp: false,
      push: false,
    },
  ]);

  const toggleSetting = (settingId: string, channel: "email" | "whatsapp" | "push") => {
    setSettings((prev) =>
      prev.map((s) =>
        s.id === settingId ? { ...s, [channel]: !s[channel] } : s
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(lang === "nl" ? "Voorkeuren opgeslagen!" : "Preferences saved!");
    setSaving(false);
  };

  const t = {
    en: {
      title: "Notification Preferences",
      subtitle: "Choose how you want to receive updates",
      email: "Email",
      whatsapp: "WhatsApp",
      push: "Push",
      savePreferences: "Save Preferences",
      instant: "Instant notifications keep you informed",
    },
    nl: {
      title: "Notificatie Voorkeuren",
      subtitle: "Kies hoe u updates wilt ontvangen",
      email: "E-mail",
      whatsapp: "WhatsApp",
      push: "Push",
      savePreferences: "Voorkeuren Opslaan",
      instant: "Directe notificaties houden u op de hoogte",
    },
  }[lang];

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 dark:bg-violet-900/50 rounded-xl">
              <Bell className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "..." : t.savePreferences}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Channel Headers */}
        <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 mb-4 pb-4 border-b">
          <div></div>
          <div className="flex items-center gap-1 text-sm font-medium text-center w-20">
            <Mail className="h-4 w-4" />
            {t.email}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-center w-20">
            <MessageSquare className="h-4 w-4" />
            {t.whatsapp}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-center w-20">
            <Smartphone className="h-4 w-4" />
            {t.push}
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {settings.map((setting, idx) => {
            const Icon = setting.icon;
            return (
              <motion.div
                key={setting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Icon className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{setting.title[lang]}</div>
                    <div className="text-xs text-muted-foreground">{setting.description[lang]}</div>
                  </div>
                </div>
                
                <div className="w-20 flex justify-center">
                  <Switch
                    checked={setting.email}
                    onCheckedChange={() => toggleSetting(setting.id, "email")}
                  />
                </div>
                
                <div className="w-20 flex justify-center">
                  <Switch
                    checked={setting.whatsapp}
                    onCheckedChange={() => toggleSetting(setting.id, "whatsapp")}
                  />
                </div>
                
                <div className="w-20 flex justify-center">
                  <Switch
                    checked={setting.push}
                    onCheckedChange={() => toggleSetting(setting.id, "push")}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-300">
              {t.instant}
            </p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  Home,
  Camera,
  Eye,
  Users,
  Target,
  MessageSquare,
  FileText,
  Handshake,
  PartyPopper,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  status: string;
  hasMarketingPackage?: boolean;
  createdAt: string;
}

interface SalesProgressProps {
  properties: Property[];
  lang: "en" | "nl";
  onUpgradeClick?: () => void;
}

interface ProgressStep {
  id: string;
  icon: any;
  title: { en: string; nl: string };
  description: { en: string; nl: string };
  status: "completed" | "current" | "upcoming" | "recommended";
}

export default function SalesProgress({
  properties,
  lang,
  onUpgradeClick,
}: SalesProgressProps) {
  const property = properties[0]; // Use first property for now

  // Calculate progress based on property state
  const steps: ProgressStep[] = useMemo(() => {
    const hasMarketing = property?.hasMarketingPackage || false;
    const daysListed = property ? 
      Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return [
      {
        id: "listed",
        icon: Home,
        title: { en: "Property Listed", nl: "Woning Geplaatst" },
        description: { en: "Your property is live on our website", nl: "Uw woning staat live op onze website" },
        status: "completed",
      },
      {
        id: "photos",
        icon: Camera,
        title: { en: "Photos Uploaded", nl: "Foto's Geüpload" },
        description: { en: "Professional images added", nl: "Professionele afbeeldingen toegevoegd" },
        status: "completed",
      },
      {
        id: "marketing",
        icon: Target,
        title: { en: "Marketing Campaign", nl: "Marketing Campagne" },
        description: { 
          en: hasMarketing ? "Active Google & Facebook Ads" : "Upgrade to reach more buyers", 
          nl: hasMarketing ? "Actieve Google & Facebook Ads" : "Upgrade om meer kopers te bereiken" 
        },
        status: hasMarketing ? "completed" : "recommended",
      },
      {
        id: "views",
        icon: Eye,
        title: { en: "First Viewings", nl: "Eerste Bezichtigingen" },
        description: { en: "Potential buyers visiting", nl: "Potentiële kopers bezichtigen" },
        status: daysListed > 14 ? "completed" : daysListed > 7 ? "current" : "upcoming",
      },
      {
        id: "inquiries",
        icon: MessageSquare,
        title: { en: "Receiving Inquiries", nl: "Aanvragen Ontvangen" },
        description: { en: "Buyers showing interest", nl: "Kopers tonen interesse" },
        status: daysListed > 30 ? "completed" : daysListed > 14 ? "current" : "upcoming",
      },
      {
        id: "offers",
        icon: FileText,
        title: { en: "Offer Received", nl: "Bod Ontvangen" },
        description: { en: "Negotiating with buyers", nl: "Onderhandelen met kopers" },
        status: "upcoming",
      },
      {
        id: "agreement",
        icon: Handshake,
        title: { en: "Agreement Signed", nl: "Overeenkomst Getekend" },
        description: { en: "Contract finalized", nl: "Contract afgerond" },
        status: "upcoming",
      },
      {
        id: "sold",
        icon: PartyPopper,
        title: { en: "SOLD!", nl: "VERKOCHT!" },
        description: { en: "Congratulations!", nl: "Gefeliciteerd!" },
        status: property?.status === "SOLD" ? "completed" : "upcoming",
      },
    ];
  }, [property]);

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);

  const t = {
    en: {
      title: "Your Sales Journey",
      subtitle: "Track the progress of your property sale",
      progress: "Progress",
      complete: "complete",
      estimatedTime: "Estimated time to sale",
      months: "months",
      speedUp: "Speed up with marketing",
      recommended: "RECOMMENDED",
      upgradeNow: "Upgrade Now",
    },
    nl: {
      title: "Uw Verkooptraject",
      subtitle: "Volg de voortgang van uw woningverkoop",
      progress: "Voortgang",
      complete: "voltooid",
      estimatedTime: "Geschatte tijd tot verkoop",
      months: "maanden",
      speedUp: "Versnel met marketing",
      recommended: "AANBEVOLEN",
      upgradeNow: "Upgrade Nu",
    },
  }[lang];

  if (!property) return null;

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{t.progress}</div>
            <div className="text-2xl font-bold text-indigo-600">{progressPercentage}% {t.complete}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = step.status === "completed";
              const isCurrent = step.status === "current";
              const isRecommended = step.status === "recommended";

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex items-start gap-4 ${
                    isRecommended ? "bg-amber-50 dark:bg-amber-950/20 -mx-4 px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-amber-800" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                        ? "bg-blue-500 text-white ring-4 ring-blue-200"
                        : isRecommended
                          ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${
                        isCompleted ? "text-green-600" :
                        isCurrent ? "text-blue-600" :
                        isRecommended ? "text-amber-700" :
                        "text-slate-400"
                      }`}>
                        {step.title[lang]}
                      </h4>
                      {isRecommended && (
                        <Badge className="bg-amber-500 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t.recommended}
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description[lang]}
                    </p>

                    {/* CTA for recommended step */}
                    {isRecommended && (
                      <Button
                        size="sm"
                        onClick={onUpgradeClick}
                        className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {t.upgradeNow}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Estimated Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-500" />
              <div>
                <div className="text-sm text-muted-foreground">{t.estimatedTime}</div>
                <div className="font-semibold">
                  <span className="text-red-500 line-through mr-2">8-14 {t.months}</span>
                  <span className="text-green-600">3-5 {t.months}</span>
                  <span className="text-xs text-muted-foreground ml-2">({t.speedUp})</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

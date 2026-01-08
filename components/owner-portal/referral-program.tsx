"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Users,
  Copy,
  Check,
  Share2,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ReferralProgramProps {
  userName: string;
  userId: string;
  lang: "en" | "nl";
}

interface Referral {
  id: string;
  name: string;
  status: "PENDING" | "CONTACTED" | "LISTED" | "SOLD";
  reward: number;
  createdAt: string;
}

export default function ReferralProgram({
  userName,
  userId,
  lang,
}: ReferralProgramProps) {
  const [referralName, setReferralName] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [referralPhone, setReferralPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Mock referrals - in production, fetch from API
  const [referrals] = useState<Referral[]>([
    { id: "1", name: "John D.", status: "LISTED", reward: 500, createdAt: "2024-01-15" },
    { id: "2", name: "Anna M.", status: "PENDING", reward: 0, createdAt: "2024-01-20" },
  ]);

  const referralCode = `PSM-${userId.slice(0, 6).toUpperCase()}`;
  const referralLink = `https://www.psmphuket.com/list-your-property?ref=${referralCode}`;

  const totalEarned = referrals
    .filter((r) => r.status === "LISTED" || r.status === "SOLD")
    .reduce((sum, r) => sum + r.reward, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(lang === "nl" ? "Link gekopieerd!" : "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!referralName || (!referralEmail && !referralPhone)) {
      toast.error(lang === "nl" ? "Vul alle velden in" : "Please fill all fields");
      return;
    }

    setSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(lang === "nl" 
      ? "Bedankt! We nemen contact op met uw referral." 
      : "Thank you! We will contact your referral."
    );
    
    setReferralName("");
    setReferralEmail("");
    setReferralPhone("");
    setShowForm(false);
    setSubmitting(false);
  };

  const getStatusBadge = (status: Referral["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{lang === "nl" ? "In Behandeling" : "Pending"}</Badge>;
      case "CONTACTED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">{lang === "nl" ? "Gecontacteerd" : "Contacted"}</Badge>;
      case "LISTED":
        return <Badge className="bg-green-500">{lang === "nl" ? "Geplaatst" : "Listed"}</Badge>;
      case "SOLD":
        return <Badge className="bg-purple-500">{lang === "nl" ? "Verkocht" : "Sold"}</Badge>;
      default:
        return null;
    }
  };

  const t = {
    en: {
      title: "Referral Program",
      subtitle: "Earn €500 for every property owner you refer",
      howItWorks: "How It Works",
      step1: "Share your unique link",
      step2: "Owner lists with PSM Phuket",
      step3: "You receive €500 reward",
      yourCode: "Your Referral Code",
      copyLink: "Copy Link",
      shareVia: "Share via",
      orRefer: "Or refer someone directly",
      referName: "Owner's Name",
      referEmail: "Email Address",
      referPhone: "Phone Number",
      submitReferral: "Submit Referral",
      yourReferrals: "Your Referrals",
      totalEarned: "Total Earned",
      noReferrals: "No referrals yet. Start sharing!",
      hideForm: "Hide Form",
      showForm: "Refer Someone",
    },
    nl: {
      title: "Referral Programma",
      subtitle: "Verdien €500 voor elke woningeigenaar die u doorverwijst",
      howItWorks: "Hoe Het Werkt",
      step1: "Deel uw unieke link",
      step2: "Eigenaar plaatst bij PSM Phuket",
      step3: "U ontvangt €500 beloning",
      yourCode: "Uw Referral Code",
      copyLink: "Kopieer Link",
      shareVia: "Deel via",
      orRefer: "Of verwijs iemand direct",
      referName: "Naam Eigenaar",
      referEmail: "E-mailadres",
      referPhone: "Telefoonnummer",
      submitReferral: "Verstuur Referral",
      yourReferrals: "Uw Referrals",
      totalEarned: "Totaal Verdiend",
      noReferrals: "Nog geen referrals. Begin met delen!",
      hideForm: "Verberg Formulier",
      showForm: "Verwijs Iemand",
    },
  }[lang];

  return (
    <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {t.title}
                <Badge className="bg-purple-500">€500</Badge>
              </CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
          </div>
          
          {totalEarned > 0 && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{t.totalEarned}</div>
              <div className="text-2xl font-bold text-purple-600">€{totalEarned}</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* How It Works */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Share2, text: t.step1, color: "blue" },
            { icon: Users, text: t.step2, color: "purple" },
            { icon: DollarSign, text: t.step3, color: "green" },
          ].map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                step.color === "blue" ? "bg-blue-100 text-blue-600" :
                step.color === "purple" ? "bg-purple-100 text-purple-600" :
                "bg-green-100 text-green-600"
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              <div className="text-xs text-muted-foreground">{step.text}</div>
              {idx < 2 && (
                <ArrowRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 text-slate-300" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Referral Code & Link */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">{t.yourCode}</div>
              <div className="font-mono text-lg font-bold">{referralCode}</div>
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {t.copyLink}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
            <span className="truncate flex-1 font-mono text-xs bg-white dark:bg-slate-700 p-2 rounded">
              {referralLink}
            </span>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t.shareVia}:</span>
            <Button
              size="sm"
              variant="outline"
              className="bg-[#25D366] text-white border-0 hover:bg-[#128C7E]"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(referralLink)}`, '_blank')}
            >
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-[#1877F2] text-white border-0 hover:bg-[#0d65d9]"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}
            >
              Facebook
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`mailto:?subject=List your property with PSM Phuket&body=${encodeURIComponent(referralLink)}`, '_blank')}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Direct Referral Form */}
        <div>
          <Button
            variant="outline"
            onClick={() => setShowForm(!showForm)}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {showForm ? t.hideForm : t.showForm}
          </Button>

          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
            >
              <div className="space-y-2">
                <Label>{t.referName}</Label>
                <Input
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.referEmail}</Label>
                  <Input
                    type="email"
                    value={referralEmail}
                    onChange={(e) => setReferralEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.referPhone}</Label>
                  <Input
                    type="tel"
                    value={referralPhone}
                    onChange={(e) => setReferralPhone(e.target.value)}
                    placeholder="+66..."
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {submitting ? "..." : t.submitReferral}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">{t.yourReferrals}</h4>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                      {referral.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{referral.name}</div>
                      <div className="text-xs text-muted-foreground">{referral.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(referral.status)}
                    {referral.reward > 0 && (
                      <span className="font-bold text-green-600">€{referral.reward}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

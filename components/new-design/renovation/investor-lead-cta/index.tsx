"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/lib/contexts/language-context";
import { renovationTranslations } from "@/lib/translations/renovation";

export default function InvestorLeadCTA() {
  const { language } = useLanguage();
  const t = renovationTranslations[language].cta;
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name) {
      toast.error(language === 'en' ? "Please fill in your name and email" : "Vul alstublieft uw naam en email in");
      return;
    }

    if (!agreeTerms) {
      toast.error(language === 'en' ? "You must agree to the terms" : "U moet akkoord gaan met de voorwaarden");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/investor-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: language === 'en' ? "Not provided" : "Niet opgegeven",
          countryCode: "+66",
          currency: "EUR",
          investmentBudget: "BELOW_1M_THB",
          investmentGoal: "RENTAL_INCOME",
          source: "renovation-projects-page",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          language === 'en' 
            ? 'Thank you! You are now subscribed to exclusive project updates.' 
            : 'Bedankt! U bent ingeschreven voor exclusieve projectupdates.',
          {
            description: language === 'en' 
              ? `Confirmation sent to ${email}` 
              : `Bevestiging verstuurd naar ${email}`,
            duration: 5000,
          }
        );
        
        // Reset form
        setEmail("");
        setName("");
        setAgreeTerms(false);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (error: any) {
      console.error('Investor lead submission error:', error);
      toast.error(
        language === 'en' ? 'Something went wrong' : 'Er is iets misgegaan',
        {
          description: language === 'en' ? 'Please try again later.' : 'Probeer het later opnieuw.',
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="investor-form" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary via-primary-dark to-primary text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Icon icon="ph:envelope-simple-bold" className="mx-auto mb-6" width={64} height={64} />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.title}
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-2">
              {t.subtitle}
            </p>
            <p className="text-white/80">
              {t.description}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="name" className="text-white mb-2 block">{t.nameLabel}</Label>
                <div className="relative">
                  <Icon icon="ph:user-bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" width={20} height={20} />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-white mb-2 block">{t.emailLabel}</Label>
                <div className="relative">
                  <Icon icon="ph:envelope-bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" width={20} height={20} />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-6">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                className="mt-1 border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
              />
              <Label htmlFor="terms" className="text-white/90 text-sm cursor-pointer">
                {t.termsPrefix}{" "}
                <a href="/terms-and-conditions" className="underline hover:text-white" target="_blank">
                  {t.termsLink}
                </a>{" "}
                {t.termsAnd}{" "}
                <a href="/privacy-policy" className="underline hover:text-white" target="_blank">
                  {t.privacyLink}
                </a>
                {t.termsSuffix}
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-primary hover:bg-gray-100 font-semibold text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="ph:circle-notch" className="mr-2 animate-spin" width={24} height={24} />
                  {t.submitting}
                </>
              ) : (
                <>
                  <Icon icon="ph:paper-plane-tilt-bold" className="mr-2" width={24} height={24} />
                  {t.submitButton}
                </>
              )}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Icon icon="ph:lock-simple-bold" width={18} height={18} />
                <span>{t.secure}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="ph:shield-check-bold" width={18} height={18} />
                <span>{t.noSpam}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="ph:envelope-simple-bold" width={18} height={18} />
                <span>{t.exclusiveDeals}</span>
              </div>
            </div>
          </form>

          {/* What You'll Receive */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Icon icon="ph:buildings-bold" width={32} height={32} />
              </div>
              <h4 className="font-semibold mb-2">{t.benefit1Title}</h4>
              <p className="text-sm text-white/80">
                {t.benefit1Description}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Icon icon="ph:chart-bar-bold" width={32} height={32} />
              </div>
              <h4 className="font-semibold mb-2">{t.benefit2Title}</h4>
              <p className="text-sm text-white/80">
                {t.benefit2Description}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Icon icon="ph:camera-bold" width={32} height={32} />
              </div>
              <h4 className="font-semibold mb-2">{t.benefit3Title}</h4>
              <p className="text-sm text-white/80">
                {t.benefit3Description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

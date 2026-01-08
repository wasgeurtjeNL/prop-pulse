"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerBiddingSystemProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerBiddingSystem({ lang = "en" }: OwnerBiddingSystemProps) {
  const t = getOwnerLandingTranslations(lang);
  
  const steps = [
    {
      number: "01",
      title: t.bidStep1Title,
      description: t.bidStep1Desc,
      icon: "ph:gavel",
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: "02",
      title: t.bidStep2Title,
      description: t.bidStep2Desc,
      icon: "ph:identification-card",
      color: "from-amber-500 to-orange-500",
    },
    {
      number: "03",
      title: t.bidStep3Title,
      description: t.bidStep3Desc,
      icon: "ph:bell-ringing",
      color: "from-emerald-500 to-teal-500",
    },
    {
      number: "04",
      title: t.bidStep4Title,
      description: t.bidStep4Desc,
      icon: "ph:timer",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const benefits = [
    {
      icon: "ph:shield-check",
      title: t.bidBenefit1Title,
      description: t.bidBenefit1Desc,
    },
    {
      icon: "ph:users-three",
      title: t.bidBenefit2Title,
      description: t.bidBenefit2Desc,
    },
    {
      icon: "ph:eye",
      title: t.bidBenefit3Title,
      description: t.bidBenefit3Desc,
    },
    {
      icon: "ph:handshake",
      title: t.bidBenefit4Title,
      description: t.bidBenefit4Desc,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-6">
              <Icon icon="ph:gavel" className="w-4 h-4" />
              <span className="text-sm font-medium">{t.bidBadge}</span>
            </span>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              {t.bidTitle1}{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                {t.bidTitle2}
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {t.bidDescription}
            </p>

            {/* Steps */}
            <div className="space-y-6 mb-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <Icon icon={step.icon} className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">{step.number}</span>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700"
                >
                  <Icon icon={benefit.icon} className="w-6 h-6 text-amber-500 mb-2" />
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">{benefit.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Mock Offer Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">John Doe</h4>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Icon icon="ph:seal-check-fill" className="w-4 h-4" />
                      <span>{t.bidMockVerified}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  {t.bidMockActive}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">{t.bidMockOffer}</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">฿8,500,000</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">{t.bidMockPercentage}</span>
                  <span className="font-semibold text-amber-600">94.4%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">{t.bidMockNationality}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">🇬🇧</span>
                    <span className="text-slate-700 dark:text-slate-300">{lang === "nl" ? "Verenigd Koninkrijk" : "United Kingdom"}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-500 dark:text-slate-400">{t.bidMockValidUntil}</span>
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Icon icon="ph:calendar" className="w-4 h-4" />
                    {lang === "nl" ? "15 februari 2026" : "February 15, 2026"}
                  </span>
                </div>
              </div>

              {/* Passport Preview */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative">
                    <Icon icon="ph:identification-card" className="w-8 h-8 text-slate-400" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon icon="ph:shield-check-fill" className="w-5 h-5 text-emerald-500" />
                      <span className="font-medium text-slate-900 dark:text-white text-sm">{t.bidMockPassportVerified}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.bidMockAiVerification} {lang === "nl" ? "26 jan 2026" : "Jan 26, 2026"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Icon icon="ph:check" className="w-5 h-5" />
                  {t.bidMockAccept}
                </button>
                <button className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Icon icon="ph:chat-circle-text" className="w-5 h-5" />
                  {t.bidMockCounter}
                </button>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-6 -right-6 bg-emerald-500 text-white rounded-2xl p-4 shadow-lg shadow-emerald-500/30"
            >
              <Icon icon="ph:seal-check-fill" className="w-8 h-8" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Icon icon="ph:bell-ringing" className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">{t.bidMockNewOffer}</p>
                  <p className="text-xs text-slate-500">{t.bidMockJustNow}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

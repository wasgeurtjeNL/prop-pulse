"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/new-design/breadcrumb";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerLandingHeroProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerLandingHero({ lang = "en" }: OwnerLandingHeroProps) {
  const t = getOwnerLandingTranslations(lang);
  
  const breadcrumbs = [
    { name: lang === "nl" ? "Voor Eigenaren" : "For Owners", href: lang === "nl" ? "/voor-eigenaren" : "/for-owners" }
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-28">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury villa dashboard concept"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-800/70" />
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-blue-600/10 animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10 py-20">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumb 
            items={breadcrumbs} 
            className="justify-start [&_a]:text-white/70 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/40" 
          />
        </div>
        
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mb-6">
              <Icon icon="ph:crown-simple-fill" className="w-4 h-4" />
              <span className="text-sm font-medium">{t.heroBadge}</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            {t.heroTitle1}{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{t.heroTitle2}</span>,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t.heroTitle3}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed"
          >
            {t.heroDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
            >
              <Icon icon="ph:eye" className="w-5 h-5" />
              {t.heroCtaPrimary}
            </Link>
            <Link
              href="#roi-calculator"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-all border border-white/20"
            >
              <Icon icon="ph:calculator" className="w-5 h-5" />
              {t.heroCtaSecondary}
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-6"
          >
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">{t.heroTrust1}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">{t.heroTrust2}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">{t.heroTrust3}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">{t.heroTrust4}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats floating card */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden lg:block absolute right-8 xl:right-20 top-1/2 -translate-y-1/2 z-10"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl min-w-[280px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Icon icon="ph:chart-line-up" className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg">{t.heroStatsTitle}</h3>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{t.heroStatsViews}</span>
              <span className="text-2xl font-bold text-emerald-400">47</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{t.heroStatsBids}</span>
              <span className="text-2xl font-bold text-blue-400">3</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{t.heroStatsConversion}</span>
              <span className="text-2xl font-bold text-white">12%</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{t.heroStatsHighest}</span>
              <span className="text-2xl font-bold text-amber-400">฿8.5M</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Icon icon="ph:info" className="w-4 h-4" />
              <span>{t.heroStatsLive}</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-xs">{t.heroScroll}</span>
          <Icon icon="ph:caret-down" className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

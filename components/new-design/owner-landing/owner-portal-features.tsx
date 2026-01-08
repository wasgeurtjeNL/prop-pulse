"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerPortalFeaturesProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerPortalFeatures({ lang = "en" }: OwnerPortalFeaturesProps) {
  const t = getOwnerLandingTranslations(lang);
  
  const features = [
    {
      icon: "ph:chart-line-up",
      title: t.feature1Title,
      description: t.feature1Desc,
      color: "from-blue-500 to-cyan-400",
      stats: t.feature1Stat,
    },
    {
      icon: "ph:currency-circle-dollar",
      title: t.feature2Title,
      description: t.feature2Desc,
      color: "from-emerald-500 to-teal-400",
      stats: t.feature2Stat,
    },
    {
      icon: "ph:gavel",
      title: t.feature3Title,
      description: t.feature3Desc,
      color: "from-amber-500 to-orange-400",
      stats: t.feature3Stat,
    },
    {
      icon: "ph:chart-bar",
      title: t.feature4Title,
      description: t.feature4Desc,
      color: "from-purple-500 to-pink-400",
      stats: t.feature4Stat,
    },
    {
      icon: "ph:chat-circle-text",
      title: t.feature5Title,
      description: t.feature5Desc,
      color: "from-indigo-500 to-violet-400",
      stats: t.feature5Stat,
    },
    {
      icon: "ph:calendar-check",
      title: t.feature6Title,
      description: t.feature6Desc,
      color: "from-rose-500 to-red-400",
      stats: t.feature6Stat,
    },
    {
      icon: "ph:megaphone-simple",
      title: t.feature7Title,
      description: t.feature7Desc,
      color: "from-green-500 to-emerald-400",
      stats: t.feature7Stat,
    },
    {
      icon: "ph:translate",
      title: t.feature8Title,
      description: t.feature8Desc,
      color: "from-sky-500 to-blue-400",
      stats: t.feature8Stat,
    },
    {
      icon: "ph:gift",
      title: t.feature9Title,
      description: t.feature9Desc,
      color: "from-fuchsia-500 to-purple-400",
      stats: t.feature9Stat,
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
            <Icon icon="ph:sparkle" className="w-4 h-4" />
            <span className="text-sm font-medium">{t.featuresBadge}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {t.featuresTitle1}{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{t.featuresTitle2}</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            {t.featuresDescription}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700/50 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon icon={feature.icon} className="w-7 h-7 text-white" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {feature.stats}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t.featuresWantDemo}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#roi-calculator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all shadow-lg"
            >
              <Icon icon="ph:calculator" className="w-5 h-5" />
              {t.featuresCtaPrimary}
            </a>
            <a
              href="#comparison"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-full transition-all"
            >
              <Icon icon="ph:scales" className="w-5 h-5" />
              {t.featuresCtaSecondary}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerComparisonProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerComparison({ lang = "en" }: OwnerComparisonProps) {
  const t = getOwnerLandingTranslations(lang);
  
  const comparisonItems = [
    {
      feature: t.comp1,
      traditional: { value: t.comp1Trad, available: false },
      ours: { value: t.comp1Ours, available: true },
    },
    {
      feature: t.comp2,
      traditional: { value: t.comp2Trad, available: false },
      ours: { value: t.comp2Ours, available: true },
    },
    {
      feature: t.comp3,
      traditional: { value: t.comp3Trad, available: false },
      ours: { value: t.comp3Ours, available: true },
    },
    {
      feature: t.comp4,
      traditional: { value: t.comp4Trad, available: false },
      ours: { value: t.comp4Ours, available: true },
    },
    {
      feature: t.comp5,
      traditional: { value: t.comp5Trad, available: false },
      ours: { value: t.comp5Ours, available: true },
    },
    {
      feature: t.comp6,
      traditional: { value: t.comp6Trad, available: false },
      ours: { value: t.comp6Ours, available: true },
    },
    {
      feature: t.comp7,
      traditional: { value: t.comp7Trad, available: false },
      ours: { value: t.comp7Ours, available: true },
    },
    {
      feature: t.comp8,
      traditional: { value: t.comp8Trad, available: false },
      ours: { value: t.comp8Ours, available: true },
    },
    {
      feature: t.comp9,
      traditional: { value: t.comp9Trad, available: false },
      ours: { value: t.comp9Ours, available: true },
    },
    {
      feature: t.comp10,
      traditional: { value: t.comp10Trad, available: false },
      ours: { value: t.comp10Ours, available: true },
    },
  ];

  return (
    <section id="comparison" className="py-20 lg:py-28">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <Icon icon="ph:scales" className="w-4 h-4" />
            <span className="text-sm font-medium">{t.compBadge}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {t.compTitle1}{" "}
            <span className="text-slate-400">{t.compTitle2}</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t.compDescription}
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="p-6 font-semibold text-slate-700 dark:text-slate-300">
              {t.compFeature}
            </div>
            <div className="p-6 text-center border-x border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Icon icon="ph:buildings" className="w-5 h-5" />
                <span className="font-semibold">{t.compTraditional}</span>
              </div>
            </div>
            <div className="p-6 text-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Icon icon="ph:rocket-launch" className="w-5 h-5" />
                <span className="font-semibold">{t.compPlatform}</span>
              </div>
            </div>
          </div>

          {/* Rows */}
          {comparisonItems.map((item, index) => (
            <motion.div
              key={item.feature}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`grid grid-cols-3 ${
                index !== comparisonItems.length - 1
                  ? "border-b border-slate-100 dark:border-slate-700/50"
                  : ""
              } hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors`}
            >
              <div className="p-5 font-medium text-slate-700 dark:text-slate-300 flex items-center">
                {item.feature}
              </div>
              <div className="p-5 text-center border-x border-slate-100 dark:border-slate-700/50 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Icon
                    icon={item.traditional.available ? "ph:check-circle" : "ph:x-circle"}
                    className={`w-5 h-5 ${
                      item.traditional.available ? "text-green-500" : "text-red-400"
                    }`}
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {item.traditional.value}
                  </span>
                </div>
              </div>
              <div className="p-5 text-center bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="ph:check-circle-fill"
                    className="w-5 h-5 text-emerald-500"
                  />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {item.ours.value}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <Icon icon="ph:clock" className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t.compTraditional}
            </h3>
            <p className="text-3xl font-bold text-red-500 mb-1">11 {t.roiMonths}</p>
            <p className="text-sm text-slate-500">{t.compAvgTime}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white text-center shadow-lg shadow-emerald-500/20 transform md:-translate-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Icon icon="ph:rocket-launch" className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t.compPlatform}
            </h3>
            <p className="text-3xl font-bold mb-1">4 {t.roiMonths}</p>
            <p className="text-sm text-white/80">{t.compAvgTime}</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Icon icon="ph:arrow-fat-down" className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t.compYouSave}
            </h3>
            <p className="text-3xl font-bold text-emerald-500 mb-1">7 {t.roiMonths}</p>
            <p className="text-sm text-slate-500">{t.compMonthsFaster}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

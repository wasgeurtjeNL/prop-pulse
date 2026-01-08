"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerTM30FeatureProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerTM30Feature({ lang = "en" }: OwnerTM30FeatureProps) {
  const t = getOwnerLandingTranslations(lang);
  
  const workflowSteps = [
    {
      step: 1,
      title: t.tm30Step1,
      description: t.tm30Step1Desc,
      icon: "ph:calendar-check",
    },
    {
      step: 2,
      title: t.tm30Step2,
      description: t.tm30Step2Desc,
      icon: "ph:upload-simple",
    },
    {
      step: 3,
      title: t.tm30Step3,
      description: t.tm30Step3Desc,
      icon: "ph:robot",
    },
    {
      step: 4,
      title: t.tm30Step4,
      description: t.tm30Step4Desc,
      icon: "ph:check-circle",
    },
  ];

  const features = [
    {
      icon: "ph:magic-wand",
      title: t.tm30Feat1Title,
      description: t.tm30Feat1Desc,
    },
    {
      icon: "ph:clock-countdown",
      title: t.tm30Feat2Title,
      description: t.tm30Feat2Desc,
    },
    {
      icon: "ph:translate",
      title: t.tm30Feat3Title,
      description: t.tm30Feat3Desc,
    },
    {
      icon: "ph:whatsapp-logo",
      title: t.tm30Feat4Title,
      description: t.tm30Feat4Desc,
    },
    {
      icon: "ph:shield-warning",
      title: t.tm30Feat5Title,
      description: t.tm30Feat5Desc,
    },
    {
      icon: "ph:chart-bar",
      title: t.tm30Feat6Title,
      description: t.tm30Feat6Desc,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 mb-4">
            <Icon icon="ph:flag-banner" className="w-4 h-4" />
            <span className="text-sm font-medium">{t.tm30Badge}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {t.tm30Title1}{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t.tm30Title2}</span>{" "}
            {t.tm30Title3}
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            {t.tm30Description}
          </p>
        </motion.div>

        {/* Workflow Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 -translate-y-1/2" />
            
            <div className="grid md:grid-cols-4 gap-6">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                    <Icon icon={step.icon} className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                <Icon icon={feature.icon} className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-white/60">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                2,500+
              </div>
              <p className="text-white/60">{t.tm30Stat1}</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-white">
                100%
              </div>
              <p className="text-white/60">{t.tm30Stat2}</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-emerald-400">
                &lt;24h
              </div>
              <p className="text-white/60">{t.tm30Stat3}</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-amber-400">
                ฿0
              </div>
              <p className="text-white/60">{t.tm30Stat4}</p>
            </div>
          </div>
        </motion.div>

        {/* Warning/Benefit Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Icon icon="ph:warning" className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">{t.tm30DidYouKnow}</h4>
              <p className="text-white/70 text-sm">
                {t.tm30Warning}
              </p>
            </div>
          </div>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg whitespace-nowrap"
          >
            <Icon icon="ph:rocket-launch" className="w-5 h-5" />
            {t.tm30Activate}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

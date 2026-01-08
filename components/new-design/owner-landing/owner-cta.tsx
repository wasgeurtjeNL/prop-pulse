"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerCTAProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerCTA({ lang = "en" }: OwnerCTAProps) {
  const t = getOwnerLandingTranslations(lang);
  
  return (
    <section id="cta" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      
      {/* Animated shapes */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ repeat: Infinity, duration: 6 }}
        className="absolute top-10 right-10 w-20 h-20 border-2 border-white/20 rounded-xl"
      />
      <motion.div
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ repeat: Infinity, duration: 8, delay: 1 }}
        className="absolute bottom-10 left-10 w-16 h-16 border-2 border-white/20 rounded-full"
      />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-white"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8"
          >
            <Icon icon="ph:rocket-launch" className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            {t.ctaTitle1}{" "}
            <br className="hidden sm:block" />
            <span className="text-yellow-300">{t.ctaTitle2}</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.ctaDescription}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link
              href="/list-your-property"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 font-bold rounded-full hover:bg-white/90 transition-colors shadow-xl shadow-black/20 text-lg"
            >
              <Icon icon="ph:house-line" className="w-6 h-6" />
              {t.ctaPrimary}
            </Link>
            <a
              href={`https://wa.me/66812345678?text=${encodeURIComponent(lang === "nl" ? "Hallo, ik wil graag meer weten over het Owner Portal" : "Hello, I would like to know more about the Owner Portal")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/30 text-lg"
            >
              <Icon icon="ph:whatsapp-logo" className="w-6 h-6" />
              {t.ctaSecondary}
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">{t.ctaTrust1}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">{t.ctaTrust2}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">{t.ctaTrust3}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">{t.ctaTrust4}</span>
            </div>
          </div>
        </motion.div>

        {/* Floating contact options */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid sm:grid-cols-3 gap-4"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/20">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Icon icon="ph:whatsapp-logo" className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-1">{t.ctaWhatsApp}</h4>
            <p className="text-white/60 text-sm mb-3">{t.ctaWhatsAppSub}</p>
            <a href="https://wa.me/66812345678" className="text-yellow-300 hover:text-yellow-200 text-sm font-medium">
              +66 98 626 1646
            </a>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/20">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Icon icon="ph:envelope" className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-1">{t.ctaEmailTitle}</h4>
            <p className="text-white/60 text-sm mb-3">{t.ctaEmailSub}</p>
            <a href="mailto:owners@psmphuket.com" className="text-yellow-300 hover:text-yellow-200 text-sm font-medium">
              owners@psmphuket.com
            </a>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/20">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Icon icon="ph:calendar-check" className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-1">{t.ctaAppointment}</h4>
            <p className="text-white/60 text-sm mb-3">{t.ctaAppointmentSub}</p>
            <a href="/contact" className="text-yellow-300 hover:text-yellow-200 text-sm font-medium">
              {t.ctaPlanCall}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

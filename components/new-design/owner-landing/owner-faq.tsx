"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerFAQProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerFAQ({ lang = "en" }: OwnerFAQProps) {
  const t = getOwnerLandingTranslations(lang);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  const faqs = [
    { question: t.faq1Q, answer: t.faq1A },
    { question: t.faq2Q, answer: t.faq2A },
    { question: t.faq3Q, answer: t.faq3A },
    { question: t.faq4Q, answer: t.faq4A },
    { question: t.faq5Q, answer: t.faq5A },
    { question: t.faq6Q, answer: t.faq6A },
    { question: t.faq7Q, answer: t.faq7A },
    { question: t.faq8Q, answer: t.faq8A },
    { question: t.faq9Q, answer: t.faq9A },
    { question: t.faq10Q, answer: t.faq10A },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <Icon icon="ph:question" className="w-4 h-4" />
            <span className="text-sm font-medium">{t.faqBadge}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {t.faqTitle1}{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{t.faqTitle2}</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {t.faqDescription}
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="font-medium text-slate-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <Icon 
                    icon="ph:caret-down" 
                    className={`w-5 h-5 ${openIndex === index ? "text-emerald-500" : "text-slate-400"}`} 
                  />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="h-px bg-slate-100 dark:bg-slate-700 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Still have questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {t.faqNotListed}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/66812345678"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition-colors"
            >
              <Icon icon="ph:whatsapp-logo" className="w-5 h-5" />
              {t.faqWhatsApp}
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-full transition-colors"
            >
              <Icon icon="ph:envelope" className="w-5 h-5" />
              {t.faqEmail}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

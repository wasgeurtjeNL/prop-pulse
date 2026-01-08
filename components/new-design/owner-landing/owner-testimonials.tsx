"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerTestimonialsProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerTestimonials({ lang = "en" }: OwnerTestimonialsProps) {
  const t = getOwnerLandingTranslations(lang);
  
  const testimonials = [
    {
      name: t.test1Name,
      location: t.test1Location,
      flag: "🇳🇱",
      property: t.test1Property,
      quote: t.test1Quote,
      result: t.test1Result,
      resultColor: "text-emerald-500",
      avatar: "PB",
      rating: 5,
    },
    {
      name: t.test2Name,
      location: t.test2Location,
      flag: "🇬🇧",
      property: t.test2Property,
      quote: t.test2Quote,
      result: t.test2Result,
      resultColor: "text-blue-500",
      avatar: "ST",
      rating: 5,
    },
    {
      name: t.test3Name,
      location: t.test3Location,
      flag: "🇩🇪",
      property: t.test3Property,
      quote: t.test3Quote,
      result: t.test3Result,
      resultColor: "text-purple-500",
      avatar: "KM",
      rating: 5,
    },
    {
      name: t.test4Name,
      location: t.test4Location,
      flag: "🇧🇪",
      property: t.test4Property,
      quote: t.test4Quote,
      result: t.test4Result,
      resultColor: "text-amber-500",
      avatar: "MJ",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
            <Icon icon="ph:star" className="w-4 h-4" />
            <span className="text-sm font-medium">{t.testBadge}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {t.testTitle1}{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{t.testTitle2}</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t.testDescription}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {testimonial.name}
                      <span className="text-lg">{testimonial.flag}</span>
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.property}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Icon key={i} icon="ph:star-fill" className="w-4 h-4 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="relative mb-6">
                <Icon icon="ph:quotes" className="absolute -top-2 -left-2 w-8 h-8 text-slate-200 dark:text-slate-700" />
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>

              {/* Result Badge */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">{testimonial.location}</span>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 font-medium text-sm ${testimonial.resultColor}`}>
                  <Icon icon="ph:check-circle-fill" className="w-4 h-4" />
                  {testimonial.result}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-500 mb-2">47</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{t.testStat1}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">94%</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{t.testStat2}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-500 mb-2">4.8</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{t.testStat3}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-500 mb-2">7</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{t.testStat4}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

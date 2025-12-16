"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useLanguage } from "@/lib/contexts/language-context";
import { renovationTranslations } from "@/lib/translations/renovation";

export default function RenovationAdvantages() {
  const { language } = useLanguage();
  const t = renovationTranslations[language].advantages;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-dark-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Icon icon="ph:star-bold" className="text-primary" width={20} height={20} />
            <span className="text-sm font-semibold text-primary">{t.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark dark:text-white mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.items.map((advantage, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-dark-card p-6 rounded-xl hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-800"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon icon={advantage.icon} className="text-primary" width={32} height={32} />
              </div>
              <h3 className="text-xl font-bold text-dark dark:text-white mb-3">
                {advantage.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {advantage.description}
              </p>
              <div className="space-y-2">
                {advantage.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Icon icon="ph:check-bold" className="text-primary flex-shrink-0" width={18} height={18} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-r from-primary-light to-primary-dark text-white p-8 sm:p-12 rounded-2xl shadow-xl text-center">
          <Icon icon="ph:handshake-bold" className="mx-auto mb-6" width={64} height={64} />
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            {t.ctaTitle}
          </h3>
          <p className="text-lg mb-6 max-w-2xl mx-auto text-white/90">
            {t.ctaDescription}
          </p>
          <a
            href="#investor-form"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300"
          >
            <Icon icon="ph:arrow-down-bold" className="mr-2" width={24} height={24} />
            {t.ctaButton}
          </a>
        </div>
      </div>
    </section>
  );
}

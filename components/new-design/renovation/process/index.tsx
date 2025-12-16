"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useLanguage } from "@/lib/contexts/language-context";
import { renovationTranslations } from "@/lib/translations/renovation";

export default function RenovationProcess() {
  const { language } = useLanguage();
  const t = renovationTranslations[language].process;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-dark-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Icon icon="ph:path-bold" className="text-primary" width={20} height={20} />
            <span className="text-sm font-semibold text-primary">{t.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark dark:text-white mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="relative">
          {/* Timeline line - hidden on mobile */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary via-primary to-primary/20"></div>

          {/* Steps */}
          <div className="space-y-12 sm:space-y-16">
            {t.steps.map((step, index) => (
              <div
                key={index}
                className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className="w-full lg:w-5/12">
                  <div className="bg-gray-50 dark:bg-dark-card p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {step.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {step.highlights.map((highlight, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          <Icon icon="ph:check-circle-fill" width={16} height={16} />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Icon circle - center on desktop */}
                <div className="hidden lg:flex w-2/12 justify-center">
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-dark-card border-4 border-primary shadow-lg flex items-center justify-center z-10">
                    <Icon icon={step.icon} className="text-primary" width={40} height={40} />
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden lg:block w-5/12"></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-8 sm:p-12 rounded-2xl shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              {t.ctaTitle}
            </h3>
            <p className="text-lg mb-6 text-white/90">
              {t.ctaDescription}
            </p>
            <a
              href="#projects"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <Icon icon="ph:arrow-down-bold" className="mr-2" width={24} height={24} />
              {t.ctaButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

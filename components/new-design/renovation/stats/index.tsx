"use client";

import { Icon } from "@iconify/react";
import { useLanguage } from "@/lib/contexts/language-context";

export default function RenovationStats() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Proven Results",
      subtitle: "Our numbers speak for themselves. Over 10 years of experience in Phuket real estate renovation.",
      stats: [
        {
          icon: "ph:building-bold",
          value: "€15M+",
          label: "Total Project Value",
          description: "Cumulative value of all renovated projects",
        },
        {
          icon: "ph:clock-bold",
          value: "45 days",
          label: "Average Renovation Time",
          description: "From start to completion with our in-house team",
        },
        {
          icon: "ph:trend-up-bold",
          value: "+€2.8M",
          label: "Total Value Added",
          description: "Value created for our investors",
        },
        {
          icon: "ph:users-three-bold",
          value: "50+",
          label: "Satisfied Investors",
          description: "Trust us with their property investments",
        },
      ],
    },
    nl: {
      title: "Bewezen Resultaten",
      subtitle: "Onze cijfers spreken voor zich. Meer dan 10 jaar ervaring in Phuket vastgoed renovatie.",
      stats: [
        {
          icon: "ph:building-bold",
          value: "€15M+",
          label: "Totale Projectwaarde",
          description: "Cumulatieve waarde van alle gerenoveerde projecten",
        },
        {
          icon: "ph:clock-bold",
          value: "45 dagen",
          label: "Gemiddelde Renovatietijd",
          description: "Van start tot oplevering met ons eigen team",
        },
        {
          icon: "ph:trend-up-bold",
          value: "+€2.8M",
          label: "Totale Waardevermeerdering",
          description: "Gecreëerde meerwaarde voor onze investeerders",
        },
        {
          icon: "ph:users-three-bold",
          value: "50+",
          label: "Tevreden Investeerders",
          description: "Vertrouwen ons met hun vastgoedinvesteringen",
        },
      ],
    },
  };

  const t = content[language];

  return (
    <section className="py-12 sm:py-16 bg-gray-50 dark:bg-dark-background-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white mb-4">
            {t.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon icon={stat.icon} className="text-primary" width={32} height={32} />
                </div>
                <div className="text-3xl font-bold text-dark dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-dark dark:text-white mb-2">
                  {stat.label}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

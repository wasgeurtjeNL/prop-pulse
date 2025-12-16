"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { useLanguage } from "@/lib/contexts/language-context";
import { renovationTranslations } from "@/lib/translations/renovation";

export default function RenovationTestimonials() {
  const { language } = useLanguage();
  const t = renovationTranslations[language].testimonials;

  const testimonials = [
    {
      name: "Mark van den Berg",
      role: "Vastgoed Investeerder",
      location: "Nederland → Phuket",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
      quote: "PSM Phuket heeft mijn eerste vastgoedinvestering in Thailand tot een groot succes gemaakt. Ze hebben alles geregeld: van het vinden van een ondergewaardeerde villa, de complete renovatie, tot de verkoop. De ROI van 38% in 7 maanden overtrof mijn verwachtingen. Het feit dat ze zowel makelaar als aannemer in huis hebben, gaf me veel vertrouwen.",
      investment: "€235,000",
      profit: "€89,300",
      project: "Rawai Beach Villa",
    },
    {
      name: "Sophie Dubois",
      role: "Property Developer",
      location: "Frankrijk → Phuket",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
      quote: "Wat mij overtuigde was hun transparantie. Voor de aankoop toonden ze me exacte berekeningen van kosten en verwachte opbrengst. De renovatie werd op tijd en binnen budget afgerond. Hun in-house team is echt van topkwaliteit - elke detailafwerking was perfect.",
      investment: "€410,000",
      profit: "€165,000",
      project: "Nai Harn Pool Villa",
    },
    {
      name: "David Chen",
      role: "Portfolio Investor",
      location: "Singapore → Phuket",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces",
      quote: "Ik heb nu 3 projecten met PSM gedaan. Hun proces is zo goed gestroomlijnd dat ik alleen periodieke updates krijg en aan het einde een mooi rendement. Ze begrijpen de markt perfect en weten precies waar investeerders naar zoeken. Hun marketing voor verkoop is ook next-level - modern en effectief.",
      investment: "€625,000",
      profit: "€243,000",
      project: "3 Projecten (2022-2024)",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-dark-background-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Icon icon="ph:quotes-bold" className="text-primary" width={20} height={20} />
            <span className="text-sm font-semibold text-primary">{t.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark dark:text-white mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={60}
                    height={60}
                    className="rounded-full border-2 border-white"
                    unoptimized
                  />
                  <div>
                    <div className="font-bold text-lg">{testimonial.name}</div>
                    <div className="text-sm text-white/90">{testimonial.role}</div>
                    <div className="text-xs text-white/75 flex items-center gap-1 mt-1">
                      <Icon icon="ph:map-pin-fill" width={14} height={14} />
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="p-6">
                <Icon icon="ph:quotes-fill" className="text-primary/20 mb-3" width={40} height={40} />
                <p className="text-gray-700 dark:text-gray-300 italic mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Project Info */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="text-sm font-semibold text-primary mb-3">
                    {testimonial.project}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t.investment}</div>
                      <div className="font-bold text-dark dark:text-white">{testimonial.investment}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t.profit}</div>
                      <div className="font-bold text-green-600 dark:text-green-400">{testimonial.profit}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-full">
            <Icon icon="ph:seal-check-fill" className="text-green-600 dark:text-green-400" width={24} height={24} />
            <span className="text-green-800 dark:text-green-300 font-semibold">
              {t.verifiedBadge}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useLanguage } from "@/lib/contexts/language-context";
import { renovationTranslations } from "@/lib/translations/renovation";

export default function RenovationProjects() {
  const { language } = useLanguage();
  const t = renovationTranslations[language].projects;
  const [activeProject, setActiveProject] = useState(0);

  const projects = [
    {
      id: 1,
      title: "Rawai Luxury Villa Transformation",
      location: "Rawai, Phuket",
      beforeImage: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop",
      afterImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      investmentCost: "฿8,500,000",
      investmentCostEur: "€215,000",
      salePrice: "฿12,200,000",
      salePriceEur: "€308,000",
      roi: "43.5%",
      timeframe: "6 maanden",
      renovationDuration: "42 dagen",
      description: "Complete transformatie van een verouderde villa naar een moderne luxe woning. Inclusief volledige herinrichting, nieuwe keuken, badkamers, zwembad renovatie en landscaping.",
      highlights: [
        "Nieuwe open keuken met kookeiland",
        "Moderne badkamers met premium afwerking",
        "Gerenoveerd infinity pool",
        "Smart home systeem",
        "Tropische tuin landscaping",
      ],
      stats: {
        bedrooms: 3,
        bathrooms: 3,
        area: "285m²",
      },
    },
    {
      id: 2,
      title: "Patong Beach Condo Upgrade",
      location: "Patong, Phuket",
      beforeImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      afterImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      investmentCost: "฿3,200,000",
      investmentCostEur: "€81,000",
      salePrice: "฿4,400,000",
      salePriceEur: "€111,000",
      roi: "37.5%",
      timeframe: "4 maanden",
      renovationDuration: "35 dagen",
      description: "Strategische renovatie van een gedateerd appartement naar een moderne, verhuurbare unit met zeezicht. Focus op hoogwaardige afwerking binnen budget.",
      highlights: [
        "Luxe vinyl vloeren",
        "Designer badkamer met regendouche",
        "Ingebouwde kasten op maat",
        "Balkon renovatie met glazen balustrade",
        "Energiezuinige airconditioning",
      ],
      stats: {
        bedrooms: 2,
        bathrooms: 2,
        area: "95m²",
      },
    },
    {
      id: 3,
      title: "Nai Harn Pool Villa Makeover",
      location: "Nai Harn, Phuket",
      beforeImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      afterImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
      investmentCost: "฿15,800,000",
      investmentCostEur: "€400,000",
      salePrice: "฿22,500,000",
      salePriceEur: "€569,000",
      roi: "42.4%",
      timeframe: "9 maanden",
      renovationDuration: "65 dagen",
      description: "Premium renovatie van een strandvilla met focus op luxe details en hoogwaardige materialen. Complete herontwerp van binnen- en buitenruimtes.",
      highlights: [
        "Italiaanse marmeren vloeren",
        "Bulthaup designer keuken",
        "Spa-achtige master bathroom",
        "Infinity pool met ocean view",
        "Outdoor entertainment area",
        "Wijnkelder",
      ],
      stats: {
        bedrooms: 4,
        bathrooms: 5,
        area: "450m²",
      },
    },
  ];

  const project = projects[activeProject];

  return (
    <section id="projects" className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-dark-background-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Icon icon="ph:images-bold" className="text-primary" width={20} height={20} />
            <span className="text-sm font-semibold text-primary">{t.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark dark:text-white mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Project Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {projects.map((proj, index) => (
            <button
              key={proj.id}
              onClick={() => setActiveProject(index)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeProject === index
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card/80'
              }`}
            >
              {t.projectButton} {proj.id}
            </button>
          ))}
        </div>

        {/* Project Details */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">{project.title}</h3>
                <div className="flex items-center gap-2 text-white/90">
                  <Icon icon="ph:map-pin-fill" width={20} height={20} />
                  <span>{project.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm opacity-90">ROI</div>
                  <div className="text-3xl font-bold">{project.roi}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm opacity-90">Tijd</div>
                  <div className="text-xl font-semibold">{project.timeframe}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Before & After Images */}
          <div className="grid md:grid-cols-2 gap-0">
            {/* Before */}
            <div className="relative group">
            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg z-10 shadow-lg">
              {t.before}
            </div>
              <div className="aspect-[4/3] relative overflow-hidden">
                <Image
                  src={project.beforeImage}
                  alt={`${project.title} - Voor renovatie`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
            </div>

            {/* After */}
            <div className="relative group">
            <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg z-10 shadow-lg">
              {t.after}
            </div>
              <div className="aspect-[4/3] relative overflow-hidden">
                <Image
                  src={project.afterImage}
                  alt={`${project.title} - Na renovatie`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Investment Breakdown */}
              <div className="lg:col-span-2">
                <h4 className="text-xl font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
                  <Icon icon="ph:currency-circle-dollar-bold" className="text-primary" width={24} height={24} />
                  {t.investmentBreakdown}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-dark-background-secondary p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t.totalInvestment}</div>
                    <div className="text-xl font-bold text-dark dark:text-white">{project.investmentCost}</div>
                    <div className="text-sm text-gray-500">{project.investmentCostEur}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-background-secondary p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t.salePrice}</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{project.salePrice}</div>
                    <div className="text-sm text-gray-500">{project.salePriceEur}</div>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="text-sm text-primary mb-1">{t.roi}</div>
                    <div className="text-2xl font-bold text-primary">{project.roi}</div>
                    <div className="text-sm text-primary/80">{t.in} {project.timeframe}</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                  <Icon icon="ph:clock-bold" className="text-blue-600 flex-shrink-0 mt-1" width={24} height={24} />
                  <div>
                    <div className="font-semibold text-dark dark:text-white">{t.renovationDuration}: {project.renovationDuration}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{t.withOurTeam}</div>
                  </div>
                </div>
              </div>

              {/* Property Stats */}
              <div>
                <h4 className="text-xl font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
                  <Icon icon="ph:info-bold" className="text-primary" width={24} height={24} />
                  {t.propertyDetails}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Icon icon="ph:bed-bold" className="text-gray-600 dark:text-gray-400" width={24} height={24} />
                    <span className="text-dark dark:text-white">{project.stats.bedrooms} {t.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon icon="ph:bathtub-bold" className="text-gray-600 dark:text-gray-400" width={24} height={24} />
                    <span className="text-dark dark:text-white">{project.stats.bathrooms} {t.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon icon="ph:ruler-bold" className="text-gray-600 dark:text-gray-400" width={24} height={24} />
                    <span className="text-dark dark:text-white">{project.stats.area} {t.area}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-xl font-bold text-dark dark:text-white mb-3">{t.projectDescription}</h4>
              <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
            </div>

            {/* Highlights */}
            <div>
              <h4 className="text-xl font-bold text-dark dark:text-white mb-4">{t.keyImprovements}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Icon icon="ph:check-circle-fill" className="text-primary flex-shrink-0 mt-1" width={20} height={20} />
                    <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {t.ctaQuestion}
          </p>
          <a
            href="#investor-form"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-300"
          >
            <Icon icon="ph:envelope-simple-bold" className="mr-2" width={24} height={24} />
            {t.ctaButton}
          </a>
        </div>
      </div>
    </section>
  );
}


"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useLanguage } from "@/lib/contexts/language-context";

export default function RenovationHero() {
  const { language } = useLanguage();
  
  const content = {
    en: {
      badge: "In-House Renovation Excellence",
      title: "From Start to Finish: Our Renovation Projects",
      subtitle: "Discover how we transform properties into profitable investments",
      description: "With our in-house renovation team and real estate agency under one roof, we have complete control over quality, costs, and timing. View our completed projects and see how we achieve consistent ROI of 25-40%.",
      viewProjects: "View Projects",
      stayUpdated: "Stay Updated",
      completedProjects: "Completed Projects",
      yearsExperience: "Years Experience",
      averageROI: "Average ROI",
      inHouseTeam: "In-House Team",
    },
    nl: {
      badge: "In-House Renovatie Excellentie",
      title: "Van Begin tot Eind: Onze Renovatie Projecten",
      subtitle: "Ontdek hoe wij woningen transformeren in winstgevende investeringen",
      description: "Met ons eigen renovatieteam en makelaardij onder één dak, hebben we volledige controle over kwaliteit, kosten en timing. Bekijk onze afgeronde projecten en zie hoe we consistente ROI van 25-40% behalen.",
      viewProjects: "Bekijk Projecten",
      stayUpdated: "Blijf op de Hoogte",
      completedProjects: "Afgeronde Projecten",
      yearsExperience: "Jaar Ervaring",
      averageROI: "Gemiddelde ROI",
      inHouseTeam: "In-House Team",
    },
  };

  const t = content[language];

  return (
    <section className="relative bg-gradient-to-br from-primary to-primary-dark text-white pt-20 lg:pt-24 pb-8 sm:pb-10 lg:pb-12">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCAzLjk5OC00SDQyYzIuMjEgMCA0IDEuNzkgNCA0djJjMCAyLjIxLTEuNzkgNC00IDRoLTIuMDAyQTMuOTk4IDMuOTk4IDAgMCAxIDM2IDM2di0yem0wLTMwYzAtMi4yMSAxLjc5LTQgMy45OTgtNEg0MmMyLjIxIDAgNCAxLjc5IDQgNHYyYzAgMi4yMS0xLjc5IDQtNCA0aC0yLjAwMkEzLjk5OCAzLjk5OCAwIDAgMSAzNiA2VjR6TTYgMzRjMC0yLjIxIDEuNzktNCAzLjk5OC00SDEyYzIuMjEgMCA0IDEuNzkgNCA0djJjMCAyLjIxLTEuNzkgNC00IDRIOS45OTZBNC4wMDIgNC4wMDIgMCAwIDEgNiAzNnYtMnptMC0zMGMwLTIuMjEgMS43OS00IDMuOTk4LTRIMTJjMi4yMSAwIDQgMS43OSA0IDR2MmMwIDIuMjEtMS43OSA0LTQgNEg5Ljk5OEE0LjAwMiA0LjAwMiAwIDAgMSA2IDZWNHoiLz48L2c+PC9nPjwvc3ZnPg==')] bg-repeat"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Icon icon="ph:hammer-bold" width={20} height={20} />
            <span className="text-sm font-semibold">{t.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {t.title}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl mb-4 text-white/90">
            {t.subtitle}
          </p>

          <p className="text-base sm:text-lg mb-8 text-white/80 max-w-3xl mx-auto">
            {t.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="#projects"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300 w-full sm:w-auto"
            >
              <Icon icon="ph:images-bold" className="mr-2" width={24} height={24} />
              {t.viewProjects}
            </Link>
            <Link
              href="#investor-form"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary transition-colors duration-300 w-full sm:w-auto"
            >
              <Icon icon="ph:envelope-bold" className="mr-2" width={24} height={24} />
              {t.stayUpdated}
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl sm:text-3xl font-bold mb-1">100+</div>
              <div className="text-xs sm:text-sm text-white/80">{t.completedProjects}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl sm:text-3xl font-bold mb-1">10+</div>
              <div className="text-xs sm:text-sm text-white/80">{t.yearsExperience}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl sm:text-3xl font-bold mb-1">25-40%</div>
              <div className="text-xs sm:text-sm text-white/80">{t.averageROI}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl sm:text-3xl font-bold mb-1">100%</div>
              <div className="text-xs sm:text-sm text-white/80">{t.inHouseTeam}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


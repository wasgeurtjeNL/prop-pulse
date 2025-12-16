"use client";

import { Icon } from "@iconify/react";

export default function PropertyTrustBadges() {
  const badges = [
    {
      icon: "ph:shield-check-bold",
      title: "Verified & Safe",
      description: "All properties filtered and verified for your protection"
    },
    {
      icon: "ph:certificate-bold",
      title: "10+ Years Experience",
      description: "Trusted expertise in Phuket real estate market"
    },
    {
      icon: "ph:handshake-bold",
      title: "Trusted Developers",
      description: "We only work with reliable, proven partners"
    },
    {
      icon: "ph:headset-bold",
      title: "Full Support",
      description: "End-to-end guidance from viewing to handover"
    },
    {
      icon: "ph:hammer-bold",
      title: "Renovation Services",
      description: "Expert renovation advice and ROI calculations"
    },
    {
      icon: "ph:scales-bold",
      title: "Legal Expertise",
      description: "Accurate information aligned with Thai regulations"
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <Icon icon="ph:seal-check-bold" className="text-primary" width={24} height={24} />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
            Why Work With PSM Phuket?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your trusted partner in Phuket real estate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge, index) => (
          <div 
            key={index}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 group h-full"
          >
            <div className="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 mb-3">
              <Icon icon={badge.icon} className="text-primary" width={24} height={24} />
            </div>
            <h4 className="text-sm font-bold text-dark dark:text-white mb-2">
              {badge.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {badge.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon icon="ph:check-circle-bold" className="text-green-600 dark:text-green-400" width={24} height={24} />
            <p className="text-sm font-semibold text-dark dark:text-white">
              Ready to make this your home?
            </p>
          </div>
          <a 
            href="tel:+66986261646"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-300 text-sm"
          >
            <Icon icon="ph:phone-call-bold" width={18} height={18} />
            Call +66 98 626 1646
          </a>
        </div>
      </div>
    </div>
  );
}


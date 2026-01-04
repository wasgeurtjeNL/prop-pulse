"use client";

import { Icon } from "@iconify/react";

export default function WhyChooseUs() {
  const buyerBenefits = [
    {
      icon: "ph:magnifying-glass-bold",
      title: "Property Search Expertise",
      description: "We search and find exactly what you're looking for, providing comprehensive property information for informed decisions."
    },
    {
      icon: "ph:shield-check-bold",
      title: "Legal Knowledge & Safety",
      description: "10+ years of legal expertise ensuring accurate information aligned with government regulations. We filter all listings to protect your investment."
    },
    {
      icon: "ph:handshake-bold",
      title: "Trusted Network",
      description: "We only work with developers we know personally - reliable and trustworthy partners in the market."
    },
    {
      icon: "ph:path-bold",
      title: "End-to-End Support",
      description: "Complete guidance through every step of the transaction process, plus ongoing property management services."
    },
    {
      icon: "ph:hammer-bold",
      title: "Renovation & ROI Advisory",
      description: "Our in-house renovation team provides expert advice, project management, and ROI calculations for investment properties."
    },
    {
      icon: "ph:chart-line-up-bold",
      title: "Investment Expertise",
      description: "Over 10 years of market experience with our own team of professionals to maximize your property investment returns."
    }
  ];

  const sellerBenefits = [
    {
      icon: "ph:megaphone-bold",
      title: "Innovative Marketing",
      description: "Modern marketing approach using Facebook, Instagram, TikTok, influencers, and targeted traffic generation - beyond traditional methods."
    },
    {
      icon: "ph:users-three-bold",
      title: "Right Audience Targeting",
      description: "Strategic campaigns designed to find and engage the perfect buyers for your specific property type."
    },
    {
      icon: "ph:checkmark-circle-bold",
      title: "Full-Service Transaction",
      description: "Complete support from listing to handover, ensuring a smooth and hassle-free selling experience."
    }
  ];

  return (
    <div className="bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-primary/10 dark:via-gray-900 dark:to-primary/5 py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark dark:text-white mb-4">
            Why Choose PSM Phuket?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            With over 10 years of experience in the Phuket real estate market, we provide 
            comprehensive services for both buyers and sellers with unmatched expertise.
          </p>
        </div>

        {/* For Buyers */}
        <div className="mb-12 lg:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon icon="ph:house-line-bold" className="text-green-600 dark:text-green-400" width={24} height={24} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white">
              For Buyers
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {buyerBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 group"
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon icon={benefit.icon} className="text-primary" width={28} height={28} />
                </div>
                <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                  {benefit.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* For Sellers */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon icon="ph:storefront-bold" className="text-blue-600 dark:text-blue-400" width={24} height={24} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white">
              For Sellers
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {sellerBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 group"
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon icon={benefit.icon} className="text-primary" width={28} height={28} />
                </div>
                <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                  {benefit.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 lg:mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Icon icon="ph:phone-call-bold" className="text-primary" width={32} height={32} />
              <div className="text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ready to get started?</p>
                <p className="text-xl font-bold text-dark dark:text-white">Contact us today</p>
              </div>
            </div>
            <a 
              href="tel:+66986261646"
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors duration-300 whitespace-nowrap"
            >
              Call +66 98 626 1646
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}













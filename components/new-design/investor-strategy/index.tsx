"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InvestorLeadForm from "@/components/new-design/investor-lead-form";

export default function InvestorStrategy() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
            <Icon icon="ph:chart-line-up-bold" className="text-primary" width={20} height={20} />
            <span className="text-sm font-semibold text-primary">Investment Opportunities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark dark:text-white mb-4">
            Maximize Your ROI with Our Proven Strategy
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            10+ years of experience turning undervalued properties into profitable investments. 
            Our comprehensive approach ensures maximum returns with minimal risk.
          </p>
        </div>

        {/* Main Strategy Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Left: Our Proven Process */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Icon icon="ph:strategy-bold" className="text-primary" width={24} height={24} />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white">Our Proven Investment Process</h3>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">1</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                    <Icon icon="ph:magnifying-glass-bold" className="inline mr-2 text-primary" width={20} height={20} />
                    Find Below-Market Opportunities
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We actively search for properties being sold below market value through our extensive network 
                    of developers, banks, and distressed sellers.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                    <Icon icon="ph:handshake-bold" className="inline mr-2 text-primary" width={20} height={20} />
                    Expert Negotiation
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our team negotiates aggressively to secure the absolute best purchase price, 
                    often 15-30% below market value.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">3</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                    <Icon icon="ph:hammer-bold" className="inline mr-2 text-primary" width={20} height={20} />
                    In-House Renovation Excellence
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our own renovation team transforms the property using premium materials and modern design, 
                    maximizing value while controlling costs.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">4</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-dark dark:text-white mb-2">
                    <Icon icon="ph:chart-line-up-bold" className="inline mr-2 text-primary" width={20} height={20} />
                    Pre-Calculated Market Value
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Before we even start, we calculate the exact post-renovation market value, ensuring 
                    guaranteed ROI of 25-40% on every project.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Why Invest With Us */}
          <div className="space-y-6">
            {/* ROI Stats */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Icon icon="ph:trophy-bold" width={32} height={32} />
                <h3 className="text-2xl font-bold">Investment Performance</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-4xl font-bold mb-1">25-40%</div>
                  <div className="text-sm opacity-90">Average ROI</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">10+</div>
                  <div className="text-sm opacity-90">Years Experience</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">100+</div>
                  <div className="text-sm opacity-90">Projects Completed</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-1">15-30%</div>
                  <div className="text-sm opacity-90">Below Market Purchase</div>
                </div>
              </div>
            </div>

            {/* Key Advantages */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-dark dark:text-white mb-6">Your Investment Advantages</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Icon icon="ph:check-circle-fill" className="text-green-500 flex-shrink-0 mt-0.5" width={24} height={24} />
                  <div>
                    <p className="font-semibold text-dark dark:text-white">Own Renovation Team</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">No contractor markups - direct control over quality and costs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon icon="ph:check-circle-fill" className="text-green-500 flex-shrink-0 mt-0.5" width={24} height={24} />
                  <div>
                    <p className="font-semibold text-dark dark:text-white">Market Expertise</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">10+ years analyzing Phuket property trends and valuations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon icon="ph:check-circle-fill" className="text-green-500 flex-shrink-0 mt-0.5" width={24} height={24} />
                  <div>
                    <p className="font-semibold text-dark dark:text-white">Pre-Calculated ROI</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Know your exact profit potential before purchasing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon icon="ph:check-circle-fill" className="text-green-500 flex-shrink-0 mt-0.5" width={24} height={24} />
                  <div>
                    <p className="font-semibold text-dark dark:text-white">Full Property Management</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">From acquisition to sale or rental management</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon icon="ph:check-circle-fill" className="text-green-500 flex-shrink-0 mt-0.5" width={24} height={24} />
                  <div>
                    <p className="font-semibold text-dark dark:text-white">Legal & Tax Optimization</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Structured for maximum returns and minimal tax liability</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-dark to-gray-800 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Build Your Property Investment Portfolio?
            </h3>
            <p className="text-base sm:text-lg text-gray-300 mb-8">
              Join successful investors who trust PSM Phuket to maximize their returns. 
              Let's discuss your investment goals and show you current opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Icon icon="ph:plus-circle-bold" width={24} height={24} />
                Get Exclusive Investment Opportunities
              </button>
              <Link 
                href="tel:+66986261646"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-dark font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Icon icon="ph:phone-bold" width={24} height={24} />
                Call +66 98 626 1646
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              <Icon icon="ph:lock-bold" className="inline mr-1" width={16} height={16} />
              Free consultation • No obligations • Confidential investment analysis
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12">
          <div className="text-center">
            <Icon icon="ph:shield-check-bold" className="text-primary mx-auto mb-2" width={40} height={40} />
            <p className="text-sm font-semibold text-dark dark:text-white">Verified Properties</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">100% Legal Compliance</p>
          </div>
          <div className="text-center">
            <Icon icon="ph:users-three-bold" className="text-primary mx-auto mb-2" width={40} height={40} />
            <p className="text-sm font-semibold text-dark dark:text-white">Expert Team</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">10+ Years Experience</p>
          </div>
          <div className="text-center">
            <Icon icon="ph:chart-line-up-bold" className="text-primary mx-auto mb-2" width={40} height={40} />
            <p className="text-sm font-semibold text-dark dark:text-white">Proven ROI</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">25-40% Average Returns</p>
          </div>
          <div className="text-center">
            <Icon icon="ph:buildings-bold" className="text-primary mx-auto mb-2" width={40} height={40} />
            <p className="text-sm font-semibold text-dark dark:text-white">Full Service</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">End-to-End Support</p>
          </div>
        </div>
      </div>

      {/* Investment Lead Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              <Icon icon="ph:chart-line-up-bold" className="inline mr-2 text-primary" width={28} height={28} />
              Investment Opportunities Registration
            </DialogTitle>
          </DialogHeader>
          <InvestorLeadForm />
        </DialogContent>
      </Dialog>
    </section>
  );
}


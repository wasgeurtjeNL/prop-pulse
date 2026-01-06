import Link from "next/link";
import { Icon } from "@iconify/react";

const CalculatorCTA = () => {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-0">
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl sm:rounded-3xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 p-6 sm:p-8 lg:p-12">
            {/* Left: Icon & Text */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 sm:gap-6 text-center sm:text-left">
              {/* Calculator Icon */}
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Icon icon="solar:calculator-bold-duotone" className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              
              {/* Text */}
              <div className="max-w-xl">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                  Calculate Your Property Transfer Costs
                </h2>
                <p className="text-white/80 text-sm sm:text-base">
                  Use our free calculator to see exactly what you'll pay in transfer fees, taxes, and government charges when buying property in Thailand.
                </p>
              </div>
            </div>
            
            {/* Right: CTA Button */}
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/tools/property-transfer-calculator"
                prefetch={false}
                className="group inline-flex items-center gap-3 bg-white text-emerald-700 hover:bg-emerald-50 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>Open Free Calculator</span>
                <Icon icon="solar:arrow-right-bold" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-white/60 text-xs flex items-center gap-1.5">
                <Icon icon="solar:verified-check-bold" className="w-4 h-4" />
                Updated with 2024-2026 incentives
              </span>
            </div>
          </div>
          
          {/* Features Strip */}
          <div className="relative z-10 bg-white/10 backdrop-blur-sm border-t border-white/20 px-6 sm:px-8 lg:px-12 py-4">
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-8 text-white/90 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-300" />
                <span>7 Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-300" />
                <span>Live Currency Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-300" />
                <span>Official Thai Tax Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-300" />
                <span>Buyer/Seller Split Options</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorCTA;

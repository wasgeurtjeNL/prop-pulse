import { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";

export const metadata: Metadata = {
  title: "Free Real Estate Tools | PSM Phuket",
  description: "Free tools for property buyers and investors in Thailand. Calculate transfer fees, estimate rental yields, and more.",
};

const tools = [
  {
    title: "Property Transfer Fee Calculator",
    description: "Calculate exact costs when buying property in Thailand, including transfer fees, taxes, and government incentives.",
    href: "/tools/property-transfer-calculator",
    icon: "solar:calculator-bold",
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  // Future tools can be added here
  // {
  //   title: "Rental Yield Calculator",
  //   description: "Estimate your return on investment for rental properties in Phuket.",
  //   href: "/tools/rental-yield-calculator",
  //   icon: "solar:chart-bold",
  //   badge: "Coming Soon",
  //   badgeColor: "bg-blue-100 text-blue-700",
  // },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Free Real Estate Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Professional tools to help you make informed property decisions in Thailand
          </p>
        </div>
        
        {/* Tools Grid */}
        <div className="grid gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group block bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon icon={tool.icon} className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                      {tool.title}
                    </h2>
                    {tool.badge && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tool.badgeColor}`}>
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </div>
                <Icon 
                  icon="solar:arrow-right-linear" 
                  className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" 
                />
              </div>
            </Link>
          ))}
        </div>
        
        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            More tools coming soon! Have a suggestion?{" "}
            <a href="/contactus" className="text-primary hover:underline">
              Let us know
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

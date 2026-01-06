import { Metadata } from "next";
import { PropertyTransferCalculator } from "@/components/tools/property-calculator";
import { Icon } from "@iconify/react";

// ============================================
// SEO METADATA
// ============================================

export const metadata: Metadata = {
  title: "Thailand Property Transfer Fee Calculator 2024-2026 | Free Tool | PSM Phuket",
  description: "Calculate exact transfer fees, taxes & costs when buying property in Thailand. Includes 0.01% government incentive savings. Free, accurate calculator by Phuket real estate experts.",
  keywords: [
    "Thailand property transfer fee calculator",
    "Thailand property tax calculator",
    "buying property Thailand costs",
    "Thailand real estate fees",
    "transfer fee Thailand",
    "specific business tax Thailand",
    "withholding tax Thailand property",
    "Phuket property fees",
    "Thailand property incentive 2026",
  ],
  openGraph: {
    title: "Thailand Property Transfer Fee Calculator | PSM Phuket",
    description: "Calculate exact costs when buying property in Thailand. Includes the latest 0.01% government incentive valid until June 2026.",
    type: "website",
    locale: "en_US",
    siteName: "PSM Phuket",
    images: [
      {
        url: "/tools/calculator-og.png",
        width: 1200,
        height: 630,
        alt: "Thailand Property Transfer Fee Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thailand Property Transfer Fee Calculator",
    description: "Calculate exact costs when buying property in Thailand. Free tool by PSM Phuket.",
  },
  alternates: {
    canonical: "https://www.psmphuket.com/tools/property-transfer-calculator",
  },
};

// ============================================
// STRUCTURED DATA
// ============================================

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Thailand Property Transfer Fee Calculator",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
  description: "Calculate exact transfer fees, taxes and costs when buying or selling property in Thailand. Includes government incentives.",
  publisher: {
    "@type": "Organization",
    name: "PSM Phuket",
    url: "https://www.psmphuket.com",
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the transfer fee when buying property in Thailand?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The standard transfer fee in Thailand is 2% of the registered value. However, until June 2026, properties valued at 7 million THB or less qualify for a reduced rate of just 0.01%.",
      },
    },
    {
      "@type": "Question",
      name: "Who pays the transfer fees in Thailand - buyer or seller?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Typically, the transfer fee is split 50/50 between buyer and seller, though this is negotiable. The seller usually pays withholding tax and specific business tax (if applicable), while the buyer pays mortgage registration fees.",
      },
    },
    {
      "@type": "Question",
      name: "What is specific business tax in Thailand property?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Specific Business Tax (SBT) is 3.3% of the sale price and applies if the seller has owned the property for less than 5 years. If SBT applies, stamp duty (0.5%) does not apply.",
      },
    },
    {
      "@type": "Question",
      name: "How is withholding tax calculated on Thai property sales?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For individual sellers, withholding tax uses a progressive rate system (5-35%) based on the registered value and years of ownership. For company sellers, it's a flat 1% of the sale price.",
      },
    },
    {
      "@type": "Question",
      name: "What is the government incentive for property transfer fees?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Thai government has reduced transfer and mortgage registration fees from 2%/1% to just 0.01% for properties valued at 7 million THB or less. This incentive is valid until June 2026.",
      },
    },
  ],
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function PropertyTransferCalculatorPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Hero Section */}
        <section className="pt-20 pb-12 px-4">
          <PropertyTransferCalculator />
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
              <Icon icon="solar:question-circle-bold" className="w-8 h-8 text-primary" />
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {/* FAQ 1 */}
              <details className="group bg-gray-50 dark:bg-gray-800 rounded-xl">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-900 dark:text-white">
                  What is the transfer fee when buying property in Thailand?
                  <Icon 
                    icon="solar:alt-arrow-down-linear" 
                    className="w-5 h-5 transition-transform group-open:rotate-180" 
                  />
                </summary>
                <div className="px-5 pb-5 text-gray-600 dark:text-gray-400">
                  The standard transfer fee in Thailand is <strong>2% of the registered value</strong>. 
                  However, until June 2026, properties valued at 7 million THB or less qualify for a 
                  reduced rate of just <strong>0.01%</strong>. This represents massive savings - for a 
                  5 million baht property, you'd pay just ฿500 instead of ฿100,000!
                </div>
              </details>
              
              {/* FAQ 2 */}
              <details className="group bg-gray-50 dark:bg-gray-800 rounded-xl">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-900 dark:text-white">
                  Who pays the transfer fees - buyer or seller?
                  <Icon 
                    icon="solar:alt-arrow-down-linear" 
                    className="w-5 h-5 transition-transform group-open:rotate-180" 
                  />
                </summary>
                <div className="px-5 pb-5 text-gray-600 dark:text-gray-400">
                  <p className="mb-3">The allocation of fees is typically negotiated, but the standard practice is:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Transfer Fee:</strong> Split 50/50 between buyer and seller</li>
                    <li><strong>Withholding Tax:</strong> Paid by seller</li>
                    <li><strong>Specific Business Tax:</strong> Paid by seller</li>
                    <li><strong>Stamp Duty:</strong> Paid by seller</li>
                    <li><strong>Mortgage Registration:</strong> Paid by buyer</li>
                  </ul>
                </div>
              </details>
              
              {/* FAQ 3 */}
              <details className="group bg-gray-50 dark:bg-gray-800 rounded-xl">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-900 dark:text-white">
                  What is Specific Business Tax (SBT)?
                  <Icon 
                    icon="solar:alt-arrow-down-linear" 
                    className="w-5 h-5 transition-transform group-open:rotate-180" 
                  />
                </summary>
                <div className="px-5 pb-5 text-gray-600 dark:text-gray-400">
                  Specific Business Tax is <strong>3.3%</strong> of the sale price (or registered value, 
                  whichever is higher). It only applies if the seller has owned the property for 
                  <strong> less than 5 years</strong>. If SBT applies, stamp duty (0.5%) does NOT apply - 
                  you pay one or the other, not both.
                </div>
              </details>
              
              {/* FAQ 4 */}
              <details className="group bg-gray-50 dark:bg-gray-800 rounded-xl">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-900 dark:text-white">
                  How is withholding tax calculated?
                  <Icon 
                    icon="solar:alt-arrow-down-linear" 
                    className="w-5 h-5 transition-transform group-open:rotate-180" 
                  />
                </summary>
                <div className="px-5 pb-5 text-gray-600 dark:text-gray-400">
                  <p className="mb-3">Withholding tax calculation depends on the seller type:</p>
                  <p className="mb-3"><strong>Individual Sellers:</strong> Uses a progressive rate system (5% to 35%) 
                  based on the registered value divided by years of ownership, with deductions based on 
                  how long the property was held.</p>
                  <p><strong>Company Sellers:</strong> Flat rate of 1% on the higher of the sale price or 
                  registered value.</p>
                </div>
              </details>
              
              {/* FAQ 5 */}
              <details className="group bg-gray-50 dark:bg-gray-800 rounded-xl">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-900 dark:text-white">
                  Can foreigners buy property in Thailand?
                  <Icon 
                    icon="solar:alt-arrow-down-linear" 
                    className="w-5 h-5 transition-transform group-open:rotate-180" 
                  />
                </summary>
                <div className="px-5 pb-5 text-gray-600 dark:text-gray-400">
                  Yes! Foreigners can purchase <strong>condominiums in their own name</strong> under 
                  freehold ownership, as long as foreign ownership in the building doesn't exceed 49%. 
                  For land and houses, foreigners typically use long-term leases or Thai company 
                  structures. The transfer fees apply equally regardless of buyer nationality.
                </div>
              </details>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary to-blue-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need Expert Guidance?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Our team at PSM Phuket can help you navigate the property buying process 
              and ensure you take full advantage of all available incentives.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/contactus"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                <Icon icon="solar:phone-linear" className="w-5 h-5" />
                Contact Us
              </a>
              <a
                href="https://wa.me/66986261646?text=Hi%2C%20I%20used%20your%20property%20transfer%20fee%20calculator%20and%20have%20questions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                <Icon icon="logos:whatsapp-icon" className="w-5 h-5" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

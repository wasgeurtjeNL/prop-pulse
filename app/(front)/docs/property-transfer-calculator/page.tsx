import { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";

export const metadata: Metadata = {
  title: "Property Transfer Fee Calculator - Official Documentation | PSM Phuket",
  description: "Complete reference documentation for the Thailand Property Transfer Fee Calculator. Official sources, tax rates, calculation methodology, and test cases.",
  openGraph: {
    title: "Thailand Property Transfer Fee Calculator - Documentation",
    description: "Official reference documentation with government sources and calculation methodology.",
    type: "article",
  },
};

// Tax rates table data
const taxRates = [
  {
    name: "Transfer Fee",
    nameLocal: "ค่าธรรมเนียมการโอน",
    standardRate: "2.0%",
    incentiveRate: "0.01%",
    taxBase: "Registered Value",
    paidBy: "50/50 Split",
    source: "Department of Lands",
    sourceUrl: "https://www.dol.go.th",
  },
  {
    name: "Specific Business Tax (SBT)",
    nameLocal: "ภาษีธุรกิจเฉพาะ",
    standardRate: "3.3%",
    incentiveRate: "N/A",
    taxBase: "MAX(Purchase, Registered)",
    paidBy: "Seller",
    source: "Revenue Department",
    sourceUrl: "https://www.rd.go.th/english/6043.html",
    condition: "If owned < 5 years",
  },
  {
    name: "Stamp Duty",
    nameLocal: "อากรแสตมป์",
    standardRate: "0.5%",
    incentiveRate: "N/A",
    taxBase: "MAX(Purchase, Registered)",
    paidBy: "Seller",
    source: "Revenue Department",
    sourceUrl: "https://www.rd.go.th/english/6045.html",
    condition: "If SBT doesn't apply",
  },
  {
    name: "Withholding Tax",
    nameLocal: "ภาษีเงินได้หัก ณ ที่จ่าย",
    standardRate: "Progressive (5-35%)",
    incentiveRate: "N/A",
    taxBase: "Registered Value",
    paidBy: "Seller",
    source: "Revenue Code Section 50",
    sourceUrl: "https://www.rd.go.th/english/23244.html",
    condition: "Individual sellers",
  },
  {
    name: "Mortgage Registration",
    nameLocal: "ค่าจดจำนอง",
    standardRate: "1.0%",
    incentiveRate: "0.01%",
    taxBase: "Loan Amount",
    paidBy: "Buyer",
    source: "Department of Lands",
    sourceUrl: "https://www.dol.go.th",
  },
];

// Progressive tax brackets
const withholdingBrackets = [
  { min: 0, max: 300000, rate: 5 },
  { min: 300001, max: 500000, rate: 10 },
  { min: 500001, max: 750000, rate: 15 },
  { min: 750001, max: 1000000, rate: 20 },
  { min: 1000001, max: 2000000, rate: 25 },
  { min: 2000001, max: 5000000, rate: 30 },
  { min: 5000001, max: Infinity, rate: 35 },
];

// Deduction rates
const deductionRates = [
  { year: 1, rate: 92, taxable: 8 },
  { year: 2, rate: 84, taxable: 16 },
  { year: 3, rate: 77, taxable: 23 },
  { year: 4, rate: 71, taxable: 29 },
  { year: 5, rate: 65, taxable: 35 },
  { year: 6, rate: 60, taxable: 40 },
  { year: 7, rate: 55, taxable: 45 },
  { year: "8+", rate: 50, taxable: 50 },
];

// Official sources
const officialSources = [
  {
    name: "Thailand Revenue Department",
    nameLocal: "กรมสรรพากร",
    url: "https://www.rd.go.th",
    info: "Withholding Tax, Stamp Duty, SBT rates",
    icon: "solar:buildings-2-bold",
  },
  {
    name: "Department of Lands",
    nameLocal: "กรมที่ดิน",
    url: "https://www.dol.go.th",
    info: "Transfer Fee, Mortgage Registration",
    icon: "solar:home-2-bold",
  },
  {
    name: "Royal Thai Government Gazette",
    nameLocal: "ราชกิจจานุเบกษา",
    url: "http://www.ratchakitcha.soc.go.th",
    info: "Cabinet Resolutions, Tax Incentives",
    icon: "solar:document-text-bold",
  },
  {
    name: "Bank of Thailand",
    nameLocal: "ธนาคารแห่งประเทศไทย",
    url: "https://www.bot.or.th",
    info: "Exchange Rates",
    icon: "solar:bank-bold",
  },
];

export default function PropertyTransferCalculatorDocs() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-2 text-blue-200 mb-4">
            <Icon icon="solar:document-text-bold" className="w-5 h-5" />
            <span>Official Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Thailand Property Transfer Fee Calculator
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mb-8">
            Complete reference documentation with official government sources, tax rates, 
            calculation methodology, and verification test cases.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/tools/property-transfer-calculator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Icon icon="solar:calculator-bold" className="w-5 h-5" />
              Open Calculator
            </Link>
            <a
              href="#sources"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              <Icon icon="solar:link-round-bold" className="w-5 h-5" />
              View Sources
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:list-bold" className="w-5 h-5 text-primary" />
            Table of Contents
          </h2>
          <div className="grid md:grid-cols-2 gap-2">
            {[
              { id: "sources", label: "1. Official Government Sources" },
              { id: "tax-rates", label: "2. Tax Types & Rates" },
              { id: "withholding", label: "3. Withholding Tax Calculation" },
              { id: "incentive", label: "4. Government Incentive Program" },
              { id: "methodology", label: "5. Calculation Methodology" },
              { id: "test-cases", label: "6. Test Cases & Validation" },
              { id: "disclaimer", label: "7. Disclaimer" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors"
              >
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Official Sources Section */}
        <section id="sources" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Icon icon="solar:verified-check-bold" className="w-6 h-6 text-green-600" />
            </div>
            1. Official Government Sources
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {officialSources.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon icon={source.icon} className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                      {source.name}
                    </div>
                    <div className="text-sm text-gray-500 mb-1">{source.nameLocal}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{source.info}</div>
                  </div>
                  <Icon icon="solar:arrow-right-up-linear" className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
              </a>
            ))}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex gap-3">
              <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Key Legal References:</strong> Revenue Code of Thailand (Sections 50, 91/2), 
                Land Code B.E. 2497, and Cabinet Resolutions for incentive programs.
              </div>
            </div>
          </div>
        </section>

        {/* Tax Rates Section */}
        <section id="tax-rates" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Icon icon="solar:chart-2-bold" className="w-6 h-6 text-blue-600" />
            </div>
            2. Tax Types & Rates
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Tax/Fee</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Standard Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Incentive Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Tax Base</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Paid By</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {taxRates.map((tax, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{tax.name}</div>
                      <div className="text-xs text-gray-500">{tax.nameLocal}</div>
                      {tax.condition && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          ⚠ {tax.condition}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">{tax.standardRate}</td>
                    <td className="px-4 py-4 text-sm">
                      {tax.incentiveRate !== "N/A" ? (
                        <span className="text-green-600 dark:text-green-400 font-mono">{tax.incentiveRate}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{tax.taxBase}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tax.paidBy === "Buyer" 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : tax.paidBy === "Seller"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}>
                        {tax.paidBy}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <a
                        href={tax.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {tax.source}
                        <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex gap-3">
              <Icon icon="solar:danger-triangle-bold" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> SBT and Stamp Duty are mutually exclusive. If SBT applies 
                (property owned &lt; 5 years), Stamp Duty does NOT apply, and vice versa.
              </div>
            </div>
          </div>
        </section>

        {/* Withholding Tax Section */}
        <section id="withholding" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Icon icon="solar:calculator-bold" className="w-6 h-6 text-purple-600" />
            </div>
            3. Withholding Tax Calculation
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Deduction Rates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Step 1: Deduction Rate by Years Owned</h3>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-2">Years</th>
                      <th className="pb-2">Deduction</th>
                      <th className="pb-2">Taxable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {deductionRates.map((row) => (
                      <tr key={row.year}>
                        <td className="py-2 font-medium text-gray-900 dark:text-white">{row.year}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{row.rate}%</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{row.taxable}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Progressive Tax Brackets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Step 3: Progressive Tax Rates</h3>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-2">Income Bracket (THB)</th>
                      <th className="pb-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {withholdingBrackets.map((bracket, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-gray-600 dark:text-gray-400">
                          {bracket.min.toLocaleString()} - {bracket.max === Infinity ? "∞" : bracket.max.toLocaleString()}
                        </td>
                        <td className="py-2 font-medium text-gray-900 dark:text-white">{bracket.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Calculation Formula */}
          <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 text-white font-mono text-sm">
            <div className="text-gray-400 mb-2">// Withholding Tax Calculation Formula</div>
            <div className="space-y-1">
              <div><span className="text-blue-400">Step 1:</span> Deduction Rate = getDeductionRate(yearsOwned)</div>
              <div><span className="text-blue-400">Step 2:</span> Assessable Income = Registered Value × Deduction Rate</div>
              <div><span className="text-blue-400">Step 3:</span> Income Per Year = Assessable Income ÷ Years Owned</div>
              <div><span className="text-blue-400">Step 4:</span> Tax Per Year = applyProgressiveTax(Income Per Year)</div>
              <div><span className="text-green-400">Result:</span> Total Withholding Tax = Tax Per Year × Years Owned</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex gap-3">
              <Icon icon="solar:buildings-2-bold" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Company Sellers:</strong> A flat rate of 1% applies, regardless of ownership period.
              </div>
            </div>
          </div>
        </section>

        {/* Government Incentive Section */}
        <section id="incentive" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Icon icon="solar:gift-bold" className="w-6 h-6 text-green-600" />
            </div>
            4. Government Incentive Program
          </h2>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:verified-check-bold" className="w-6 h-6" />
              <span className="font-semibold text-lg">Current Program (Extended)</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-green-200 text-sm mb-1">Effective Period</div>
                <div className="text-2xl font-bold">April 2024 - June 2026</div>
              </div>
              <div>
                <div className="text-green-200 text-sm mb-1">Eligible Properties</div>
                <div className="text-2xl font-bold">Registered Value ≤ ฿7,000,000</div>
              </div>
              <div>
                <div className="text-green-200 text-sm mb-1">Transfer Fee Reduction</div>
                <div className="text-2xl font-bold">2.0% → 0.01%</div>
              </div>
              <div>
                <div className="text-green-200 text-sm mb-1">Mortgage Fee Reduction</div>
                <div className="text-2xl font-bold">1.0% → 0.01%</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Maximum Savings Example (฿7M Property)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Standard Transfer Fee</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">฿140,000</div>
                <div className="text-xs text-gray-400">฿7M × 2%</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Incentive Transfer Fee</div>
                <div className="text-xl font-bold text-green-700 dark:text-green-300">฿700</div>
                <div className="text-xs text-green-500">฿7M × 0.01%</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Your Savings</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">฿139,300</div>
                <div className="text-xs text-blue-500">Per Cabinet Resolution</div>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section id="methodology" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Icon icon="solar:cpu-bolt-bold" className="w-6 h-6 text-orange-600" />
            </div>
            5. Calculation Methodology
          </h2>

          <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 text-white font-mono text-sm mb-6">
            <div className="text-gray-400 mb-4">// Complete Formula</div>
            <div className="text-green-400 mb-2">TOTAL COSTS = Transfer Fee + (SBT OR Stamp Duty) + Withholding Tax + Mortgage Fee</div>
            <div className="space-y-2 text-gray-300 mt-4">
              <div>Transfer Fee = Registered Value × (2% OR 0.01%)</div>
              <div>SBT = MAX(Purchase, Registered) × 3.3% <span className="text-gray-500">// if owned &lt; 5 years</span></div>
              <div>Stamp Duty = MAX(Purchase, Registered) × 0.5% <span className="text-gray-500">// if SBT not applicable</span></div>
              <div>Withholding Tax = <span className="text-yellow-400">Complex calculation (see section 3)</span></div>
              <div>Mortgage Fee = Loan Amount × (1% OR 0.01%)</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Standard 50/50 Cost Split (Thailand Practice)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium mb-2">
                  <Icon icon="solar:user-bold" className="w-5 h-5" />
                  Buyer Pays
                </div>
                <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• 50% of Transfer Fee</li>
                  <li>• 50% of SBT/Stamp Duty</li>
                  <li>• 50% of Withholding Tax</li>
                  <li>• 100% of Mortgage Fee</li>
                </ul>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-medium mb-2">
                  <Icon icon="solar:home-2-bold" className="w-5 h-5" />
                  Seller Pays
                </div>
                <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-1">
                  <li>• 50% of Transfer Fee</li>
                  <li>• 50% of SBT/Stamp Duty</li>
                  <li>• 50% of Withholding Tax</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Note: The split is negotiable. The calculator allows customization of the fee distribution.
            </p>
          </div>
        </section>

        {/* Test Cases Section */}
        <section id="test-cases" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
              <Icon icon="solar:test-tube-bold" className="w-6 h-6 text-cyan-600" />
            </div>
            6. Test Cases & Validation
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Test Case 1: Standard Sale (Individual, &lt; 5 years)</h3>
            </div>
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500 mb-2">Input</div>
                  <ul className="text-sm space-y-1">
                    <li>• Purchase Price: ฿5,000,000</li>
                    <li>• Registered Value: ฿4,500,000</li>
                    <li>• Years Owned: 3</li>
                    <li>• Seller Type: Individual</li>
                    <li>• Loan Amount: ฿0</li>
                    <li>• Apply Incentive: Yes</li>
                  </ul>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Expected Output</div>
                  <ul className="text-sm space-y-1">
                    <li>• Transfer Fee: ฿450 (0.01%)</li>
                    <li>• SBT: ฿165,000 (3.3%)</li>
                    <li>• Stamp Duty: ฿0 (N/A)</li>
                    <li>• Withholding Tax: ฿483,749</li>
                    <li>• Mortgage Fee: ฿0</li>
                    <li className="font-bold">• Total: ฿649,199 ✅</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Test Case 2: Company Sale (≥ 5 years, No Incentive)</h3>
            </div>
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500 mb-2">Input</div>
                  <ul className="text-sm space-y-1">
                    <li>• Purchase Price: ฿10,000,000</li>
                    <li>• Registered Value: ฿8,000,000</li>
                    <li>• Years Owned: 6</li>
                    <li>• Seller Type: Company</li>
                    <li>• Loan Amount: ฿0</li>
                    <li>• Apply Incentive: No</li>
                  </ul>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Expected Output</div>
                  <ul className="text-sm space-y-1">
                    <li>• Transfer Fee: ฿160,000 (2%)</li>
                    <li>• SBT: ฿0 (≥5 years)</li>
                    <li>• Stamp Duty: ฿50,000 (0.5%)</li>
                    <li>• Withholding Tax: ฿100,000 (1%)</li>
                    <li>• Mortgage Fee: ฿0</li>
                    <li className="font-bold">• Total: ฿310,000 ✅</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section id="disclaimer" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Icon icon="solar:danger-triangle-bold" className="w-6 h-6 text-red-600" />
            </div>
            7. Disclaimer
          </h2>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-red-800 dark:text-red-200 mb-4">
              This calculator provides <strong>estimates only</strong>. Actual costs may vary based on:
            </p>
            <ul className="text-red-700 dark:text-red-300 space-y-2 mb-4">
              <li>• Individual circumstances not captured by this calculator</li>
              <li>• Special exemptions that may apply</li>
              <li>• Negotiated fee splitting between buyer and seller</li>
              <li>• Changes in tax law or incentive programs</li>
              <li>• Local Land Office interpretation of regulations</li>
            </ul>
            <p className="text-red-800 dark:text-red-200">
              <strong>Professional Advice:</strong> Users should consult with a qualified legal professional, 
              tax advisor, or the relevant Land Office for official calculations.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Calculate Your Transfer Costs?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Use our free calculator to get an instant estimate of all fees and taxes for your Thailand property transaction.
          </p>
          <Link
            href="/tools/property-transfer-calculator"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            <Icon icon="solar:calculator-bold" className="w-5 h-5" />
            Open Calculator
          </Link>
        </section>

        {/* Footer Meta */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500">
          <p>Version 1.2 • Last Updated: January 2025</p>
          <p className="mt-1">
            For questions or corrections, contact{" "}
            <a href="mailto:info@psmphuket.com" className="text-primary hover:underline">
              info@psmphuket.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

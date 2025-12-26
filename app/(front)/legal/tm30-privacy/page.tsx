"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Clock, Eye, Trash2, FileText, Mail, Phone } from "lucide-react";

export default function TM30PrivacyPage() {
  const sections = [
    {
      icon: FileText,
      title: "Legal Basis for Data Collection",
      content: `Under the Thai Immigration Act B.E. 2522, Section 38, all accommodation providers (hotels, guesthouses, rental properties) are legally required to notify Thai Immigration of foreign guests within 24 hours of arrival. This notification is known as the "TM30" report.

As your accommodation provider, we are obligated by Thai law to collect your passport information to fulfill this legal requirement. The collection of your passport data is therefore based on our legal obligation to comply with Thai immigration law.`
    },
    {
      icon: Eye,
      title: "What Data We Collect",
      content: `To complete the TM30 registration, we collect the following information from your passport:

• Full name (as shown on passport)
• Passport number
• Nationality
• Date of birth
• Gender
• Passport expiry date
• A photo/scan of your passport data page

We also collect your check-in and check-out dates, and the accommodation address where you are staying.`
    },
    {
      icon: Lock,
      title: "How We Protect Your Data",
      content: `Your passport data is protected using industry-standard security measures:

• End-to-End Encryption: All passport images sent via WhatsApp are protected by end-to-end encryption during transmission.

• Secure Storage: Passport images and extracted data are stored in encrypted databases with access controls.

• Access Restrictions: Only authorized staff members involved in TM30 processing can access your passport data.

• No Third-Party Sharing: Your passport data is only shared with Thai Immigration for TM30 registration. We do not sell or share your data with any other third parties.`
    },
    {
      icon: Clock,
      title: "How Long We Keep Your Data",
      content: `We retain your passport data only as long as necessary:

• Passport Images: Automatically deleted 90 days after your checkout date.

• TM30 Records: Basic registration records (name, passport number, dates) may be retained for up to 1 year to comply with potential immigration audits.

• After Deletion: Data is permanently removed from our systems and cannot be recovered.`
    },
    {
      icon: Trash2,
      title: "Your Rights",
      content: `You have the following rights regarding your personal data:

• Right to Access: You can request a copy of the passport data we hold about you.

• Right to Rectification: If any data is incorrect, you can request correction.

• Right to Erasure: After the legal retention period, you can request deletion of your data.

• Right to Withdraw Consent: While TM30 registration is a legal requirement for accommodation, you can choose not to stay at properties requiring registration.

To exercise any of these rights, please contact us using the details below.`
    },
    {
      icon: Shield,
      title: "Data Processing",
      content: `Your passport data is processed as follows:

1. Collection: You send a passport photo via WhatsApp.

2. OCR Processing: Our secure system extracts the relevant data from the passport image using optical character recognition (OCR).

3. Verification: The extracted data is displayed for your confirmation before processing.

4. TM30 Submission: The data is submitted to the Thai Immigration Bureau's TM30 system.

5. Confirmation: You receive a confirmation with your TM30 reference number.

6. Retention & Deletion: Data is retained for the required period, then automatically deleted.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Privacy Policy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              TM30 Passport Data Privacy Policy
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              How we collect, use, and protect your passport information for Thai Immigration TM30 registration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Last Updated */}
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-gray-500 text-sm">
          Last updated: December 26, 2025
        </p>
      </div>

      {/* Introduction */}
      <section className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-emerald-900 mb-4">Overview</h2>
          <p className="text-gray-700 leading-relaxed">
            PSM Phuket is committed to protecting your privacy while fulfilling our legal obligations under Thai immigration law. This policy explains how we handle your passport data when processing TM30 immigration notifications for foreign guests staying at our properties.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            By providing your passport information for TM30 registration, you acknowledge that you have read and understood this privacy policy.
          </p>
        </motion.div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-xl flex-shrink-0">
                  <section.icon className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 md:p-12"
        >
          <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
          <p className="text-gray-300 mb-8">
            If you have any questions about this privacy policy or how we handle your passport data, please contact us:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <a href="mailto:info@psmphuket.com" className="text-white hover:text-emerald-400 transition-colors">
                  info@psmphuket.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-xl">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400">WhatsApp</p>
                <a href="https://wa.me/66986261646" className="text-white hover:text-emerald-400 transition-colors">
                  +66 98 626 1646
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Thai Law Reference */}
      <section className="container mx-auto px-4 py-8 max-w-4xl mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-8"
        >
          <h3 className="text-xl font-bold text-amber-900 mb-4">🇹🇭 Thai Immigration Law Reference</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            The TM30 notification requirement is established under:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Immigration Act B.E. 2522 (1979), Section 38:</strong> Requires accommodation owners/managers to notify Immigration when a foreigner stays at their premises.</li>
            <li><strong>Notification Period:</strong> Within 24 hours of the foreigner's arrival.</li>
            <li><strong>Penalty for Non-Compliance:</strong> Fines up to 2,000 THB for each violation.</li>
          </ul>
          <p className="text-gray-600 mt-4 text-sm">
            For more information, visit the official Thai Immigration Bureau website at{" "}
            <a href="https://www.immigration.go.th" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">
              www.immigration.go.th
            </a>
          </p>
        </motion.div>
      </section>
    </div>
  );
}


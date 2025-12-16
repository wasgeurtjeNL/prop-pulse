"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export default function ListPropertyComparison() {
  return (
    <section id="comparison" className="py-20 lg:py-28 bg-slate-900 dark:bg-slate-950 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary mb-4">
            <Icon icon="ph:scales" className="w-4 h-4" />
            <span className="text-sm font-medium">Compare Options</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your{" "}
            <span className="text-primary">Listing Package</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Select the package that best fits your needs. Our exclusive package offers premium marketing 
            that typically sells properties <strong className="text-white">40% faster</strong> and often <strong className="text-green-400">above asking price</strong>.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Standard Package */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Standard Listing</h3>
              <p className="text-slate-400">Basic exposure on our platform</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">6%</span>
                <span className="text-slate-400">commission</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle" className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Listed on our website</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle" className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Basic property photos (your photos)</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle" className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Standard inquiries handling</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:x-circle" className="w-5 h-5 text-red-400/60 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">No paid advertising</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:x-circle" className="w-5 h-5 text-red-400/60 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">No social media promotion</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:x-circle" className="w-5 h-5 text-red-400/60 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">No professional photography</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:x-circle" className="w-5 h-5 text-red-400/60 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">No video tour</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:x-circle" className="w-5 h-5 text-red-400/60 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">No priority placement</span>
              </li>
            </ul>

            <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Icon icon="ph:clock" className="w-4 h-4" />
                <span>Average time to sell: <strong className="text-white">90-180 days</strong></span>
              </div>
            </div>

            <a
              href="#list-form"
              className="block w-full text-center py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
            >
              Choose Standard
            </a>
          </motion.div>

          {/* Exclusive Package */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-8 border-2 border-primary/50 shadow-xl shadow-primary/20"
          >
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-full shadow-lg">
                <Icon icon="ph:star-four-fill" className="w-4 h-4" />
                RECOMMENDED
              </span>
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-2xl font-bold text-white mb-2">Exclusive Partnership</h3>
              <p className="text-slate-300">Premium marketing & maximum exposure</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">15%</span>
                <span className="text-slate-300">minimum commission</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">Investment in your success</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-white">Premium website placement</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-white font-semibold">Professional photography & video tour</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-white">Priority viewing scheduling</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-semibold">Google Ads Campaign</span>
                  <p className="text-sm text-slate-400">Targeted ads reaching qualified buyers</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-semibold">TikTok & Instagram Marketing</span>
                  <p className="text-sm text-slate-400">Viral content to millions of viewers</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-semibold">Facebook Ads Campaign</span>
                  <p className="text-sm text-slate-400">Targeting expats & international buyers</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-white">Featured in our newsletter (10,000+ subscribers)</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-white">Dedicated sales agent</span>
              </li>
            </ul>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <Icon icon="ph:rocket-launch" className="w-4 h-4" />
                <span>Average time to sell: <strong className="text-white">30-60 days</strong></span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Properties often sell above asking price!</p>
            </div>

            <a
              href="#list-form"
              className="block w-full text-center py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors shadow-lg shadow-primary/30"
            >
              <span className="flex items-center justify-center gap-2">
                <Icon icon="ph:rocket-launch" className="w-5 h-5" />
                Choose Exclusive Partnership
              </span>
            </a>
          </motion.div>
        </div>

        {/* Marketing Channels Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 mb-6">Exclusive listings are promoted across:</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <Icon icon="logos:google-ads" className="w-6 h-6" />
              <span className="font-medium">Google Ads</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <Icon icon="logos:tiktok-icon" className="w-6 h-6" />
              <span className="font-medium">TikTok</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <Icon icon="logos:facebook" className="w-6 h-6" />
              <span className="font-medium">Facebook</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <Icon icon="skill-icons:instagram" className="w-6 h-6" />
              <span className="font-medium">Instagram</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <Icon icon="logos:youtube-icon" className="w-6 h-6" />
              <span className="font-medium">YouTube</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}




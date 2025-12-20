"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Breadcrumb from "@/components/new-design/breadcrumb";

export default function ListPropertyHero() {
  const breadcrumbs = [
    { name: 'List Your Property', href: '/list-your-property' }
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-28">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury villa in Phuket"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10 py-20">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumb 
            items={breadcrumbs} 
            className="justify-start [&_a]:text-white/70 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/40" 
          />
        </div>
        
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary mb-6">
              <Icon icon="ph:star-four-fill" className="w-4 h-4" />
              <span className="text-sm font-medium">Premium Listing Service</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Sell Your Property{" "}
            <span className="text-primary">Faster</span> with{" "}
            <span className="text-primary">Premium Marketing</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed"
          >
            Join hundreds of successful property owners who trusted PSM Phuket to sell their properties. 
            Our exclusive marketing package reaches qualified international buyers through{" "}
            <strong className="text-white">TikTok, Google Ads, Facebook</strong>, and our extensive network.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <a
              href="#list-form"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
            >
              <Icon icon="ph:rocket-launch" className="w-5 h-5" />
              List My Property Now
            </a>
            <a
              href="#comparison"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-all border border-white/20"
            >
              <Icon icon="ph:info" className="w-5 h-5" />
              Compare Packages
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-6"
          >
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-green-400" />
              <span className="text-sm">10+ Years Experience</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-green-400" />
              <span className="text-sm">200+ Properties Sold</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-green-400" />
              <span className="text-sm">Free Property Valuation</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats floating card */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden lg:block absolute right-8 xl:right-20 top-1/2 -translate-y-1/2 z-10"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h3 className="text-white font-semibold mb-6 text-lg">Our Results</h3>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-1">94%</div>
              <div className="text-white/70 text-sm">Success Rate</div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">45</div>
              <div className="text-white/70 text-sm">Avg. Days to Sell</div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">+12%</div>
              <div className="text-white/70 text-sm">Above Asking Price</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}



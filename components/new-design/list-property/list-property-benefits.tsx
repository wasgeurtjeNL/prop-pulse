"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

const benefits = [
  {
    icon: "ph:globe-hemisphere-west",
    title: "International Reach",
    description: "Your property showcased to qualified buyers from Europe, USA, Australia, and Asia through our global network.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: "ph:camera",
    title: "Professional Photography",
    description: "High-quality photos and video tours that make your property stand out from the competition.",
    color: "from-purple-500 to-pink-400",
  },
  {
    icon: "ph:chart-line-up",
    title: "Maximum Exposure",
    description: "Featured on major property portals, social media, and exclusive buyer databases.",
    color: "from-green-500 to-blue-400",
  },
  {
    icon: "ph:handshake",
    title: "Expert Negotiation",
    description: "Our experienced team handles all negotiations to secure the best possible price for your property.",
    color: "from-orange-500 to-amber-400",
  },
  {
    icon: "ph:shield-check",
    title: "Legal Support",
    description: "Complete legal guidance through the entire sales process, ensuring a secure transaction.",
    color: "from-red-500 to-rose-400",
  },
  {
    icon: "ph:currency-circle-dollar",
    title: "Free Valuation",
    description: "Get an accurate market valuation of your property from our expert team - no obligations.",
    color: "from-indigo-500 to-violet-400",
  },
];

export default function ListPropertyBenefits() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Icon icon="ph:sparkle" className="w-4 h-4" />
            <span className="text-sm font-medium">Why List With Us</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need to{" "}
            <span className="text-primary">Sell Successfully</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We provide comprehensive services to ensure your property sells quickly and at the best possible price.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700/50"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.color} mb-5 group-hover:scale-110 transition-transform`}>
                <Icon icon={benefit.icon} className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}






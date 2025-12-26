"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

const testimonials = [
  {
    name: "Michael Thompson",
    location: "Villa Owner, Rawai",
    quote: "PSM Phuket sold my villa in just 6 weeks! Their marketing strategy and professional photography made all the difference. Highly recommended.",
    rating: 5,
    image: "/images/testimonials/avatar-1.jpg",
  },
  {
    name: "Sarah & James Wilson",
    location: "Condo Sellers, Patong",
    quote: "The team was incredibly professional throughout the entire process. They handled everything from valuation to closing, making it stress-free.",
    rating: 5,
    image: "/images/testimonials/avatar-2.jpg",
  },
  {
    name: "Andreas Mueller",
    location: "Investment Property, Kata",
    quote: "Excellent service and great communication. They found a buyer willing to pay above my asking price thanks to their negotiation skills.",
    rating: 5,
    image: "/images/testimonials/avatar-3.jpg",
  },
];

export default function ListPropertyTestimonials() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Icon icon="ph:quotes" className="w-4 h-4" />
            <span className="text-sm font-medium">Success Stories</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            What Our <span className="text-primary">Sellers Say</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Join hundreds of satisfied property owners who have successfully sold with us.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-white dark:bg-slate-800/50 rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-100 dark:border-slate-700/50"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Icon icon="ph:quotes-fill" className="w-12 h-12 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Icon
                    key={i}
                    icon="ph:star-fill"
                    className="w-5 h-5 text-amber-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 relative z-10">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-semibold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-wrap justify-center items-center gap-8 lg:gap-16"
        >
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">500+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Properties Sold</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">98%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Client Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">45 Days</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Avg. Time to Sell</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">15+ Years</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Experience</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

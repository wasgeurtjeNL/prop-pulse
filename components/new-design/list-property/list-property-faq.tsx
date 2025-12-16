"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

const faqs = [
  {
    question: "What is the difference between Standard and Exclusive listing?",
    answer: "With a Standard listing (6% commission), your property appears on our website only. With our Exclusive Partnership (15% minimum commission), we invest heavily in marketing your property through Google Ads, TikTok, Facebook, Instagram, professional photography, video tours, and our extensive buyer network. Exclusive listings typically sell 40% faster and often above asking price.",
  },
  {
    question: "Why is the Exclusive commission 15%?",
    answer: "The higher commission covers our significant investment in your property's success. We spend thousands on professional photography, video production, paid advertising campaigns (Google, TikTok, Facebook, Instagram), and dedicated agent time. This investment typically results in faster sales at higher prices, meaning you often end up with more money in your pocket despite the higher commission.",
  },
  {
    question: "How long does it take to sell my property?",
    answer: "Properties with our Exclusive Partnership typically sell within 30-60 days due to our aggressive marketing approach. Standard listings average 90-180 days as they rely solely on organic website traffic. Market conditions and property pricing also affect selling time.",
  },
  {
    question: "What marketing channels do you use for Exclusive listings?",
    answer: "For Exclusive Partnership listings, we deploy a comprehensive marketing strategy including: Google Ads targeting qualified buyers worldwide, TikTok and Instagram Reels for viral reach, Facebook ads targeting expat groups and high-net-worth individuals, YouTube property tours, email campaigns to our 10,000+ subscriber database, and premium placement on major property portals.",
  },
  {
    question: "Is professional photography included?",
    answer: "Professional photography and video tours are included FREE with our Exclusive Partnership package. Our professional team will visit your property to capture stunning images and create a compelling video tour. For Standard listings, you'll need to provide your own photos.",
  },
  {
    question: "Can I switch from Standard to Exclusive later?",
    answer: "Yes! You can upgrade to our Exclusive Partnership at any time. However, we recommend starting with Exclusive from the beginning for maximum impact. Fresh listings receive the most attention, and our initial marketing push is most effective when your property first hits the market.",
  },
  {
    question: "What happens after I submit my property?",
    answer: "Within 24 hours, our team will review your submission and contact you to discuss next steps. For Exclusive Partnership listings, we'll schedule a property visit for photography and valuation. Your property can be live on our website within 48-72 hours of approval.",
  },
  {
    question: "Do you handle the legal paperwork?",
    answer: "Yes, we provide comprehensive legal support for all listings. Our team guides you through the entire sales process, including due diligence, contract preparation, and closing. We work with trusted legal partners to ensure a smooth and secure transaction.",
  },
];

export default function ListPropertyFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Icon icon="ph:question" className="w-4 h-4" />
            <span className="text-sm font-medium">FAQ</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Everything you need to know about listing your property with us.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-slate-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}>
                  <Icon icon="ph:caret-down" className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </span>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-6">
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Still have questions? Our team is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/contactus"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition-colors shadow-lg shadow-primary/30"
            >
              <Icon icon="ph:chat-circle-text" className="w-5 h-5" />
              Contact Us
            </a>
            <a
              href="tel:+66986261646"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 hover:text-primary font-medium rounded-full transition-colors"
            >
              <Icon icon="ph:phone" className="w-5 h-5" />
              Call +66 98 626 1646
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}




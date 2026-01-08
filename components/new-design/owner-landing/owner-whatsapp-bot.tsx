"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { getOwnerLandingTranslations, type OwnerLandingLanguage } from "@/lib/i18n/owner-landing-translations";

interface OwnerWhatsAppBotProps {
  lang?: OwnerLandingLanguage;
}

export default function OwnerWhatsAppBot({ lang = "en" }: OwnerWhatsAppBotProps) {
  const t = getOwnerLandingTranslations(lang);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  
  const chatMessages = [
    { from: "user", text: "Toast 1", delay: 0 },
    { from: "bot", text: t.waChatWelcome, delay: 1 },
    { from: "user", text: t.waChatPhotos, delay: 3 },
    { from: "bot", text: t.waChatPerfect, delay: 4 },
    { from: "user", text: t.waChatLocation, delay: 6 },
    { from: "bot", text: t.waChatAnalyzing, delay: 7 },
    { from: "bot", text: t.waChatDone, delay: 9 },
  ];

  const features = [
    {
      icon: "ph:camera",
      title: t.waFeat1Title,
      description: t.waFeat1Desc,
    },
    {
      icon: "ph:map-pin",
      title: t.waFeat2Title,
      description: t.waFeat2Desc,
    },
    {
      icon: "ph:robot",
      title: t.waFeat3Title,
      description: t.waFeat3Desc,
    },
    {
      icon: "ph:text-aa",
      title: t.waFeat4Title,
      description: t.waFeat4Desc,
    },
  ];

  useEffect(() => {
    chatMessages.forEach((msg, index) => {
      setTimeout(() => {
        setVisibleMessages((prev) => [...prev, index]);
      }, msg.delay * 1000);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="py-20 lg:py-28 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Phone Mock */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="max-w-[380px] mx-auto">
              {/* Phone Frame */}
              <div className="relative bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20" />
                
                {/* Screen */}
                <div className="bg-[#0B141A] rounded-[2.5rem] overflow-hidden">
                  {/* WhatsApp Header */}
                  <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      PSM
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">PSM Property Bot</p>
                      <p className="text-[#8696A0] text-xs">online</p>
                    </div>
                    <Icon icon="ph:phone" className="w-5 h-5 text-[#8696A0]" />
                    <Icon icon="ph:dots-three-vertical" className="w-5 h-5 text-[#8696A0]" />
                  </div>
                  
                  {/* Chat Area */}
                  <div className="h-[450px] overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
                    <AnimatePresence>
                      {chatMessages.map((message, index) => (
                        visibleMessages.includes(index) && (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                                message.from === "user"
                                  ? "bg-[#005C4B] text-white rounded-br-none"
                                  : "bg-[#1F2C34] text-white rounded-bl-none"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-line">{message.text}</p>
                              <p className="text-[10px] text-white/50 text-right mt-1">
                                {message.from === "user" ? "✓✓" : ""} 10:3{index}
                              </p>
                            </div>
                          </motion.div>
                        )
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing indicator */}
                    {visibleMessages.length < chatMessages.length && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-[#1F2C34] rounded-lg px-4 py-3 rounded-bl-none">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="w-2 h-2 bg-[#8696A0] rounded-full"
                            />
                            <motion.div
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                              className="w-2 h-2 bg-[#8696A0] rounded-full"
                            />
                            <motion.div
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                              className="w-2 h-2 bg-[#8696A0] rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Input Area */}
                  <div className="bg-[#1F2C34] px-3 py-2 flex items-center gap-2">
                    <Icon icon="ph:smiley" className="w-6 h-6 text-[#8696A0]" />
                    <Icon icon="ph:paperclip" className="w-6 h-6 text-[#8696A0]" />
                    <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-2">
                      <p className="text-[#8696A0] text-sm">Type a message</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center">
                      <Icon icon="ph:microphone" className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
              <Icon icon="ph:whatsapp-logo" className="w-4 h-4" />
              <span className="text-sm font-medium">{t.waBadge}</span>
            </span>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              {t.waTitle1}{" "}
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                {t.waTitle2}
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {t.waDescription}
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon icon={feature.icon} className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">{feature.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Process Steps */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Icon icon="ph:list-numbers" className="w-5 h-5 text-green-500" />
                {t.waHowItWorks}
              </h4>
              <ol className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-slate-600 dark:text-slate-400">{t.waStep1}</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-slate-600 dark:text-slate-400">{t.waStep2}</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-slate-600 dark:text-slate-400">{t.waStep3}</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">4</span>
                  <span className="text-slate-600 dark:text-slate-400">{t.waStep4}</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Icon icon="ph:check" className="w-4 h-4" />
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">{t.waStep5}</span>
                </li>
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Home,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface SuccessStoriesProps {
  lang: "en" | "nl";
}

interface SuccessStory {
  id: number;
  name: string;
  location: string;
  propertyType: string;
  askingPrice: string;
  soldPrice: string;
  daysOnMarket: number;
  avgDaysWithout: number;
  image: string;
  quote: {
    en: string;
    nl: string;
  };
  package: "MARKETING_FEE" | "EXCLUSIVE_CONTRACT";
}

const successStories: SuccessStory[] = [
  {
    id: 1,
    name: "Thomas & Sarah V.",
    location: "Rawai",
    propertyType: "Pool Villa",
    askingPrice: "฿18,500,000",
    soldPrice: "฿17,900,000",
    daysOnMarket: 42,
    avgDaysWithout: 280,
    image: "/images/properties/villa-1.jpg",
    quote: {
      en: "We were skeptical at first, but PSM Phuket's marketing made all the difference. Sold in just 6 weeks!",
      nl: "We waren eerst sceptisch, maar PSM Phuket's marketing maakte het verschil. Verkocht in slechts 6 weken!",
    },
    package: "MARKETING_FEE",
  },
  {
    id: 2,
    name: "Michael B.",
    location: "Kamala",
    propertyType: "Sea View Condo",
    askingPrice: "฿12,000,000",
    soldPrice: "฿11,800,000",
    daysOnMarket: 28,
    avgDaysWithout: 320,
    image: "/images/properties/condo-1.jpg",
    quote: {
      en: "The exclusive contract was the best decision. Zero upfront cost and sold in under a month!",
      nl: "Het exclusiviteitscontract was de beste beslissing. Geen voorafkosten en verkocht in minder dan een maand!",
    },
    package: "EXCLUSIVE_CONTRACT",
  },
  {
    id: 3,
    name: "Hans & Ingrid K.",
    location: "Nai Harn",
    propertyType: "Luxury Villa",
    askingPrice: "฿32,000,000",
    soldPrice: "฿31,500,000",
    daysOnMarket: 67,
    avgDaysWithout: 420,
    image: "/images/properties/villa-2.jpg",
    quote: {
      en: "Professional photography, drone videos, and targeted ads brought serious buyers. Highly recommend!",
      nl: "Professionele fotografie, drone video's en gerichte advertenties brachten serieuze kopers. Sterk aanbevolen!",
    },
    package: "MARKETING_FEE",
  },
  {
    id: 4,
    name: "David & Emma L.",
    location: "Bang Tao",
    propertyType: "Beachfront Apartment",
    askingPrice: "฿8,500,000",
    soldPrice: "฿8,200,000",
    daysOnMarket: 35,
    avgDaysWithout: 250,
    image: "/images/properties/apartment-1.jpg",
    quote: {
      en: "The investor events were incredible. Met the buyer at one of their exclusive networking dinners!",
      nl: "De investeerders events waren ongelooflijk. Ontmoette de koper op een van hun exclusieve netwerk diners!",
    },
    package: "EXCLUSIVE_CONTRACT",
  },
];

export default function SuccessStories({ lang }: SuccessStoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % successStories.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentStory = successStories[currentIndex];
  const timeSaved = Math.round((currentStory.avgDaysWithout - currentStory.daysOnMarket) / 30);

  const t = {
    en: {
      title: "Owner Success Stories",
      subtitle: "Real results from property owners like you",
      soldIn: "Sold in",
      days: "days",
      avgWithout: "Average without marketing",
      timeSaved: "months saved",
      package: "Package Used",
      marketingBudget: "Marketing Budget",
      exclusiveContract: "Exclusive Contract",
      askingPrice: "Asking Price",
      soldPrice: "Sold Price",
      viewMore: "View More Stories",
    },
    nl: {
      title: "Succesverhalen van Eigenaren",
      subtitle: "Echte resultaten van woningeigenaren zoals u",
      soldIn: "Verkocht in",
      days: "dagen",
      avgWithout: "Gemiddeld zonder marketing",
      timeSaved: "maanden bespaard",
      package: "Gebruikt Pakket",
      marketingBudget: "Marketing Budget",
      exclusiveContract: "Exclusief Contract",
      askingPrice: "Vraagprijs",
      soldPrice: "Verkoopprijs",
      viewMore: "Bekijk Meer Verhalen",
    },
  }[lang];

  return (
    <Card className="overflow-hidden border-2">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-5 w-5 text-amber-500 fill-amber-500"
                />
              ))}
            </div>
            <div>
              <h3 className="font-bold text-lg">{t.title}</h3>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div 
          className="relative p-6"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Navigation Arrows */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/80 shadow-md"
              onClick={() => setCurrentIndex((prev) => 
                prev === 0 ? successStories.length - 1 : prev - 1
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/80 shadow-md"
              onClick={() => setCurrentIndex((prev) => 
                (prev + 1) % successStories.length
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="px-8"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Image & Stats */}
                <div className="relative">
                  <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    <Image
                      src={currentStory.image}
                      alt={`${currentStory.propertyType} in ${currentStory.location}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/placeholder-property.jpg";
                      }}
                    />
                    
                    {/* Sold Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t.soldIn} {currentStory.daysOnMarket} {t.days}
                      </Badge>
                    </div>
                    
                    {/* Property Info */}
                    <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                      <h4 className="font-bold text-xl">{currentStory.propertyType}</h4>
                      <p className="text-white/80">{currentStory.location}, Phuket</p>
                    </div>
                  </div>
                  
                  {/* Stats Below Image */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{currentStory.daysOnMarket}</div>
                      <div className="text-xs text-muted-foreground">{t.days}</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-500">{currentStory.avgDaysWithout}</div>
                      <div className="text-xs text-muted-foreground">{t.avgWithout}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{timeSaved}</div>
                      <div className="text-xs text-muted-foreground">{t.timeSaved}</div>
                    </div>
                  </div>
                </div>

                {/* Right: Quote & Details */}
                <div className="space-y-6">
                  {/* Quote */}
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 h-8 w-8 text-amber-300" />
                    <blockquote className="text-lg italic text-slate-700 dark:text-slate-300 pl-8 pr-4">
                      "{currentStory.quote[lang]}"
                    </blockquote>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {currentStory.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{currentStory.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {currentStory.location}
                      </div>
                    </div>
                  </div>

                  {/* Price Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground">{t.askingPrice}</div>
                      <div className="font-bold text-lg">{currentStory.askingPrice}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground">{t.soldPrice}</div>
                      <div className="font-bold text-lg text-green-600">{currentStory.soldPrice}</div>
                    </div>
                  </div>

                  {/* Package Used */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t.package}:</span>
                    <Badge 
                      variant="outline" 
                      className={currentStory.package === "MARKETING_FEE" 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      {currentStory.package === "MARKETING_FEE" ? t.marketingBudget : t.exclusiveContract}
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {successStories.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-8 h-2 bg-amber-500 rounded-full"
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

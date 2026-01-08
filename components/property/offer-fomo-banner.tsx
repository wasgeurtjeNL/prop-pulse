"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Users, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OfferFomoBannerProps {
  propertyId: string;
  hasActiveOffers: boolean;
  offerCount: number;
  onPlaceOffer?: () => void;
  className?: string;
}

export default function OfferFomoBanner({
  propertyId,
  hasActiveOffers,
  offerCount,
  onPlaceOffer,
  className = "",
}: OfferFomoBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Simulate other viewers (between 2-8)
    setViewerCount(Math.floor(Math.random() * 7) + 2);
    
    // Show banner after slight delay for effect
    const timer = setTimeout(() => setShowBanner(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!hasActiveOffers && viewerCount < 3) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl p-4 text-white ${className}`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 animate-pulse" />
                <span className="font-bold text-lg">Hoge Interesse!</span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm">
                {hasActiveOffers && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {offerCount} actieve bieding{offerCount !== 1 ? "en" : ""}
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{viewerCount} mensen bekijken nu</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Laatst gezien 3 min geleden</span>
                </div>
              </div>
            </div>

            {onPlaceOffer && (
              <Button
                onClick={onPlaceOffer}
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg"
              >
                Bied Nu
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import PropertyAlertForm from "./PropertyAlertForm";

interface PropertyAlertCTAProps {
  variant?: "banner" | "card" | "inline";
  propertyType?: "FOR_SALE" | "FOR_RENT";
  location?: string;
}

export default function PropertyAlertCTA({
  variant = "card",
  propertyType,
  location,
}: PropertyAlertCTAProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "banner") {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-2xl p-6 sm:p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon icon="ph:bell-ringing-fill" className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                Never Miss a New Property
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Get instant alerts when properties matching your criteria are listed
              </p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6"
              >
                <Icon icon="ph:plus" className="w-5 h-5 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <PropertyAlertForm
                defaultType={propertyType}
                defaultLocation={location}
                onSuccess={() => setTimeout(() => setIsOpen(false), 2000)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
            <Icon icon="ph:bell-ringing" className="w-5 h-5" />
            Get alerts for similar properties
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <PropertyAlertForm
            defaultType={propertyType}
            defaultLocation={location}
            onSuccess={() => setTimeout(() => setIsOpen(false), 2000)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Default: card variant
  return (
    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:bell-ringing" className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-dark dark:text-white">
            Can't find what you're looking for?
          </h4>
          <p className="text-dark/60 dark:text-white/60 text-sm mt-1">
            Create a property alert and we'll notify you when new listings match your preferences.
          </p>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4" size="sm">
                <Icon icon="ph:plus" className="w-4 h-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <PropertyAlertForm
                defaultType={propertyType}
                defaultLocation={location}
                onSuccess={() => setTimeout(() => setIsOpen(false), 2000)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}



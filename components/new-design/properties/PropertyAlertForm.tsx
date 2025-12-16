"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Phuket locations for dropdown
const PHUKET_LOCATIONS = [
  "Rawai",
  "Kata",
  "Karon",
  "Patong",
  "Kamala",
  "Surin",
  "Bang Tao",
  "Laguna",
  "Cherng Talay",
  "Nai Harn",
  "Chalong",
  "Phuket Town",
  "Mai Khao",
  "Nai Yang",
  "Thalang",
];

// Price ranges
const PRICE_RANGES = [
  { label: "Any Price", min: null, max: null },
  { label: "Under ฿3M", min: null, max: 3000000 },
  { label: "฿3M - ฿5M", min: 3000000, max: 5000000 },
  { label: "฿5M - ฿10M", min: 5000000, max: 10000000 },
  { label: "฿10M - ฿20M", min: 10000000, max: 20000000 },
  { label: "฿20M - ฿50M", min: 20000000, max: 50000000 },
  { label: "Over ฿50M", min: 50000000, max: null },
];

const RENTAL_PRICE_RANGES = [
  { label: "Any Price", min: null, max: null },
  { label: "Under ฿20K/mo", min: null, max: 20000 },
  { label: "฿20K - ฿40K/mo", min: 20000, max: 40000 },
  { label: "฿40K - ฿80K/mo", min: 40000, max: 80000 },
  { label: "฿80K - ฿150K/mo", min: 80000, max: 150000 },
  { label: "Over ฿150K/mo", min: 150000, max: null },
];

interface PropertyAlertFormProps {
  defaultType?: "FOR_SALE" | "FOR_RENT";
  defaultLocation?: string;
  defaultBeds?: number;
  onSuccess?: () => void;
  compact?: boolean;
  // Dialog mode props
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PropertyAlertForm({
  defaultType,
  defaultLocation,
  defaultBeds,
  onSuccess,
  compact = false,
  isOpen,
  onClose,
}: PropertyAlertFormProps) {
  const isDialogMode = isOpen !== undefined && onClose !== undefined;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState<string>(defaultType || "");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    defaultLocation ? [defaultLocation] : []
  );
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);
  const [minBeds, setMinBeds] = useState<number | null>(defaultBeds || null);
  const [minBaths, setMinBaths] = useState<number | null>(null);
  const [notifyImmediately, setNotifyImmediately] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceRanges = propertyType === "FOR_RENT" ? RENTAL_PRICE_RANGES : PRICE_RANGES;

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const selectedRange = priceRanges[priceRangeIndex];

      const response = await fetch("/api/property-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          propertyType: propertyType || null,
          locations: selectedLocations.length > 0 ? selectedLocations : undefined,
          minPrice: selectedRange?.min,
          maxPrice: selectedRange?.max,
          minBeds: minBeds,
          minBaths: minBaths,
          notifyImmediately,
          notifyDigest,
          source: "property-alert-form",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create alert");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen && isDialogMode) {
      // Small delay to let the dialog animation finish
      setTimeout(() => {
        setSuccess(false);
      }, 300);
    }
  }, [isOpen, isDialogMode]);

  const successContent = (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon icon="ph:check-circle-fill" className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-dark dark:text-white mb-2">
        Alert Created Successfully!
      </h3>
      <p className="text-dark/60 dark:text-white/60 mb-4">
        We&apos;ll notify you at <strong>{email}</strong> when new properties match your criteria.
      </p>
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            setSuccess(false);
            setEmail("");
            setName("");
            setSelectedLocations([]);
            setPriceRangeIndex(0);
            setMinBeds(null);
            setMinBaths(null);
          }}
        >
          Create Another Alert
        </Button>
        {isDialogMode && onClose && (
          <Button onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </div>
  );

  if (success && !isDialogMode) {
    return successContent;
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header - only show when not in dialog mode and not compact */}
      {!compact && !isDialogMode && (
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon icon="ph:bell-ringing" className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-dark dark:text-white">
            Get Property Alerts
          </h3>
          <p className="text-dark/60 dark:text-white/60 text-sm mt-1">
            Be the first to know when new properties match your criteria
          </p>
        </div>
      )}

      {/* Email & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Your Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* Property Type */}
      <div>
        <Label className="text-sm font-medium">Property Type</Label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="FOR_SALE">For Sale</SelectItem>
            <SelectItem value="FOR_RENT">For Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Locations */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Preferred Locations
        </Label>
        <div className="flex flex-wrap gap-2">
          {PHUKET_LOCATIONS.map((location) => (
            <button
              key={location}
              type="button"
              onClick={() => toggleLocation(location)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${
                  selectedLocations.includes(location)
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-dark/70 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-gray-700"
                }
              `}
            >
              {location}
            </button>
          ))}
        </div>
        {selectedLocations.length === 0 && (
          <p className="text-xs text-dark/50 dark:text-white/50 mt-1.5">
            Leave empty to receive alerts for all locations
          </p>
        )}
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium">Price Range</Label>
        <Select
          value={priceRangeIndex.toString()}
          onValueChange={(v) => setPriceRangeIndex(parseInt(v))}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((range, index) => (
              <SelectItem key={index} value={index.toString()}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Min Bedrooms</Label>
          <Select
            value={minBeds?.toString() || ""}
            onValueChange={(v) => setMinBeds(v ? parseInt(v) : null)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Min Bathrooms</Label>
          <Select
            value={minBaths?.toString() || ""}
            onValueChange={(v) => setMinBaths(v ? parseInt(v) : null)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <Label className="text-sm font-medium block">Notification Preferences</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="notifyImmediately"
            checked={notifyImmediately}
            onCheckedChange={(checked) => setNotifyImmediately(!!checked)}
          />
          <label htmlFor="notifyImmediately" className="text-sm cursor-pointer">
            Notify me immediately when a new property matches
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="notifyDigest"
            checked={notifyDigest}
            onCheckedChange={(checked) => setNotifyDigest(!!checked)}
          />
          <label htmlFor="notifyDigest" className="text-sm cursor-pointer">
            Send me a weekly digest of matching properties
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !email}
        className="w-full py-3 text-base font-semibold"
      >
        {loading ? (
          <>
            <Icon icon="ph:spinner" className="w-5 h-5 mr-2 animate-spin" />
            Creating Alert...
          </>
        ) : (
          <>
            <Icon icon="ph:bell-ringing" className="w-5 h-5 mr-2" />
            Create Property Alert
          </>
        )}
      </Button>

      {/* Privacy Note */}
      <p className="text-xs text-center text-dark/50 dark:text-white/50">
        You can unsubscribe at any time. We respect your privacy.
      </p>
    </form>
  );

  // If in dialog mode, wrap the content in a Dialog
  if (isDialogMode) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon icon="ph:bell-ringing" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Get Property Alerts</DialogTitle>
                <DialogDescription>
                  Be the first to know when new properties match your criteria
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {success ? successContent : formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Non-dialog mode: return the form directly
  return success ? successContent : formContent;
}


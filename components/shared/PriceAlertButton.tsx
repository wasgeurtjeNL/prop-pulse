"use client";

import { useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { 
  trackPriceAlertSubscription, 
  trackPriceAlertUnsubscribe 
} from "@/lib/klaviyo-tracking";

interface PriceAlertButtonProps {
  propertyId: string;
  propertyTitle: string;
  currentPrice: number;
  location?: string;
  listingNumber?: string;
  variant?: "button" | "icon" | "minimal";
  className?: string;
}

export function PriceAlertButton({
  propertyId,
  propertyTitle,
  currentPrice,
  location,
  listingNumber,
  variant = "button",
  className = "",
}: PriceAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/property-price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          propertyId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Track in Klaviyo
        trackPriceAlertSubscription({
          email: email.toLowerCase().trim(),
          property: {
            id: propertyId,
            name: propertyTitle,
            price: currentPrice,
            location,
            listingNumber,
          },
        });

        toast.success(data.message);
        setIsSubscribed(true);
        setSubscribedEmail(email.toLowerCase().trim());
        setIsOpen(false);
        setEmail("");
      } else {
        toast.error(data.message || "Failed to subscribe");
      }
    } catch (error) {
      console.error("Price alert subscription error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [email, propertyId, propertyTitle, currentPrice, location, listingNumber]);

  const handleUnsubscribe = useCallback(async () => {
    if (!subscribedEmail) return;
    
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/property-price-alerts?email=${encodeURIComponent(subscribedEmail)}&propertyId=${propertyId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        trackPriceAlertUnsubscribe({
          email: subscribedEmail,
          propertyId,
          propertyName: propertyTitle,
        });

        toast.success("Unsubscribed from price alerts");
        setIsSubscribed(false);
        setSubscribedEmail(null);
      } else {
        toast.error(data.message || "Failed to unsubscribe");
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [subscribedEmail, propertyId, propertyTitle]);

  // Format price for display
  const formattedPrice = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(currentPrice);

  // Render based on variant
  if (variant === "icon") {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => isSubscribed ? handleUnsubscribe() : setIsOpen(!isOpen)}
          className={`p-3 rounded-full transition-all duration-300 ${
            isSubscribed 
              ? "bg-primary text-white" 
              : "bg-gray-100 hover:bg-primary hover:text-white text-gray-600"
          }`}
          disabled={isLoading}
          title={isSubscribed ? "Unsubscribe from price alerts" : "Get price drop alerts"}
        >
          <Icon 
            icon={isSubscribed ? "solar:bell-ring-bold" : "solar:bell-linear"} 
            width={20} 
            height={20}
          />
        </button>
        
        {isOpen && !isSubscribed && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border p-4 z-50">
            <PriceAlertForm
              email={email}
              setEmail={setEmail}
              isLoading={isLoading}
              onSubmit={handleSubscribe}
              onClose={() => setIsOpen(false)}
              propertyTitle={propertyTitle}
              formattedPrice={formattedPrice}
            />
          </div>
        )}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={className}>
        {isSubscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
          >
            <Icon icon="solar:bell-ring-bold" width={16} height={16} />
            <span>{isLoading ? "..." : "Watching for price drops"}</span>
          </button>
        ) : isOpen ? (
          <div className="mt-2">
            <PriceAlertForm
              email={email}
              setEmail={setEmail}
              isLoading={isLoading}
              onSubmit={handleSubscribe}
              onClose={() => setIsOpen(false)}
              propertyTitle={propertyTitle}
              formattedPrice={formattedPrice}
              compact
            />
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm"
          >
            <Icon icon="solar:bell-linear" width={16} height={16} />
            <span>Get price alerts</span>
          </button>
        )}
      </div>
    );
  }

  // Default button variant
  return (
    <div className={className}>
      {isSubscribed ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Icon icon="solar:bell-ring-bold" width={20} height={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">Price alerts active</p>
                <p className="text-sm text-green-600">We'll notify you when the price drops</p>
              </div>
            </div>
            <button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="text-sm text-green-600 hover:text-green-800 underline"
            >
              {isLoading ? "..." : "Unsubscribe"}
            </button>
          </div>
        </div>
      ) : isOpen ? (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <PriceAlertForm
            email={email}
            setEmail={setEmail}
            isLoading={isLoading}
            onSubmit={handleSubscribe}
            onClose={() => setIsOpen(false)}
            propertyTitle={propertyTitle}
            formattedPrice={formattedPrice}
          />
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Icon icon="solar:bell-bing-bold" width={24} height={24} />
          <span>Get Price Drop Alerts</span>
        </button>
      )}
    </div>
  );
}

// Sub-component for the subscription form
function PriceAlertForm({
  email,
  setEmail,
  isLoading,
  onSubmit,
  onClose,
  propertyTitle,
  formattedPrice,
  compact = false,
}: {
  email: string;
  setEmail: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  propertyTitle: string;
  formattedPrice: string;
  compact?: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon icon="solar:bell-linear" width={20} height={20} className="text-amber-500" />
          <h4 className="font-semibold text-gray-800">Price Alert</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <Icon icon="mdi:close" width={20} height={20} />
        </button>
      </div>
      
      {!compact && (
        <p className="text-sm text-gray-600 mb-3">
          Get notified when the price drops for{" "}
          <span className="font-medium">{propertyTitle}</span>
        </p>
      )}
      
      <div className="text-xs text-gray-500 mb-3">
        Current price: <span className="font-semibold text-gray-700">{formattedPrice}</span>
      </div>
      
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
          disabled={isLoading}
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Icon icon="mdi:loading" width={20} height={20} className="animate-spin" />
          ) : (
            "Notify Me"
          )}
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mt-2">
        We'll only email you about price changes for this property.
      </p>
    </form>
  );
}

export default PriceAlertButton;

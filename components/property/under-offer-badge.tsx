"use client";

import { Badge } from "@/components/ui/badge";
import { Flame, Gavel } from "lucide-react";

interface UnderOfferBadgeProps {
  offerCount?: number;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export default function UnderOfferBadge({ 
  offerCount = 1, 
  className = "",
  size = "default",
}: UnderOfferBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2",
    default: "text-sm py-1 px-3",
    lg: "text-base py-1.5 px-4",
  };

  return (
    <Badge 
      variant="destructive" 
      className={`
        bg-gradient-to-r from-orange-500 to-red-600 
        text-white font-semibold 
        animate-pulse 
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <Flame className={`mr-1 ${size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"}`} />
      {offerCount > 1 ? (
        <>ONDER BOD ({offerCount} biedingen)</>
      ) : (
        <>ONDER BOD</>
      )}
    </Badge>
  );
}

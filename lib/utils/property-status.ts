/**
 * Property Status Configuration
 * 
 * Centralized configuration for property status handling across the application.
 * This ensures consistent behavior for ACTIVE, INACTIVE, SOLD, and RENTED properties.
 */

import { Status } from "@prisma/client";

export interface StatusConfig {
  label: string;
  labelNL: string; // Dutch label for Dutch-speaking agents
  color: string; // Tailwind background color class
  textColor: string; // Tailwind text color class
  badgeClass: string; // Full badge styling
  overlayClass: string; // Overlay for property cards/images
  showOnWebsite: boolean; // Should this status be visible on public website
  allowBooking: boolean; // Can users book/contact for this property
  indexByGoogle: boolean; // Should Google index this page
  icon: string; // Iconify icon name
}

export const PropertyStatusConfig: Record<Status, StatusConfig> = {
  ACTIVE: {
    label: "Active",
    labelNL: "Actief",
    color: "bg-green-500",
    textColor: "text-green-700 dark:text-green-400",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    overlayClass: "",
    showOnWebsite: true,
    allowBooking: true,
    indexByGoogle: true,
    icon: "ph:check-circle-fill",
  },
  INACTIVE: {
    label: "Inactive",
    labelNL: "Inactief",
    color: "bg-gray-500",
    textColor: "text-gray-700 dark:text-gray-400",
    badgeClass: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    overlayClass: "",
    showOnWebsite: false,
    allowBooking: false,
    indexByGoogle: false,
    icon: "ph:pause-circle-fill",
  },
  SOLD: {
    label: "Sold",
    labelNL: "Verkocht",
    color: "bg-blue-600",
    textColor: "text-blue-700 dark:text-blue-400",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    overlayClass: "bg-blue-600/90",
    showOnWebsite: true, // Show with overlay
    allowBooking: false,
    indexByGoogle: true, // Keep indexed for SEO value
    icon: "ph:seal-check-fill",
  },
  RENTED: {
    label: "Rented",
    labelNL: "Verhuurd",
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    overlayClass: "bg-amber-500/90",
    showOnWebsite: true, // Show with overlay
    allowBooking: false,
    indexByGoogle: true, // Keep indexed for SEO value
    icon: "ph:key-fill",
  },
};

/**
 * Get status configuration for a given status
 */
export function getStatusConfig(status: Status | string): StatusConfig {
  return PropertyStatusConfig[status as Status] || PropertyStatusConfig.ACTIVE;
}

/**
 * Check if a property is available for booking/contact
 */
export function isPropertyAvailable(status: Status | string): boolean {
  return getStatusConfig(status).allowBooking;
}

/**
 * Check if a property should be shown on the website
 */
export function isPropertyVisibleOnWebsite(status: Status | string): boolean {
  return getStatusConfig(status).showOnWebsite;
}

/**
 * Check if a property is sold or rented (unavailable but visible)
 */
export function isPropertySoldOrRented(status: Status | string): boolean {
  return status === "SOLD" || status === "RENTED";
}

/**
 * Get the appropriate badge variant for shadcn/ui Badge component
 */
export function getStatusBadgeVariant(status: Status | string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "SOLD":
    case "RENTED":
      return "outline";
    case "INACTIVE":
    default:
      return "secondary";
  }
}

/**
 * Get status options for select dropdowns (dashboard filters)
 */
export function getStatusOptions(includeAll: boolean = true): { value: string; label: string }[] {
  const options = Object.entries(PropertyStatusConfig).map(([value, config]) => ({
    value,
    label: config.label,
  }));
  
  if (includeAll) {
    return [{ value: "all", label: "All Status" }, ...options];
  }
  
  return options;
}

/**
 * Get statuses that should be shown on the public website
 */
export function getWebsiteVisibleStatuses(): Status[] {
  return Object.entries(PropertyStatusConfig)
    .filter(([_, config]) => config.showOnWebsite)
    .map(([status]) => status as Status);
}

/**
 * Get statuses that should be indexed by Google
 */
export function getIndexableStatuses(): Status[] {
  return Object.entries(PropertyStatusConfig)
    .filter(([_, config]) => config.indexByGoogle)
    .map(([status]) => status as Status);
}

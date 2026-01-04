"use server";

import prisma from "@/lib/prisma";
import type { Property, PropertyType, PropertyCategory } from "@prisma/client";

interface PropertyData {
  id: string;
  title: string;
  slug: string;
  type: PropertyType;
  category: PropertyCategory;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
}

/**
 * Parse price string to number (THB)
 * Examples: "฿5,000,000" -> 5000000, "฿25,000/mo" -> 25000
 */
function parsePriceToNumber(priceStr: string): number {
  // Remove currency symbols, commas, and rental suffix
  const cleaned = priceStr
    .replace(/[฿$€£]/g, "")
    .replace(/,/g, "")
    .replace(/\/mo$/i, "")
    .replace(/\/month$/i, "")
    .trim();
  
  return parseInt(cleaned) || 0;
}

/**
 * Check if a location matches any of the alert's locations
 */
function locationMatches(propertyLocation: string, alertLocations: string[]): boolean {
  if (!alertLocations || alertLocations.length === 0) return true;
  
  const locationLower = propertyLocation.toLowerCase();
  return alertLocations.some((loc) => locationLower.includes(loc.toLowerCase()));
}

/**
 * Find all active alerts that match a new property
 */
export async function findMatchingAlerts(property: PropertyData) {
  try {
    // Get all active and verified alerts
    const alerts = await prisma.propertyAlert.findMany({
      where: {
        isActive: true,
        isVerified: true,
      },
    });

    const priceNumber = parsePriceToNumber(property.price);
    const matchingAlerts: typeof alerts = [];

    for (const alert of alerts) {
      let matches = true;

      // Type filter
      if (alert.propertyType && alert.propertyType !== property.type) {
        matches = false;
      }

      // Category filter
      if (matches && alert.category && alert.category !== property.category) {
        matches = false;
      }

      // Location filter
      if (matches && alert.locations) {
        const locations = JSON.parse(alert.locations) as string[];
        if (!locationMatches(property.location, locations)) {
          matches = false;
        }
      }

      // Price filter
      if (matches && alert.minPrice && priceNumber < alert.minPrice) {
        matches = false;
      }
      if (matches && alert.maxPrice && priceNumber > alert.maxPrice) {
        matches = false;
      }

      // Beds filter
      if (matches && alert.minBeds && property.beds < alert.minBeds) {
        matches = false;
      }
      if (matches && alert.maxBeds && property.beds > alert.maxBeds) {
        matches = false;
      }

      // Baths filter
      if (matches && alert.minBaths && property.baths < alert.minBaths) {
        matches = false;
      }
      if (matches && alert.maxBaths && property.baths > alert.maxBaths) {
        matches = false;
      }

      // Size filter
      if (matches && alert.minSqft && property.sqft < alert.minSqft) {
        matches = false;
      }
      if (matches && alert.maxSqft && property.sqft > alert.maxSqft) {
        matches = false;
      }

      if (matches) {
        matchingAlerts.push(alert);
      }
    }

    return matchingAlerts;
  } catch (error) {
    console.error("Error finding matching alerts:", error);
    return [];
  }
}

/**
 * Send notifications to matching alerts for a new property
 */
export async function notifyMatchingAlerts(property: PropertyData) {
  try {
    const matchingAlerts = await findMatchingAlerts(property);

    if (matchingAlerts.length === 0) {
      console.log(`No matching alerts for property: ${property.title}`);
      return { notified: 0 };
    }

    console.log(`Found ${matchingAlerts.length} matching alerts for: ${property.title}`);

    const notifiedAlerts: string[] = [];

    for (const alert of matchingAlerts) {
      // Only send immediately if they have that preference
      if (!alert.notifyImmediately) {
        continue;
      }

      // Create notification record
      await prisma.propertyAlertNotification.create({
        data: {
          alertId: alert.id,
          propertyIds: JSON.stringify([property.id]),
          propertyCount: 1,
          emailSent: false, // Will be true after email is sent
        },
      });

      // Update alert stats
      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: {
          matchCount: { increment: 1 },
          notificationCount: { increment: 1 },
          lastNotifiedAt: new Date(),
        },
      });

      // TODO: Actually send email here
      // For now, just log it
      console.log(`📧 Would send email to ${alert.email} for property: ${property.title}`);

      notifiedAlerts.push(alert.id);
    }

    return {
      notified: notifiedAlerts.length,
      alerts: notifiedAlerts,
    };
  } catch (error) {
    console.error("Error notifying alerts:", error);
    return { notified: 0, error: String(error) };
  }
}

/**
 * Get alert statistics for a user
 */
export async function getAlertStats(userId?: string, email?: string) {
  try {
    const whereClause: any = { isActive: true };

    if (userId) {
      whereClause.userId = userId;
    } else if (email) {
      whereClause.email = email;
    } else {
      return null;
    }

    const alerts = await prisma.propertyAlert.findMany({
      where: whereClause,
      select: {
        id: true,
        matchCount: true,
        notificationCount: true,
        lastNotifiedAt: true,
      },
    });

    return {
      totalAlerts: alerts.length,
      totalMatches: alerts.reduce((sum, a) => sum + a.matchCount, 0),
      totalNotifications: alerts.reduce((sum, a) => sum + a.notificationCount, 0),
    };
  } catch (error) {
    console.error("Error getting alert stats:", error);
    return null;
  }
}

/**
 * Get popular locations for property alerts
 */
export async function getPopularAlertLocations() {
  try {
    const alerts = await prisma.propertyAlert.findMany({
      where: { isActive: true },
      select: { locations: true },
    });

    const locationCounts: Record<string, number> = {};

    for (const alert of alerts) {
      if (alert.locations) {
        const locations = JSON.parse(alert.locations) as string[];
        for (const loc of locations) {
          locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        }
      }
    }

    // Sort by count and return top 10
    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  } catch (error) {
    console.error("Error getting popular locations:", error);
    return [];
  }
}





import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PropertyType } from "./generated/prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format property type enum to readable string
 */
export function formatType(type: PropertyType): string {
  switch (type) {
    case "FOR_SALE":
      return "For Sale"
    case "FOR_RENT":
      return "For Rent"
    default:
      return type
  }
}

/**
 * Get user initials from name
 */
export function getUserInitials(name?: string | null): string {
  if (!name) return "U"
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
}

/**
 * Calculate estimated reading time for content
 * @param content - HTML or plain text content
 * @param wordsPerMinute - Average reading speed (default: 200 wpm)
 * @returns Reading time in minutes
 */
export function calculateReadTime(content: string, wordsPerMinute: number = 200): number {
  // Strip HTML tags to get plain text
  const plainText = content.replace(/<[^>]*>/g, ' ')
  
  // Count words (split by whitespace)
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0)
  const wordCount = words.length
  
  // Calculate minutes, minimum 1 minute
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return Math.max(1, minutes)
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @returns Formatted string like "5 min read"
 */
export function formatReadTime(minutes: number): string {
  return `${minutes} min read`
}

/**
 * Format price string to ensure proper currency symbol display
 * Fixes encoding issues with Thai Baht (฿) and other currency symbols
 * @param price - Price string from database (may have corrupted characters)
 * @returns Clean formatted price string
 */
export function formatPrice(price: string | null | undefined): string {
  if (!price) return '';
  
  // Clean up the price string
  let cleanPrice = price.toString();
  
  // Fix common encoding issues - remove all broken characters
  cleanPrice = cleanPrice
    .replace(/Ó©┐/g, '')           // Corrupted Thai Baht
    .replace(/\?+/g, '')            // Question marks from encoding issues
    .replace(/฿+/g, '')             // Thai Baht symbols (we'll add THB prefix)
    .replace(/[\u{0E3F}]/gu, '')    // Thai Baht unicode
    .replace(/^[\s$€£¥]+/g, '')     // Remove leading currency symbols and spaces
    .trim();
  
  // Extract the numeric part
  const numericMatch = cleanPrice.match(/[\d,]+(\.\d+)?/);
  if (!numericMatch) return cleanPrice;
  
  const numericPart = numericMatch[0];
  
  // Check if it's a rental price (contains /mo, /month, Monthly, etc.)
  const isMonthly = /\/mo|monthly|per month|\/month/i.test(cleanPrice);
  const suffix = isMonthly ? '/mo' : '';
  
  // Check original price for currency type
  const originalPrice = price.toString().toLowerCase();
  
  if (originalPrice.includes('$') || originalPrice.includes('usd')) {
    return `$${numericPart}${suffix}`;
  }
  if (originalPrice.includes('€') || originalPrice.includes('eur')) {
    return `€${numericPart}${suffix}`;
  }
  
  // Default to THB (text-based, more compatible than ฿ symbol)
  return `THB ${numericPart}${suffix}`;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PropertyType } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize text by replacing problematic Unicode characters with safe ASCII alternatives.
 * This prevents encoding issues with em-dashes, special quotes, accented characters, etc.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    // Replace various dashes with standard hyphen
    .replace(/[\u2013\u2014\u2015]/g, '-')  // en-dash, em-dash, horizontal bar
    .replace(/\u2212/g, '-')                 // minus sign
    // Replace fancy quotes with standard quotes
    .replace(/[\u2018\u2019\u201A]/g, "'")   // single quotes
    .replace(/[\u201C\u201D\u201E]/g, '"')   // double quotes
    // Replace accented characters with ASCII equivalents
    .replace(/[àáâãäå]/gi, (match) => match.toLowerCase() === match ? 'a' : 'A')
    .replace(/[èéêë]/gi, (match) => match.toLowerCase() === match ? 'e' : 'E')
    .replace(/[ìíîï]/gi, (match) => match.toLowerCase() === match ? 'i' : 'I')
    .replace(/[òóôõö]/gi, (match) => match.toLowerCase() === match ? 'o' : 'O')
    .replace(/[ùúûü]/gi, (match) => match.toLowerCase() === match ? 'u' : 'U')
    .replace(/[ñ]/gi, (match) => match.toLowerCase() === match ? 'n' : 'N')
    .replace(/[ç]/gi, (match) => match.toLowerCase() === match ? 'c' : 'C')
    .replace(/[ÿ]/gi, 'y')
    .replace(/[æ]/gi, 'ae')
    .replace(/[œ]/gi, 'oe')
    // Replace ellipsis
    .replace(/\u2026/g, '...')
    // Replace other problematic characters
    .replace(/[\u00A0]/g, ' ')               // non-breaking space
    .replace(/[\u200B-\u200D\uFEFF]/g, '')   // zero-width characters
    // Remove any remaining characters that might cause issues (question mark sequences)
    .replace(/\?{2,}/g, '')                  // Remove sequences of 2+ question marks
    .trim();
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

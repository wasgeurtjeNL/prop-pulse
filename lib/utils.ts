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

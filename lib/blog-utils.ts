/**
 * Blog Utility Functions
 * 
 * Pure utility functions for blog content processing.
 * These are shared between server and client components.
 * 
 * NOTE: Do NOT add "use client" here - these must remain server-compatible.
 */

export interface TocItem {
  id: string;
  title: string;
  level: number; // 2 for H2, 3 for H3
}

export interface Section {
  heading: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  position: "left" | "right";
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface BlogStructuredContent {
  intro: string;
  sections: Section[];
  faq?: FAQ[];
}

/**
 * Generates a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .trim();
}

/**
 * Extract Table of Contents items from structured content
 * This can be used by parent components to render a ToC
 */
export function extractTocItems(content: BlogStructuredContent | string): TocItem[] {
  const items: TocItem[] = [];
  
  // Try to parse if string
  let parsedContent: BlogStructuredContent | null = null;
  if (typeof content === "string") {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return items; // Legacy HTML content, no structured ToC
    }
  } else {
    parsedContent = content;
  }
  
  if (!parsedContent?.sections) return items;
  
  // Add section headings as ToC items
  parsedContent.sections.forEach((section) => {
    if (section.heading) {
      items.push({
        id: `section-${generateSlug(section.heading)}`,
        title: section.heading,
        level: 2,
      });
    }
  });
  
  // Add FAQ section if present
  if (parsedContent.faq && parsedContent.faq.length > 0) {
    items.push({
      id: "faq",
      title: "Frequently Asked Questions",
      level: 2,
    });
  }
  
  return items;
}

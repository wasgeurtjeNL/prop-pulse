"use client";

import Image from "next/image";
import HTMLContent from "@/components/ui/html-content";
import { cn } from "@/lib/utils";

interface Section {
  heading: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  position: "left" | "right";
}

interface LandingPageContent {
  intro: string;
  sections: Section[];
}

interface LandingPageSectionsProps {
  content: LandingPageContent | string;
  className?: string;
}

/**
 * Renders landing page content with alternating image/text layout
 * 
 * Supports both:
 * - New structured format (JSON with intro + sections)
 * - Legacy HTML format (for backwards compatibility)
 */
export function LandingPageSections({ content, className }: LandingPageSectionsProps) {
  // Handle legacy HTML content
  if (typeof content === "string") {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return <StructuredContent content={parsed} className={className} />;
      }
    } catch {
      // Not JSON, render as HTML
      return (
        <section className={cn("blog-details markdown", className)}>
          <HTMLContent content={content} />
        </section>
      );
    }
    // Fallback to HTML rendering
    return (
      <section className={cn("blog-details markdown", className)}>
        <HTMLContent content={content} />
      </section>
    );
  }

  return <StructuredContent content={content} className={className} />;
}

function StructuredContent({ content, className }: { content: LandingPageContent; className?: string }) {
  return (
    <div className={cn("space-y-16", className)}>
      {/* Intro Section */}
      {content.intro && (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <HTMLContent content={content.intro} />
        </div>
      )}

      {/* Alternating Sections */}
      {content.sections.map((section, index) => (
        <SectionBlock key={index} section={section} index={index} />
      ))}
    </div>
  );
}

function SectionBlock({ section, index }: { section: Section; index: number }) {
  const isImageLeft = section.position === "left";
  const hasImage = section.imageUrl && section.imageUrl.length > 0;

  return (
    <section
      className={cn(
        "grid gap-8 items-center",
        hasImage ? "lg:grid-cols-2" : "lg:grid-cols-1"
      )}
    >
      {/* Image - Left Position */}
      {hasImage && isImageLeft && (
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg order-1 lg:order-1">
          <Image
            src={section.imageUrl!}
            alt={section.imageAlt || section.heading}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading={index === 0 ? "eager" : "lazy"}
          />
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "space-y-4",
          hasImage && isImageLeft && "order-2 lg:order-2",
          hasImage && !isImageLeft && "order-2 lg:order-1"
        )}
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-dark dark:text-white">
          {section.heading}
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline">
          <HTMLContent content={section.content} />
        </div>
      </div>

      {/* Image - Right Position */}
      {hasImage && !isImageLeft && (
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg order-1 lg:order-2">
          <Image
            src={section.imageUrl!}
            alt={section.imageAlt || section.heading}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
          />
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>
      )}
    </section>
  );
}

export default LandingPageSections;


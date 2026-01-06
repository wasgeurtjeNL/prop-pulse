"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateSlug, BlogStructuredContent, Section } from "@/lib/blog-utils";
import { FAQAccordion, ProTip } from "./BlogEnhancements";
import { Icon } from "@iconify/react";

// Re-export for backwards compatibility
export { extractTocItems } from "@/lib/blog-utils";

interface BlogSectionsProps {
  content: BlogStructuredContent | string;
  className?: string;
  showFaq?: boolean;
}

/**
 * Strip HTML tags from a string (server-safe)
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Parse content and extract Pro Tips for special styling
 * Works on both server and client
 */
function parseContentWithProTips(htmlContent: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  
  // Match patterns like:
  // <p><strong>Pro Tip:</strong> text</p>
  // <p>Pro Tip: text</p>  
  // <div><strong>Pro Tip:</strong> text</div>
  const proTipRegex = /<(?:p|div)[^>]*>(?:\s*)?(?:<strong>)?Pro Tip:?(?:<\/strong>)?(?:\s*)?([\s\S]*?)<\/(?:p|div)>/gi;
  
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  
  // Reset regex lastIndex
  proTipRegex.lastIndex = 0;
  
  while ((match = proTipRegex.exec(htmlContent)) !== null) {
    // Add content before the Pro Tip
    if (match.index > lastIndex) {
      const beforeContent = htmlContent.slice(lastIndex, match.index);
      if (beforeContent.trim()) {
        elements.push(
          <div 
            key={`content-${keyIndex++}`}
            className="prose prose-lg dark:prose-invert max-w-none blog-prose"
            dangerouslySetInnerHTML={{ __html: beforeContent }}
          />
        );
      }
    }
    
    // Extract Pro Tip text (strip HTML tags for clean text)
    const tipText = stripHtmlTags(match[1]);
    
    if (tipText) {
      // Add styled Pro Tip
      elements.push(
        <ProTip key={`tip-${keyIndex++}`} variant="tip">
          {tipText}
        </ProTip>
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining content
  if (lastIndex < htmlContent.length) {
    const remainingContent = htmlContent.slice(lastIndex);
    if (remainingContent.trim()) {
      elements.push(
        <div 
          key={`content-${keyIndex++}`}
          className="prose prose-lg dark:prose-invert max-w-none blog-prose"
          dangerouslySetInnerHTML={{ __html: remainingContent }}
        />
      );
    }
  }
  
  // If no Pro Tips were found, return the original content
  if (elements.length === 0) {
    return [
      <div 
        key="full-content"
        className="prose prose-lg dark:prose-invert max-w-none blog-prose"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    ];
  }
  
  return elements;
}

/**
 * Renders blog content with alternating image/text layout
 * 
 * Supports both:
 * - New structured format (JSON with intro + sections + faq)
 * - Legacy HTML format (for backwards compatibility)
 */
export function BlogSections({ content, className, showFaq = true }: BlogSectionsProps) {
  // Handle legacy HTML content
  if (typeof content === "string") {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return <StructuredBlogContent content={parsed} className={className} showFaq={showFaq} />;
      }
    } catch {
      // Not JSON, render as HTML (legacy content)
      return (
        <div className={cn("blog-details markdown", className)}>
          {parseContentWithProTips(content)}
        </div>
      );
    }
    // Fallback to HTML rendering
    return (
      <div className={cn("blog-details markdown", className)}>
        {parseContentWithProTips(content)}
      </div>
    );
  }

  return <StructuredBlogContent content={content} className={className} showFaq={showFaq} />;
}

function StructuredBlogContent({ 
  content, 
  className, 
  showFaq 
}: { 
  content: BlogStructuredContent; 
  className?: string;
  showFaq: boolean;
}) {
  return (
    <article className={cn("space-y-4 md:space-y-6", className)}>
      {/* Intro Section - Featured Snippet Optimized */}
      {content.intro && (
        <div className="prose prose-lg dark:prose-invert max-w-none blog-prose">
          {parseContentWithProTips(content.intro)}
        </div>
      )}

      {/* Sections with varying layouts */}
      {content.sections.map((section, index) => (
        <BlogSectionBlock 
          key={index} 
          section={section} 
          index={index} 
          totalSections={content.sections.length}
          isLast={index === content.sections.length - 1}
        />
      ))}

      {/* FAQ Section - Accordion Style with Schema.org */}
      {showFaq && content.faq && content.faq.length > 0 && (
        <FAQAccordion items={content.faq} />
      )}
    </article>
  );
}

function BlogSectionBlock({ 
  section, 
  index, 
  totalSections,
  isLast = false 
}: { 
  section: Section; 
  index: number;
  totalSections: number;
  isLast?: boolean;
}) {
  const isImageLeft = section.position === "left";
  const hasImage = section.imageUrl && section.imageUrl.length > 0;
  const sectionId = `section-${generateSlug(section.heading)}`;
  
  // Determine layout variant based on section position
  // First section: featured (large image)
  // Sections without image: full width text
  // Other sections: compact layout with smaller images
  const isFirstWithImage = index === 0 && hasImage;
  const isCompactLayout = index > 0 && hasImage;

  return (
    <section
      id={sectionId}
      className={cn(
        "scroll-mt-28 relative",
        // Compact section separator
        !isLast && "pb-4 md:pb-5 border-b border-gray-100 dark:border-gray-800/50"
      )}
    >
      {/* Layout for sections WITHOUT image - Full width text */}
      {!hasImage && (
        <div className="max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-dark dark:text-white leading-tight flex items-center gap-3 mb-4">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-blue-400 rounded-full flex-shrink-0" />
            {section.heading}
          </h2>
          <div className="space-y-3">
            {parseContentWithProTips(section.content)}
          </div>
        </div>
      )}

      {/* Layout for FIRST section with image - Featured/Large, image stretches to match text height */}
      {isFirstWithImage && (
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-stretch">
          {isImageLeft && (
            <ImageBlock 
              src={section.imageUrl!}
              alt={section.imageAlt || section.heading}
              isEager={true}
              variant="featured"
              fillHeight={true}
              className="order-1"
            />
          )}
          <div className={cn("space-y-4", isImageLeft ? "order-2" : "order-2 lg:order-1")}>
            <h2 className="text-2xl md:text-3xl font-bold text-dark dark:text-white leading-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-blue-400 rounded-full flex-shrink-0" />
              {section.heading}
            </h2>
            <div className="space-y-3">
              {parseContentWithProTips(section.content)}
            </div>
          </div>
          {!isImageLeft && (
            <ImageBlock 
              src={section.imageUrl!}
              alt={section.imageAlt || section.heading}
              isEager={true}
              variant="featured"
              fillHeight={true}
              className="order-1 lg:order-2"
            />
          )}
        </div>
      )}

      {/* Layout for OTHER sections with image - Image on top, text flows below */}
      {isCompactLayout && (
        <div className="space-y-4">
          {/* Section heading */}
          <h2 className="text-xl md:text-2xl font-bold text-dark dark:text-white leading-tight flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary to-blue-400 rounded-full flex-shrink-0" />
            {section.heading}
          </h2>
          
          {/* Image with varied positioning for visual interest */}
          <div className={cn(
            "relative",
            // Alternate image sizes and positions for variety
            index % 4 === 1 && "float-right ml-4 mb-3 w-full sm:w-2/5 lg:w-1/3",
            index % 4 === 2 && "float-left mr-4 mb-3 w-full sm:w-2/5 lg:w-1/3",
            index % 4 === 3 && "w-full max-w-md mx-auto",
            index % 4 === 0 && "float-right ml-4 mb-3 w-full sm:w-1/2 lg:w-2/5"
          )}>
            <ImageBlock 
              src={section.imageUrl!}
              alt={section.imageAlt || section.heading}
              variant={index % 4 === 3 ? "wide" : "compact"}
            />
          </div>
          
          {/* Content flows naturally around or below image */}
          <div className="space-y-3">
            {parseContentWithProTips(section.content)}
          </div>
          
          {/* Clear floats */}
          <div className="clear-both" />
        </div>
      )}
    </section>
  );
}

/**
 * Enhanced Image Block with hover effects and multiple variants
 */
function ImageBlock({ 
  src, 
  alt, 
  isEager = false,
  variant = "featured",
  fillHeight = false,
  className 
}: { 
  src: string; 
  alt: string; 
  isEager?: boolean;
  variant?: "featured" | "compact" | "thumbnail" | "wide";
  fillHeight?: boolean;
  className?: string;
}) {
  const variants = {
    featured: {
      aspect: "aspect-[4/3]",
      rounded: "rounded-2xl",
      shadow: "shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]",
      hoverShadow: "group-hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)]",
      sizes: "(max-width: 768px) 100vw, 50vw"
    },
    compact: {
      aspect: "aspect-[4/3]",
      rounded: "rounded-xl",
      shadow: "shadow-md",
      hoverShadow: "group-hover:shadow-lg",
      sizes: "(max-width: 768px) 100vw, 300px"
    },
    wide: {
      aspect: "aspect-[16/9]",
      rounded: "rounded-xl",
      shadow: "shadow-lg",
      hoverShadow: "group-hover:shadow-xl",
      sizes: "(max-width: 768px) 100vw, 450px"
    },
    thumbnail: {
      aspect: "aspect-square",
      rounded: "rounded-lg",
      shadow: "shadow-sm",
      hoverShadow: "group-hover:shadow-md",
      sizes: "150px"
    }
  };

  const v = variants[variant];

  return (
    <div className={cn(
      "relative group",
      fillHeight && "h-full",
      className
    )}>
      <div className={cn(
        "relative overflow-hidden",
        // Use full height when fillHeight is true, otherwise use aspect ratio
        fillHeight ? "h-full min-h-[300px]" : v.aspect,
        v.rounded,
        v.shadow,
        "ring-1 ring-black/5 dark:ring-white/10",
        "transition-all duration-300 ease-out",
        v.hoverShadow,
        variant === "featured" && !fillHeight && "group-hover:-translate-y-1"
      )}>
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-cover transition-transform duration-500 ease-out",
            variant === "featured" && "group-hover:scale-[1.02]",
            variant === "compact" && "group-hover:scale-[1.01]"
          )}
          sizes={v.sizes}
          loading={isEager ? "eager" : "lazy"}
        />
        
        {/* Subtle gradient overlay */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          variant === "featured" 
            ? "bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 group-hover:opacity-40" 
            : "bg-gradient-to-t from-black/10 to-transparent opacity-50 group-hover:opacity-30"
        )} />
      </div>
      
      {/* Decorative accent for featured images only */}
      {variant === "featured" && (
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
    </div>
  );
}

export default BlogSections;

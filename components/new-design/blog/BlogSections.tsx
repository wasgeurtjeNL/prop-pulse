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

interface FAQ {
  question: string;
  answer: string;
}

interface BlogStructuredContent {
  intro: string;
  sections: Section[];
  faq?: FAQ[];
}

interface BlogSectionsProps {
  content: BlogStructuredContent | string;
  className?: string;
  showFaq?: boolean;
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
          <HTMLContent content={content} />
        </div>
      );
    }
    // Fallback to HTML rendering
    return (
      <div className={cn("blog-details markdown", className)}>
        <HTMLContent content={content} />
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
    <div className={cn("space-y-16", className)}>
      {/* Intro Section */}
      {content.intro && (
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:text-dark/80 dark:prose-p:text-white/80 prose-a:text-primary hover:prose-a:text-primary/80">
          <HTMLContent content={content.intro} />
        </div>
      )}

      {/* Alternating Sections */}
      {content.sections.map((section, index) => (
        <BlogSectionBlock key={index} section={section} index={index} />
      ))}

      {/* FAQ Section */}
      {showFaq && content.faq && content.faq.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl md:text-3xl font-bold text-dark dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {content.faq.map((item, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">
                  {item.question}
                </h3>
                <p className="text-dark/70 dark:text-white/70">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BlogSectionBlock({ section, index }: { section: Section; index: number }) {
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
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:text-dark/80 dark:prose-p:text-white/80 prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline prose-strong:text-dark dark:prose-strong:text-white prose-li:text-dark/80 dark:prose-li:text-white/80">
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

export default BlogSections;




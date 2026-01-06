"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { TocItem } from "@/lib/blog-utils";

// Re-export for backwards compatibility
export type { TocItem } from "@/lib/blog-utils";
export { generateSlug } from "@/lib/blog-utils";

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

/**
 * Table of Contents component for blog articles
 * - Supports smooth scrolling
 * - Highlights active section
 * - Responsive design (collapsible on mobile)
 */
export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  // Track which section is currently visible
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -66%",
        threshold: 0,
      }
    );

    // Observe all headings
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      
      // Close mobile menu after click
      setIsOpen(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        "toc-container",
        className
      )}
      aria-label="Table of contents"
    >
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 lg:hidden bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Icon icon="ph:list-bullets" className="w-5 h-5" />
          In this article
        </span>
        <Icon
          icon={isOpen ? "ph:caret-up" : "ph:caret-down"}
          className="w-5 h-5 text-slate-500"
        />
      </button>

      {/* Desktop: Always visible, Mobile: Collapsible */}
      <div
        className={cn(
          "lg:block",
          isOpen ? "block" : "hidden",
          "mt-2 lg:mt-0"
        )}
      >
        <div className="p-4 lg:p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          {/* Header - Desktop Only */}
          <h3 className="hidden lg:flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Icon icon="ph:list-bullets" className="w-4 h-4 text-primary" />
            In this article
          </h3>

          {/* ToC Items */}
          <ul className="space-y-1" role="list">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "w-full text-left py-2 px-3 rounded-lg text-sm transition-all duration-200",
                    item.level === 3 && "ml-4 text-xs",
                    activeId === item.id
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                  aria-current={activeId === item.id ? "location" : undefined}
                >
                  <span className="line-clamp-2">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default TableOfContents;

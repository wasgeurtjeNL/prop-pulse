"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface HTMLContentProps {
  content: string;
  className?: string;
}

export default function HTMLContent({ content, className = "" }: HTMLContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const root = contentRef.current;
      
      // Clean up corrupted emoji characters (displayed as "????")
      // This fixes content that was saved with encoding issues
      const cleanedContent = content
        .replace(/\?{2,}/g, '') // Remove sequences of 2+ question marks (corrupted emojis)
        .replace(/^\s*\?+\s*/gm, '') // Remove lines starting with question marks
        .trim();
      
      const sanitized = DOMPurify.sanitize(cleanedContent, {
        ALLOWED_TAGS: [
          // Basic text formatting
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "mark",
          "small",
          "sub",
          "sup",
          // Headings
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          // Lists
          "ul",
          "ol",
          "li",
          // Block elements
          "div",
          "span",
          "blockquote",
          "hr",
          "pre",
          "code",
          // Links and media
          "a",
          "img",
          "figure",
          "figcaption",
          // Tables
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          // Semantic elements
          "article",
          "section",
          "aside",
          "header",
          "footer",
        ],
        ALLOWED_ATTR: [
          "href",
          "target",
          "rel",
          "class",
          "id",
          "src",
          "alt",
          "width",
          "height",
          "loading",
          "style",
          "title",
          "colspan",
          "rowspan",
        ],
      });
      root.innerHTML = sanitized;

      // ═══════════════════════════════════════════════════════════════
      // AUTO-GENERATE IDS FOR HEADINGS (SEO & Anchor Links)
      // This enables Table of Contents navigation and jump links
      // ═══════════════════════════════════════════════════════════════

      const generateSlug = (text: string): string => {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      };

      // Track used IDs to prevent duplicates
      const usedIds = new Set<string>();

      const headings = root.querySelectorAll("h2, h3, h4");
      headings.forEach((heading) => {
        if (!heading.id) {
          let baseId = generateSlug(heading.textContent || "section");
          let uniqueId = baseId;
          let counter = 1;
          
          // Ensure unique ID
          while (usedIds.has(uniqueId)) {
            uniqueId = `${baseId}-${counter}`;
            counter++;
          }
          
          usedIds.add(uniqueId);
          heading.id = uniqueId;
          
          // Add scroll margin for fixed header
          (heading as HTMLElement).style.scrollMarginTop = "7rem";
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // AUTO-DETECT AND STYLE SPECIAL CONTENT ELEMENTS
      // This ensures styling works even without explicit CSS classes
      // ═══════════════════════════════════════════════════════════════

      // Style all images within the content (CLS-optimized)
      const images = root.querySelectorAll("img");
      images.forEach((img) => {
        // Prevent CLS by setting aspect-ratio
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.maxHeight = "500px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "1rem";
        img.style.marginTop = "1.5rem";
        img.style.marginBottom = "1.5rem";
        img.style.aspectRatio = "16 / 9"; // Prevents CLS
        img.style.backgroundColor = "#f1f5f9"; // Placeholder color while loading
        img.setAttribute("loading", "lazy");
        img.setAttribute("decoding", "async");
      });

      // Auto-detect and style divs based on content patterns
      const allDivs = root.querySelectorAll("div");
      allDivs.forEach((div) => {
        const text = div.textContent || "";

        // Skip if already styled
        if (div.classList.contains("highlight-box") || 
            div.classList.contains("pro-tip") || 
            div.classList.contains("warning-box") ||
            div.classList.contains("stat-highlight") ||
            div.classList.contains("faq-section") ||
            div.classList.contains("cta-box")) {
          return;
        }

        // Detect Key Insight boxes (prioritize over pro-tip)
        if (text.includes("Key Insight:")) {
          div.classList.add("highlight-box");
          return;
        }

        // Detect Pro Tip boxes
        if (text.includes("Pro Tip:")) {
          div.classList.add("pro-tip");
          return;
        }

        // Detect Warning boxes
        if (text.includes("⚠️ Important:") || text.includes("Important:") || text.includes("Warning:")) {
          div.classList.add("warning-box");
          return;
        }

        // Detect Statistic highlights (divs where first child contains a percentage or large number)
        const firstChild = div.firstElementChild;
        if (firstChild && (firstChild.tagName === "SPAN" || firstChild.tagName === "DIV")) {
          const firstChildContent = firstChild.textContent?.trim() || "";
          // Check if first child contains a percentage or number-like stat
          if (/^\d+(?:\.\d+)?%?$/.test(firstChildContent) || /^\d+[+]?$/.test(firstChildContent)) {
            div.classList.add("stat-highlight");
            firstChild.classList.add("stat-number");
            // Style the description text (second child)
            const secondChild = firstChild.nextElementSibling;
            if (secondChild) {
              secondChild.classList.add("stat-text");
            }
            return;
          }
        }

        // Detect FAQ sections (parent div containing H2 with FAQ/Frequently Asked)
        const h2 = div.querySelector(":scope > h2");
        if (h2 && (h2.textContent?.includes("FAQ") || h2.textContent?.includes("Frequently Asked"))) {
          div.classList.add("faq-section");
          // Style FAQ items (child divs with H3)
          const faqItems = div.querySelectorAll(":scope > div");
          faqItems.forEach((item) => {
            if (item.querySelector("h3")) {
              item.classList.add("faq-item");
            }
          });
          return;
        }

        // Detect CTA boxes (divs with H3 containing "Ready to" or "Next Step")
        const h3 = div.querySelector(":scope > h3");
        if (h3 && (h3.textContent?.includes("Ready to") || h3.textContent?.includes("Next Step"))) {
          div.classList.add("cta-box");
          return;
        }
      });

      // Style all hr elements as section dividers
      const hrElements = root.querySelectorAll("hr");
      hrElements.forEach((hr) => {
        if (!hr.classList.contains("section-divider")) {
          hr.classList.add("section-divider");
        }
      });

      // Enhance blockquotes
      const blockquotes = root.querySelectorAll("blockquote");
      blockquotes.forEach((bq) => {
        // Add quote styling
        if (!bq.classList.contains("styled-quote")) {
          bq.classList.add("styled-quote");
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // STAT BLOCK NORMALIZATION (avoid "4 big boxes under each other")
      // - Move short "intro" paragraphs into the stat card as a label
      // - Remove punctuation-only paragraphs (e.g. "." lines)
      // - Group consecutive stat cards into a responsive grid
      // ═══════════════════════════════════════════════════════════════

      // Remove punctuation-only paragraphs that visually look like stray dots/commas
      const paragraphs = root.querySelectorAll("p");
      paragraphs.forEach((p) => {
        const text = (p.textContent || "").trim();
        if (text.length > 0 && /^[\s.,;:]+$/.test(text)) {
          p.remove();
        }
      });

      // Move a short preceding paragraph into the stat card to act as a label
      const statBlocks = Array.from(root.querySelectorAll<HTMLDivElement>(".stat-highlight"));
      statBlocks.forEach((stat) => {
        const prev = stat.previousElementSibling;
        if (!prev || prev.tagName !== "P") return;

        const prevTextRaw = (prev.textContent || "").trim();
        // Only absorb short helper lines; avoid pulling full paragraphs into the card
        if (prevTextRaw.length < 4 || prevTextRaw.length > 140) return;

        // Normalize leading punctuation (", while ...", ". Total ...")
        const normalized = prevTextRaw.replace(/^[\s,.;:–—-]+/, "").trim();
        if (!normalized) return;

        prev.textContent = normalized;
        prev.classList.add("stat-label");
        stat.insertBefore(prev, stat.firstChild);
      });

      // Wrap consecutive stat cards (after label absorption) into a grid
      const wrapStatGroups = (container: HTMLElement) => {
        const children = Array.from(container.children);
        for (let i = 0; i < children.length; i++) {
          const el = children[i];
          if (!(el instanceof HTMLElement) || !el.classList.contains("stat-highlight")) continue;

          const group: HTMLElement[] = [el];
          let j = i + 1;
          while (j < children.length) {
            const next = children[j];
            if (!(next instanceof HTMLElement) || !next.classList.contains("stat-highlight")) break;
            group.push(next);
            j++;
          }

          if (group.length >= 2) {
            const wrapper = document.createElement("div");
            wrapper.className = "stat-grid";
            container.insertBefore(wrapper, group[0]);
            group.forEach((node) => wrapper.appendChild(node));
          }

          i = j - 1;
        }
      };

      // Run grouping on every parent that directly contains stat blocks (covers nested content)
      const statParents = new Set<HTMLElement>();
      statBlocks.forEach((stat) => {
        const parent = stat.parentElement;
        if (parent) statParents.add(parent);
      });
      statParents.forEach((parent) => wrapStatGroups(parent));

      // ═══════════════════════════════════════════════════════════════
      // SOURCES SECTION DETECTION
      // ═══════════════════════════════════════════════════════════════
      const allDivsForSources = root.querySelectorAll("div");
      allDivsForSources.forEach((div) => {
        // Check for sources section by h3 content
        const h3 = div.querySelector(":scope > h3");
        if (h3 && (h3.textContent?.includes("Sources") || h3.textContent?.includes("References") || h3.textContent?.includes("Bronnen"))) {
          if (!div.classList.contains("sources-section")) {
            div.classList.add("sources-section");
            // Style the sources list
            const ul = div.querySelector("ul");
            if (ul) {
              ul.classList.add("sources-list");
            }
          }
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // INTERNAL LINKS ENHANCEMENT
      // ═══════════════════════════════════════════════════════════════
      const allLinks = root.querySelectorAll("a");
      allLinks.forEach((link) => {
        const href = link.getAttribute("href") || "";
        
        // Internal links to blog posts
        if (href.startsWith("/blogs/") || href.includes("/blogs/")) {
          if (!link.classList.contains("internal-link")) {
            link.classList.add("internal-link");
          }
        }
        
        // External links - ensure proper attributes
        if (href.startsWith("http") && !href.includes(window.location.hostname)) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
      });
    }
  }, [content]);

  return <div ref={contentRef} className={className} />;
}
















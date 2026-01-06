"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

// ============================================
// 1. KEY TAKEAWAYS COMPONENT
// ============================================
interface KeyTakeaway {
  text: string;
  icon?: string;
}

interface KeyTakeawaysProps {
  takeaways: KeyTakeaway[];
  title?: string;
  className?: string;
}

export function KeyTakeaways({ 
  takeaways, 
  title = "Key Takeaways",
  className 
}: KeyTakeawaysProps) {
  if (!takeaways || takeaways.length === 0) return null;

  return (
    <div className={cn(
      "bg-gradient-to-br from-primary/5 via-primary/10 to-blue-50 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900/50",
      "border border-primary/20 rounded-2xl p-6 md:p-8 mb-10",
      "shadow-sm",
      className
    )}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Icon icon="ph:lightbulb-filament-fill" className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-dark dark:text-white">{title}</h2>
      </div>
      <ul className="space-y-3">
        {takeaways.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
              <Icon 
                icon={item.icon || "ph:check-bold"} 
                className="w-3.5 h-3.5 text-primary" 
              />
            </span>
            <span className="text-dark/80 dark:text-white/80 leading-relaxed">
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// 2. PRO TIP COMPONENT (Enhanced)
// ============================================
interface ProTipProps {
  children: React.ReactNode;
  variant?: "tip" | "warning" | "info" | "success";
  title?: string;
  className?: string;
}

export function ProTip({ 
  children, 
  variant = "tip",
  title,
  className 
}: ProTipProps) {
  const variants = {
    tip: {
      bg: "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
      border: "border-amber-200 dark:border-amber-800",
      icon: "ph:lightbulb-fill",
      iconColor: "text-amber-500",
      title: "Pro Tip"
    },
    warning: {
      bg: "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30",
      border: "border-red-200 dark:border-red-800",
      icon: "ph:warning-fill",
      iconColor: "text-red-500",
      title: "Important"
    },
    info: {
      bg: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
      border: "border-blue-200 dark:border-blue-800",
      icon: "ph:info-fill",
      iconColor: "text-blue-500",
      title: "Did You Know?"
    },
    success: {
      bg: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
      border: "border-green-200 dark:border-green-800",
      icon: "ph:check-circle-fill",
      iconColor: "text-green-500",
      title: "Success"
    }
  };

  const v = variants[variant];

  return (
    <aside 
      className={cn(
        v.bg,
        "border-l-4",
        v.border,
        "rounded-r-xl p-5 my-6",
        className
      )}
      role="note"
    >
      <div className="flex items-start gap-3">
        <Icon icon={v.icon} className={cn("w-6 h-6 flex-shrink-0 mt-0.5", v.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold mb-1", v.iconColor.replace('text-', 'text-').replace('-500', '-700 dark:text-').concat('-400'))}>
            {title || v.title}
          </p>
          <div className="text-dark/80 dark:text-white/80 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ============================================
// 3. READING PROGRESS INDICATOR
// ============================================
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800">
      <div 
        className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ============================================
// 4. SOCIAL SHARE BUTTONS
// ============================================
interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "horizontal" | "vertical";
}

export function SocialShare({ 
  url, 
  title, 
  description = "",
  className,
  variant = "horizontal"
}: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shareLinks = [
    {
      name: "Facebook",
      icon: "ri:facebook-fill",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-[#1877F2] hover:text-white"
    },
    {
      name: "Twitter",
      icon: "ri:twitter-x-fill",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:bg-black hover:text-white"
    },
    {
      name: "LinkedIn",
      icon: "ri:linkedin-fill",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:bg-[#0A66C2] hover:text-white"
    },
    {
      name: "WhatsApp",
      icon: "ri:whatsapp-fill",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-[#25D366] hover:text-white"
    },
    {
      name: "Copy Link",
      icon: "ph:link-bold",
      href: "#",
      color: "hover:bg-primary hover:text-white",
      onClick: async () => {
        await navigator.clipboard.writeText(url);
        // Could add toast notification here
      }
    }
  ];

  const isVertical = variant === "vertical";

  return (
    <div className={cn(
      "flex items-center gap-2",
      isVertical && "flex-col",
      className
    )}>
      <span className={cn(
        "text-sm font-medium text-dark/60 dark:text-white/60",
        isVertical ? "mb-2" : "mr-2"
      )}>
        Share:
      </span>
      <div className={cn("flex gap-2", isVertical && "flex-col")}>
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            onClick={link.onClick ? (e) => { e.preventDefault(); link.onClick?.(); } : undefined}
            target={link.onClick ? undefined : "_blank"}
            rel={link.onClick ? undefined : "noopener noreferrer"}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
              "transition-all duration-200",
              link.color
            )}
            title={link.name}
          >
            <Icon icon={link.icon} className="w-4 h-4" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 5. AUTHOR BIO SECTION
// ============================================
interface AuthorBioProps {
  name: string;
  image?: string | null;
  role?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  className?: string;
}

export function AuthorBio({ 
  name, 
  image, 
  role = "Real Estate Expert",
  bio,
  socialLinks,
  className 
}: AuthorBioProps) {
  const defaultBio = `${name} is a real estate professional with extensive experience in the Phuket property market. Specializing in helping international investors and expats find their perfect property in Thailand.`;

  return (
    <section 
      className={cn(
        "bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900",
        "border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8",
        "mt-12",
        className
      )}
      itemScope
      itemType="https://schema.org/Person"
    >
      <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">
        About the Author
      </h3>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          {image ? (
            <Image
              src={image}
              alt={name}
              width={80}
              height={80}
              className="rounded-xl ring-2 ring-primary/20"
              itemProp="image"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-primary font-bold text-2xl">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xl font-bold text-dark dark:text-white" itemProp="name">
            {name}
          </h4>
          <p className="text-primary font-medium mb-3" itemProp="jobTitle">
            {role}
          </p>
          <p className="text-dark/70 dark:text-white/70 leading-relaxed text-sm" itemProp="description">
            {bio || defaultBio}
          </p>
          
          {/* Social Links */}
          {socialLinks && (
            <div className="flex gap-3 mt-4">
              {socialLinks.twitter && (
                <a 
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#1DA1F2] transition-colors"
                >
                  <Icon icon="ri:twitter-x-fill" className="w-5 h-5" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#0A66C2] transition-colors"
                >
                  <Icon icon="ri:linkedin-fill" className="w-5 h-5" />
                </a>
              )}
              {socialLinks.website && (
                <a 
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  <Icon icon="ph:globe-bold" className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================
// 6. FAQ ACCORDION COMPONENT
// ============================================
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) return null;

  return (
    <section 
      id="faq"
      className={cn(
        "mt-16 pt-12 border-t border-gray-200 dark:border-gray-800 scroll-mt-28",
        className
      )}
      itemScope 
      itemType="https://schema.org/FAQPage"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-dark dark:text-white mb-8 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon icon="ph:question-fill" className="w-5 h-5 text-primary" />
        </span>
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={index}
            className={cn(
              "border rounded-xl overflow-hidden transition-all duration-200",
              openIndex === index 
                ? "border-primary/30 bg-primary/5 dark:bg-primary/10" 
                : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
            )}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
              aria-expanded={openIndex === index}
            >
              <span 
                className="text-lg font-semibold text-dark dark:text-white pr-4 flex items-center gap-3"
                itemProp="name"
              >
                <span className="text-primary font-bold">Q:</span>
                {item.question}
              </span>
              <Icon 
                icon={openIndex === index ? "ph:minus-bold" : "ph:plus-bold"}
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  openIndex === index ? "text-primary" : "text-gray-400"
                )}
              />
            </button>
            <div 
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
              itemScope 
              itemProp="acceptedAnswer" 
              itemType="https://schema.org/Answer"
            >
              <p 
                className="px-6 pb-5 text-dark/70 dark:text-white/70 leading-relaxed pl-14"
                itemProp="text"
              >
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================
// 7. INLINE CTA COMPONENT
// ============================================
interface InlineCTAProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonHref: string;
  variant?: "primary" | "secondary" | "whatsapp";
  className?: string;
}

export function InlineCTA({ 
  title, 
  description, 
  buttonText, 
  buttonHref,
  variant = "primary",
  className 
}: InlineCTAProps) {
  const variants = {
    primary: {
      bg: "bg-gradient-to-r from-primary to-blue-600",
      button: "bg-white text-primary hover:bg-gray-100"
    },
    secondary: {
      bg: "bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800",
      button: "bg-primary text-white hover:bg-primary/90"
    },
    whatsapp: {
      bg: "bg-gradient-to-r from-[#25D366] to-[#128C7E]",
      button: "bg-white text-[#25D366] hover:bg-gray-100"
    }
  };

  const v = variants[variant];

  return (
    <aside className={cn(
      v.bg,
      "rounded-2xl p-6 md:p-8 my-10 text-white",
      className
    )}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{title}</h3>
          {description && (
            <p className="text-white/80 text-sm">{description}</p>
          )}
        </div>
        <Link
          href={buttonHref}
          className={cn(
            v.button,
            "px-6 py-3 rounded-lg font-semibold text-center transition-all duration-200",
            "flex items-center justify-center gap-2 flex-shrink-0"
          )}
        >
          {variant === "whatsapp" && <Icon icon="ri:whatsapp-fill" className="w-5 h-5" />}
          {buttonText}
        </Link>
      </div>
    </aside>
  );
}

// ============================================
// 8. STAT HIGHLIGHT BOX
// ============================================
interface Stat {
  value: string;
  label: string;
  icon?: string;
}

interface StatHighlightProps {
  stats: Stat[];
  title?: string;
  className?: string;
}

export function StatHighlight({ stats, title, className }: StatHighlightProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className={cn(
      "bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 my-8 text-white",
      className
    )}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-white/80">{title}</h3>
      )}
      <div className={cn(
        "grid gap-4",
        stats.length === 2 && "grid-cols-2",
        stats.length === 3 && "grid-cols-3",
        stats.length >= 4 && "grid-cols-2 md:grid-cols-4"
      )}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            {stat.icon && (
              <Icon icon={stat.icon} className="w-6 h-6 text-primary mx-auto mb-2" />
            )}
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {stat.value}
            </div>
            <div className="text-sm text-white/60 mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 9. LAST UPDATED INDICATOR
// ============================================
interface LastUpdatedProps {
  date: Date | string;
  className?: string;
}

export function LastUpdated({ date, className }: LastUpdatedProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-dark/50 dark:text-white/50",
      className
    )}>
      <Icon icon="ph:clock-counter-clockwise" className="w-4 h-4" />
      <span>Last updated: {formattedDate}</span>
    </div>
  );
}

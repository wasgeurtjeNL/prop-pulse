'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { generateBreadcrumbSchema, renderJsonLd } from '@/lib/utils/structured-data';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * SEO-optimized Breadcrumb component following Google's guidelines:
 * - Semantic HTML with nav, ol, li elements
 * - JSON-LD structured data (BreadcrumbList schema)
 * - Proper aria attributes for accessibility
 * - Home icon for first item
 * - Current page is not a link (last item)
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
const Breadcrumb: FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  // Always ensure Home is the first item
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    ...items.filter(item => item.href !== '/'), // Remove any duplicate home items
  ];

  // Generate JSON-LD structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(item => ({ name: item.name, url: item.href })),
    baseUrl
  );

  const lastIndex = breadcrumbItems.length - 1;

  return (
    <>
      {/* JSON-LD Structured Data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderJsonLd(breadcrumbSchema)}
      />
      
      {/* Semantic Breadcrumb Navigation */}
      <nav 
        aria-label="Breadcrumb" 
        className={`w-full ${className}`}
      >
        <ol 
          className="flex items-center flex-wrap justify-center gap-0.5 text-xs"
          itemScope 
          itemType="https://schema.org/BreadcrumbList"
        >
          {breadcrumbItems.map((item, index) => {
            const isLast = index === lastIndex;
            const isFirst = index === 0;

            return (
              <li 
                key={item.href + index}
                className="flex items-center"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {!isLast ? (
                  <>
                    <Link
                      href={item.href}
                      prefetch={false}
                      itemProp="item"
                      className="flex items-center gap-1.5 text-dark/70 dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                    >
                      {isFirst && (
                        <Icon
                          icon="ph:house-simple-fill"
                          className="w-3 h-3 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span itemProp="name">{item.name}</span>
                    </Link>
                    <meta itemProp="position" content={String(index + 1)} />
                    
                    {/* Separator */}
                    <Icon
                      icon="ph:caret-right"
                      className="w-3 h-3 mx-0.5 text-dark/40 dark:text-white/40 flex-shrink-0"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    {/* Current page - not a link */}
                    <span 
                      className="text-dark dark:text-white font-medium"
                      itemProp="name"
                      aria-current="page"
                    >
                      {item.name}
                    </span>
                    <meta itemProp="position" content={String(index + 1)} />
                    <meta itemProp="item" content={`${baseUrl}${item.href}`} />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;

// Re-export types for convenience
export type { BreadcrumbProps };

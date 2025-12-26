// Geoptimaliseerde Redirect Configuratie voor psmphuket.com → nieuwe site
// Gebruik wildcard patterns voor efficientere redirects

import type { NextConfig } from "next";

// Voeg dit toe aan je next.config.ts
export const redirects = async () => {
  return [
    // ============================================
    // WILDCARD PATTERNS (meest efficient)
    // ============================================
    
    // Property pagina's → nieuwe property structuur
    {
      source: '/property/:slug',
      destination: '/properties/phuket/other/:slug',
      permanent: true,
    },
    
    // Agent pagina's → about
    {
      source: '/agent/:slug',
      destination: '/about',
      permanent: true,
    },
    
    // Property type filters → properties listing
    {
      source: '/property-type/:type',
      destination: '/properties',
      permanent: true,
    },
    {
      source: '/property-type/:type/page/:num',
      destination: '/properties',
      permanent: true,
    },
    
    // Property feature filters → properties listing
    {
      source: '/property-feature/:feature',
      destination: '/properties',
      permanent: true,
    },
    {
      source: '/property-feature/:feature/page/:num',
      destination: '/properties',
      permanent: true,
    },
    
    // Property status filters → properties listing
    {
      source: '/property-status/:status',
      destination: '/properties',
      permanent: true,
    },
    {
      source: '/property-status/:status/page/:num',
      destination: '/properties',
      permanent: true,
    },
    
    // Properties search pagina's
    {
      source: '/properties-search',
      destination: '/properties',
      permanent: true,
    },
    {
      source: '/properties-search/page/:num',
      destination: '/properties',
      permanent: true,
    },
    
    // Gallery pagina's
    {
      source: '/gallery-2-columns',
      destination: '/properties',
      permanent: true,
    },
    {
      source: '/gallery-2-columns/page/:num',
      destination: '/properties',
      permanent: true,
    },
    
    // Pagination van homepage
    {
      source: '/page/:num',
      destination: '/properties',
      permanent: true,
    },
    
    // Compare properties
    {
      source: '/compare-properties',
      destination: '/properties',
      permanent: true,
    },
    
    // ============================================
    // STATISCHE PAGINA'S
    // ============================================
    
    // Contact blijft contact
    {
      source: '/contact',
      destination: '/contact',
      permanent: true,
    },
    
    // WordPress standaard paden die we moeten blokkeren (410 Gone)
    // Deze kunnen we niet met Next.js redirects doen, maar wel in middleware
  ];
};

// ============================================
// VOLLEDIGE NEXT.CONFIG.TS VOORBEELD
// ============================================

const nextConfig: NextConfig = {
  // ... je bestaande config ...
  
  async redirects() {
    return [
      // Property pagina's → nieuwe property structuur
      {
        source: '/property/:slug',
        destination: '/properties/phuket/other/:slug',
        permanent: true,
      },
      
      // Agent pagina's → about
      {
        source: '/agent/:slug',
        destination: '/about',
        permanent: true,
      },
      
      // Property type filters → properties listing
      {
        source: '/property-type/:path*',
        destination: '/properties',
        permanent: true,
      },
      
      // Property feature filters → properties listing
      {
        source: '/property-feature/:path*',
        destination: '/properties',
        permanent: true,
      },
      
      // Property status filters → properties listing
      {
        source: '/property-status/:path*',
        destination: '/properties',
        permanent: true,
      },
      
      // Properties search pagina's
      {
        source: '/properties-search/:path*',
        destination: '/properties',
        permanent: true,
      },
      
      // Gallery pagina's
      {
        source: '/gallery-2-columns/:path*',
        destination: '/properties',
        permanent: true,
      },
      
      // Pagination van homepage
      {
        source: '/page/:num',
        destination: '/properties',
        permanent: true,
      },
      
      // Compare properties
      {
        source: '/compare-properties',
        destination: '/properties',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [70, 75, 80],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "dubaivastgoedclub.com",
      },
      {
        // Allow any hostname for user-uploaded blog images
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  
  // ============================================
  // REDIRECTS: psmphuket.com → nieuwe site
  // Gegenereerd door tools/crawl_wordpress.py
  // ============================================
  async redirects() {
    return [
      // Property pagina's → listings route (zoekt alleen op slug, geen province/area nodig)
      // Voorbeeld: /property/villa-rawai → /listings/villa-rawai
      {
        source: '/property/:slug',
        destination: '/listings/:slug',
        permanent: true,
      },
      
      // Agent pagina's → about pagina
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
      {
        source: '/properties-search',
        destination: '/properties',
        permanent: true,
      },
      
      // Gallery pagina's
      {
        source: '/gallery-2-columns/:path*',
        destination: '/properties',
        permanent: true,
      },
      {
        source: '/gallery-2-columns',
        destination: '/properties',
        permanent: true,
      },
      
      // Pagination van homepage (/page/2, /page/3, etc.)
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
      
      // WordPress standaard paden
      {
        source: '/feed/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

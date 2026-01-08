import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import SessionProvider from "@/components/providers/SessionProvider";
import { KlaviyoScript } from "@/components/shared/KlaviyoScript";
import { UTMCaptureProvider } from "@/components/providers/UTMCaptureProvider";
import { LanguageProvider } from "@/lib/contexts/language-context";
import { LayoutDataProvider } from "@/lib/contexts/layout-data-context";
import { PropertyNavigationProvider } from "@/lib/contexts/PropertyNavigationContext";
import { FavoritesProvider } from "@/lib/contexts/FavoritesContext";

const font = Bricolage_Grotesque({ 
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap", // Prevents FOIT (Flash of Invisible Text) for better CLS
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.psmphuket.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "PSM Phuket | Luxury Real Estate in Phuket & Pattaya",
    template: "%s | PSM Phuket",
  },
  description:
    "Luxury villas and condos in Phuket & Pattaya. Buy, sell, or rent with PSM Phuket: local experts, curated listings, bespoke viewings, and full property management.",
  keywords: [
    'Phuket real estate',
    'Phuket property',
    'luxury villas Phuket',
    'condos Phuket',
    'Pattaya real estate',
    'buy villa Phuket',
    'rent condo Phuket',
    'Phuket property management',
    'beachfront villas Thailand',
    'investment properties Phuket',
  ],
  authors: [{ name: 'PSM Phuket' }],
  creator: 'PSM Phuket',
  publisher: 'PSM Phuket',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'PSM Phuket',
    title: 'PSM Phuket | Luxury Real Estate in Phuket & Pattaya',
    description:
      'Browse beachfront villas and ocean-view condos in Phuket & Pattaya. Viewings, negotiation, and property management by local experts.',
    images: [
      {
        url: '/images/hero/heroBanner.png',
        width: 1200,
        height: 630,
        alt: 'PSM Phuket - Luxury Real Estate in Phuket & Pattaya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PSM Phuket | Luxury Real Estate',
    description:
      'Luxury villas and condos in Phuket & Pattaya with full-service support from PSM Phuket.',
    images: ['/images/hero/heroBanner.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    // Add your verification codes when ready
    // google: 'your-google-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

// Optimize viewport for mobile LCP
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

/**
 * Critical inline CSS for fastest LCP and CLS prevention
 * Contains styles needed for initial render without layout shifts
 */
const criticalCSS = `
  /* Hero LCP optimization */
  .hero-lcp{position:relative;width:100%;overflow:hidden;margin-top:-5rem;contain:layout style}
  .hero-lcp-bg{position:absolute;inset:0;z-index:0}
  .hero-lcp-bg img{object-fit:cover;object-position:top;width:100%;height:100%}
  .hero-lcp-content{position:relative;z-index:10}
  /* Lazy sections - defer rendering of off-screen content */
  .lazy-section{contain:layout paint;content-visibility:auto;contain-intrinsic-size:auto 500px}
  /* Prevent icon flash - reserve space for icons */
  svg.iconify,span.iconify{display:inline-block;width:1em;height:1em;vertical-align:-0.125em}
  /* Reduce layout thrashing from header */
  header{contain:layout}
  /* ============================================ */
  /* CLS Prevention - Property Pages */
  /* ============================================ */
  /* Reserve space for property images with aspect ratio */
  [style*="aspect-ratio"]{aspect-ratio:var(--aspect-ratio,4/3)}
  /* Main content container - prevent reflow */
  main[role="main"]{contain:layout style;min-height:100vh}
  /* Property navigation bar placeholder */
  .property-nav-placeholder{min-height:44px}
  /* Image skeleton with fixed aspect ratio */
  .img-skeleton{aspect-ratio:4/3;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:skeleton-loading 1.5s infinite}
  @keyframes skeleton-loading{0%{background-position:200% 0}100%{background-position:-200% 0}}
  /* Prevent mobile carousel shift */
  .mobile-carousel{min-height:calc(85vw * 0.75)}
  /* Grid image container heights */
  .property-grid-main{min-height:400px}
  @media(min-width:1024px){.property-grid-main{min-height:500px}}
`;

/**
 * Script to defer Iconify loading until after LCP
 * This prevents icon API calls from blocking critical rendering
 */
const deferIconifyScript = `
  (function(){
    // Wait for LCP or max 2 seconds before allowing Iconify API calls
    if(window.requestIdleCallback){
      requestIdleCallback(function(){},{ timeout: 2000 });
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full" data-scroll-behavior="smooth">
      <head>
        {/* Critical inline CSS - renders before external stylesheets */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        {/* Preconnect to ImageKit CDN for faster image loading */}
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        {/* Preconnect to Iconify API - icons load async after LCP */}
        <link rel="preconnect" href="https://api.iconify.design" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.iconify.design" />
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${font.className} bg-white dark:bg-black antialiased h-full m-0 p-0`}>
        <NextTopLoader color="#004aac" />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            enableSystem={true}
            defaultTheme="light"
          >
            <LanguageProvider>
              <LayoutDataProvider>
                <PropertyNavigationProvider>
                  <FavoritesProvider>
                    <UTMCaptureProvider>
                      {children}
                    </UTMCaptureProvider>
                  </FavoritesProvider>
                </PropertyNavigationProvider>
                <Toaster richColors />
              </LayoutDataProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SessionProvider>
        {/* Klaviyo tracking script - lazy loaded for better TTI */}
        <KlaviyoScript />
      </body>
    </html>
  );
}

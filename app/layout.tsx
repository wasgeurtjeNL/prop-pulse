import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import SessionProvider from "@/components/providers/SessionProvider";
import { LanguageProvider } from "@/lib/contexts/language-context";

const font = Bricolage_Grotesque({ 
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  ...(baseUrl && { metadataBase: new URL(baseUrl) }),
  title: {
    default: "Real Estate Pulse - Premium Properties & Real Estate Services",
    template: "%s | Real Estate Pulse",
  },
  description:
    "Discover premium properties and professional real estate services. Find your dream home from our curated collection of luxury villas, modern apartments, and investment properties.",
  keywords: [
    'real estate',
    'properties for sale',
    'properties for rent',
    'luxury villas',
    'apartments',
    'investment properties',
    'real estate services',
    'property listings',
  ],
  authors: [{ name: 'Real Estate Pulse' }],
  creator: 'Real Estate Pulse',
  publisher: 'Real Estate Pulse',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Real Estate Pulse',
    title: 'Real Estate Pulse - Premium Properties & Real Estate Services',
    description:
      'Discover premium properties and professional real estate services. Find your dream home from our curated collection of luxury villas, modern apartments, and investment properties.',
    images: [
      {
        url: '/images/hero/heroBanner.png',
        width: 1200,
        height: 630,
        alt: 'Real Estate Pulse - Premium Properties',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Pulse - Premium Properties & Real Estate Services',
    description:
      'Discover premium properties and professional real estate services. Find your dream home from our curated collection of luxury villas, modern apartments, and investment properties.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${font.className} bg-white dark:bg-black antialiased h-full m-0 p-0`}>
        <NextTopLoader color="#07be8a" />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            enableSystem={true}
            defaultTheme="light"
          >
            <LanguageProvider>
              {children}
              <Toaster richColors />
            </LanguageProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

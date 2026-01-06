import "@/app/globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

/**
 * Embed Layout - Clean layout without header/footer
 * This allows calculators and tools to be embedded in iframes
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Allow embedding in iframes from any origin */}
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body className={cn(
        inter.variable,
        spaceGrotesk.variable,
        "font-sans antialiased"
      )}>
        {children}
      </body>
    </html>
  );
}

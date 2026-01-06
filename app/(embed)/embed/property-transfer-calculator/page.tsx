import { Metadata } from "next";
import { EmbedCalculator } from "@/components/tools/property-calculator/EmbedCalculator";

// ============================================
// SEO METADATA FOR EMBED
// ============================================

export const metadata: Metadata = {
  title: "Thailand Property Transfer Fee Calculator | Embed",
  description: "Embeddable Thailand property transfer fee calculator. Add this free tool to your website.",
  robots: {
    index: false, // Don't index embed pages
    follow: false,
  },
};

// ============================================
// EMBED PAGE COMPONENT
// ============================================

export default function PropertyTransferCalculatorEmbed() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-4">
      <EmbedCalculator />
    </main>
  );
}

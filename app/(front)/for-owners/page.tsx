import { Metadata } from "next";
import OwnerLandingHero from "@/components/new-design/owner-landing/owner-landing-hero";
import OwnerPortalFeatures from "@/components/new-design/owner-landing/owner-portal-features";
import OwnerROICalculator from "@/components/new-design/owner-landing/owner-roi-calculator";
import OwnerComparison from "@/components/new-design/owner-landing/owner-comparison";
import OwnerBiddingSystem from "@/components/new-design/owner-landing/owner-bidding-system";
import OwnerTM30Feature from "@/components/new-design/owner-landing/owner-tm30-feature";
import OwnerWhatsAppBot from "@/components/new-design/owner-landing/owner-whatsapp-bot";
import OwnerTestimonials from "@/components/new-design/owner-landing/owner-testimonials";
import OwnerFAQ from "@/components/new-design/owner-landing/owner-faq";
import OwnerCTA from "@/components/new-design/owner-landing/owner-cta";

export const metadata: Metadata = {
  title: "For Property Owners | Your Property, Your Dashboard, Your Control | PSM Phuket",
  description: "Discover what our enterprise-level platform can do for you as a property owner. Real-time statistics, passport-verified bidding system, automated TM30, and more.",
  keywords: "owner portal, property dashboard, sell property Thailand, rental management Phuket, TM30 automation, real estate bidding system",
  alternates: {
    languages: {
      'nl': '/voor-eigenaren',
      'en': '/for-owners',
    }
  },
  openGraph: {
    title: "For Property Owners | PSM Phuket Real Estate",
    description: "Not just a realtor - a complete enterprise platform for your property. View live statistics, receive verified offers, and manage everything from your own dashboard.",
    type: "website",
    images: [
      {
        url: "/images/owner-portal-preview.jpg",
        width: 1200,
        height: 630,
        alt: "PSM Owner Portal Dashboard",
      },
    ],
  },
};

export default function ForOwnersPage() {
  return (
    <main className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <OwnerLandingHero lang="en" />
      <OwnerPortalFeatures lang="en" />
      <OwnerROICalculator lang="en" />
      <OwnerComparison lang="en" />
      <OwnerBiddingSystem lang="en" />
      <OwnerTM30Feature lang="en" />
      <OwnerWhatsAppBot lang="en" />
      <OwnerTestimonials lang="en" />
      <OwnerFAQ lang="en" />
      <OwnerCTA lang="en" />
    </main>
  );
}

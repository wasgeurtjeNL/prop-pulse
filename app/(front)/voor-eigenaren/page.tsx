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
  title: "Voor Eigenaren | Uw Property, Uw Dashboard, Uw Controle | PSM Phuket",
  description: "Ontdek wat ons enterprise-niveau platform voor u als eigenaar kan betekenen. Real-time statistieken, biedingssysteem met paspoort verificatie, automatische TM30, en meer.",
  keywords: "eigenaren portal, property dashboard, verkoop woning Thailand, verhuur management Phuket, TM30 automatisering, biedingssysteem vastgoed",
  alternates: {
    languages: {
      'nl': '/voor-eigenaren',
      'en': '/for-owners',
    }
  },
  openGraph: {
    title: "Voor Eigenaren | PSM Phuket Real Estate",
    description: "Geen gewone makelaar - een compleet enterprise platform voor uw property. Bekijk live statistieken, ontvang geverifieerde biedingen, en beheer alles vanuit uw eigen dashboard.",
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

export default function VoorEigenarenPage() {
  return (
    <main className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <OwnerLandingHero lang="nl" />
      <OwnerPortalFeatures lang="nl" />
      <OwnerROICalculator lang="nl" />
      <OwnerComparison lang="nl" />
      <OwnerBiddingSystem lang="nl" />
      <OwnerTM30Feature lang="nl" />
      <OwnerWhatsAppBot lang="nl" />
      <OwnerTestimonials lang="nl" />
      <OwnerFAQ lang="nl" />
      <OwnerCTA lang="nl" />
    </main>
  );
}

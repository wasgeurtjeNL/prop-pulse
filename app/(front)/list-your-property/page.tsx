import { Metadata } from "next";
import ListPropertyForm from "@/components/new-design/list-property/list-property-form";
import ListPropertyHero from "@/components/new-design/list-property/list-property-hero";
import ListPropertyBenefits from "@/components/new-design/list-property/list-property-benefits";
import ListPropertyComparison from "@/components/new-design/list-property/list-property-comparison";
import ListPropertyTestimonials from "@/components/new-design/list-property/list-property-testimonials";
import ListPropertyFAQ from "@/components/new-design/list-property/list-property-faq";

export const metadata: Metadata = {
  title: "List Your Property | Sell Faster with PSM Phuket",
  description: "List your property with PSM Phuket and reach qualified international buyers. Choose our exclusive listing package for premium marketing including TikTok, Google Ads, and professional photography.",
  keywords: "list property Phuket, sell property Phuket, property listing Thailand, real estate agent Phuket, sell villa Phuket",
  openGraph: {
    title: "List Your Property | Sell Faster with PSM Phuket",
    description: "Reach qualified international buyers with PSM Phuket's premium marketing services.",
    type: "website",
  },
};

export default function ListYourPropertyPage() {
  return (
    <main className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <ListPropertyHero />
      <ListPropertyBenefits />
      <ListPropertyComparison />
      <ListPropertyForm />
      <ListPropertyTestimonials />
      <ListPropertyFAQ />
    </main>
  );
}






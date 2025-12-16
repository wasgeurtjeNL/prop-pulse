import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Team from "@/components/shared/sections/team";
import Mission from "@/components/shared/sections/mission";
import { Metadata } from "next";
import Breadcrumb from "@/components/new-design/breadcrumb";

export const metadata: Metadata = {
  title: "About Us - Your Trusted Property Management Partner",
  description: "Learn about Real Estate Pulse, your trusted property management partner in Thailand's premier coastal destinations. We specialize in luxury real estate across Phuket and Pattaya, providing comprehensive property services for international investors.",
  keywords: "about us, property management Phuket, real estate Pattaya, luxury properties Thailand, international investors",
  openGraph: {
    title: "About Us | Real Estate Pulse",
    description: "Your trusted property management partner in Phuket and Pattaya. Comprehensive property services for international investors.",
    images: [
      {
        url: "/about-image.avif",
        width: 1200,
        height: 630,
        alt: "Real Estate Pulse Team",
      },
    ],
  },
};

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'About Us', href: '/about' }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative pt-20 lg:pt-24 pb-10 md:pb-12 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/about-image.avif"
            alt="Office background"
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumb items={breadcrumbs} className="[&_a]:text-white/70 [&_a:hover]:text-white [&_span]:text-white" />
          </div>
          
          <Badge variant="outline" className="mb-6 text-white border-white/30">
            Serving Phuket & Pattaya
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
            Welcome to PSM Phuket
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Your trusted property management partner in Thailand's premier coastal destinations. 
            We specialize in luxury real estate across Phuket and Pattaya, providing comprehensive 
            property services - from investment consultation to full property management - for 
            international investors and expats seeking their perfect tropical paradise or high-ROI investment.
          </p>
        </div>
      </section>

      <Mission />

      <Team />
    </div>
  );
}

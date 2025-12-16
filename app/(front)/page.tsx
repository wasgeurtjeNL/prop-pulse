import Services from '@/components/new-design/home/services'
import Hero from '@/components/new-design/home/hero'
import Properties from '@/components/new-design/home/properties'
import FeaturedProperty from '@/components/new-design/home/featured-property'
import Testimonial from '@/components/new-design/home/testimonial'
import WhyChooseUs from '@/components/new-design/why-choose-us'
import InvestorStrategy from '@/components/new-design/investor-strategy'
import RentalExpert from '@/components/new-design/home/rental-expert'
import BlogSmall from '@/components/new-design/shared/blog'
import GetInTouch from '@/components/new-design/home/get-in-touch'
import FAQ from '@/components/new-design/home/faqs'
import { Metadata } from 'next'
import { generateOrganizationSchema, renderJsonLd } from '@/lib/utils/structured-data'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Discover premium properties and professional real estate services. Find your dream home from our curated collection of luxury villas, modern apartments, and investment properties. Expert guidance for buyers, sellers, and investors.',
  openGraph: {
    title: 'Real Estate Pulse - Premium Properties & Real Estate Services',
    description: 'Discover premium properties and professional real estate services. Find your dream home from our curated collection of luxury villas, modern apartments, and investment properties.',
  },
}

export default function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://realestatepulse.com';
  
  // Organization structured data for homepage
  const organizationSchema = generateOrganizationSchema({
    name: 'Real Estate Pulse',
    url: baseUrl,
    logo: `${baseUrl}/images/header/logo.svg`,
    description: 'Premium real estate services specializing in luxury properties, investment opportunities, and rental management.',
    sameAs: [
      // Add your social media profiles when available
      // 'https://www.facebook.com/realestatepulse',
      // 'https://www.instagram.com/realestatepulse',
      // 'https://www.linkedin.com/company/realestatepulse',
    ],
  });

  return (
    <>
      {/* JSON-LD Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderJsonLd(organizationSchema)}
      />
      <main>
        <Hero />
        <Services />
        <Properties />
        <FeaturedProperty />
        <Testimonial />
        <WhyChooseUs />
        <InvestorStrategy />
        <RentalExpert />
        <BlogSmall />
        <GetInTouch />
        <FAQ />
      </main>
    </>
  )
}

import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { generateOrganizationSchema, renderJsonLd } from '@/lib/utils/structured-data';

// Critical above-the-fold components - load immediately for best LCP
import Hero from '@/components/new-design/home/hero';
import Services from '@/components/new-design/home/services';

// Below-the-fold components - lazy load with dynamic imports to reduce initial bundle
const Properties = dynamic(() => import('@/components/new-design/home/properties'), {
  loading: () => <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800" />,
});

const FeaturedProperty = dynamic(() => import('@/components/new-design/home/featured-property'), {
  loading: () => <div className="animate-pulse h-[500px] bg-slate-100 dark:bg-slate-800" />,
});

const Testimonial = dynamic(() => import('@/components/new-design/home/testimonial'), {
  loading: () => <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800" />,
});

const WhyChooseUs = dynamic(() => import('@/components/new-design/why-choose-us'), {
  loading: () => <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800" />,
});

const InvestorStrategy = dynamic(() => import('@/components/new-design/investor-strategy'), {
  loading: () => <div className="animate-pulse h-[600px] bg-slate-100 dark:bg-slate-800" />,
});

const RentalExpert = dynamic(() => import('@/components/new-design/home/rental-expert'), {
  loading: () => <div className="animate-pulse h-[600px] bg-slate-100 dark:bg-slate-800" />,
});

const BlogSmall = dynamic(() => import('@/components/new-design/shared/blog'), {
  loading: () => <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800" />,
});

const GetInTouch = dynamic(() => import('@/components/new-design/home/get-in-touch'), {
  loading: () => <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800" />,
});

const FAQ = dynamic(() => import('@/components/new-design/home/faqs'), {
  loading: () => <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800" />,
});

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
        {/* Above-the-fold - critical for LCP */}
        <Hero />
        <Services />
        
        {/* Below-the-fold - lazy loaded for faster initial load */}
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

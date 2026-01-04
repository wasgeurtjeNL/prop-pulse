import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { generateOrganizationSchema, renderJsonLd } from '@/lib/utils/structured-data';
import { getProperties } from '@/lib/actions/property.actions';
import { transformPropertiesToTemplate } from '@/lib/adapters/property-adapter';
import HeroImagePreloader from './HeroImagePreloader';

// Critical above-the-fold components - load immediately for best LCP
import Hero from '@/components/new-design/home/hero';
import Services from '@/components/new-design/home/services';

// Properties component - NOT lazy loaded since we have server-side data
import Properties from '@/components/new-design/home/properties';

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
  title: 'Luxury Phuket Real Estate | Villas & Condos | PSM Phuket',
  description:
    'Buy or rent luxury villas and condos in Phuket & Pattaya with PSM Phuket. Local experts, bespoke viewings, negotiations, and full property management for investors, buyers, and renters.',
  openGraph: {
    title: 'PSM Phuket | Luxury Villas & Condos in Phuket & Pattaya',
    description:
      'Explore beachfront villas, ocean-view condos, and investment properties in Phuket & Pattaya. End-to-end support: sourcing, viewings, negotiation, and property management.',
  },
}

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.psmphuket.com';
  
  // Fetch properties data server-side for instant rendering (no waterfall)
  const properties = await getProperties({});
  const propertyHomes = transformPropertiesToTemplate(properties as any[]);
  
  // Organization structured data for homepage
  const organizationSchema = generateOrganizationSchema({
    name: 'PSM Phuket',
    url: baseUrl,
    logo: `${baseUrl}/images/header/logo.svg`,
    description: 'Luxury real estate services in Phuket & Pattaya, specializing in beachfront villas, ocean-view condos, investment properties, and full property management.',
    sameAs: [
      // Add your social media profiles when available
      // 'https://www.facebook.com/psmphuket',
      // 'https://www.instagram.com/psmphuket',
      // 'https://www.linkedin.com/company/psmphuket',
    ],
  });

  return (
    <>
      {/* Preload hero images for faster LCP - only on homepage */}
      <HeroImagePreloader />
      {/* JSON-LD Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderJsonLd(organizationSchema)}
      />
      <main>
        {/* Above-the-fold - critical for LCP */}
        <Hero />
        
        {/* SEO Section - H1 + internal links for crawlability */}
        <section className="py-8 sm:py-10 lg:py-12 bg-white dark:bg-black">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-dark dark:text-white">
              Luxury Phuket Real Estate: Villas & Condos by PSM Phuket
            </h1>
            <p className="text-sm sm:text-base text-black/70 dark:text-white/70">
              Find beachfront villas, ocean-view condos, and investment-ready properties across Phuket and Pattaya.
              PSM Phuket arranges bespoke viewings, handles negotiations, and provides full property management for
              buyers, sellers, and investors.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm sm:text-base">
              <a className="text-primary hover:underline" href="/properties">View properties</a>
              <span className="text-black/30 dark:text-white/30">•</span>
              <a className="text-primary hover:underline" href="/rental-services">Rental services</a>
              <span className="text-black/30 dark:text-white/30">•</span>
              <a className="text-primary hover:underline" href="/list-your-property">List your property</a>
              <span className="text-black/30 dark:text-white/30">•</span>
              <a className="text-primary hover:underline" href="/about">About PSM Phuket</a>
              <span className="text-black/30 dark:text-white/30">•</span>
              <a className="text-primary hover:underline" href="/faq">FAQ</a>
              <span className="text-black/30 dark:text-white/30">•</span>
              <a className="text-primary hover:underline" href="/guides/phuket">Phuket guide</a>
              <span className="text-black/30 dark:text-white/30">•</span>
              <a className="text-primary hover:underline" href="/contactus">Contact us</a>
            </div>
          </div>
        </section>

        <Services />
        
        {/* Properties - server-side data for instant image loading */}
        <Properties initialProperties={propertyHomes} />
        
        {/* Below-the-fold - lazy loaded with content-visibility for better LCP */}
        <div className="lazy-section">
          <FeaturedProperty />
        </div>
        <div className="lazy-section">
          <Testimonial />
        </div>
        <div className="lazy-section">
          <WhyChooseUs />
        </div>
        <div className="lazy-section">
          <InvestorStrategy />
        </div>
        <div className="lazy-section">
          <RentalExpert />
        </div>
        <div className="lazy-section">
          <BlogSmall />
        </div>
        <div className="lazy-section">
          <GetInTouch />
        </div>
        <div className="lazy-section">
          <FAQ />
        </div>
      </main>
    </>
  )
}

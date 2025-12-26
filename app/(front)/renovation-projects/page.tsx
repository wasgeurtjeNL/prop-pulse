import RenovationHero from '@/components/new-design/renovation/hero';
import RenovationProcess from '@/components/new-design/renovation/process';
import RenovationProjects from '@/components/new-design/renovation/projects';
import RenovationAdvantages from '@/components/new-design/renovation/advantages';
import InvestorLeadCTA from '@/components/new-design/renovation/investor-lead-cta';
import RenovationStats from '@/components/new-design/renovation/stats';
import RenovationTestimonials from '@/components/new-design/renovation/testimonials';

export const metadata = {
  title: 'In-House Renovation Projects | PSM Phuket',
  description: 'Discover our proven renovation process and completed projects. From acquisition to sale, we handle everything in-house - maximizing your ROI with our expert team.',
  keywords: 'Phuket renovation, property investment, ROI optimization, in-house renovation, property transformation',
};

export default function RenovationProjectsPage() {
  return (
    <main className="overflow-x-hidden">
      <RenovationHero />
      <RenovationStats />
      <RenovationProcess />
      <RenovationProjects />
      <RenovationAdvantages />
      <RenovationTestimonials />
      <InvestorLeadCTA />
    </main>
  );
}












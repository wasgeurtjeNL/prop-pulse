import RentalExpert from '@/components/new-design/home/rental-expert'

export const metadata = {
  title: 'Rental Services in Phuket | Find Your Perfect Home',
  description: 'Looking for a rental property in Phuket? Lionel Lopez, our rental specialist with 30 years of experience, helps you find the perfect long-term rental or vacation home. From budget apartments to luxury villas. Contact +66 61 714 2353.',
  keywords: 'rental services Phuket, property rental, long-term rental, vacation home, apartment rental, villa rental',
  openGraph: {
    title: 'Rental Services in Phuket | Real Estate Pulse',
    description: 'Expert rental services in Phuket. Find your perfect long-term rental or vacation home with 30 years of experience.',
  },
}

export default function RentalServicesPage() {
  return (
    <main>
      <RentalExpert />
    </main>
  )
}


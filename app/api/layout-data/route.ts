import { NextResponse } from "next/server";

const navLinks = [
  { label: 'Home', href: '/' },
  { 
    label: 'Buy Property', 
    href: '/properties',
    children: [
      { 
        label: 'All Properties', 
        href: '/properties',
        description: 'Browse our complete collection',
        icon: 'ph:buildings'
      },
      { 
        label: 'Luxury Villas', 
        href: '/properties?category=luxury-villa',
        description: 'Beachfront & hillside estates',
        icon: 'ph:house-line'
      },
      { 
        label: 'Apartments & Condos', 
        href: '/properties?category=apartment',
        description: 'Modern high-rise living',
        icon: 'ph:building-apartment'
      },
      { 
        label: 'Residential Homes', 
        href: '/properties?category=residential-home',
        description: 'Family homes & pool villas',
        icon: 'ph:house'
      },
      { 
        label: 'Commercial Spaces', 
        href: '/properties?category=office-spaces',
        description: 'Offices, retail & restaurants',
        icon: 'ph:storefront'
      },
      { 
        label: 'New Developments', 
        href: '/properties?listing-type=off-plan',
        description: 'Off-plan & pre-launch projects',
        icon: 'ph:crane'
      },
    ]
  },
  { 
    label: 'Invest', 
    href: '/renovation-projects',
    children: [
      { 
        label: 'Investment Opportunities', 
        href: '/renovation-projects',
        description: 'High-ROI property projects',
        icon: 'ph:chart-line-up'
      },
      { 
        label: 'Renovation Projects', 
        href: '/renovation-projects',
        description: 'In-house fix & flip (25-40% ROI)',
        icon: 'ph:hammer'
      },
      { 
        label: 'Property Management', 
        href: '/contactus',
        description: 'Full-service for investors',
        icon: 'ph:clipboard-text'
      },
      { 
        label: 'ROI Calculator', 
        href: '/contactus?subject=roi-calculation',
        description: 'Estimate your returns',
        icon: 'ph:calculator'
      },
    ]
  },
  { 
    label: 'Rentals', 
    href: '/rental-services',
    children: [
      { 
        label: 'Short Stay', 
        href: '/properties?type=FOR_RENT&shortStay=true',
        description: 'Daily & weekly rentals (< 30 days)',
        icon: 'ph:calendar-blank'
      },
      { 
        label: 'Long-term Rentals', 
        href: '/properties?type=FOR_RENT',
        description: 'Monthly & yearly contracts',
        icon: 'ph:calendar-check'
      },
      { 
        label: 'Vacation Rentals', 
        href: '/properties?type=FOR_RENT&category=luxury-villa',
        description: 'Holiday homes & villas',
        icon: 'ph:sun-horizon'
      },
      { 
        label: 'Rental Services', 
        href: '/rental-services',
        description: 'Expert rental guidance',
        icon: 'ph:user-circle-gear'
      },
      { 
        label: 'Tenant Services', 
        href: '/contactus?subject=tenant-inquiry',
        description: 'Support for renters',
        icon: 'ph:key'
      },
    ]
  },
  { 
    label: 'Sell Your Property', 
    href: '/list-your-property',
    highlight: true,
    icon: 'ph:tag'
  },
  { 
    label: 'Services', 
    href: '/about',
    children: [
      { 
        label: 'Buying Assistance', 
        href: '/contactus?subject=buying-help',
        description: 'End-to-end purchase support',
        icon: 'ph:handshake'
      },
      { 
        label: 'Property Valuation', 
        href: '/contactus?subject=valuation',
        description: 'Free market assessment',
        icon: 'ph:chart-bar'
      },
      { 
        label: 'Legal Services', 
        href: '/contactus?subject=legal',
        description: 'Title transfer & documentation',
        icon: 'ph:scales'
      },
      { 
        label: 'Relocation Services', 
        href: '/contactus?subject=relocation',
        description: 'Moving & settling in Phuket',
        icon: 'ph:airplane-takeoff'
      },
      { 
        label: 'Visa & Immigration', 
        href: '/contactus?subject=visa',
        description: 'Long-term visa assistance',
        icon: 'ph:identification-card'
      },
    ]
  },
  { 
    label: 'About', 
    href: '/about',
    children: [
      { 
        label: 'About PSM Phuket', 
        href: '/about',
        description: 'Our story & expertise',
        icon: 'ph:users-three'
      },
      { 
        label: 'Our Team', 
        href: '/about#team',
        description: 'Meet our professionals',
        icon: 'ph:user-circle'
      },
      { 
        label: 'Blog & Insights', 
        href: '/blogs',
        description: 'Market updates & guides',
        icon: 'ph:newspaper'
      },
      { 
        label: 'Testimonials', 
        href: '/about#testimonials',
        description: 'What our clients say',
        icon: 'ph:star'
      },
      { 
        label: 'Contact Us', 
        href: '/contactus',
        description: 'Get in touch today',
        icon: 'ph:envelope'
      },
    ]
  },
]

const footerLinks = [
  { label: 'Luxury Villas', href: '/properties?category=luxury-villa' },
  { label: 'Apartments', href: '/properties?category=apartment' },
  { label: 'Residential Homes', href: '/properties?category=residential-home' },
  { label: 'Commercial Spaces', href: '/properties?category=office-spaces' },
  { label: 'New Developments', href: '/properties?listing-type=off-plan' },
  { label: 'Investment Projects', href: '/renovation-projects' },
  { label: 'Rental Services', href: '/rental-services' },
  { label: 'Sell Your Property', href: '/list-your-property' },
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blogs' },
  { label: 'Contact Us', href: '/contactus' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
]

export const GET = async () => {
  return NextResponse.json({
    navLinks,
    footerLinks
  });
};

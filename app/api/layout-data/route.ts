import { NextResponse } from "next/server";

const navLinks = [
  { label: 'Home', href: '/' },
  { 
    label: 'Properties', 
    href: '/properties',
    children: [
      { 
        label: 'For Sale', 
        href: '/properties?type=FOR_SALE',
        description: 'Browse properties for sale',
        icon: 'ph:house-line'
      },
      { 
        label: 'For Rent', 
        href: '/properties?type=FOR_RENT',
        description: 'Long & short-term rentals',
        icon: 'ph:key'
      },
      { 
        label: 'New Developments', 
        href: '/properties?listing-type=off-plan',
        description: 'Off-plan & pre-launch',
        icon: 'ph:crane'
      },
    ]
  },
  { 
    label: 'Investment', 
    href: '/renovation-projects',
    children: [
      { 
        label: 'Renovation Projects', 
        href: '/renovation-projects',
        description: 'Fix & flip (25-40% ROI)',
        icon: 'ph:hammer'
      },
      { 
        label: 'High ROI Properties', 
        href: '/properties?investment=true',
        description: 'Investment opportunities',
        icon: 'ph:chart-line-up'
      },
    ]
  },
  { 
    label: 'About', 
    href: '/about',
    children: [
      { 
        label: 'Our Story', 
        href: '/about',
        description: 'About PSM Phuket',
        icon: 'ph:users-three'
      },
      { 
        label: 'Blog', 
        href: '/blogs',
        description: 'Market insights & guides',
        icon: 'ph:newspaper'
      },
      { 
        label: 'Contact', 
        href: '/contactus',
        description: 'Get in touch',
        icon: 'ph:envelope'
      },
    ]
  },
  { 
    label: 'Sell Property', 
    href: '/list-your-property',
    highlight: true,
    icon: 'ph:tag'
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

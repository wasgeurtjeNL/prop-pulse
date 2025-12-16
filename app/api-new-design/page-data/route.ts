import { FeaturedProperty } from '@/types/featuredProperty'
import { Testimonial } from "@/types/testimonial"
import { NextResponse } from 'next/server';

const featuredProprty: FeaturedProperty[] = [
  {
    scr: '/images/featuredproperty/image-1.jpg',
    alt: 'property6',
  },
  {
    scr: '/images/featuredproperty/image-2.jpg',
    alt: 'property7',
  },
  {
    scr: '/images/featuredproperty/image-3.jpg',
    alt: 'property8',
  },
  {
    scr: '/images/featuredproperty/image-4.jpg',
    alt: 'property9',
  },
]

const testimonials: Testimonial[] = [
    {
        image: 'https://ik.imagekit.io/slydc8kod/Jum%20(3).png',
        name: 'Jum - Property Consultant',
        review: 'At PSM Phuket, we specialize in helping you find your dream property in Thailand. Whether you\'re looking for a beachfront villa, a modern condo, or an investment opportunity, our experienced team provides personalized guidance throughout the entire process. We offer comprehensive market insights, legal support, and property management services to ensure your investment is secure and profitable.',
        position: 'PSM Phuket Team'
    },
    {
        image: '/images/testimonial/johns.jpg',
        name: 'Sam & Mickay John',
        review: 'I quickly found my dream home! The listings were thorough, the photos were spot-on, and the entire process was smooth. The customer service was outstanding, addressing all my questions with ease. I’ll definitely use this platform again!',
        position: 'Buyer'
    },
]

export const GET = async () => {
  return NextResponse.json({
    featuredProprty,
    testimonials
  });
};
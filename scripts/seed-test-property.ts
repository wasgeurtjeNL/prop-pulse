/**
 * Seed Test Property with New Schema
 * Run with: npx tsx scripts/seed-test-property.ts
 */

import prisma from '../lib/prisma';
import { PropertyCategory, PropertyType, Status } from '../lib/generated/prisma/client';

async function seedTestProperty() {
  console.log('🌱 Seeding test property with new schema...\n');

  try {
    // First, find or create a test user
    let user = await prisma.user.findFirst({
      where: { email: { contains: '@' } }
    });

    if (!user) {
      // Create demo user
      user = await prisma.user.create({
        data: {
          id: 'test-user-001',
          name: 'Demo Agent',
          email: 'demo@realestatepulse.com',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'AGENT',
        },
      });
      console.log('✅ Created demo user:', user.email);
    }

    // Create property with ALL new fields
    const property = await prisma.property.create({
      data: {
        title: 'Luxury Ocean View Villa',
        slug: 'luxury-ocean-view-villa',
        location: '123 Sunset Boulevard, Malibu, CA',
        price: '$2,750,000',
        beds: 5,
        baths: 4.5,
        sqft: 4500,
        type: PropertyType.FOR_SALE,
        category: PropertyCategory.LUXURY_VILLA,
        tag: 'Featured',
        status: Status.ACTIVE,
        image: '/images/property/property-1/property-cover-1.jpg',
        
        // New fields
        shortDescription: 'Experience unparalleled luxury in this stunning oceanfront villa with breathtaking views and modern amenities.',
        
        descriptionParagraphs: [
          'Nestled along the pristine coastline of Malibu, this architectural masterpiece offers an extraordinary blend of sophistication and coastal living. With floor-to-ceiling windows throughout, natural light floods every room while showcasing panoramic ocean views.',
          'The gourmet chef\'s kitchen features top-of-the-line appliances, custom cabinetry, and a large island perfect for entertaining. The open-concept design seamlessly connects indoor and outdoor living spaces.',
          'The luxurious master suite serves as a private sanctuary, complete with a spa-like bathroom, walk-in closets, and a private terrace overlooking the ocean. Four additional bedrooms provide ample space for family and guests.',
          'Outside, the infinity pool seems to merge with the ocean horizon, while the outdoor kitchen and multiple seating areas create the perfect setting for California coastal living.',
        ],
        
        propertyFeatures: [
          {
            title: 'Oceanfront Location',
            description: 'Direct beach access with stunning panoramic ocean views from every room.',
            icon: 'ocean-view'
          },
          {
            title: 'Smart Home Technology',
            description: 'Fully integrated smart home system controlling lighting, climate, and security.',
            icon: 'smart-home-access'
          },
          {
            title: 'Eco-Friendly Design',
            description: 'Solar panels, energy-efficient systems, and sustainable materials throughout.',
            icon: 'energyefficient'
          }
        ],
        
        content: 'This is the legacy content field for backward compatibility.',
        amenities: ['Pool', 'Beach Access', 'Home Theater', 'Wine Cellar'],
        
        amenitiesWithIcons: [
          { name: 'Infinity Pool & Spa', icon: 'ph:swimming-pool' },
          { name: 'Private Beach Access', icon: 'ph:waves' },
          { name: 'Home Theater', icon: 'ph:film-strip' },
          { name: 'Wine Cellar', icon: 'ph:wine' },
          { name: 'Gourmet Kitchen', icon: 'ph:chef-hat' },
          { name: 'Fitness Center', icon: 'ph:barbell' },
          { name: 'Ocean View Terrace', icon: 'ph:sun-horizon' },
          { name: 'Smart Home System', icon: 'ph:house-line' },
          { name: 'Security System', icon: 'ph:shield-check' },
        ],
        
        yearBuilt: 2024,
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.4901556469894!2d-118.67885!3d34.03913!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDAyJzIwLjkiTiAxMTjCsDQwJzQzLjkiVw!5e0!3m2!1sen!2sus!4v1234567890',
        
        userId: user.id,
      },
    });

    console.log('\n✅ Created property:', property.title);
    console.log('   - ID:', property.id);
    console.log('   - Category:', property.category);
    console.log('   - Year Built:', property.yearBuilt);

    // Create property images (4 positions)
    const images = await prisma.propertyImage.createMany({
      data: [
        {
          propertyId: property.id,
          url: '/images/property/property-1/property-cover-1.jpg',
          position: 1,
          alt: 'Luxury Ocean View Villa - Main View'
        },
        {
          propertyId: property.id,
          url: '/images/property/property-1/property-1.jpg',
          position: 2,
          alt: 'Luxury Ocean View Villa - Living Room'
        },
        {
          propertyId: property.id,
          url: '/images/property/property-1/property-2.jpg',
          position: 3,
          alt: 'Luxury Ocean View Villa - Kitchen'
        },
        {
          propertyId: property.id,
          url: '/images/property/property-1/property-3.jpg',
          position: 4,
          alt: 'Luxury Ocean View Villa - Bedroom'
        },
      ],
    });

    console.log('\n✅ Created', images.count, 'property images (positions 1-4)');
    
    console.log('\n🎉 Test property seeded successfully!');
    console.log('\n📍 Next steps:');
    console.log('   1. Visit http://localhost:3000/properties');
    console.log('   2. Click on "Luxury Ocean View Villa"');
    console.log('   3. See all new fields in action!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestProperty()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });










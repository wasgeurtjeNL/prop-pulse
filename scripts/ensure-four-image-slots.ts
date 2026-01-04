/**
 * Script to ensure every property has exactly 4 PropertyImage records (positions 1-4)
 * Empty slots will have url = null
 * This makes it clear in the database which image slots are filled and which are empty
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureFourImageSlots() {
  try {
    console.log('🔍 Checking all properties...\n');

    // Get all properties with their images
    const properties = await prisma.property.findMany({
      include: {
        images: {
          orderBy: { position: 'asc' }
        }
      }
    });

    console.log(`Found ${properties.length} properties\n`);

    let updatedCount = 0;
    let createdSlotsCount = 0;

    for (const property of properties) {
      const existingPositions = property.images.map(img => img.position);
      const missingPositions = [1, 2, 3, 4].filter(pos => !existingPositions.includes(pos));

      if (missingPositions.length > 0) {
        console.log(`📝 Property: ${property.title} (${property.slug})`);
        console.log(`   Existing slots: [${existingPositions.join(', ')}]`);
        console.log(`   Creating slots: [${missingPositions.join(', ')}]`);

        // Create missing slots with null URLs
        for (const position of missingPositions) {
          await prisma.propertyImage.create({
            data: {
              propertyId: property.id,
              position: position,
              url: null,
              alt: `Image ${position} slot - empty`
            }
          });
          createdSlotsCount++;
        }

        updatedCount++;
        console.log(`   ✅ Done\n`);
      }
    }

    console.log('\n✨ Summary:');
    console.log(`   Properties updated: ${updatedCount}`);
    console.log(`   Image slots created: ${createdSlotsCount}`);
    console.log(`   Total properties: ${properties.length}`);
    
    if (updatedCount === 0) {
      console.log('\n✅ All properties already have 4 image slots!');
    } else {
      console.log('\n✅ All properties now have 4 image slots (1-4)');
      console.log('   Filled slots: url contains image URL');
      console.log('   Empty slots: url = null');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
ensureFourImageSlots()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

















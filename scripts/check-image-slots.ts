import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkImageSlots() {
  const properties = await prisma.property.findMany({
    include: {
      images: {
        orderBy: { position: 'asc' }
      }
    }
  });

  console.log(`Total properties: ${properties.length}\n`);

  for (const property of properties) {
    console.log(`Property: ${property.title}`);
    console.log(`  Image slots: ${property.images.length}`);
    
    for (const img of property.images) {
      console.log(`    Position ${img.position}: ${img.url ? 'FILLED ✓' : 'EMPTY ○'}`);
    }
    
    console.log('');
  }

  await prisma.$disconnect();
}

checkImageSlots();







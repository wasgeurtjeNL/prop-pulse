/**
 * Script to delete seeded demo properties
 * Run with: npx tsx scripts/delete-seed-properties.ts
 */

import prisma from "@/lib/prisma";

// Slugs of seeded demo properties to delete
const SEED_PROPERTY_SLUGS = [
  "luxury-beachfront-villa-kamala",
  "modern-sea-view-condo",
  "tropical-pool-villa-rawai",
  "pattaya-beach-condo",
  "bang-tao-luxury-residence",
  "pratumnak-hill-penthouse",
];

async function main() {
  console.log("🗑️  Deleting seeded demo properties...\n");

  for (const slug of SEED_PROPERTY_SLUGS) {
    try {
      const property = await prisma.property.findUnique({
        where: { slug },
      });

      if (property) {
        // Delete related images first
        await prisma.propertyImage.deleteMany({
          where: { propertyId: property.id },
        });

        // Delete the property
        await prisma.property.delete({
          where: { slug },
        });
        console.log(`✓ Deleted: ${property.title}`);
      } else {
        console.log(`- Skipped (not found): ${slug}`);
      }
    } catch (error) {
      console.error(`✗ Error deleting ${slug}:`, error);
    }
  }

  // Show remaining properties
  const remaining = await prisma.property.findMany({
    select: { title: true, slug: true },
  });

  console.log("\n📋 Remaining properties:");
  if (remaining.length === 0) {
    console.log("   (none)");
  } else {
    remaining.forEach((p) => console.log(`   - ${p.title} (${p.slug})`));
  }

  console.log("\n✅ Done!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });






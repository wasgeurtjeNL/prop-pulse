import { PropertyType, Status } from "@prisma/client";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import bcrypt from "bcrypt";

// Test user credentials for development
const TEST_USER = {
  id: "In0C25ONqtTF3m5eAZDP49XlUYoSMMFO",
  name: "Test Agent",
  email: "agent@test.com",
  password: "password123", // Will be hashed
};

const RAW_PROPERTIES = [
  {
    title: "Luxury Beachfront Villa Kamala",
    location: "Kamala Beach, Phuket",
    price: "฿45,000,000",
    beds: 5,
    baths: 5,
    sqft: 4500,
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=800&auto=format&fit=crop",
    type: "For Sale",
    tag: "Beachfront",
  },
  {
    title: "Modern Sea View Condo",
    location: "Patong, Phuket",
    price: "฿85,000 / mo",
    beds: 2,
    baths: 2,
    sqft: 1200,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
    type: "For Rent",
    tag: "Sea View",
  },
  {
    title: "Tropical Pool Villa Rawai",
    location: "Rawai, Phuket",
    price: "฿28,500,000",
    beds: 4,
    baths: 4,
    sqft: 3200,
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop",
    type: "For Sale",
    tag: "Pool Villa",
  },
  {
    title: "Pattaya Beach Condo",
    location: "Jomtien Beach, Pattaya",
    price: "฿12,500,000",
    beds: 3,
    baths: 2,
    sqft: 1800,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
    type: "For Sale",
    tag: "Investment",
  },
  {
    title: "Bang Tao Luxury Residence",
    location: "Bang Tao, Phuket",
    price: "฿52,000,000",
    beds: 6,
    baths: 6,
    sqft: 5000,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800&auto=format&fit=crop",
    type: "For Sale",
    tag: "Ultra Luxury",
  },
  {
    title: "Pratumnak Hill Penthouse",
    location: "Pratumnak, Pattaya",
    price: "฿120,000 / mo",
    beds: 3,
    baths: 3,
    sqft: 2200,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop",
    type: "For Rent",
    tag: "Penthouse",
  },
];

async function main() {
  // 1. Create test user first
  const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
  
  const user = await prisma.user.upsert({
    where: { id: TEST_USER.id },
    update: {},
    create: {
      id: TEST_USER.id,
      name: TEST_USER.name,
      email: TEST_USER.email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "ADMIN",
      accounts: {
        create: {
          id: `${TEST_USER.id}-account`,
          accountId: TEST_USER.id,
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log(`✓ Created user: ${user.email}`);
  console.log(`  Email: ${TEST_USER.email}`);
  console.log(`  Password: ${TEST_USER.password}`);

  // 2. Create properties
  for (const p of RAW_PROPERTIES) {
    const slug = slugify(p.title);

    const propertyType =
      p.type === "For Rent" ? PropertyType.FOR_RENT : PropertyType.FOR_SALE;

    const property = await prisma.property.upsert({
      where: { slug: slug },
      update: {},
      create: {
        title: p.title,
        slug: slug,
        location: p.location,
        price: p.price,
        beds: p.beds,
        baths: p.baths,
        sqft: p.sqft,
        type: propertyType,
        tag: p.tag,
        image: p.image,
        userId: TEST_USER.id,
        status: Status.ACTIVE,

        content: `<h2>Tropical Paradise Awaits</h2><p>Experience luxurious Thailand living in this stunning ${p.title}. Perfectly located in ${p.location}, this exceptional property offers the ultimate blend of modern comfort and tropical elegance.</p><p><strong>Prime Location Benefits:</strong></p><ul><li>Easy access to pristine beaches</li><li>Close to international restaurants and shopping</li><li>Excellent rental investment potential</li><li>Expat-friendly community</li></ul><p>Whether you're seeking a permanent residence, holiday home, or investment property, this is your gateway to the Thai lifestyle.</p>`,

        amenities: [
          "Infinity Pool",
          "Ocean/Mountain Views",
          "24/7 Security",
          "Covered Parking",
          "Fully Furnished",
          "High-Speed WiFi",
          "Modern Kitchen",
          "Air Conditioning",
        ],
      },
    });
    console.log(`✓ Created property: ${property.title}`);
  }

  console.log(`\n🎉 Seeding finished!`);
  console.log(`\n📝 You can now login with:`);
  console.log(`   Email: ${TEST_USER.email}`);
  console.log(`   Password: ${TEST_USER.password}`);
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

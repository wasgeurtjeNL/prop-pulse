import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // First, list all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  
  console.log('Current users:');
  console.log(JSON.stringify(users, null, 2));
  
  // Find Jack Wullems and update to admin
  const jackUser = users.find(u => u.email?.includes('wullems') || u.name?.includes('Jack'));
  
  if (jackUser) {
    console.log(`\nUpdating user ${jackUser.email} to admin role...`);
    
    await prisma.user.update({
      where: { id: jackUser.id },
      data: { role: 'admin' }
    });
    
    console.log('User role updated to admin!');
  } else {
    console.log('User not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());




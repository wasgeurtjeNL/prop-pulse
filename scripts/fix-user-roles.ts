/**
 * Fix User Roles - Give AGENT role to users without one
 * Run with: npx tsx scripts/fix-user-roles.ts
 */

import prisma from '../lib/prisma';

async function fixUserRoles() {
  console.log('🔧 Fixing user roles...\n');

  try {
    // Update all users without a role to AGENT
    const result = await prisma.user.updateMany({
      where: {
        OR: [
          { role: null },
          { role: "" },
        ]
      },
      data: {
        role: "AGENT"
      }
    });

    console.log(`✅ Updated ${result.count} users to AGENT role\n`);

    // Show all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    console.log('📋 Current users:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}): ${user.role || 'NO ROLE'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();






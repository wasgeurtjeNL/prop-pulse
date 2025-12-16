/**
 * Database Backup Script - Export Properties Before Migration
 * Run with: npx tsx scripts/backup-properties.ts
 */

import prisma from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function backupProperties() {
  console.log('🔄 Starting property backup...\n');

  try {
    // Fetch all properties
    const properties = await prisma.property.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Found ${properties.length} properties to backup\n`);

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create backup file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `properties-backup-${timestamp}.json`);

    // Write backup
    fs.writeFileSync(backupFile, JSON.stringify(properties, null, 2));

    console.log(`✅ Backup saved to: ${backupFile}\n`);
    console.log('📊 Backup Summary:');
    console.log(`   - Total Properties: ${properties.length}`);
    console.log(`   - File Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
    
    // Display property details
    console.log('\n📋 Properties in backup:');
    properties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title} (${prop.slug})`);
      console.log(`      - Price: ${prop.price}`);
      console.log(`      - Location: ${prop.location}`);
      console.log(`      - Type: ${prop.type}`);
      console.log(`      - Status: ${prop.status}`);
      console.log(`      - Owner: ${prop.user.name} (${prop.user.email})`);
      console.log('');
    });

    console.log('✅ Backup completed successfully!');
    console.log('\n⚠️  IMPORTANT: Keep this backup file safe!');
    console.log('   You can restore data after migration using restore-properties.ts\n');

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backupProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });






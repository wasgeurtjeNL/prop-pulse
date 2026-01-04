/**
 * Force migration execution
 * This will drop the old Property table and create the new schema
 */

const { execSync } = require('child_process');

console.log('🚀 Starting database migration...\n');
console.log('⚠️  This will drop the existing Property table (13 rows)\n');

try {
  // Run migration with --create-only first
  console.log('📝 Creating migration file...');
  execSync('npx prisma migrate dev --name add_property_enhancements --create-only', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Migration file created!');
  console.log('🔄 Applying migration...\n');
  
  // Apply the migration
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Migration completed successfully!');
  console.log('🎉 Database schema updated!\n');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}















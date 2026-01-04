/**
 * Script to delete ALL Facebook Marketplace leads from the database
 * Run with: npx tsx scripts/delete-all-fb-leads.ts
 */

import prisma from "../lib/prisma";

async function deleteAllFbLeads() {
  console.log("🗑️  Deleting ALL Facebook Marketplace leads...\n");

  try {
    // Count before deletion
    const countBefore = await prisma.fbMarketplaceLead.count();
    console.log(`📊 Found ${countBefore} leads in database`);

    if (countBefore === 0) {
      console.log("✅ No leads to delete!");
      return;
    }

    // Delete all
    const result = await prisma.fbMarketplaceLead.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.count} leads!`);
    
    // Verify
    const countAfter = await prisma.fbMarketplaceLead.count();
    console.log(`📊 Leads remaining: ${countAfter}`);

  } catch (error) {
    console.error("❌ Error deleting leads:", error);
  }
}

deleteAllFbLeads();

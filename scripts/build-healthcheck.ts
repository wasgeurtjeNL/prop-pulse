/**
 * Build-time health check script
 * Runs before Next.js build to verify critical services are working
 * Exit code 1 = build fails, Exit code 0 = build continues
 * 
 * @developer Jack Wullems
 * @contact jackwullems18@gmail.com
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Load environment variables from .env.local (local dev) or .env (production)
config({ path: ".env.local" });
config({ path: ".env" });

function createPrismaClient() {
  const adapter = new PrismaPg({ 
    connectionString: process.env.DATABASE_URL,
  });
  
  return new PrismaClient({ 
    adapter,
    log: ["error"],
  });
}

async function healthCheck() {
  console.log("🔍 Running pre-build health checks...\n");

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check required environment variables first (before DB)
  console.log("🔐 Checking environment variables...");
  
  const requiredEnvVars = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
  ];

  const optionalEnvVars = [
    "PERPLEXITY_API_KEY",
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_PRIVATE_KEY",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_ACCESS_TOKEN",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required env var: ${envVar}`);
      console.log(`   ❌ Missing: ${envVar}`);
    } else {
      console.log(`   ✅ ${envVar} is set`);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Missing optional env var: ${envVar}`);
      console.log(`   ⚠️  Missing (optional): ${envVar}`);
    } else {
      console.log(`   ✅ ${envVar} is set`);
    }
  }

  // Stop early if DATABASE_URL is missing
  if (!process.env.DATABASE_URL) {
    console.log("\n" + "=".repeat(50));
    console.log("\n❌ Cannot continue: DATABASE_URL is required\n");
    console.log("🚫 BUILD BLOCKED - Fix errors above before deploying\n");
    process.exit(1);
  }

  // 2. Check database connection
  console.log("\n📦 Checking database connection...");
  const prisma = createPrismaClient();
  
  try {
    // Simple query to test connection
    await prisma.$executeRaw`SELECT 1`;
    console.log("   ✅ Database connection successful");

    // 3. Verify critical models exist and are accessible
    console.log("\n📋 Checking Prisma models...");
    
    const modelChecks = [
      { name: "CompanyProfile", fn: () => prisma.companyProfile.findFirst() },
      { name: "InternalLink", fn: () => prisma.internalLink.count() },
      { name: "Blog", fn: () => prisma.blog.count() },
      { name: "Property", fn: () => prisma.property.count() },
      { name: "SiteSettings", fn: () => prisma.siteSettings.findFirst() },
      { name: "TopicSuggestion", fn: () => prisma.topicSuggestion.count() },
    ];

    for (const check of modelChecks) {
      try {
        await check.fn();
        console.log(`   ✅ ${check.name} model accessible`);
      } catch (err: any) {
        const message = `${check.name} model error: ${err.message?.substring(0, 100)}`;
        errors.push(message);
        console.log(`   ❌ ${message}`);
      }
    }

  } catch (err: any) {
    errors.push(`Database connection failed: ${err.message?.substring(0, 100)}`);
    console.log(`   ❌ Database connection failed: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} error(s) found:`);
    errors.forEach((e) => console.log(`   - ${e}`));
    console.log("\n🚫 BUILD BLOCKED - Fix errors above before deploying\n");
    process.exit(1);
  }

  console.log("\n✅ All health checks passed! Proceeding with build...\n");
  process.exit(0);
}

healthCheck().catch((err) => {
  console.error("❌ Health check script crashed:", err.message || err);
  process.exit(1);
});

/**
 * Prisma Database Client Configuration
 * 
 * Handles database connections with proper error recovery for serverless environments.
 * Supports both direct PostgreSQL connections and Prisma Accelerate.
 * 
 * @developer Jack Wullems
 * @contact jackwullems18@gmail.com
 */

import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Type for the extended Prisma client
type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as { 
  prisma: ExtendedPrismaClient | undefined;
  lastConnectionTime: number | undefined;
};

// Connection timeout in milliseconds (refresh connection after 5 minutes of inactivity)
const CONNECTION_REFRESH_INTERVAL = 5 * 60 * 1000;

function createPrismaClient(): ExtendedPrismaClient {
  // Configure the adapter with connection string
  const adapter = new PrismaPg({ 
    connectionString: process.env.DATABASE_URL,
  });
  
  return new PrismaClient({ 
    adapter,
    // Log warnings and errors in development
    log: process.env.NODE_ENV === "development" 
      ? ["warn", "error"] 
      : ["error"],
  }).$extends(withAccelerate());
}

function getPrismaClient(): ExtendedPrismaClient {
  const now = Date.now();
  
  // In production, check if we need to refresh the connection
  // This helps with serverless cold starts and idle connection timeouts
  if (process.env.NODE_ENV === "production") {
    const lastConnection = globalForPrisma.lastConnectionTime || 0;
    const timeSinceLastConnection = now - lastConnection;
    
    // If connection is stale, create a new one
    if (!globalForPrisma.prisma || timeSinceLastConnection > CONNECTION_REFRESH_INTERVAL) {
      globalForPrisma.prisma = createPrismaClient();
      globalForPrisma.lastConnectionTime = now;
    }
    
    return globalForPrisma.prisma;
  }
  
  // In development, reuse the same connection to prevent too many connections
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.lastConnectionTime = now;
  }
  
  return globalForPrisma.prisma;
}

const prisma = getPrismaClient();

export default prisma;

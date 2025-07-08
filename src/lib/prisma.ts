import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Enhanced Prisma configuration with better error handling and connection management
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
    // Enhanced connection configuration for stability
    datasourceUrl:
      process.env.NODE_ENV === "test"
        ? (process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL)
        : process.env.DATABASE_URL,
  });

// Improved connection management for different environments
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Add connection test function for diagnostics
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

// Enhanced disconnect handling
process.on("beforeExit", () => {
  void prisma.$disconnect();
});

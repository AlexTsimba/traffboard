// Database connection test utility
import { prisma } from "./prisma";

export async function testDatabaseConnection() {
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful");

    // Test that we can query the User table (from NextAuth)
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible, count: ${userCount}`);

    return { success: true, userCount };
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function ensureDatabaseTables() {
  try {
    // This will fail if tables don't exist, indicating we need to run migrations
    await prisma.user.findFirst();
    await prisma.account.findFirst();
    await prisma.session.findFirst();
    console.log("✅ Core tables exist");
    return { success: true };
  } catch (error) {
    console.log("⚠️ Tables may not exist yet, run: npx prisma db push");
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

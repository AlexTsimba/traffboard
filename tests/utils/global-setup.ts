import { FullConfig } from "@playwright/test";
import { DatabaseHelper } from "./database";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting E2E test setup...");

  try {
    // Ensure clean database state
    await DatabaseHelper.cleanup();
    console.log("✅ Database cleaned");

    // Seed required test data
    const admin = await DatabaseHelper.seedAdminUser();
    const user = await DatabaseHelper.seedTestUser();
    console.log("✅ Test users seeded:", { admin: admin.email, user: user.email });

    console.log("🎉 E2E test setup completed");
  } catch (error) {
    console.error("❌ Failed to setup E2E tests:", error);
    throw error;
  }
}

export default globalSetup;

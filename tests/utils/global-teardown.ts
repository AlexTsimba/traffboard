import { FullConfig } from "@playwright/test";
import { DatabaseHelper } from "./database";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting E2E test teardown...");

  try {
    // Clean up test data
    await DatabaseHelper.cleanup();
    console.log("✅ Test data cleaned up");

    // Disconnect from database
    await DatabaseHelper.disconnect();
    console.log("✅ Database connection closed");

    console.log("🎉 E2E test teardown completed");
  } catch (error) {
    console.error("❌ Failed to teardown E2E tests:", error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;

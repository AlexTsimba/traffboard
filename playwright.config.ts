import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "tests/results/html", open: "never" }],
    ["json", { outputFile: "tests/results/results.json" }],
    ["junit", { outputFile: "tests/results/junit.xml" }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: !!process.env.CI,
  },
  
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        // Disable dev tools for consistent testing
        launchOptions: {
          args: ["--disable-dev-shm-usage", "--no-sandbox"],
        },
      },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve("./tests/utils/global-setup.ts"),
  globalTeardown: require.resolve("./tests/utils/global-teardown.ts"),

  // Web server configuration for CI
  webServer: process.env.CI
    ? {
        command: "npm run build && npm run start",
        port: 3000,
        timeout: 120_000,
        reuseExistingServer: false,
        env: {
          NODE_ENV: "test",
          DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "",
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "test-secret-for-ci",
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
        },
      }
    : undefined,
});

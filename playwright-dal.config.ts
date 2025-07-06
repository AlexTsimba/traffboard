import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/dal",
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,

  globalSetup: "./e2e/config/global-setup.ts",
  globalTeardown: "./e2e/config/global-teardown.ts",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  outputDir: "test-results-dal/",

  reporter: [
    ["html", { outputFolder: "playwright-report-dal", open: "never" }],
    ["json", { outputFile: "test-results-dal.json" }],
    process.env.CI ? ["github"] : ["list"],
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

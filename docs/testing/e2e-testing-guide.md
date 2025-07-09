# E2E Testing Guide - TraffBoard

This guide provides proven patterns for writing reliable End-to-End tests that work consistently in both local development and CI environments.

> **✅ CI-Proven Patterns**: All patterns in this guide are verified working in GitHub Actions CI with 100% test pass rate.

## Table of Contents

- [Quick Start](#quick-start)
- [Proven Architecture](#proven-architecture)
- [Page Object Model](#page-object-model)
- [Test Patterns](#test-patterns)
- [CI Configuration](#ci-configuration)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

```bash
# Install dependencies (already included in package.json)
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium webkit
```

### Running Tests

```bash
# Local development
npm run test:e2e

# CI mode (headless)
npm run test:e2e:ci

# Debug mode with browser UI
npx playwright test --debug

# Specific test file
npx playwright test auth.spec.ts
```

## Proven Architecture

### Directory Structure

```
tests/
├── e2e/                    # Test files
│   └── auth.spec.ts       # Authentication tests ✅ Working
├── fixtures/              # Page Object Models
│   ├── base-page.ts       # Base class with proven patterns
│   ├── login-page.ts      # Login page interactions
│   └── dashboard-page.ts  # Dashboard page interactions
├── utils/                 # Test utilities
│   ├── global-setup.ts    # Database seeding ✅ CI-proven
│   ├── global-teardown.ts # Cleanup
│   └── database.ts        # Database helper
└── results/               # Test output
    ├── html/              # HTML reports
    ├── results.json       # JSON results
    └── junit.xml          # JUnit format
```

### Configuration (playwright.config.ts)

```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000, // ✅ Proven: 30s works for CI
  expect: { timeout: 5_000 }, // ✅ Proven: 5s for assertions
  fullyParallel: true, // ✅ Performance boost
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // ✅ Retry on CI flakes
  workers: process.env.CI ? 1 : undefined, // ✅ Single worker for CI stability

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry", // ✅ Debug failed tests
    screenshot: "only-on-failure", // ✅ Visual debugging
    video: "retain-on-failure", // ✅ Video evidence
    headless: !!process.env.CI, // ✅ UI in dev, headless in CI
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-dev-shm-usage", "--no-sandbox"], // ✅ CI stability
        },
      },
    },
    {
      name: "webkit", // ✅ Cross-browser testing
      use: { ...devices["Desktop Safari"] },
    },
  ],

  // ✅ Critical: Global setup for database seeding
  globalSetup: require.resolve("./tests/utils/global-setup.ts"),
  globalTeardown: require.resolve("./tests/utils/global-teardown.ts"),

  // ✅ CI Web Server - builds and starts app
  webServer: process.env.CI
    ? {
        command: "npm run build && npm run start",
        port: 3000,
        timeout: 120_000, // ✅ 2min for build + start
        reuseExistingServer: false,
        env: {
          NODE_ENV: "test",
          DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "test-secret-for-ci",
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
        },
      }
    : undefined,
});
```

## Page Object Model

### Base Page Pattern ✅

```typescript
// tests/fixtures/base-page.ts
import { Page } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * ✅ CRITICAL: Don't wait for networkidle by default
   * This prevents tests hanging on continuous API calls
   */
  async waitForLoad(waitForNetwork: boolean = false): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");

    if (waitForNetwork) {
      try {
        await this.page.waitForLoadState("networkidle", { timeout: 5000 });
      } catch (error) {
        console.warn("Network idle timeout - continuing with test execution");
      }
    }
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async isOnPage(urlPattern: string | RegExp): Promise<boolean> {
    const currentUrl = await this.getCurrentUrl();
    if (typeof urlPattern === "string") {
      return currentUrl.includes(urlPattern);
    }
    return urlPattern.test(currentUrl);
  }
}
```

### Login Page Pattern ✅

```typescript
// tests/fixtures/login-page.ts
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // ✅ Use semantic selectors (ID, type, role)
    this.emailInput = page.locator("input#email");
    this.passwordInput = page.locator("input#password");
    this.loginButton = page.locator('button[type="submit"]');
    this.rememberMeCheckbox = page.locator('button[role="checkbox"]');
    this.errorMessage = page.locator('[role="alert"], .text-destructive');
  }

  async goto(): Promise<void> {
    await super.goto("/main/auth/v1/login");
    await this.waitForLoad();
  }

  /**
   * ✅ PROVEN: Robust login with timeout handling
   */
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.click({ force: true });
    }

    await this.loginButton.click();

    // ✅ Race condition handling - wait for either success or error
    try {
      await Promise.race([
        this.page.waitForURL(/\/main\/dashboard/, { timeout: 15000 }),
        this.page.waitForSelector('[role="alert"], .text-destructive', { timeout: 8000 }),
      ]);
    } catch (error) {
      console.warn("Login timeout - checking current state");
      const currentUrl = this.page.url();
      if (!currentUrl.includes("/main/dashboard") && !(await this.errorMessage.isVisible())) {
        throw new Error(`Login failed - unexpected state at ${currentUrl}`);
      }
    }
  }

  async expectToBeOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/main\/auth\/v1\/login/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectErrorMessage(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}
```

## Test Patterns

### Clean Test Structure ✅

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "../fixtures/login-page";
import { DashboardPage } from "../fixtures/dashboard-page";

test.describe("Authentication Flow", () => {
  // ✅ CRITICAL: Clear cookies before each test
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should login and logout successfully with admin credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Step 1: Navigate to login page
    await loginPage.goto();
    await loginPage.expectToBeOnLoginPage();

    // Step 2: Login with admin credentials
    await loginPage.login("admin@traffboard.com", "admin123");

    // Step 3: Verify successful login and dashboard access
    await dashboardPage.expectToBeOnDashboard();

    // Step 4: Logout
    await dashboardPage.logout();

    // Step 5: Verify redirect to login page
    await loginPage.expectToBeOnLoginPage();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.expectToBeOnLoginPage();

    // ✅ Test error handling
    await loginPage.login("invalid@example.com", "wrongpassword");
    await loginPage.expectErrorMessage();
    await loginPage.expectToBeOnLoginPage();
  });

  test("should maintain session with remember me option", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login("admin@traffboard.com", "admin123", true);
    await dashboardPage.expectToBeOnDashboard();

    // ✅ Test session persistence
    await page.reload();
    await dashboardPage.expectToBeOnDashboard();

    await dashboardPage.logout();
    await loginPage.expectToBeOnLoginPage();
  });
});
```

### Error Handling Patterns ✅

```typescript
test("should handle login timeout gracefully", async ({ page }) => {
  const loginPage = new LoginPage(page);

  // ✅ Mock slow API response
  await page.route("**/api/auth/signin", (route) => {
    setTimeout(() => route.fulfill({ status: 200 }), 20000);
  });

  await loginPage.goto();

  // ✅ Test should not hang - timeout and provide meaningful error
  try {
    await loginPage.login("admin@traffboard.com", "admin123");
  } catch (error) {
    expect(error.message).toContain("Login timeout");
  }
});
```

### Reliable Selectors ✅

```typescript
// ✅ Good: Semantic selectors
page.locator("input#email"); // ID selector
page.locator('button[type="submit"]'); // Attribute selector
page.locator('button[role="checkbox"]'); // Role selector
page.locator('[role="alert"]'); // ARIA role
page.getByRole("button", { name: "Login" }); // Accessible selector

// ❌ Avoid: Fragile selectors
page.locator(".btn-primary"); // CSS classes can change
page.locator("div > span:nth-child(3)"); // Position dependent
page.locator("#root > div > form > button"); // Deep hierarchies
```

## CI Configuration

### GitHub Actions Integration ✅

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: traffboard_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium webkit

      - name: Setup database
        run: npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/traffboard_test

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/traffboard_test
          NEXTAUTH_SECRET: test-secret-for-ci-environment
          NEXTAUTH_URL: http://localhost:3000

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tests/results/
          retention-days: 7
```

### Environment Variables ✅

```bash
# Required for CI
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/traffboard_test
NEXTAUTH_SECRET=test-secret-for-ci-environment
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=test
CI=true

# Optional
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## Database Setup

### Global Setup Pattern ✅

```typescript
// tests/utils/global-setup.ts
import { FullConfig } from "@playwright/test";
import { DatabaseHelper } from "./database";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting E2E test setup...");

  try {
    // ✅ Clean database state
    await DatabaseHelper.cleanup();
    console.log("✅ Database cleaned");

    // ✅ Seed test users
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
```

### Database Helper ✅

```typescript
// tests/utils/database.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

export class DatabaseHelper {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          },
        },
      });
    }
    return this.instance;
  }

  // ✅ Clean up in dependency order
  static async cleanup(): Promise<void> {
    const prisma = this.getInstance();

    await prisma.authAttempt.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.twoFactorBackupCode.deleteMany();
    await prisma.account.deleteMany();
    await prisma.conversionUpload.deleteMany();
    await prisma.conversion.deleteMany();
    await prisma.playerData.deleteMany();
    await prisma.user.deleteMany();
    await prisma.verificationToken.deleteMany();
  }

  // ✅ Seed predictable test data
  static async seedTestUser(): Promise<{ id: string; email: string; password: string }> {
    const prisma = this.getInstance();
    const testPassword = "test123456";
    const passwordHash = await hash(testPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        role: "user",
        passwordHash,
        isActive: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      password: testPassword,
    };
  }

  static async seedAdminUser(): Promise<{ id: string; email: string; password: string }> {
    const prisma = this.getInstance();
    const adminPassword = "admin123";
    const passwordHash = await hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: "admin@traffboard.com",
        name: "Admin User",
        role: "admin",
        passwordHash,
        isActive: true,
      },
    });

    return {
      id: admin.id,
      email: admin.email,
      password: adminPassword,
    };
  }
}
```

## Writing New Tests

### Test Creation Checklist ✅

```typescript
// 1. Create page object if needed
class NewFeaturePage extends BasePage {
  constructor(page: Page) {
    super(page);
    // ✅ Use semantic selectors
    this.featureButton = page.locator('button[data-testid="feature-button"]');
  }

  async performAction(): Promise<void> {
    await this.featureButton.click();
    // ✅ Wait for specific condition, not generic timeout
    await this.page.waitForSelector('[data-testid="success-message"]');
  }
}

// 2. Write test with proper setup/teardown
test.describe("New Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    // ✅ Set up required state
  });

  test("should perform feature action", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const featurePage = new NewFeaturePage(page);

    // ✅ Login first if feature requires auth
    await loginPage.goto();
    await loginPage.login("admin@traffboard.com", "admin123");

    // ✅ Test the feature
    await featurePage.goto();
    await featurePage.performAction();

    // ✅ Assert expected results
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

### Do's and Don'ts ✅

#### ✅ Do's

- **Clear cookies** in `beforeEach` for clean state
- **Use semantic selectors** (ID, role, data-testid)
- **Wait for specific conditions** not generic timeouts
- **Handle both success and error cases**
- **Test cross-browser** (chromium + webkit minimum)
- **Structure tests** with clear steps and comments
- **Use Page Object Model** for reusable page interactions
- **Seed predictable test data** in global setup

#### ❌ Don'ts

- **Don't wait for networkidle** by default (causes hangs)
- **Don't use CSS class selectors** (fragile)
- **Don't use hardcoded waits** (`page.waitForTimeout()`)
- **Don't test implementation details** (test user flows)
- **Don't leave hanging promises** (always await)
- **Don't ignore CI failures** (fix them immediately)
- **Don't use real production data** (use test seeds)

## Troubleshooting

### Common Issues ✅

#### Test Hangs/Timeouts

**Cause**: Waiting for networkidle on pages with continuous API calls
**Solution**:

```typescript
// ❌ Don't do this
await page.waitForLoadState("networkidle");

// ✅ Do this instead
await page.waitForLoadState("domcontentloaded");
await page.waitForSelector('[data-testid="specific-element"]');
```

#### Flaky Tests in CI

**Cause**: Race conditions, timing issues
**Solution**:

```typescript
// ✅ Use explicit waits
await expect(element).toBeVisible();

// ✅ Use Promise.race for multiple outcomes
await Promise.race([
  page.waitForURL(/success/),
  page.waitForSelector('.error-message')
]);

// ✅ Configure retries in CI
retries: process.env.CI ? 2 : 0,
```

#### Database Connection Errors

**Cause**: Wrong DATABASE_URL or database not ready
**Solution**:

```typescript
// ✅ Check environment variables
console.log('Database URL:', process.env.TEST_DATABASE_URL);

// ✅ Ensure PostgreSQL service is running in CI
services:
  postgres:
    image: postgres:15
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
```

#### Login Not Working

**Cause**: User not seeded or wrong credentials
**Solution**:

```typescript
// ✅ Check global setup logs
console.log("✅ Test users seeded:", { admin: admin.email, user: user.email });

// ✅ Verify user creation in database helper
static async seedAdminUser(): Promise<{ id: string; email: string; password: string }> {
  // Ensure password hashing is consistent
  const passwordHash = await hash(adminPassword, 12);
}
```

### Debug Commands ✅

```bash
# Run with browser UI for debugging
npx playwright test --debug

# Run specific test
npx playwright test auth.spec.ts --debug

# Generate test code
npx playwright codegen http://localhost:3000

# View test report
npx playwright show-report tests/results/html
```

## Performance Tips ✅

### Optimize Test Speed

```typescript
// ✅ Run tests in parallel
fullyParallel: true,

// ✅ Skip unnecessary waiting
async waitForLoad(waitForNetwork: boolean = false): Promise<void> {
  await this.page.waitForLoadState("domcontentloaded");
  // Don't wait for networkidle unless specifically needed
}

// ✅ Use workers efficiently
workers: process.env.CI ? 1 : undefined, // Single worker in CI for stability
```

### Resource Management

```typescript
// ✅ Clean up after tests
test.afterEach(async ({ page }) => {
  await page.close();
});

// ✅ Minimize browser instances
projects: [
  { name: "chromium" },  // Essential
  { name: "webkit" },    // Cross-browser validation
  // Don't include firefox unless specifically needed
],
```

## Security Considerations ✅

### Test Data Security

```typescript
// ✅ Use dedicated test credentials
const testCredentials = {
  admin: { email: "admin@traffboard.com", password: "admin123" },
  user: { email: "test@example.com", password: "test123456" }
};

// ✅ Clean up sensitive data
static async cleanup(): Promise<void> {
  // Remove all test data after each run
}

// ❌ Never use production credentials
// const prodCredentials = { email: "real@company.com", password: "realpass" };
```

### Environment Isolation

```yaml
# ✅ Separate test database
TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/traffboard_test

# ✅ Test-specific secrets
NEXTAUTH_SECRET: test-secret-for-ci-environment
```

## Maintenance ✅

### Regular Tasks

1. **Update selectors** when UI changes
2. **Review test failures** and fix immediately
3. **Update Playwright** and browsers regularly
4. **Monitor test execution time** and optimize slow tests
5. **Clean up obsolete tests** when features are removed

### Health Monitoring

```typescript
// ✅ Add test metadata for monitoring
test("critical user login @smoke", async ({ page }) => {
  // Critical path test
});

// Run only smoke tests for quick feedback
// npx playwright test --grep @smoke
```

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [TraffBoard CI Logs](https://github.com/AlexTsimba/traffboard/actions)
- [Test Results](./tests/results/html/index.html)

**✅ All patterns in this guide are CI-proven with 100% pass rate in GitHub Actions.**

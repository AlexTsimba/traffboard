# TraffBoard DAL Testing Strategy

## 🎯 **Core Philosophy: No Mocking, Real Integration Testing**

This document outlines the comprehensive testing strategy for TraffBoard's Data Access Layer (DAL) using Playwright instead of traditional unit tests with mocks.

## 📋 **Why No Mocking for DAL?**

### **Industry Expert Consensus**

- **Repository pattern**: DAL implementations should be tested with integration tests, not unit tests
- **ORM Integration**: Mocking Prisma ORM is nearly impossible and provides false confidence
- **Real Database Validation**: Only real PostgreSQL testing validates SQL queries and schema integrity
- **Authentication Stack**: NextAuth.js + Prisma + PostgreSQL integration cannot be meaningfully mocked

### **TraffBoard Specific Reasons**

- **Simple CRUD Operations**: DAL contains minimal business logic - mostly database access with auth checks
- **Server-Only Functions**: Many DAL functions (e.g., `admin2FAReset`) have no direct UI access
- **Security Critical**: Authentication and authorization must be tested with real data flow
- **MVP Focus**: Need confidence in critical paths, not comprehensive edge case coverage

## 🏗️ **Testing Architecture**

### **Three-Layer Testing Approach**

#### **1. API Tests (via Playwright APIRequestContext)**

Test server-only DAL functions directly through API endpoints without UI involvement.

```typescript
test("DAL: admin can reset user 2FA", async ({ request }) => {
  // Direct API call to test server-only DAL function
  const response = await request.post("/api/admin/2fa/reset", {
    headers: { Authorization: "Bearer " + adminToken },
    data: { userId: "test-user-id" },
  });
  expect(response.status()).toBe(200);

  // Verify DAL state change through database
  const user = await request.get(`/api/admin/users/test-user-id`);
  const userData = await user.json();
  expect(userData.totpEnabled).toBe(false);
});
```

#### **2. E2E Tests (via Playwright UI)**

Test critical user flows through the browser to validate complete UI → API → DAL → Database integration.

```typescript
test("Admin creates user through UI and can login", async ({ page }) => {
  // Test through UI
  await page.goto("/main/administration");
  await page.fill('[data-testid="user-email"]', "newuser@test.com");
  await page.fill('[data-testid="user-password"]', "testpass123");
  await page.click('[data-testid="create-user"]');
  await expect(page.getByText("User created successfully")).toBeVisible();

  // Verify new user can login (DAL authentication works)
  await page.goto("/main/auth/v1/login");
  await page.fill('[data-testid="email"]', "newuser@test.com");
  await page.fill('[data-testid="password"]', "testpass123");
  await page.click('[data-testid="login"]');
  await expect(page).toHaveURL("/main/dashboard");
});
```

#### **3. Hybrid Tests (UI Action + API Verification)**

Combine UI actions with API verification to test data persistence and cross-system integration.

```typescript
test("Password change persists and works for login", async ({ page, request }) => {
  // UI Action: Change password
  await page.goto("/main/preferences");
  await page.fill('[data-testid="current-password"]', "oldpass123");
  await page.fill('[data-testid="new-password"]', "newpass456");
  await page.click('[data-testid="save-password"]');
  await expect(page.getByText("Password updated")).toBeVisible();

  // API Verification: New password works for login
  const loginResponse = await request.post("/api/auth/login", {
    data: { email: "test@example.com", password: "newpass456" },
  });
  expect(loginResponse.status()).toBe(200);

  // API Verification: Old password doesn't work
  const oldLoginResponse = await request.post("/api/auth/login", {
    data: { email: "test@example.com", password: "oldpass123" },
  });
  expect(oldLoginResponse.status()).toBe(401);
});
```

## 📊 **DAL Coverage Matrix**

### **auth.ts Functions**

| Function           | Test Type | Description                                      |
| ------------------ | --------- | ------------------------------------------------ |
| `requireAuth()`    | E2E       | Test protected route redirects                   |
| `requireAdmin()`   | E2E + API | Test admin page access + API endpoint protection |
| `hasPermission()`  | API       | Test permission checking logic                   |
| `getCurrentUser()` | API       | Test user data retrieval                         |
| `auditLog()`       | API       | Test security event logging                      |

### **users.ts Functions**

| Function               | Test Type | Description                                         |
| ---------------------- | --------- | --------------------------------------------------- |
| `getUsers()`           | Hybrid    | Test admin UI user list + API pagination            |
| `createUser()`         | Hybrid    | Test admin user creation UI + database verification |
| `getUserById()`        | API       | Test user data retrieval with authorization         |
| `updateUser()`         | Hybrid    | Test profile updates UI + database persistence      |
| `deleteUser()`         | Hybrid    | Test admin user deletion UI + database removal      |
| `updateUserPassword()` | Hybrid    | Test password change UI + login verification        |

### **sessions.ts Functions**

| Function                   | Test Type     | Description                                      |
| -------------------------- | ------------- | ------------------------------------------------ |
| `getUserSessions()`        | E2E           | Test session management UI display               |
| `revokeSession()`          | Cross-browser | Test session revocation across multiple browsers |
| `revokeAllOtherSessions()` | Cross-browser | Test bulk session termination                    |
| `updateSessionActivity()`  | API           | Test session metadata tracking                   |

### **two-factor.ts Functions**

| Function                 | Test Type | Description                                   |
| ------------------------ | --------- | --------------------------------------------- |
| `checkUserRequires2FA()` | API       | Test login flow 2FA requirement detection     |
| `get2FAStatus()`         | E2E       | Test 2FA status display in UI                 |
| `generate2FASetup()`     | E2E       | Test QR code generation and display           |
| `enable2FA()`            | E2E       | Test 2FA enablement with TOTP verification    |
| `disable2FA()`           | E2E       | Test 2FA disabling with password verification |
| `admin2FAReset()`        | API       | Test admin 2FA reset (server-only function)   |
| `verify2FACode()`        | API       | Test TOTP code verification logic             |

## 🛠️ **Implementation Guidelines**

### **Test File Organization**

```
e2e/
├── dal/
│   ├── auth.spec.ts           # Authentication DAL tests
│   ├── users.spec.ts          # User management DAL tests
│   ├── sessions.spec.ts       # Session management DAL tests
│   ├── two-factor.spec.ts     # 2FA DAL tests
│   └── integration.spec.ts    # Cross-DAL integration tests
├── fixtures/
│   ├── test-users.ts          # Test user creation utilities
│   ├── auth-helpers.ts        # Authentication helper functions
│   └── database-helpers.ts    # Database setup/cleanup utilities
└── config/
    └── playwright-dal.config.ts  # DAL-specific Playwright configuration
```

### **Test Environment Setup**

```typescript
// test-setup.ts
import { test as baseTest } from "@playwright/test";
import { createTestUser, cleanupTestData } from "./fixtures/test-users";

export const test = baseTest.extend({
  // Setup fresh test user for each test
  authenticatedUser: async ({ page }, use) => {
    const testUser = await createTestUser();
    await loginAsUser(page, testUser);
    await use(testUser);
    await cleanupTestData(testUser.id);
  },

  // Setup admin user for admin-specific tests
  adminUser: async ({ page }, use) => {
    const adminUser = await createTestAdminUser();
    await loginAsAdmin(page, adminUser);
    await use(adminUser);
    await cleanupTestData(adminUser.id);
  },
});
```

## 🔧 **Debugging Strategy**

### **When Tests Fail: Active Investigation Approach**

#### **Step 1: Use MCP Playwright Server**

- Leverage MCP Playwright tools for real-time debugging
- Take screenshots and videos of failing tests
- Inspect DOM elements and network requests
- Use `page.pause()` for interactive debugging

#### **Step 2: Analyze Application Code**

- Examine actual DAL function implementation
- Check API route handlers for data flow
- Verify Prisma schema and database queries
- Review NextAuth.js configuration and session handling

#### **Step 3: Database State Investigation**

```typescript
test("Debug failing test with database inspection", async ({ page }) => {
  // Perform the action that should work
  await page.click('[data-testid="create-user"]');

  // Check database state directly
  const dbUser = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });
  console.log("Database user state:", dbUser);

  // Check for validation errors or constraints
  const lastError = await prisma.$queryRaw`
    SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction (aborted)'
  `;
  console.log("Database errors:", lastError);
});
```

#### **Step 4: Network Request Analysis**

```typescript
test("Debug API communication", async ({ page }) => {
  // Monitor network requests
  page.on("request", (request) => {
    console.log("Request:", request.url(), request.method());
  });

  page.on("response", (response) => {
    console.log("Response:", response.url(), response.status());
  });

  // Perform the failing action
  await page.click('[data-testid="submit"]');
});
```

## 🚀 **CI/CD Integration**

### **GitHub Actions Configuration**

```yaml
name: DAL Integration Tests

on: [push, pull_request]

jobs:
  dal-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: traffboard_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm run db:push
          npm run db:seed:test
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/traffboard_test

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run DAL tests
        run: npm run test:dal
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/traffboard_test
          NEXTAUTH_SECRET: test-secret-for-ci
          NEXTAUTH_URL: http://localhost:3000

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: dal-test-results
          path: |
            test-results/
            playwright-report/
```

### **Test Scripts Configuration**

```json
{
  "scripts": {
    "test:dal": "playwright test e2e/dal --reporter=html",
    "test:dal:debug": "playwright test e2e/dal --debug",
    "test:dal:headed": "playwright test e2e/dal --headed",
    "test:dal:ui": "playwright test e2e/dal --ui"
  }
}
```

## 📋 **Quality Standards**

### **MVP Testing Principles**

1. **Critical Path Coverage**: Test main user flows, not edge cases
2. **Real Data Validation**: Verify actual database state changes
3. **Cross-Browser Testing**: Ensure functionality works across browsers
4. **Security Verification**: Test authorization at every access level
5. **Performance Baseline**: Ensure tests complete within reasonable timeframes

### **Test Success Criteria**

- ✅ All tests pass consistently in CI environment
- ✅ Test failures provide clear debugging information
- ✅ Tests cover all critical DAL functions
- ✅ Real database integration works without mocking
- ✅ Cross-browser compatibility verified
- ✅ Security and authorization properly tested

### **Maintenance Guidelines**

- **Test Updates**: Update tests when DAL functions change
- **Database Schema**: Update test fixtures when Prisma schema changes
- **Environment Changes**: Update CI configuration for infrastructure changes
- **Performance Monitoring**: Track test execution times and optimize slow tests

## 🔍 **Troubleshooting Common Issues**

### **Database Connection Problems**

```bash
# Check PostgreSQL container status
docker ps | grep postgres

# Verify database connectivity
npm run db:test-connection

# Reset test database
npm run db:reset:test
```

### **Authentication Test Failures**

```typescript
// Debug session state
test("Debug auth session", async ({ page }) => {
  await page.goto("/main/preferences");

  // Check session cookie
  const cookies = await page.context().cookies();
  console.log("Session cookies:", cookies);

  // Check NextAuth.js session
  const session = await page.evaluate(() => {
    return fetch("/api/auth/session").then((r) => r.json());
  });
  console.log("NextAuth session:", session);
});
```

### **Playwright Selector Issues**

```typescript
// Use robust selectors
await page.getByRole("button", { name: "Create User" }); // ✅ Good
await page.click(".btn-primary"); // ❌ Fragile

// Wait for elements properly
await page.waitForSelector('[data-testid="user-list"]');
await expect(page.getByTestId("user-list")).toBeVisible();
```

## 📈 **Success Metrics**

### **Implementation Success**

- **100% DAL function coverage** through integration tests
- **Zero mocking** of Prisma, NextAuth.js, or PostgreSQL
- **CI/CD reliability** with consistent test results
- **Sub-5 minute** total test execution time
- **Clear failure debugging** with actionable error messages

### **Ongoing Maintenance**

- **Weekly test execution** to catch regressions early
- **Monthly performance review** to optimize slow tests
- **Quarterly coverage review** to ensure new DAL functions are tested
- **Annual strategy review** to incorporate new testing best practices

---

**Remember**: The goal is confidence in critical functionality, not perfect test coverage. Focus on testing what matters for MVP success and user trust in the authentication system.

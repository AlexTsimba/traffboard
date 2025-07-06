import { test, expect } from "@playwright/test";
import { loginAndGetAPIContext, performUIActionAndVerifyAPI } from "../fixtures/browser-api-helpers";

const TEST_USERS = {
  admin: { email: "admin@traffboard.com", password: "admin123" },
  user: { email: "user@traffboard.com", password: "user123" },
};

test.describe("DAL Integration Tests", () => {
  test("Complete user lifecycle with security features", async ({ page }) => {
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);

    const testUser = {
      name: "Integration Test User",
      email: "integration@example.com",
      password: "secure123",
      role: "user",
    };

    // 1. Admin creates user
    const createResponse = await adminAPI.post("/api/admin/users", {
      data: JSON.stringify(testUser),
      headers: { "Content-Type": "application/json" },
    });
    expect(createResponse.status()).toBe(201);
    const { user: createdUser } = await createResponse.json();

    try {
      // 2. User logs in and accesses profile
      await page.goto("/main/auth/v1/login");
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/main\/dashboard/);

      // 3. User changes password
      await page.goto("/main/dashboard/preferences");
      await page.fill('[data-testid="current-password"]', testUser.password);
      await page.fill('[data-testid="new-password"]', "newsecure456");
      await page.fill('[data-testid="confirm-password"]', "newsecure456");
      await page.getByRole("button", { name: "Update Password" }).click();

      // 4. Verify new password works
      await page.getByRole("button", { name: "Sign Out" }).click();
      await page.goto("/main/auth/v1/login");
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', "newsecure456");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/main\/dashboard/);

      // 5. Admin verifies user activity
      const userAPI = await loginAndGetAPIContext(page, { email: testUser.email, password: "newsecure456" });
      const sessionsResponse = await userAPI.get("/api/account/sessions");
      const { sessions } = await sessionsResponse.json();
      expect(sessions.length).toBeGreaterThan(0);
    } finally {
      // Cleanup: Delete test user
      await adminAPI.delete(`/api/admin/users/${createdUser.id}`);
    }
  });

  test("Security enforcement across all DAL functions", async ({ page }) => {
    // Test that unauthorized access is consistently blocked
    const endpoints = [
      "/api/admin/users",
      "/api/admin/users/123",
      "/api/account/profile",
      "/api/account/sessions",
      "/api/account/2fa/status",
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(401);
    }

    // Test regular user cannot access admin endpoints
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);
    const adminEndpoints = ["/api/admin/users", "/api/admin/users/123/2fa/reset"];

    for (const endpoint of adminEndpoints) {
      const response = await userAPI.get(endpoint);
      expect(response.status()).toBe(403);
    }
  });

  test("Cross-browser session consistency", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login on both browsers
    const api1 = await loginAndGetAPIContext(page1, TEST_USERS.user);
    const api2 = await loginAndGetAPIContext(page2, TEST_USERS.user);

    // Both should access same user data
    const profile1 = await api1.get("/api/account/profile");
    const profile2 = await api2.get("/api/account/profile");

    const user1 = await profile1.json();
    const user2 = await profile2.json();

    expect(user1.email).toBe(user2.email);
    expect(user1.id).toBe(user2.id);

    await context1.close();
    await context2.close();
  });
});

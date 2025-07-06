import { test, expect } from "@playwright/test";
import { loginAndGetAPIContext, performUIActionAndVerifyAPI } from "../fixtures/browser-api-helpers";

const TEST_USERS = {
  admin: { email: "admin@traffboard.com", password: "admin123" },
  user: { email: "user@traffboard.com", password: "user123" },
};

test.describe("DAL Authentication - Fixed Tests", () => {
  test("requireAuth() works with shared browser/API context", async ({ page }) => {
    // Login via UI and get API context that shares session
    const apiRequest = await loginAndGetAPIContext(page, TEST_USERS.user);

    // Test DAL requireAuth() through API using shared session
    const response = await apiRequest.get("/api/account/profile");
    expect(response.status()).toBe(200);

    const profile = await response.json();
    expect(profile.user.email).toBe(TEST_USERS.user.email);
  });

  test("requireAdmin() works correctly", async ({ page }) => {
    // Test with admin user
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);
    const adminResponse = await adminAPI.get("/api/admin/users");
    expect(adminResponse.status()).toBe(200);

    // Test with regular user - create new context
    await page.context().clearCookies();
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);
    const userResponse = await userAPI.get("/api/admin/users");
    expect(userResponse.status()).toBe(403);
  });

  test("UI routes work with correct paths", async ({ page }) => {
    // Login via UI
    await page.goto("/main/auth/v1/login");
    await page.fill('input[type="email"]', TEST_USERS.user.email);
    await page.fill('input[type="password"]', TEST_USERS.user.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/main\/dashboard/);

    // Test correct routing paths
    await page.goto("/main/dashboard/preferences");
    await expect(page).toHaveURL("/main/dashboard/preferences");
    await expect(page.getByText("Settings")).toBeVisible();
  });

  test("admin pages work with correct paths", async ({ page }) => {
    // Login as admin
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);

    // Test admin page access
    await page.goto("/main/dashboard/administration");
    await expect(page).toHaveURL("/main/dashboard/administration");
    await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
  });

  test("hybrid UI + API verification", async ({ page }) => {
    const apiRequest = await loginAndGetAPIContext(page, TEST_USERS.admin);

    await performUIActionAndVerifyAPI(
      page,
      apiRequest,
      async () => {
        // UI action: navigate to user management
        await page.goto("/main/dashboard/administration");
        await page.getByText("User Management").click();
      },
      async (api) => {
        // API verification: check users endpoint works
        const response = await api.get("/api/admin/users");
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data.users)).toBe(true);
      },
    );
  });
});

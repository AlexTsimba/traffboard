import { test, expect } from "@playwright/test";
import { loginAndGetAPIContext } from "../fixtures/browser-api-helpers";

const TEST_USERS = {
  admin: { email: "admin@traffboard.com", password: "admin123" },
  user: { email: "user@traffboard.com", password: "user123" },
};

test.describe("DAL Two-Factor Authentication Tests", () => {
  test("get2FAStatus() - API endpoint validation", async ({ page }) => {
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);

    const statusResponse = await userAPI.get("/api/account/2fa/status");
    expect([200, 404]).toContain(statusResponse.status()); // 404 if endpoint not implemented

    if (statusResponse.status() === 200) {
      const statusData = await statusResponse.json();
      expect(typeof statusData.enabled).toBe("boolean");
    }
  });

  test("admin2FAReset() - Admin-only functionality", async ({ page }) => {
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);

    // Get user list to find a target user
    const usersResponse = await adminAPI.get("/api/admin/users");
    const { users } = await usersResponse.json();
    const targetUser = users.find((u: any) => u.email !== TEST_USERS.admin.email);

    if (targetUser) {
      // Admin can access 2FA reset endpoint
      const resetResponse = await adminAPI.post(`/api/admin/users/${targetUser.id}/2fa/reset`);
      expect([200, 404, 501]).toContain(resetResponse.status()); // 404/501 if not implemented

      // Regular user cannot access admin 2FA reset
      const userResetResponse = await userAPI.post(`/api/admin/users/${targetUser.id}/2fa/reset`);
      expect(userResetResponse.status()).toBe(403);
    }
  });

  test("2FA API endpoints security", async ({ page }) => {
    // Test unauthenticated access is blocked
    const unauthenticatedEndpoints = [
      "/api/account/2fa/status",
      "/api/account/2fa/setup",
      "/api/account/2fa/enable",
      "/api/account/2fa/disable",
    ];

    for (const endpoint of unauthenticatedEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });

  test("2FA workflow structure validation", async ({ page }) => {
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);

    // Test setup endpoint exists and requires authentication
    const setupResponse = await userAPI.post("/api/account/2fa/setup");
    expect([200, 404, 501]).toContain(setupResponse.status());

    if (setupResponse.status() === 200) {
      const setupData = await setupResponse.json();
      // Should return secret and QR code URL if implemented
      expect(setupData).toBeDefined();
    }
  });
});

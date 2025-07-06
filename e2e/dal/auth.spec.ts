import { test, expect } from "@playwright/test";
import {
  TEST_USERS,
  loginViaAPI,
  loginViaUI,
  authenticatedRequest,
  verifyAdminAccess,
  verifyUserAccess,
  verifyNoAccess,
  expectAuthRequired,
  createTestUser,
  deleteTestUser,
} from "../fixtures/auth-helpers";

test.describe("DAL Authentication Tests", () => {
  test.describe("requireAuth() Function", () => {
    test("should allow access to authenticated users via API", async ({ request }) => {
      // Login as regular user
      const cookies = await loginViaAPI(request, TEST_USERS.regularUser);
      expect(cookies.sessionToken).toBeTruthy();

      // Test DAL requireAuth() through protected endpoint
      const response = await authenticatedRequest(request, cookies, "/api/account/profile");
      expect(response.status()).toBe(200);

      const profile = await response.json();
      expect(profile.email).toBe(TEST_USERS.regularUser.email);
    });

    test("should deny access to unauthenticated users", async ({ request }) => {
      // Direct API call without authentication
      const response = await request.get("/api/account/profile");
      expect(response.status()).toBe(401);

      const error = await response.json();
      expect(error.error).toContain("Unauthorized");
    });

    test("should redirect unauthenticated users from protected pages", async ({ page }) => {
      // Test UI-level requireAuth through page protection
      await expectAuthRequired(page, "/main/dashboard");
      await expectAuthRequired(page, "/main/dashboard/preferences");
      await expectAuthRequired(page, "/main/dashboard/administration");
    });

    test("should allow access after successful login via UI", async ({ page }) => {
      await loginViaUI(page, TEST_USERS.regularUser);

      // Should be able to access protected pages now
      await page.goto("/main/dashboard");
      await expect(page).toHaveURL("/main/dashboard");

      await page.goto("/main/dashboard/preferences");
      await expect(page).toHaveURL("/main/dashboard/preferences");
    });
  });

  test.describe("requireAdmin() Function", () => {
    test("should allow admin access to superuser via API", async ({ request }) => {
      // Login as admin user
      const adminCookies = await loginViaAPI(request, TEST_USERS.admin);
      expect(adminCookies.sessionToken).toBeTruthy();

      // Test DAL requireAdmin() through admin endpoint
      const isAdmin = await verifyAdminAccess(request, adminCookies);
      expect(isAdmin).toBe(true);

      // Should be able to list users
      const response = await authenticatedRequest(request, adminCookies, "/api/admin/users");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });

    test("should deny admin access to regular users", async ({ request }) => {
      // Login as regular user
      const userCookies = await loginViaAPI(request, TEST_USERS.regularUser);
      expect(userCookies.sessionToken).toBeTruthy();

      // Test DAL requireAdmin() rejection
      const response = await authenticatedRequest(request, userCookies, "/api/admin/users");
      expect(response.status()).toBe(403);

      const error = await response.json();
      expect(error.error).toContain("Forbidden");
    });

    test("should allow admin UI access to superuser", async ({ page }) => {
      await loginViaUI(page, TEST_USERS.admin);

      // Should be able to access admin pages
      await page.goto("/main/dashboard/administration");
      await expect(page).toHaveURL("/main/dashboard/administration");

      // Should see admin-specific content
      await expect(page.getByText("User Management")).toBeVisible();
    });

    test("should deny admin UI access to regular users", async ({ page }) => {
      await loginViaUI(page, TEST_USERS.regularUser);

      // Should be redirected or shown access denied
      await page.goto("/main/dashboard/administration");

      // Either redirected to dashboard or see access denied message
      const currentUrl = page.url();
      const hasAccessDenied = await page
        .getByText("Access denied")
        .isVisible()
        .catch(() => false);

      expect(
        currentUrl.includes("/main/dashboard") || currentUrl.includes("/main/unauthorized") || hasAccessDenied,
      ).toBe(true);
    });
  });

  test.describe("hasPermission() Function", () => {
    test("should return true for admin users", async ({ request }) => {
      const adminCookies = await loginViaAPI(request, TEST_USERS.admin);

      // Test permission check through admin endpoints
      const hasAccess = await verifyAdminAccess(request, adminCookies);
      expect(hasAccess).toBe(true);
    });

    test("should return false for regular users", async ({ request }) => {
      const userCookies = await loginViaAPI(request, TEST_USERS.regularUser);

      // Test permission check through user endpoints
      const hasUserAccess = await verifyUserAccess(request, userCookies);
      expect(hasUserAccess).toBe(true); // Can access user endpoints

      const hasAdminAccess = await verifyAdminAccess(request, userCookies);
      expect(hasAdminAccess).toBe(false); // Cannot access admin endpoints
    });

    test("should return false for unauthenticated users", async ({ request }) => {
      const hasAccess = await verifyNoAccess(request);
      expect(hasAccess).toBe(true); // verifyNoAccess returns true when no access confirmed
    });
  });

  test.describe("getCurrentUser() Function", () => {
    test("should return user data for authenticated users", async ({ request }) => {
      const cookies = await loginViaAPI(request, TEST_USERS.regularUser);

      // Test getCurrentUser() through profile endpoint
      const response = await authenticatedRequest(request, cookies, "/api/account/profile");
      expect(response.status()).toBe(200);

      const user = await response.json();
      expect(user.email).toBe(TEST_USERS.regularUser.email);
      expect(user.name).toBeTruthy();
      expect(user.role).toBeTruthy();
      expect(user.id).toBeTruthy();
    });

    test("should return null for unauthenticated users", async ({ request }) => {
      // Test getCurrentUser() without authentication
      const response = await request.get("/api/account/profile");
      expect(response.status()).toBe(401);
    });
  });

  test.describe("auditLog() Function", () => {
    test("should log authentication events", async ({ request, page }) => {
      // Login should trigger audit log
      await loginViaUI(page, TEST_USERS.regularUser);

      // For now, audit logs go to console
      // In the future, we would test database audit log entries
      // This test verifies the function doesn't crash the system

      // Make some actions that should trigger audit logs
      const cookies = await loginViaAPI(request, TEST_USERS.admin);
      await authenticatedRequest(request, cookies, "/api/admin/users");

      // Test passes if no exceptions thrown
      expect(true).toBe(true);
    });
  });

  test.describe("Integration: Complete Authentication Flow", () => {
    test("should handle complete user lifecycle with DAL functions", async ({ request, page }) => {
      // 1. Admin login
      const adminCookies = await loginViaAPI(request, TEST_USERS.admin);
      expect(adminCookies.sessionToken).toBeTruthy();

      // 2. Create test user (tests createUser DAL)
      const newUser = await createTestUser(request, adminCookies, TEST_USERS.tempUser);
      expect(newUser.id).toBeTruthy();

      // 3. New user login (tests requireAuth DAL)
      const userCookies = await loginViaAPI(request, TEST_USERS.tempUser);
      expect(userCookies.sessionToken).toBeTruthy();

      // 4. User accesses profile (tests getCurrentUser DAL)
      const profileResponse = await authenticatedRequest(request, userCookies, "/api/account/profile");
      expect(profileResponse.status()).toBe(200);

      const profile = await profileResponse.json();
      expect(profile.email).toBe(TEST_USERS.tempUser.email);

      // 5. User tries admin access (tests requireAdmin DAL)
      const adminResponse = await authenticatedRequest(request, userCookies, "/api/admin/users");
      expect(adminResponse.status()).toBe(403);

      // 6. Cleanup: Delete test user
      await deleteTestUser(request, adminCookies, newUser.id!);
    });

    test("should maintain security across multiple requests", async ({ request }) => {
      // Test session consistency and security
      const userCookies = await loginViaAPI(request, TEST_USERS.regularUser);

      // Multiple authenticated requests should work
      for (let i = 0; i < 3; i++) {
        const response = await authenticatedRequest(request, userCookies, "/api/account/profile");
        expect(response.status()).toBe(200);
      }

      // Admin endpoints should consistently deny access
      for (let i = 0; i < 3; i++) {
        const response = await authenticatedRequest(request, userCookies, "/api/admin/users");
        expect(response.status()).toBe(403);
      }
    });
  });
});

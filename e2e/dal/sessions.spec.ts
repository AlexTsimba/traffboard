import { test, expect } from "@playwright/test";
import { loginAndGetAPIContext } from "../fixtures/browser-api-helpers";

const TEST_USERS = {
  admin: { email: "admin@traffboard.com", password: "admin123" },
  user: { email: "user@traffboard.com", password: "user123" },
};

test.describe("DAL Session Management Tests", () => {
  test("getUserSessions() - Display Active Sessions", async ({ page }) => {
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);

    // Navigate to security settings
    await page.goto("/main/dashboard/preferences");
    await page.getByRole("tab", { name: "Security" }).click();

    // Should see current session
    await expect(page.getByText("Active Sessions")).toBeVisible();
    await expect(page.getByText("Current Session")).toBeVisible();

    // Verify API returns session data
    const response = await userAPI.get("/api/account/sessions");
    expect(response.status()).toBe(200);

    const { sessions } = await response.json();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);
  });

  test("revokeSession() - Cross-Browser Session Termination", async ({ browser }) => {
    // Create two browser contexts (simulate two devices)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login on both browsers
    const api1 = await loginAndGetAPIContext(page1, TEST_USERS.user);
    const api2 = await loginAndGetAPIContext(page2, TEST_USERS.user);

    // Verify both sessions work
    expect((await api1.get("/api/account/profile")).status()).toBe(200);
    expect((await api2.get("/api/account/profile")).status()).toBe(200);

    // Get session ID from browser 2
    const sessionsResponse = await api1.get("/api/account/sessions");
    const { sessions } = await sessionsResponse.json();
    const otherSession = sessions.find((s: any) => !s.isCurrent);

    if (otherSession) {
      // Revoke session from browser 1
      const revokeResponse = await api1.delete(`/api/account/sessions/${otherSession.id}`);
      expect(revokeResponse.status()).toBe(200);

      // Browser 2 session should be terminated
      await page2.reload();
      await expect(page2).toHaveURL(/\/main\/auth\/v1\/login/);
    }

    await context1.close();
    await context2.close();
  });

  test("revokeAllOtherSessions() - Bulk Session Termination", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    // Create multiple sessions
    const api1 = await loginAndGetAPIContext(page1, TEST_USERS.user);
    await loginAndGetAPIContext(page2, TEST_USERS.user);
    await loginAndGetAPIContext(page3, TEST_USERS.user);

    // Revoke all other sessions from context 1
    await page1.goto("/main/dashboard/preferences");
    await page1.getByRole("tab", { name: "Security" }).click();
    await page1.getByRole("button", { name: "Sign Out All Other Devices" }).click();
    await page1.getByRole("button", { name: "Confirm" }).click();

    // Other contexts should be logged out
    await page2.reload();
    await page3.reload();

    await expect(page2).toHaveURL(/\/main\/auth\/v1\/login/);
    await expect(page3).toHaveURL(/\/main\/auth\/v1\/login/);

    // Current session should still work
    expect((await api1.get("/api/account/profile")).status()).toBe(200);

    await context1.close();
    await context2.close();
    await context3.close();
  });
});

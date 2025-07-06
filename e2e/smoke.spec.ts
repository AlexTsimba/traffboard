import { test, expect } from "@playwright/test";

test("Login page loads and shows login form", async ({ page }) => {
  await page.goto("/main/auth/v1/login");
  await expect(page.getByRole("heading", { name: /traffboard/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in|login/i })).toBeVisible();
});

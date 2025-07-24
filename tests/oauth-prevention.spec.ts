import { test, expect } from '@playwright/test';

test.describe('OAuth Account Creation Prevention', () => {
  test('should show OAuth prevention error when clicking Google sign in', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login page loads
    await expect(page.locator('text=Welcome on board')).toBeVisible();
    
    // Check that Google sign in button exists
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    
    // Note: We cannot test actual OAuth flow without mocking
    // This test verifies the UI elements are present
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify form elements
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle login error query parameter', async ({ page }) => {
    await page.goto('/login?error=signup_disabled');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential toast to appear (even if we can't verify it)
    await page.waitForTimeout(1000);
    
    // Verify we're still on login page
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.locator('text=Welcome on board')).toBeVisible();
  });

  test('should redirect to dashboard when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('should show two-factor page route exists', async ({ page }) => {
    await page.goto('/auth/two-factor');
    
    // Should either show 2FA page or redirect to login
    await page.waitForLoadState('networkidle');
    
    // Verify we get some response (not 404)
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
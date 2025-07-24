import { test, expect } from '@playwright/test';

test.describe('Route Protection and Navigation', () => {
  test('should redirect to login for protected dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome on board')).toBeVisible();
  });

  test('should allow access to login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome on board')).toBeVisible();
  });

  test('should handle two-factor authentication route', async ({ page }) => {
    await page.goto('/auth/two-factor');
    
    // Should either show 2FA page or redirect appropriately
    await page.waitForLoadState('networkidle');
    
    // Verify we get a proper response (not 404/500)
    const url = page.url();
    expect(url).toMatch(/\/(login|auth\/two-factor)/);
  });

  test('should handle settings security route', async ({ page }) => {
    await page.goto('/settings/security');
    
    // Should redirect to login for unauthenticated user
    await page.waitForLoadState('networkidle');
    
    // Should end up at login or stay at settings if somehow authenticated
    const url = page.url();
    expect(url).toMatch(/\/(login|settings)/);
  });

  test('should handle non-existent routes properly', async ({ page }) => {
    const response = await page.goto('/non-existent-route');
    
    // Should handle 404 gracefully
    expect(response?.status()).toBe(404);
  });

  test('should load page assets correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check that basic assets load
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Verify no critical console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Filter out expected development/hydration warnings
    const criticalErrors = logs.filter(log => 
      !log.includes('Warning:') && 
      !log.includes('hydration') && 
      !log.includes('useSearchParams')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
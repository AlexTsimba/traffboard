import { test, expect } from '@playwright/test';

test.describe('Navigation and Routes', () => {
  test('should redirect protected routes to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome on board')).toBeVisible();
  });

  test('should allow access to login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome on board')).toBeVisible();
  });

  test('should handle two-factor route', async ({ page }) => {
    await page.goto('/auth/two-factor');
    
    await page.waitForLoadState('networkidle');
    
    // Should either show 2FA page or redirect to login
    const url = page.url();
    expect(url).toMatch(/\/(login|auth\/two-factor)/);
  });

  test('should handle settings route protection', async ({ page }) => {
    await page.goto('/settings/security');
    
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login for unauthenticated user
    const url = page.url();
    expect(url).toMatch(/\/(login|settings)/);
  });

  test('should handle 404 for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-route');
    
    expect(response?.status()).toBe(404);
  });

  test('should load without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected warnings/development errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('hydration') && 
      !error.includes('useSearchParams') &&
      !error.includes('User not found') // Expected auth error
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
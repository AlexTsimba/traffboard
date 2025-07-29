import { test, expect } from '@playwright/test';

test('debug navigation elements', async ({ page }) => {
  // Navigate and login
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Login as admin
  await page.fill('input[id="email"]', 'admin@traffboard.com');
  await page.fill('input[id="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Debug: Take a screenshot
  await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
  
  // Debug: Print all buttons on page
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons on page`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    if (!button) continue;
    const text = await button.textContent();
    const role = await button.getAttribute('role');
    const type = await button.getAttribute('type');
    const dataSlot = await button.getAttribute('data-slot');
    const dataSidebar = await button.getAttribute('data-sidebar');
    
    console.log(`Button ${i}: text="${text}" role="${role}" type="${type}" data-slot="${dataSlot}" data-sidebar="${dataSidebar}"`);
  }
  
  // Look specifically for user menu
  const userButtons = await page.locator('[data-sidebar="menu-button"]').all();
  console.log(`Found ${userButtons.length} sidebar menu buttons`);
  
  // Try to find user avatar or name
  const avatars = await page.locator('img, [class*="avatar"]').all();
  console.log(`Found ${avatars.length} avatar elements`);
});
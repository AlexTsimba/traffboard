import { test, expect } from '@playwright/test';
import { db } from '~/server/db';

test('debug admin user role', async ({ page }) => {
  // Check database directly
  const user = await db.user.findUnique({
    where: { email: 'admin@traffboard.com' },
    select: { id: true, email: true, role: true, name: true }
  });
  
  console.log('Database user:', JSON.stringify(user, null, 2));
  
  // Login and check session
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[id="email"]', 'admin@traffboard.com');
  await page.fill('input[id="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Click on user dropdown to open it
  await page.click('[data-slot="dropdown-menu-trigger"][data-sidebar="menu-button"]:has-text("Test Admin")');
  
  // Wait a moment for dropdown to appear
  await page.waitForTimeout(1000);
  
  // Take screenshot of dropdown
  await page.screenshot({ path: 'debug-dropdown.png', fullPage: true });
  
  // Check if Administration option is visible
  const adminOption = await page.locator('text=Administration').count();
  console.log(`Administration option found: ${adminOption > 0}`);
  
  // List all dropdown items
  const dropdownItems = await page.locator('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]').all();
  console.log(`Found ${dropdownItems.length} dropdown items`);
  
  for (let i = 0; i < dropdownItems.length; i++) {
    const item = dropdownItems[i];
    if (!item) continue;
    const text = await item.textContent();
    console.log(`Dropdown item ${i}: "${text}"`);
  }
});
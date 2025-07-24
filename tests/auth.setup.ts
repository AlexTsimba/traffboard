import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUsers } from './utils/db-helpers';
import { TEST_USERS } from './utils/test-data';

test.describe('Authentication Setup', () => {
  test.beforeAll(async () => {
    // Clean up any existing test users
    await cleanupTestUsers();
    
    // Create test users
    await createTestUser(TEST_USERS.STANDARD_USER);
    await createTestUser(TEST_USERS.MFA_USER);
    await createTestUser(TEST_USERS.OAUTH_USER);
  });

  test('authenticate standard user', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', TEST_USERS.STANDARD_USER.email);
    await page.fill('#password', TEST_USERS.STANDARD_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Verify we're logged in
    await expect(page.locator('h2')).toContainText('Hi, Welcome back');
    
    // Save authentication state
    await page.context().storageState({ path: '.auth/user.json' });
  });

  test.afterAll(async () => {
    // Optional: Clean up test users after setup
    // await cleanupTestUsers();
  });
});
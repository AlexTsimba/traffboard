import { test as base, expect } from '@playwright/test';
import { TEST_USERS } from '../utils/test-data';

type AuthFixtures = {
  authenticatedUser: {
    email: string;
    password: string;
    name: string;
  };
  loginPage: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  authenticatedUser: async ({}, use) => {
    await use(TEST_USERS.STANDARD_USER);
  },

  loginPage: async ({ page }, use) => {
    const loginFn = async (email: string, password: string) => {
      await page.goto('/login');
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });
    };
    
    await use(loginFn);
  },

  logout: async ({ page }, use) => {
    const logoutFn = async () => {
      await page.goto('/dashboard');
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL('/login');
    };
    
    await use(logoutFn);
  },
});

export { expect };
import type { APIRequestContext, Page, BrowserContext } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Create APIRequestContext that shares cookies with browser context
 * This solves the issue where API tests don't include browser session cookies
 */
export async function createAuthenticatedAPIContext(
  page: Page, 
  context: BrowserContext
): Promise<APIRequestContext> {
  // Get all cookies from browser context
  const cookies = await context.cookies();
  
  // Create new API context with those cookies
  return context.request;
}

/**
 * Login via UI and return API context that shares the session
 */
export async function loginAndGetAPIContext(
  page: Page, 
  user: { email: string; password: string }
): Promise<APIRequestContext> {
  // Login via UI first
  await page.goto('/main/auth/v1/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login with better error handling
  try {
    await expect(page).toHaveURL(/\/main\/dashboard/, { timeout: 10000 });
  } catch (error) {
    console.log('Login failed, current URL:', page.url());
    throw new Error(`Login failed for ${user.email}: ${error}`);
  }
  
  // Return API context that shares browser cookies
  return page.context().request;
}

/**
 * Hybrid test helper: UI action + API verification
 */
export async function performUIActionAndVerifyAPI(
  page: Page,
  apiRequest: APIRequestContext,
  uiAction: () => Promise<void>,
  apiVerification: (request: APIRequestContext) => Promise<void>
): Promise<void> {
  // Perform UI action
  await uiAction();
  
  // Verify via API using shared session
  await apiVerification(apiRequest);
}

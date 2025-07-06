import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: "user" | "superuser";
}

export interface AuthCookies {
  sessionToken?: string;
  csrfToken?: string;
}

/**
 * Test user data for authentication tests
 */
export const TEST_USERS = {
  admin: {
    email: "admin@traffboard.com",
    password: "admin123",
    name: "Test Admin",
    role: "superuser" as const,
  },
  regularUser: {
    email: "user@traffboard.com",
    password: "user123",
    name: "Test User",
    role: "user" as const,
  },
  tempUser: {
    email: "temp@traffboard.com",
    password: "temp123",
    name: "Temp User",
    role: "user" as const,
  },
} as const;

/**
 * Login via UI and return page with authenticated session
 */
export async function loginViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto("/main/auth/v1/login");

  // Fill login form
  await page.fill('input[type="email"], input[placeholder*="email"]', user.email);
  await page.fill('input[type="password"], input[placeholder*="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

  // Wait for successful login (either dashboard or 2FA page)
  await expect(page).toHaveURL(/\/(main\/dashboard|main\/auth\/v1\/two-factor)/);
}

/**
 * Login via API using browser context to maintain real session cookies
 */
export async function loginViaAPI(request: APIRequestContext, user: TestUser): Promise<AuthCookies> {
  // NextAuth v5 requires proper signin flow
  const signinResponse = await request.post("/api/auth/signin/credentials", {
    data: new URLSearchParams({
      email: user.email,
      password: user.password,
      redirect: "false",
    }).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const cookies: AuthCookies = {};

  // Extract session cookies - NextAuth v5 uses different cookie names
  const setCookieHeaders = signinResponse.headers()["set-cookie"];
  if (setCookieHeaders) {
    const cookieStrings = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

    for (const cookieString of cookieStrings) {
      // NextAuth v5 cookie patterns
      if (cookieString.includes("authjs.session-token") || cookieString.includes("next-auth.session-token")) {
        cookies.sessionToken = cookieString.split("=")[1]?.split(";")[0];
      }
      if (cookieString.includes("authjs.csrf-token") || cookieString.includes("next-auth.csrf-token")) {
        cookies.csrfToken = cookieString.split("=")[1]?.split(";")[0];
      }
    }
  }

  // Verify session works with a test request
  if (cookies.sessionToken) {
    const testResponse = await authenticatedRequest(request, cookies, "/api/auth/session");
    if (testResponse.status() !== 200) {
      console.warn("Session verification failed, login may not have worked properly");
    }
  }

  return cookies;
}

/**
 * Make authenticated API request with session cookies
 */
export async function authenticatedRequest(
  request: APIRequestContext,
  cookies: AuthCookies,
  url: string,
  options: any = {},
): Promise<any> {
  // Support both NextAuth v4 and v5 cookie formats
  const cookieHeader = [
    cookies.sessionToken ? `authjs.session-token=${cookies.sessionToken}` : "",
    cookies.sessionToken ? `next-auth.session-token=${cookies.sessionToken}` : "",
    cookies.csrfToken ? `authjs.csrf-token=${cookies.csrfToken}` : "",
    cookies.csrfToken ? `next-auth.csrf-token=${cookies.csrfToken}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  return request.fetch(url, {
    ...options,
    headers: {
      Cookie: cookieHeader,
      ...options.headers,
    },
  });
}

/**
 * Verify user has admin access through API
 */
export async function verifyAdminAccess(request: APIRequestContext, cookies: AuthCookies): Promise<boolean> {
  try {
    const response = await authenticatedRequest(request, cookies, "/api/admin/users");
    return response.status() === 200;
  } catch {
    return false;
  }
}

/**
 * Verify user is authenticated but not admin
 */
export async function verifyUserAccess(request: APIRequestContext, cookies: AuthCookies): Promise<boolean> {
  try {
    // Should be able to access account endpoints but not admin
    const accountResponse = await authenticatedRequest(request, cookies, "/api/account/profile");
    const adminResponse = await authenticatedRequest(request, cookies, "/api/admin/users");

    return accountResponse.status() === 200 && adminResponse.status() === 403;
  } catch {
    return false;
  }
}

/**
 * Verify user is not authenticated
 */
export async function verifyNoAccess(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get("/api/account/profile");
    return response.status() === 401;
  } catch {
    return false;
  }
}

/**
 * Logout user via UI
 */
export async function logoutViaUI(page: Page): Promise<void> {
  // Look for logout button/link in various locations
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Sign Out")',
    'a:has-text("Logout")',
    'a:has-text("Sign Out")',
    '[data-testid="logout"]',
    '[data-testid="sign-out"]',
  ];

  for (const selector of logoutSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 1000 })) {
        await element.click();
        break;
      }
    } catch {
      // Continue to next selector
    }
  }

  // Verify redirect to login page
  await expect(page).toHaveURL(/\/main\/auth\/v1\/login/);
}

/**
 * Check if page requires authentication (redirects to login)
 */
export async function expectAuthRequired(page: Page, protectedUrl: string): Promise<void> {
  await page.goto(protectedUrl);
  await expect(page).toHaveURL(/\/main\/auth\/v1\/login/);
}

/**
 * Create test user via API (requires admin access)
 */
export async function createTestUser(
  request: APIRequestContext,
  adminCookies: AuthCookies,
  userData: TestUser,
): Promise<TestUser> {
  const response = await authenticatedRequest(request, adminCookies, "/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
    }),
  });

  if (response.status() !== 201) {
    throw new Error(`Failed to create test user: ${response.status()}`);
  }

  const result = await response.json();
  return {
    ...userData,
    id: result.user.id,
  };
}

/**
 * Delete test user via API (requires admin access)
 */
export async function deleteTestUser(
  request: APIRequestContext,
  adminCookies: AuthCookies,
  userId: string,
): Promise<void> {
  await authenticatedRequest(request, adminCookies, `/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

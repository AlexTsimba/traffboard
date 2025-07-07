import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input#email');
    this.passwordInput = page.locator('input#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.rememberMeCheckbox = page.locator('button[role="checkbox"]');
    this.errorMessage = page.locator('[role="alert"], .text-destructive');
  }

  async goto(): Promise<void> {
    await super.goto("/main/auth/v1/login");
    await this.waitForLoad();
  }

  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      // Use specific checkbox selector and force click
      await this.rememberMeCheckbox.click({ force: true });
    }
    
    await this.loginButton.click();
    
    // Wait for navigation or response
    await Promise.race([
      this.page.waitForURL(/\/main\/dashboard/, { timeout: 10000 }),
      this.page.waitForSelector('[role="alert"], .text-destructive', { timeout: 5000 }).catch(() => null)
    ]);
  }

  async expectToBeOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/main\/auth\/v1\/login/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectErrorMessage(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}

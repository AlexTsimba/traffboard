import { Page, Locator } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to be loaded and stable
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Check if we're on the expected page by URL pattern
   */
  async isOnPage(urlPattern: string | RegExp): Promise<boolean> {
    const currentUrl = await this.getCurrentUrl();
    if (typeof urlPattern === "string") {
      return currentUrl.includes(urlPattern);
    }
    return urlPattern.test(currentUrl);
  }
}

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
   * @param waitForNetwork - Whether to wait for network idle (default: false for performance)
   */
  async waitForLoad(waitForNetwork: boolean = false): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    
    // Only wait for network idle if explicitly requested
    // This prevents tests from hanging due to continuous API calls
    if (waitForNetwork) {
      try {
        await this.page.waitForLoadState("networkidle", { timeout: 5000 });
      } catch (error) {
        console.warn("Network idle timeout - continuing with test execution");
      }
    }
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

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class DashboardPage extends BasePage {
  readonly userDropdownTrigger: Locator;
  readonly userAvatar: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly logoutButton: Locator;
  readonly preferencesLink: Locator;
  readonly administrationLink: Locator;
  readonly sidebarToggle: Locator;

  constructor(page: Page) {
    super(page);
    
    // User dropdown trigger - это SidebarMenuButton который содержит Avatar и текст
    this.userDropdownTrigger = page.locator('[data-sidebar="menu-button"][data-size="lg"]');
    this.userAvatar = page.locator('.rounded-lg:has-text("AU"), .rounded-lg:has-text("TU")'); // Avatar fallback with initials
    this.userName = page.locator('.truncate.font-medium');
    this.userEmail = page.locator('.text-muted-foreground.truncate.text-xs');
    
    // Dropdown menu items
    this.logoutButton = page.locator('text=Log out');
    this.preferencesLink = page.locator('a[href="/main/dashboard/preferences"]');
    this.administrationLink = page.locator('a[href="/main/dashboard/administration"]');
    
    // Other dashboard elements
    this.sidebarToggle = page.locator('text=Toggle Sidebar');
  }

  async goto(): Promise<void> {
    await super.goto("/main/dashboard/overview");
    await this.waitForLoad();
  }

  async openUserDropdown(): Promise<void> {
    await this.userDropdownTrigger.click();
    // Wait for dropdown to be visible
    await expect(this.logoutButton).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.openUserDropdown();
    await this.logoutButton.click();
    // Wait for navigation to login page
    await this.page.waitForURL(/\/main\/auth\/v1\/login/);
  }

  async expectToBeOnDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/main\/dashboard/);
    // Check that user dropdown trigger is visible (contains user name)
    await expect(this.userDropdownTrigger).toBeVisible();
  }

  async expectUserInfo(name: string, email: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`).first()).toBeVisible();
    await expect(this.page.locator(`text=${email}`).first()).toBeVisible();
  }

  async goToPreferences(): Promise<void> {
    await this.openUserDropdown();
    await this.preferencesLink.click();
    await this.page.waitForURL(/\/main\/dashboard\/preferences/);
  }

  async goToAdministration(): Promise<void> {
    await this.openUserDropdown();
    await this.administrationLink.click();
    await this.page.waitForURL(/\/main\/dashboard\/administration/);
  }
}

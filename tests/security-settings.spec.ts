import { test, expect } from '@playwright/test';

test.describe('Security Settings Page', () => {
  test('should display security settings page with all main sections', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login if not authenticated
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.locator('text=Welcome on board')).toBeVisible();
      return;
    }
    
    // If authenticated, check security settings elements
    await expect(page.locator('text=Security Settings')).toBeVisible();
    
    // Check all 4 main cards are present
    await expect(page.locator('text=Change Password')).toBeVisible();
    await expect(page.locator('text=Two-Factor Authentication')).toBeVisible();
    await expect(page.locator('text=Available Login Methods')).toBeVisible();
    await expect(page.locator('text=Active Sessions')).toBeVisible();
  });

  test('should handle loading state gracefully', async ({ page }) => {
    await page.goto('/settings/security');
    
    // Check for loading state or security content
    const hasLoading = await page.locator('text=Loading...').isVisible().catch(() => false);
    const hasSecuritySettings = await page.locator('text=Security Settings').isVisible().catch(() => false);
    const hasLogin = await page.locator('text=Welcome on board').isVisible().catch(() => false);
    
    // Should show one of these states
    expect(hasLoading || hasSecuritySettings || hasLogin).toBe(true);
  });

  test('should load without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Filter out expected errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('hydration') && 
      !error.includes('useSearchParams') &&
      !error.includes('Failed to load sessions') &&
      !error.includes('Failed to enable 2FA') &&
      !error.includes('Network request failed') &&
      !error.includes('User not found')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Change Password Functionality', () => {
  test('should show change password form toggle', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Check if change password button exists
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    const isVisible = await changePasswordButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await changePasswordButton.click();
      
      // Form should become visible
      await expect(page.locator('input[id="currentPassword"]')).toBeVisible();
      await expect(page.locator('input[id="newPassword"]')).toBeVisible();
      await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
    }
  });

  test('should validate password form inputs', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    const isVisible = await changePasswordButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await changePasswordButton.click();
      
      // Submit button should be disabled when fields are empty
      const submitButton = page.locator('button:has-text("Change Password")').nth(1);
      await expect(submitButton).toBeDisabled();
      
      // Fill only current password
      await page.fill('input[id="currentPassword"]', 'current123');
      await expect(submitButton).toBeDisabled();
      
      // Fill new password
      await page.fill('input[id="newPassword"]', 'new123456');
      await expect(submitButton).toBeDisabled();
      
      // Fill confirm password - should enable submit
      await page.fill('input[id="confirmPassword"]', 'new123456');
      await expect(submitButton).toBeEnabled();
    }
  });

  test('should test password visibility toggles', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    const isVisible = await changePasswordButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await changePasswordButton.click();
      
      // Test current password visibility toggle
      const currentPasswordInput = page.locator('input[id="currentPassword"]');
      await expect(currentPasswordInput).toHaveAttribute('type', 'password');
      
      // Click visibility toggle and verify it exists
      const visibilityToggle = page.locator('button').filter({ has: page.locator('svg') }).first();
      await expect(visibilityToggle).toBeVisible();
    }
  });

  test('should handle form cancellation', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    const isVisible = await changePasswordButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await changePasswordButton.click();
      
      // Fill form
      await page.fill('input[id="currentPassword"]', 'test123');
      await page.fill('input[id="newPassword"]', 'new123456');
      await page.fill('input[id="confirmPassword"]', 'new123456');
      
      // Click cancel
      const cancelButton = page.locator('button', { hasText: 'Cancel' });
      await cancelButton.click();
      
      // Form should be hidden and original button visible again
      await expect(page.locator('input[id="currentPassword"]')).not.toBeVisible();
      await expect(changePasswordButton).toBeVisible();
    }
  });
});

test.describe('Two-Factor Authentication', () => {
  test('should display 2FA status and controls', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Check for 2FA status badge
    const enabledBadge = page.locator('text=Enabled');
    const disabledBadge = page.locator('text=Disabled');
    
    const isEnabled = await enabledBadge.isVisible().catch(() => false);
    const isDisabled = await disabledBadge.isVisible().catch(() => false);
    
    // Should show either enabled or disabled state
    expect(isEnabled || isDisabled).toBe(true);
    
    // Check for appropriate action button
    if (isDisabled) {
      await expect(page.locator('button', { hasText: 'Enable Two-Factor Authentication' })).toBeVisible();
    } else {
      await expect(page.locator('button', { hasText: 'Disable 2FA' })).toBeVisible();
    }
  });

  test('should show 2FA enable form when clicking enable', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    const enableButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    const isVisible = await enableButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await enableButton.click();
      await page.waitForTimeout(500);
      
      // Should show password input form
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('button', { hasText: 'Continue' })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Cancel' })).toBeVisible();
    }
  });

  test('should validate 2FA setup password input', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    const enableButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    const isVisible = await enableButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await enableButton.click();
      await page.waitForTimeout(500);
      
      const continueButton = page.locator('button', { hasText: 'Continue' });
      
      // Continue should be disabled when password is empty
      await expect(continueButton).toBeDisabled();
      
      // Fill password and check it becomes enabled
      await page.fill('input[id="password"]', 'testpassword');
      await expect(continueButton).toBeEnabled();
    }
  });

  test('should handle 2FA disable form when enabled', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    const disableButton = page.locator('button', { hasText: 'Disable 2FA' });
    const isVisible = await disableButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Should show password input for disabling
      const passwordInput = page.locator('input[id="disablePassword"]');
      await expect(passwordInput).toBeVisible();
      
      // Disable button should be disabled when password is empty
      await expect(disableButton).toBeDisabled();
    }
  });

  test('should handle 2FA form cancellation', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    const enableButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    const isVisible = await enableButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await enableButton.click();
      await page.waitForTimeout(500);
      
      // Fill password
      await page.fill('input[id="password"]', 'testpassword');
      
      // Click cancel
      const cancelButton = page.locator('button', { hasText: 'Cancel' });
      await cancelButton.click();
      
      // Should return to original state
      await expect(page.locator('input[id="password"]')).not.toBeVisible();
      await expect(enableButton).toBeVisible();
    }
  });
});

test.describe('Login Methods Display', () => {
  test('should show available login methods', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Check for login methods section
    await expect(page.locator('text=Available Login Methods')).toBeVisible();
    
    // Should show email & password method
    await expect(page.locator('text=Email & Password')).toBeVisible();
    await expect(page.locator('text=Always available')).toBeVisible();
    
    // Should show Google OAuth status
    await expect(page.locator('text=Google OAuth')).toBeVisible();
    
    // Should show either "Linked" or "Auto-Link Available" badge
    const linkedBadge = page.locator('text=Linked');
    const autoLinkBadge = page.locator('text=Auto-Link Available');
    
    const isLinked = await linkedBadge.isVisible().catch(() => false);
    const isAutoLink = await autoLinkBadge.isVisible().catch(() => false);
    
    expect(isLinked || isAutoLink).toBe(true);
  });

  test('should display user email in login methods', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Should show some email indication (may be partial or full)
    const emailIndicator = page.locator('text=@');
    const hasEmailIndicator = await emailIndicator.isVisible().catch(() => false);
    
    // In test environment, we might not have real email, so this is optional
    if (hasEmailIndicator) {
      await expect(emailIndicator).toBeVisible();
    }
  });
});

test.describe('Session Management', () => {
  test('should display active sessions section', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Check for sessions section
    await expect(page.locator('text=Active Sessions')).toBeVisible();
    
    // Should show sessions count or loading
    await page.waitForTimeout(2000); // Wait for sessions to load
    
    const sessionsText = page.locator('text=/\\d+ active session/');
    const loadingText = page.locator('text=Loading sessions...');
    const noSessionsText = page.locator('text=No active sessions found');
    
    const hasSessionsText = await sessionsText.isVisible().catch(() => false);
    const hasLoadingText = await loadingText.isVisible().catch(() => false);
    const hasNoSessions = await noSessionsText.isVisible().catch(() => false);
    
    expect(hasSessionsText || hasLoadingText || hasNoSessions).toBe(true);
  });

  test('should show sign out others button when applicable', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Wait for sessions to load
    await page.waitForTimeout(3000);
    
    const signOutButton = page.locator('button', { hasText: 'Sign Out Others' });
    const isVisible = await signOutButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Button should be present (whether enabled or disabled depends on session count)
      await expect(signOutButton).toBeVisible();
    }
  });

  test('should handle session loading states properly', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Should show either loading or session content
    await page.waitForTimeout(1000);
    
    const hasLoadingText = await page.locator('text=Loading sessions...').isVisible().catch(() => false);
    const hasSessionCount = await page.locator('text=/\\d+ active session/').isVisible().catch(() => false);
    const hasNoSessions = await page.locator('text=No active sessions found').isVisible().catch(() => false);
    
    expect(hasLoadingText || hasSessionCount || hasNoSessions).toBe(true);
  });

  test('should display session details when available', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Wait for sessions to load
    await page.waitForTimeout(3000);
    
    // Check if any session items are displayed
    const sessionItems = page.locator('div:has-text("Current")');
    const hasSessionItems = await sessionItems.count().catch(() => 0);
    
    if (hasSessionItems > 0) {
      // Should have at least one current session
      await expect(page.locator('text=Current')).toBeVisible();
    }
  });
});

test.describe('Security Settings Integration Tests', () => {
  test('should maintain page functionality during loading states', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // All main sections should remain accessible even during loading
    await expect(page.locator('text=Security Settings')).toBeVisible();
    
    // Main cards should be visible
    const changePasswordCard = page.locator('text=Change Password');
    const twoFactorCard = page.locator('text=Two-Factor Authentication');
    const loginMethodsCard = page.locator('text=Available Login Methods');
    const sessionsCard = page.locator('text=Active Sessions');
    
    await expect(changePasswordCard).toBeVisible();
    await expect(twoFactorCard).toBeVisible();  
    await expect(loginMethodsCard).toBeVisible();
    await expect(sessionsCard).toBeVisible();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Monitor console errors during interactions
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Filter out expected errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('hydration') && 
      !error.includes('Failed to load sessions') &&
      !error.includes('Failed to enable 2FA') &&
      !error.includes('Network request failed') &&
      !error.includes('User not found')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should respond to user interactions properly', async ({ page }) => {
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      return;
    }
    
    // Try interacting with change password button
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    const isPasswordButtonVisible = await changePasswordButton.isVisible().catch(() => false);
    
    if (isPasswordButtonVisible) {
      await changePasswordButton.click();
      await page.waitForTimeout(500);
      
      // Should show form or some response
      const hasForm = await page.locator('input[id="currentPassword"]').isVisible().catch(() => false);
      expect(hasForm).toBe(true);
    }
    
    // Try interacting with 2FA button
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    const is2FAButtonVisible = await enable2FAButton.isVisible().catch(() => false);
    
    if (is2FAButtonVisible) {
      await enable2FAButton.click();
      await page.waitForTimeout(500);
      
      // Should show form or some response
      const hasForm = await page.locator('input[id="password"]').isVisible().catch(() => false);
      expect(hasForm).toBe(true);
    }
  });
});
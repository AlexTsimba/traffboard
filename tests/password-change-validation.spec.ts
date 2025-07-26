import { test, expect } from '@playwright/test';

test.describe('Password Change Validation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to security settings
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip tests if not authenticated
    if (page.url().includes('/login')) {
      test.skip();
    }
  });

  test('should show specific error for incorrect current password', async ({ page }) => {
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    
    // Only run if change password functionality is available
    if (!(await changePasswordButton.isVisible())) {
      test.skip();
    }
    
    await changePasswordButton.click();
    
    // Fill form with deliberately wrong current password
    await page.fill('input[id="currentPassword"]', 'definitely-wrong-password-123');
    await page.fill('input[id="newPassword"]', 'validNewPassword123');
    await page.fill('input[id="confirmPassword"]', 'validNewPassword123');
    
    // Submit the form
    const submitButton = page.locator('button:has-text("Change Password")').nth(1);
    await submitButton.click();
    
    // Wait for API response and toast
    await page.waitForTimeout(3000);
    
    // Verify error toast appears with meaningful message
    const errorToasts = page.locator('[data-sonner-toast]').filter({ 
      hasText: /Failed to change password|Current password|incorrect|invalid|wrong/i 
    });
    
    const hasErrorToast = await errorToasts.count() > 0;
    expect(hasErrorToast).toBe(true);
    
    // Verify NO success toast appears
    const successToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: 'Password changed successfully' 
    });
    const hasSuccessToast = await successToast.isVisible().catch(() => false);
    expect(hasSuccessToast).toBe(false);
    
    // Form should remain visible since operation failed
    await expect(page.locator('input[id="currentPassword"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    
    if (!(await changePasswordButton.isVisible())) {
      test.skip();
    }
    
    await changePasswordButton.click();
    
    // Test various error scenarios
    const errorScenarios = [
      {
        current: 'wrong-password-123',
        new: 'newPassword123',
        confirm: 'newPassword123',
        expectedErrorPattern: /Failed to change password|Current password|incorrect|invalid/i,
        description: 'wrong current password'
      },
      {
        current: 'some-password',
        new: 'weak',
        confirm: 'weak', 
        expectedErrorPattern: /password.*characters|too short|minimum/i,
        description: 'weak new password (client-side validation)'
      }
    ];
    
    for (const scenario of errorScenarios) {
      console.log(`Testing scenario: ${scenario.description}`);
      
      // Clear and fill form
      await page.fill('input[id="currentPassword"]', '');
      await page.fill('input[id="newPassword"]', '');
      await page.fill('input[id="confirmPassword"]', '');
      
      await page.fill('input[id="currentPassword"]', scenario.current);
      await page.fill('input[id="newPassword"]', scenario.new);
      await page.fill('input[id="confirmPassword"]', scenario.confirm);
      
      // Submit if enabled
      const submitButton = page.locator('button:has-text("Change Password")').nth(1);
      const isEnabled = await submitButton.isEnabled();
      
      if (isEnabled) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Check for appropriate error message
        const errorToasts = page.locator('[data-sonner-toast]');
        const errorCount = await errorToasts.count();
        
        if (errorCount > 0) {
          const toastText = await errorToasts.first().textContent() || '';
          console.log(`Toast message: ${toastText}`);
          
          // Should match expected error pattern
          expect(toastText).toMatch(scenario.expectedErrorPattern);
        }
        
        // Never show success
        const successToast = page.locator('[data-sonner-toast]').filter({ 
          hasText: 'Password changed successfully' 
        });
        const hasSuccessToast = await successToast.isVisible().catch(() => false);
        expect(hasSuccessToast).toBe(false);
      }
      
      // Clear any existing toasts before next scenario
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  });

  test('should show loading state during API call', async ({ page }) => {
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    
    if (!(await changePasswordButton.isVisible())) {
      test.skip();
    }
    
    await changePasswordButton.click();
    
    // Fill form with any values
    await page.fill('input[id="currentPassword"]', 'test-password');
    await page.fill('input[id="newPassword"]', 'newPassword123');
    await page.fill('input[id="confirmPassword"]', 'newPassword123');
    
    // Submit form
    const submitButton = page.locator('button:has-text("Change Password")').nth(1);
    await submitButton.click();
    
    // Check for loading toast (should appear immediately)
    await page.waitForTimeout(100);
    const loadingToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: /Changing password|loading/i 
    });
    
    const hasLoadingToast = await loadingToast.isVisible().catch(() => false);
    expect(hasLoadingToast).toBe(true);
  });

  test('should not show false positive success messages', async ({ page }) => {
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    
    if (!(await changePasswordButton.isVisible())) {
      test.skip();
    }
    
    await changePasswordButton.click();
    
    // Track all toast messages during test
    const toastMessages: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('toast')) {
        toastMessages.push(msg.text());
      }
    });
    
    // Try multiple invalid attempts
    const invalidAttempts = [
      { current: 'wrong1', new: 'new123456', confirm: 'new123456' },
      { current: 'wrong2', new: 'new123456', confirm: 'new123456' },
      { current: 'wrong3', new: 'new123456', confirm: 'new123456' }
    ];
    
    for (let i = 0; i < invalidAttempts.length; i++) {
      const attempt = invalidAttempts[i];
      
      // Clear and fill form
      await page.fill('input[id="currentPassword"]', '');
      await page.fill('input[id="newPassword"]', '');
      await page.fill('input[id="confirmPassword"]', '');
      
      await page.fill('input[id="currentPassword"]', attempt.current);
      await page.fill('input[id="newPassword"]', attempt.new);
      await page.fill('input[id="confirmPassword"]', attempt.confirm);
      
      // Submit
      const submitButton = page.locator('button:has-text("Change Password")').nth(1);
      await submitButton.click();
      
      // Wait for complete response
      await page.waitForTimeout(3000);
      
      // Check that no success toast appears
      const successToast = page.locator('[data-sonner-toast]').filter({ 
        hasText: 'Password changed successfully' 
      });
      const hasSuccessToast = await successToast.isVisible().catch(() => false);
      
      expect(hasSuccessToast).toBe(false);
      
      // Clear toasts for next attempt
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    console.log('All toast messages during test:', toastMessages);
  });

  test('should handle network errors appropriately', async ({ page }) => {
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    
    if (!(await changePasswordButton.isVisible())) {
      test.skip();
    }
    
    await changePasswordButton.click();
    
    // Fill valid form
    await page.fill('input[id="currentPassword"]', 'test-password');
    await page.fill('input[id="newPassword"]', 'newPassword123');
    await page.fill('input[id="confirmPassword"]', 'newPassword123');
    
    // Simulate network failure by blocking requests
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });
    
    // Submit form
    const submitButton = page.locator('button:has-text("Change Password")').nth(1);
    await submitButton.click();
    
    // Wait for error handling
    await page.waitForTimeout(3000);
    
    // Should show error, not success
    const errorToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: /Failed|error|network/i 
    });
    const successToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: 'Password changed successfully' 
    });
    
    const hasErrorToast = await errorToast.isVisible().catch(() => false);
    const hasSuccessToast = await successToast.isVisible().catch(() => false);
    
    expect(hasErrorToast).toBe(true);
    expect(hasSuccessToast).toBe(false);
  });

  test('should preserve form state on API errors', async ({ page }) => {
    const changePasswordButton = page.locator('button', { hasText: 'Change Password' });
    
    if (!(await changePasswordButton.isVisible())) {
      test.skip();
    }
    
    await changePasswordButton.click();
    
    const testPassword = 'wrong-current-password';
    const newPassword = 'newValidPassword123';
    
    // Fill form
    await page.fill('input[id="currentPassword"]', testPassword);
    await page.fill('input[id="newPassword"]', newPassword);
    await page.fill('input[id="confirmPassword"]', newPassword);
    
    // Submit (should fail)
    const submitButton = page.locator('button:has-text("Change Password")').nth(1);
    await submitButton.click();
    
    // Wait for API response
    await page.waitForTimeout(3000);
    
    // Form should remain visible and accessible
    await expect(page.locator('input[id="currentPassword"]')).toBeVisible();
    await expect(page.locator('input[id="newPassword"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
    
    // Fields should be clearable for retry
    await page.fill('input[id="currentPassword"]', '');
    await expect(page.locator('input[id="currentPassword"]')).toHaveValue('');
  });
});
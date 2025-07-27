import { test, expect } from '@playwright/test';

test.describe('2FA Validation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to security settings
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Skip tests if not authenticated
    if (page.url().includes('/login')) {
      test.skip();
    }
  });

  test('should show specific error for wrong password when enabling 2FA', async ({ page }) => {
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    
    // Only run if 2FA enable functionality is available
    if (!(await enable2FAButton.isVisible())) {
      test.skip();
    }
    
    await enable2FAButton.click();
    
    // Fill form with deliberately wrong password
    await page.fill('input[id="password"]', 'definitely-wrong-password-123');
    
    // Submit the form
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();
    
    // Wait for API response and toast
    await page.waitForTimeout(3000);
    
    // Verify error toast appears with meaningful message
    const errorToasts = page.locator('[data-sonner-toast]').filter({ 
      hasText: /Failed to enable 2FA|Current password|incorrect|invalid|wrong|Password is incorrect/i 
    });
    
    const hasErrorToast = await errorToasts.count() > 0;
    expect(hasErrorToast).toBe(true);
    
    // Verify NO success toast appears
    const successToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: /2FA enabled successfully|setup complete/i 
    });
    const hasSuccessToast = await successToast.isVisible().catch(() => false);
    expect(hasSuccessToast).toBe(false);
    
    // Form should remain visible since operation failed
    await expect(page.locator('input[id="password"]')).toBeVisible();
  });

  test('should show error for wrong password when disabling 2FA', async ({ page }) => {
    const disable2FAButton = page.locator('button', { hasText: 'Disable 2FA' });
    
    // Only run if 2FA disable functionality is available
    if (!(await disable2FAButton.isVisible())) {
      test.skip();
    }
    
    // Fill form with deliberately wrong password
    await page.fill('input[id="disablePassword"]', 'definitely-wrong-password-123');
    
    // Submit the form
    await disable2FAButton.click();
    
    // Wait for API response and toast
    await page.waitForTimeout(3000);
    
    // Verify error toast appears with meaningful message
    const errorToasts = page.locator('[data-sonner-toast]').filter({ 
      hasText: /Failed to disable 2FA|Current password|incorrect|invalid|wrong|Password is incorrect/i 
    });
    
    const hasErrorToast = await errorToasts.count() > 0;
    expect(hasErrorToast).toBe(true);
    
    // Verify NO success toast appears
    const successToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: /2FA disabled|Two-factor authentication has been turned off/i 
    });
    const hasSuccessToast = await successToast.isVisible().catch(() => false);
    expect(hasSuccessToast).toBe(false);
    
    // Form should remain visible since operation failed
    await expect(page.locator('input[id="disablePassword"]')).toBeVisible();
  });

  test('should handle 2FA verification errors gracefully', async ({ page }) => {
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    
    if (!(await enable2FAButton.isVisible())) {
      test.skip();
    }
    
    await enable2FAButton.click();
    
    // Test various error scenarios for TOTP verification
    const errorScenarios = [
      {
        code: '123456',
        description: 'invalid TOTP code',
        expectedErrorPattern: /Failed to verify code|Invalid code|verification failed/i
      },
      {
        code: '000000',
        description: 'obviously fake code',
        expectedErrorPattern: /Failed to verify code|Invalid code|verification failed/i
      }
    ];
    
    for (const scenario of errorScenarios) {
      console.log(`Testing 2FA scenario: ${scenario.description}`);
      
      // Fill TOTP code input if available
      const totpInput = page.locator('input[id="totpCode"]');
      const isTotpVisible = await totpInput.isVisible().catch(() => false);
      
      if (isTotpVisible) {
        await page.fill('input[id="totpCode"]', scenario.code);
        
        // Submit if enabled
        const verifyButton = page.locator('button:has-text("Verify & Enable")');
        const isEnabled = await verifyButton.isEnabled();
        
        if (isEnabled) {
          await verifyButton.click();
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
            hasText: /2FA enabled successfully|setup complete|verification successful/i 
          });
          const hasSuccessToast = await successToast.isVisible().catch(() => false);
          expect(hasSuccessToast).toBe(false);
        }
        
        // Clear any existing toasts before next scenario
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should show loading state during 2FA operations', async ({ page }) => {
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    
    if (!(await enable2FAButton.isVisible())) {
      test.skip();
    }
    
    await enable2FAButton.click();
    
    // Fill form with any password
    await page.fill('input[id="password"]', 'test-password');
    
    // Submit form
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();
    
    // Check for loading state (should appear immediately)
    await page.waitForTimeout(100);
    const loadingButton = page.locator('button:has-text("Generating...")');
    
    const hasLoadingButton = await loadingButton.isVisible().catch(() => false);
    expect(hasLoadingButton).toBe(true);
  });

  test('should not show false positive success messages for 2FA operations', async ({ page }) => {
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    
    if (!(await enable2FAButton.isVisible())) {
      test.skip();
    }
    
    await enable2FAButton.click();
    
    // Track all toast messages during test
    const toastMessages: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('toast')) {
        toastMessages.push(msg.text());
      }
    });
    
    // Try multiple invalid password attempts
    const invalidAttempts = [
      'wrong1',
      'wrong2', 
      'wrong3'
    ];
    
    for (let i = 0; i < invalidAttempts.length; i++) {
      const password = invalidAttempts[i];
      
      // Clear and fill form
      await page.fill('input[id="password"]', '');
      await page.fill('input[id="password"]', password ?? '');
      
      // Submit
      const continueButton = page.locator('button:has-text("Continue")');
      await continueButton.click();
      
      // Wait for complete response
      await page.waitForTimeout(3000);
      
      // Check that no success toast appears
      const successToast = page.locator('[data-sonner-toast]').filter({ 
        hasText: /2FA enabled successfully|setup complete/i 
      });
      const hasSuccessToast = await successToast.isVisible().catch(() => false);
      
      expect(hasSuccessToast).toBe(false);
      
      // Clear toasts for next attempt
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    console.log('All 2FA toast messages during test:', toastMessages);
  });

  test('should handle network errors appropriately for 2FA operations', async ({ page }) => {
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    
    if (!(await enable2FAButton.isVisible())) {
      test.skip();
    }
    
    await enable2FAButton.click();
    
    // Fill valid form
    await page.fill('input[id="password"]', 'test-password');
    
    // Simulate network failure by blocking requests
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });
    
    // Submit form
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();
    
    // Wait for error handling
    await page.waitForTimeout(3000);
    
    // Should show error, not success
    const errorToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: /Failed|error|network/i 
    });
    const successToast = page.locator('[data-sonner-toast]').filter({ 
      hasText: /2FA enabled successfully|setup complete/i 
    });
    
    const hasErrorToast = await errorToast.isVisible().catch(() => false);
    const hasSuccessToast = await successToast.isVisible().catch(() => false);
    
    expect(hasErrorToast).toBe(true);
    expect(hasSuccessToast).toBe(false);
  });

  test('should preserve form state on 2FA API errors', async ({ page }) => {
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    
    if (!(await enable2FAButton.isVisible())) {
      test.skip();
    }
    
    await enable2FAButton.click();
    
    const testPassword = 'wrong-password-123';
    
    // Fill form
    await page.fill('input[id="password"]', testPassword);
    
    // Submit (should fail)
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();
    
    // Wait for API response
    await page.waitForTimeout(3000);
    
    // Form should remain visible and accessible
    await expect(page.locator('input[id="password"]')).toBeVisible();
    
    // Field should be clearable for retry
    await page.fill('input[id="password"]', '');
    await expect(page.locator('input[id="password"]')).toHaveValue('');
  });

  test('should handle 2FA disable with wrong password gracefully', async ({ page }) => {
    const disable2FAButton = page.locator('button', { hasText: 'Disable 2FA' });
    
    if (!(await disable2FAButton.isVisible())) {
      test.skip();
    }
    
    // Try multiple wrong passwords
    const wrongPasswords = ['wrong1', 'wrong2', 'wrong3'];
    
    for (const wrongPassword of wrongPasswords) {
      // Clear and fill password
      await page.fill('input[id="disablePassword"]', '');
      await page.fill('input[id="disablePassword"]', wrongPassword);
      
      // Submit
      await disable2FAButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Should show error, not success
      const errorToast = page.locator('[data-sonner-toast]').filter({ 
        hasText: /Failed to disable 2FA|Current password|incorrect|invalid/i 
      });
      const successToast = page.locator('[data-sonner-toast]').filter({ 
        hasText: /2FA disabled|Two-factor authentication has been turned off/i 
      });
      
      const hasErrorToast = await errorToast.isVisible().catch(() => false);
      const hasSuccessToast = await successToast.isVisible().catch(() => false);
      
      expect(hasErrorToast).toBe(true);
      expect(hasSuccessToast).toBe(false);
      
      // Clear toasts for next attempt
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('should validate 2FA form inputs properly', async ({ page }) => {
    const enable2FAButton = page.locator('button', { hasText: 'Enable Two-Factor Authentication' });
    
    if (!(await enable2FAButton.isVisible())) {
      test.skip();
    }
    
    await enable2FAButton.click();
    
    // Continue button should be disabled when password is empty
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeDisabled();
    
    // Fill password and check it becomes enabled
    await page.fill('input[id="password"]', 'testpassword');
    await expect(continueButton).toBeEnabled();
    
    // Clear password and check it becomes disabled again
    await page.fill('input[id="password"]', '');
    await expect(continueButton).toBeDisabled();
  });
});
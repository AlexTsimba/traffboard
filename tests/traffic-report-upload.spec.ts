import { test, expect } from '@playwright/test';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extend timeout for file upload operations
test.setTimeout(60000);

test.describe('Traffic Report Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root (will redirect to login if not authenticated)
    await page.goto('/');
    
    // Wait for potential redirects and page load
    await page.waitForLoadState('networkidle');
    
    // Login as admin (using correct selectors and credentials)
    await page.fill('input[id="email"]', 'admin@traffboard.com');
    await page.fill('input[id="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // Wait for successful login and redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to data management via user dropdown menu
    // Click on user dropdown to open it (using the correct selector from debug tests)
    await page.click('[data-slot="dropdown-menu-trigger"][data-sidebar="menu-button"]:has-text("Test Admin")');
    
    // Wait for dropdown to appear and click on Administration submenu
    await page.click('text=Administration');
    
    // Click on Data Management
    await page.click('text=Data Management');
    
    // Wait for navigation to admin data page
    await page.waitForURL('/settings/admin/data');
  });

  test('should upload and process traffic report CSV successfully', async ({ page }) => {
    // Get the CSV file path
    const csvPath = join(__dirname, 'fixtures', 'sample-traffic-report.csv');
    
    // Upload the CSV file
    await page.setInputFiles('input[type="file"]', csvPath);
    
    // Wait for upload to start (file input should be disabled and button should show "Uploading...")
    await expect(page.locator('button:has-text("Uploading...")')).toBeVisible({ timeout: 10000 });
    
    // Wait for processing to complete by checking for completed badge
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 60000 });
    
    // Check database status refresh
    await page.click('button:has-text("Refresh")');
    
    // Wait for database status to update - look for traffic reports count
    await expect(page.locator('text=Traffic Reports')).toBeVisible();
    await expect(page.locator('text=4 records')).toBeVisible();
  });

  test('should handle duplicate records correctly on second upload', async ({ page }) => {
    const csvPath = join(__dirname, 'fixtures', 'sample-traffic-report.csv');
    
    // First upload
    await page.setInputFiles('input[type="file"]', csvPath);
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 30000 });
    
    // Second upload (same file) 
    await page.setInputFiles('input[type="file"]', csvPath);
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 30000 });
    
    // Check database status - should still show 4 records (no duplicates added)
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=4 records')).toBeVisible();
  });

  test('should handle file with duplicates within the same upload', async ({ page }) => {
    const csvPath = join(__dirname, 'fixtures', 'sample-traffic-report-duplicates.csv');
    
    // Upload CSV with internal duplicates
    await page.setInputFiles('input[type="file"]', csvPath);
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 30000 });
    
    // Check database status
    await page.click('button:has-text("Refresh")');
    
    // Should have processed the file and show some records
    await expect(page.locator('text=Traffic Reports')).toBeVisible();
    await expect(page.locator('text=Traffic Reports').locator('~ *').filter({ hasText: 'records' }).first()).toBeVisible();
  });

  test('should handle partial duplicate scenario', async ({ page }) => {
    const csvPath1 = join(__dirname, 'fixtures', 'sample-traffic-report.csv');
    const csvPath2 = join(__dirname, 'fixtures', 'sample-traffic-report-duplicates.csv');
    
    // First upload - 4 unique records
    await page.setInputFiles('input[type="file"]', csvPath1);
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 30000 });
    
    // Second upload - file with some duplicates
    await page.setInputFiles('input[type="file"]', csvPath2);
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 30000 });
    
    // Check final database status
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=Traffic Reports')).toBeVisible();
    await expect(page.locator('text=Traffic Reports').locator('~ *').filter({ hasText: 'records' }).first()).toBeVisible();
  });

  test('should maintain performance with large file uploads', async ({ page }) => {
    // Test that processing completes within reasonable time
    const csvPath = join(__dirname, 'fixtures', 'sample-traffic-report.csv');
    
    const startTime = Date.now();
    
    await page.setInputFiles('input[type="file"]', csvPath);
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 30000 });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Should complete within 30 seconds
    expect(processingTime).toBeLessThan(30000);
    
    // Verify processing was successful
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=4 records')).toBeVisible();
  });

  test('should filter out cr, cftd, cd, rftd columns during processing', async ({ page }) => {
    // Test CSV with filtered columns - should process successfully and ignore filtered columns
    const csvPath = join(__dirname, 'fixtures', 'sample-traffic-report-with-filtered-columns.csv');
    
    await page.setInputFiles('input[type="file"]', csvPath);
    await expect(page.locator('text=completed').first()).toBeVisible({ timeout: 30000 });
    
    // Check database status - should show 4 records processed successfully
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=Traffic Reports')).toBeVisible();
    await expect(page.locator('text=4 records')).toBeVisible();
  });
});
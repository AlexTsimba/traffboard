import { test, expect } from '@playwright/test';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('debug upload flow', async ({ page }) => {
  // Monitor network requests
  const requests: string[] = [];
  const responses: Array<{url: string, status: number, body?: string}> = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/admin/data/')) {
      requests.push(`${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/admin/data/')) {
      try {
        const body = await response.text();
        responses.push({
          url: response.url(),
          status: response.status(),
          body: body
        });
      } catch (e) {
        responses.push({
          url: response.url(),
          status: response.status(),
          body: 'Could not read body'
        });
      }
    }
  });
  
  // Navigate and login
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Login as admin
  await page.fill('input[id="email"]', 'admin@traffboard.com');
  await page.fill('input[id="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Navigate to admin data page
  await page.click('[data-slot="dropdown-menu-trigger"][data-sidebar="menu-button"]:has-text("Test Admin")');
  await page.click('text=Administration');
  await page.click('text=Data Management');
  await page.waitForURL('/settings/admin/data');
  
  // Try to upload a file
  const csvPath = join(__dirname, 'fixtures', 'sample-traffic-report.csv');
  await page.setInputFiles('input[type="file"]', csvPath);
  
  // Wait for any network activity
  await page.waitForTimeout(3000);
  
  console.log('\n=== NETWORK REQUESTS ===');
  requests.forEach(req => console.log(req));
  
  console.log('\n=== NETWORK RESPONSES ===');
  responses.forEach(res => {
    console.log(`${res.status} ${res.url}`);
    if (res.body && res.body !== 'Could not read body') {
      console.log(`Body: ${res.body}`);
    }
  });
  
  // Check console for errors
  const logs = [];
  page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
  
  if (logs.length > 0) {
    console.log('\n=== CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));
  }
});
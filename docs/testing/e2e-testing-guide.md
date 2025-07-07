ectors
- **Use** semantic selectors (`text=`, `role=`) when appropriate
- **Avoid** CSS class names that may change
- **Test** selectors thoroughly to ensure they're robust

### Error Handling
```typescript
// ✅ Good: Handle expected failures gracefully
test("should handle server error", async ({ page }) => {
  // Setup error condition
  await page.route("**/api/login", route => route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ error: "Server error" })
  }));
  
  const loginPage = new LoginPage(page);
  await loginPage.login("user@example.com", "password");
  await loginPage.expectErrorMessage("Server error");
});
```

### Performance
- Use `page.waitForLoadState("networkidle")` for complex pages
- Avoid `page.waitForTimeout()` - use specific conditions instead
- Parallelize tests when possible (set `fullyParallel: true`)

## CI Integration

### GitHub Actions Integration
The tests are integrated into the CI pipeline via `.github/workflows/ci.yml`:

```yaml
# Add to existing CI workflow
- name: 🎭 Install Playwright
  run: npx playwright install --with-deps chromium

- name: 🧪 Run E2E tests
  run: npx playwright test
  env:
    CI: true
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    PLAYWRIGHT_BASE_URL: http://localhost:3000

- name: 📊 Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: tests/results/
    retention-days: 7
```

### Environment Variables
Required environment variables for CI:
- `TEST_DATABASE_URL`: Test database connection string
- `DATABASE_URL`: Fallback database connection
- `NEXTAUTH_SECRET`: Authentication secret
- `NEXTAUTH_URL`: Base URL for auth callbacks

## Troubleshooting

### Common Test Failures

#### "Element not found" errors
**Cause**: Element selector changed or timing issue
**Solution**: 
1. Check if selector still exists in DOM
2. Add explicit wait: `await expect(locator).toBeVisible()`
3. Use browser dev tools to inspect current DOM

#### "Timeout" errors
**Cause**: Page takes too long to load or respond
**Solution**:
1. Increase timeout for slow operations
2. Check network requests in browser dev tools
3. Use `waitForLoadState("networkidle")` for dynamic content

#### Database connection errors
**Cause**: Test database not accessible or misconfigured
**Solution**:
1. Verify `TEST_DATABASE_URL` is correct
2. Ensure test database exists and is accessible
3. Check database connection pooling limits

#### Authentication state issues
**Cause**: Session cookies not properly managed
**Solution**:
1. Clear cookies in `beforeEach`: `await page.context().clearCookies()`
2. Verify logout properly clears session
3. Check for cached authentication state

### Debug Strategies

#### Visual Debugging
```typescript
// Take screenshot at specific points
await page.screenshot({ path: "debug-screenshot.png" });

// Record video of test execution
// (enabled automatically in config for failed tests)
```

#### Console Logs
```typescript
// Monitor browser console for errors
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
```

#### Step-by-step Debugging
```typescript
// Run single test with debug flag
// npx playwright test auth.spec.ts --debug

// Add breakpoints in test
await page.pause(); // Pauses execution in debug mode
```

## Security Considerations

### Test Data
- Never use real production credentials in tests
- Use dedicated test accounts with minimal privileges
- Clean up sensitive test data after each run

### API Testing
```typescript
// Test API endpoints directly when needed
test("API: should authenticate user", async ({ request }) => {
  const response = await request.post("/api/auth/signin", {
    data: {
      email: "test@example.com",
      password: "test123456"
    }
  });
  
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty("user");
});
```

## Performance Monitoring

### Test Metrics
- Track test execution time trends
- Monitor flaky test rates
- Measure browser resource usage

### Optimization Tips
- Run critical path tests first
- Skip non-essential tests in fast feedback loops
- Use test sharding for large test suites

```typescript
// Example: Mark critical tests
test.describe("Critical Path @smoke", () => {
  test("user can login", async ({ page }) => {
    // Critical authentication test
  });
});

// Run only smoke tests for quick feedback
// npx playwright test --grep @smoke
```

## Maintenance

### Regular Tasks
1. **Update Selectors**: Review selectors when UI changes
2. **Test Data**: Refresh test scenarios as features evolve
3. **Dependencies**: Keep Playwright and browsers updated
4. **Performance**: Monitor and optimize slow tests

### Version Updates
```bash
# Update Playwright
npm install @playwright/test@latest

# Update browser versions
npx playwright install
```

### Test Health Monitoring
- Set up alerts for test failures in CI
- Track test reliability metrics
- Regular review of flaky tests

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Organization Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration Guide](https://playwright.dev/docs/ci)

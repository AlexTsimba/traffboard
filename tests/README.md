# E2E Testing Setup

Quick start guide for running E2E tests locally and in CI.

## Prerequisites

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Set up test database
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/traffboard_test"
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Test Structure

- `tests/e2e/` - Test files (*.spec.ts)
- `tests/fixtures/` - Page Object Models 
- `tests/utils/` - Database helpers and setup

## Key Features

✅ **Isolated test database** - Clean state for each run
✅ **Page Object Model** - Maintainable, reusable page classes
✅ **CI integration** - Works in GitHub Actions
✅ **Cross-browser** - Chrome, Firefox, Safari
✅ **Auto-retry** - Handles flaky tests
✅ **Rich reporting** - HTML reports with screenshots/videos

## Troubleshooting

**"Element not found"** → Check selectors in `tests/fixtures/*.ts`
**"Database errors"** → Verify `TEST_DATABASE_URL` is set correctly
**"Next.js dev tools blocking"** → Already disabled in `next.config.mjs`

See `docs/testing/e2e-testing-guide.md` for detailed documentation.

# DAL Tests CI/CD Setup

This document explains the CI/CD integration for TraffBoard DAL tests.

## Workflow: `.github/workflows/dal-tests.yml`

The DAL test workflow:

- Runs on push/PR to main/develop branches
- Sets up PostgreSQL service container
- Installs dependencies and Playwright
- Seeds test database
- Runs comprehensive DAL tests across browsers
- Uploads test results and reports

## Configuration

### Environment Variables

Required in CI:

```bash
DATABASE_URL=postgresql://postgres:testpassword@localhost:5432/traffboard_test
NEXTAUTH_SECRET=test-secret-for-ci
NEXTAUTH_URL=http://localhost:3000
```

### Test Commands

```bash
npm run test:dal:ci    # Run DAL tests in CI mode
npm run test:dal       # Run locally
npm run test:dal:debug # Debug mode
```

## Test Coverage

The DAL tests verify:

- Authentication (requireAuth, requireAdmin)
- User management (CRUD operations)
- Session management (cross-browser)
- Two-factor authentication APIs
- Error handling and security

## Artifacts

Test results uploaded:

- HTML report (`playwright-report-dal/`)
- Test results (`test-results-dal/`)
- Screenshots/videos on failure

## Troubleshooting

Common CI issues:

1. Database connection: Check PostgreSQL service health
2. Authentication: Verify test users exist
3. Timing: Increase timeouts for slower CI
4. Dependencies: Ensure Playwright browsers installed

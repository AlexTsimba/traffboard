# Testing Guide

## Quick Setup
```bash
npm run test:setup    # Setup database
npm run test:unit     # Unit tests  
npm run test          # E2E tests
npm run test:all      # All tests
```

## Configuration

### vitest.config.ts
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { isolate: true, singleFork: true }},
    include: ['tests/{backend,integration,unit}/**/*.test.ts'],
    exclude: ['tests/**/*.spec.ts']
  }
})
```

### .env.test
```bash
BETTER_AUTH_SECRET="test-secret-key-32-chars-long-abcd"
DATABASE_URL="postgresql://test:test@localhost:5433/traffboard_test"
BETTER_AUTH_URL="http://localhost:3000"
```

## Architecture

### E2E (Playwright): `tests/*.spec.ts` 
- auth-ui.spec.ts, navigation.spec.ts, security-settings.spec.ts, oauth-prevention.spec.ts

### Unit/Integration (Vitest): `tests/{unit,integration,backend}/**/*.test.ts`
- middleware.test.ts, auth/config.test.ts, api/auth.test.ts, models/user.test.ts

## Playwright Patterns

```typescript
// Selectors
await page.locator('text=Welcome').toBeVisible()
await page.locator('input[id="email"]').fill('test@example.com')

// Wait strategies  
await page.waitForLoadState('networkidle')
await page.waitForURL('/login')

// Route protection
await page.goto('/dashboard')
await page.waitForURL('/login')

// Error monitoring
const errors: string[] = []
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text())
})
```

## Vitest Patterns

```typescript
// ESM imports - add .js extension
import { NextRequest } from 'next/server.js'

// Mock setup
vi.mock('~/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() }}
}))

// Complete mock objects with type assertion
const mockSession = {
  user: { 
    id: '1', 
    email: 'test@example.com',
    twoFactorEnabled: false
  },
  session: { id: 'session1' }
} as any

// API testing
const response = await testRequest('/api/auth/sign-in/email', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
})
```

## Troubleshooting

**ESM Import Errors**: Add `.js` extension
```typescript
import { NextRequest } from 'next/server.js'
```

**NODE_ENV readonly**: Use `Object.defineProperty` in setup
```typescript
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test', writable: true
})
```

**Type errors with mocks**: Use `as any`
```typescript
mockResolvedValue({ user: { id: '1' } } as any)
```

**Floating promises**: Use `void` operator
```typescript
void asyncFunction()
```


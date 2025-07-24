import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false, // Prevent Symbol conflicts
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    pool: 'forks', // Prevent database connection conflicts
    poolOptions: {
      forks: {
        isolate: true,
        singleFork: true
      }
    },
    include: [
      'tests/backend/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/unit/**/*.test.ts'
    ],
    exclude: [
      'tests/**/*.spec.ts', // Playwright E2E tests
      'node_modules'
    ]
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src')
    }
  }
})
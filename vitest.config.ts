/// <reference types="vitest" />
import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: "jsdom",

    // Global test functions (describe, it, expect)
    globals: true,

    // Include patterns for test files
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],

    // Exclude patterns
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/e2e/**", // Exclude Playwright tests
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "coverage/**",
        "dist/**",
        "**/node_modules/**",
        "**/[.]**",
        "packages/*/test{,s}/**",
        "**/*.d.ts",
        "cypress/**",
        "test{,s}/**",
        "test{,-*}.{js,cjs,mjs,ts,tsx,jsx}",
        "**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}",
        "**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}",
        "**/src/components/ui/**", // Exclude shadcn/ui components
        "**/__tests__/**",
        "**/*.config.{js,ts,mjs}",
        "**/eslint.config.{js,mjs}",
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },

    // Performance optimization
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },

    // Test timeout (ms)
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },

  resolve: {
    alias: {
      // Match Next.js path mapping
      "@": path.resolve(process.cwd(), "./src"),
      "~": path.resolve(process.cwd(), "./src"),
    },
  },

  // Define for environment variables
  define: {
    "process.env.NODE_ENV": '"test"',
  },
});

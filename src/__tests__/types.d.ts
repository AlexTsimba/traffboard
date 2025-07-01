/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare global {
  namespace Vi {
    interface JestAssertion<T = unknown> extends jest.Matchers<void, T>, TestingLibraryMatchers<T, void> {}
  }
}

// Custom render options for React Testing Library
export interface CustomRenderOptions {
  preloadedState?: Record<string, unknown>;
  route?: string;
  locale?: string;
  theme?: "light" | "dark" | "system";
}

// Mock data interfaces for testing
export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

export interface MockConversion {
  id: string;
  title: string;
  value: number;
  date: string;
  status: "pending" | "completed" | "failed";
}

// Test utilities
export interface TestUtils {
  user: MockUser;
  conversions: MockConversion[];
  waitForLoadingToFinish: () => Promise<void>;
  clickByTestId: (testId: string) => Promise<void>;
}

// Vitest extended matcher types
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = unknown> extends TestingLibraryMatchers<T, void> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}

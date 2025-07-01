import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, beforeAll, vi } from "vitest";

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string; width?: number; height?: number; className?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} className={props.className} src={props.src} />;
  },
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  },
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: undefined,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Set up global mocks before all tests
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  globalThis.IntersectionObserver = mockIntersectionObserver as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  globalThis.ResizeObserver = mockResizeObserver as any;

  // Mock HTMLElement.scrollIntoView
  globalThis.HTMLElement.prototype.scrollIntoView = vi.fn();

  // Mock HTMLElement.hasPointerCapture
  globalThis.HTMLElement.prototype.hasPointerCapture = vi.fn();
  globalThis.HTMLElement.prototype.setPointerCapture = vi.fn();
  globalThis.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

// Environment variables for testing
vi.stubEnv("NODE_ENV", "test");

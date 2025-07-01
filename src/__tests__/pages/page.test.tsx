import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen } from "@/__tests__";

// Mock Next.js router more comprehensively
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockForward = vi.fn();
const mockRefresh = vi.fn();
const mockPrefetch = vi.fn();

const createMockRouter = (_pathname = "/"): Partial<AppRouterInstance> => ({
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
  prefetch: mockPrefetch,
});

vi.mock("next/navigation", () => ({
  useRouter: () => createMockRouter(),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Example page component for testing
function HomePage() {
  return (
    <main>
      <h1>Welcome to TraffBoard</h1>
      <p>Track your conversions and analytics</p>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/conversions">Conversions</a>
      </nav>
    </main>
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders main heading", () => {
    render(<HomePage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Welcome to TraffBoard");
  });

  it("renders navigation links", () => {
    render(<HomePage />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const conversionsLink = screen.getByRole("link", { name: /conversions/i });

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(conversionsLink).toHaveAttribute("href", "/conversions");
  });

  it("has proper semantic structure", () => {
    render(<HomePage />);

    const main = screen.getByRole("main");
    const nav = screen.getByRole("navigation");

    expect(main).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });
});

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen } from "@/__tests__";

// Mock navigation component using Next.js Link
function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    // Simulate logout logic
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav aria-label="Main navigation" role="navigation">
      <ul>
        <li>
          <Link className={isActive("/dashboard") ? "active" : ""} href="/dashboard">
            Dashboard
          </Link>
        </li>
        <li>
          <Link className={isActive("/conversions") ? "active" : ""} href="/conversions">
            Conversions
          </Link>
        </li>
        <li>
          <Link className={isActive("/analytics") ? "active" : ""} href="/analytics">
            Analytics
          </Link>
        </li>
        <li>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

// Mock Next.js hooks with more control
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: vi.fn(() => "/dashboard"),
}));

const mockUsePathname = vi.mocked(usePathname);

describe("Navigation Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("renders all navigation links", () => {
    render(<Navigation />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /conversions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("highlights active link based on pathname", () => {
    render(<Navigation />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const conversionsLink = screen.getByRole("link", { name: /conversions/i });

    expect(dashboardLink).toHaveClass("active");
    expect(conversionsLink).not.toHaveClass("active");
  });

  it("updates active link when pathname changes", () => {
    mockUsePathname.mockReturnValue("/conversions");

    render(<Navigation />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const conversionsLink = screen.getByRole("link", { name: /conversions/i });

    expect(dashboardLink).not.toHaveClass("active");
    expect(conversionsLink).toHaveClass("active");
  });

  it("calls router.push when logout is clicked", async () => {
    const { user } = render(<Navigation />);

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    await user.click(logoutButton);

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("has proper accessibility attributes", () => {
    render(<Navigation />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Main navigation");

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
  });
});

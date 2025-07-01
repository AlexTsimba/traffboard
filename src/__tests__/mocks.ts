// Mock data interfaces for testing
interface MockUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

interface MockConversion {
  id: string;
  title: string;
  value: number;
  date: string;
  status: "pending" | "completed" | "failed";
}

// Mock data generators
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  ...overrides,
});

export const createMockConversion = (overrides?: Partial<MockConversion>): MockConversion => ({
  id: "conv-1",
  title: "Test Conversion",
  value: 1500,
  date: "2024-01-15T10:30:00Z",
  status: "completed",
  ...overrides,
});

export const createMockConversions = (count = 3): MockConversion[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockConversion({
      id: `conv-${index + 1}`,
      title: `Conversion ${index + 1}`,
      value: 1000 + index * 500,
      date: new Date(2024, 0, 15 + index).toISOString(),
      status: index % 2 === 0 ? "completed" : "pending",
    }),
  );
};

// Test utilities
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
};

// Common test selectors
export const testIds = {
  // Navigation
  sidebar: "sidebar",
  sidebarTrigger: "sidebar-trigger",
  navigationItem: "navigation-item",

  // Forms
  loginForm: "login-form",
  emailInput: "email-input",
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  passwordInput: "password-input",
  submitButton: "submit-button",

  // Dashboard
  dashboardHeader: "dashboard-header",
  statsCard: "stats-card",
  chartContainer: "chart-container",

  // Data table
  dataTable: "data-table",
  tableRow: "table-row",
  tableCell: "table-cell",
  sortButton: "sort-button",
  filterButton: "filter-button",

  // Loading states
  loadingSpinner: "loading-spinner",
  loadingSkeleton: "loading-skeleton",

  // Error states
  errorMessage: "error-message",
  errorBoundary: "error-boundary",
} as const;

// Common assertions
export const commonAssertions = {
  expectLoadingToFinish: async (container: HTMLElement) => {
    await waitForLoadingToFinish();
    const loading = container.querySelector(`[data-testid="${testIds.loadingSpinner}"]`);
    expect(loading).not.toBeInTheDocument();
  },

  expectElementToBeVisible: (element: HTMLElement | null) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  },

  expectFormToBeValid: (form: HTMLElement) => {
    expect(form).toBeInTheDocument();
    expect(form).not.toHaveAttribute("aria-invalid", "true");
  },
};

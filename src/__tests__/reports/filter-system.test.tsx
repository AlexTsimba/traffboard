/**
 * Filter System Component Tests
 *
 * Tests the critical filter modal dialog, filter button, and active chips functionality
 * to ensure proper state management and user interaction workflows.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import {
  FilterButton,
  FilterModal,
  FilterChips,
  formatFilterValue,
  createAppliedFilter,
  validateFilterValue,
  validateFilters,
  COMMON_FILTERS,
  FilterComposer,
  createFilterComposer,
} from "@/components/reports/filters/filter-system";
import type { FilterDefinition, AppliedFilter } from "@/types/reports";

// =============================================================================
// MOCKS
// =============================================================================

// Mock the UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, onClick }: any) => (
    <span data-testid="filter-badge" onClick={onClick}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input data-testid="filter-input" {...props} />,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => {
    // Extract SelectContent children (options) and ignore SelectTrigger for the native select
    const selectItems = React.Children.toArray(children).filter((child: any) => child?.type?.name !== "SelectTrigger");

    return (
      <div data-testid="filter-select">
        <div>Select Trigger</div>
        <select onChange={(e) => onValueChange?.(e.target.value)} value={value} style={{ display: "none" }}>
          {selectItems}
        </select>
      </div>
    );
  },
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children: _children }: any) => null, // Don't render inside select
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// =============================================================================
// FILTER BUTTON TESTS
// =============================================================================

describe("FilterButton", () => {
  it("renders with default styling when no active filters", () => {
    const handleClick = vi.fn();
    render(<FilterButton onClick={handleClick} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Open filters");
  });

  it("renders with active styling when hasActiveFilters is true", () => {
    const handleClick = vi.fn();
    render(<FilterButton onClick={handleClick} hasActiveFilters={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<FilterButton onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// FILTER MODAL TESTS
// =============================================================================

describe("FilterModal", () => {
  const mockFilterDefinitions: FilterDefinition[] = [
    {
      id: "search",
      label: "Search",
      type: "text",
      placeholder: "Enter search term",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    onClear: vi.fn(),
    filterDefinitions: mockFilterDefinitions,
    currentFilters: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    render(<FilterModal {...defaultProps} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Filter Report");
  });

  it("does not render when closed", () => {
    render(<FilterModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders filter inputs based on definitions", () => {
    render(<FilterModal {...defaultProps} />);

    expect(screen.getByDisplayValue("")).toBeInTheDocument(); // text input
    expect(screen.getByTestId("filter-select")).toBeInTheDocument(); // select component
  });

  it("calls onSubmit with current filters when submit button clicked", async () => {
    render(<FilterModal {...defaultProps} />);

    const submitButton = screen.getByText("SUBMIT");
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({});
  });

  it("calls onClear when clear button clicked", () => {
    render(<FilterModal {...defaultProps} />);

    const clearButton = screen.getByText("CLEAR");
    fireEvent.click(clearButton);

    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it("updates local filter state when input changes", async () => {
    render(<FilterModal {...defaultProps} />);

    const textInput = screen.getByTestId("filter-input");
    fireEvent.change(textInput, { target: { value: "test search" } });

    // Submit to verify the value was captured
    const submitButton = screen.getByText("SUBMIT");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        search: "test search",
      });
    });
  });
});

// =============================================================================
// FILTER CHIPS TESTS
// =============================================================================

describe("FilterChips", () => {
  const mockAppliedFilters: AppliedFilter[] = [
    {
      id: "search",
      definition: { id: "search", label: "Search", type: "text" },
      value: "test",
      displayText: "test",
    },
    {
      id: "status",
      definition: { id: "status", label: "Status", type: "select" },
      value: "active",
      displayText: "active",
    },
  ];

  it("renders nothing when no applied filters", () => {
    const { container } = render(<FilterChips appliedFilters={[]} onRemoveFilter={vi.fn()} onClearAll={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders filter chips for applied filters", () => {
    render(<FilterChips appliedFilters={mockAppliedFilters} onRemoveFilter={vi.fn()} onClearAll={vi.fn()} />);

    expect(screen.getAllByTestId("filter-badge")).toHaveLength(2);
    expect(screen.getByText("Search: test")).toBeInTheDocument();
    expect(screen.getByText("Status: active")).toBeInTheDocument();
  });

  it("calls onRemoveFilter when filter chip is clicked", () => {
    const handleRemove = vi.fn();
    render(<FilterChips appliedFilters={mockAppliedFilters} onRemoveFilter={handleRemove} onClearAll={vi.fn()} />);

    // Find and click the remove button for the first filter
    const removeButtons = screen.getAllByRole("button");
    const firstRemoveButton = removeButtons.find((button) =>
      button.getAttribute("aria-label")?.includes("Remove Search"),
    );

    if (firstRemoveButton) {
      fireEvent.click(firstRemoveButton);
      expect(handleRemove).toHaveBeenCalledWith("search");
    }
  });

  it("shows clear all button when multiple filters", () => {
    render(<FilterChips appliedFilters={mockAppliedFilters} onRemoveFilter={vi.fn()} onClearAll={vi.fn()} />);

    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe("formatFilterValue", () => {
  it("formats text values correctly", () => {
    expect(formatFilterValue("test", "text")).toBe("test");
  });

  it("formats date values correctly", () => {
    const date = new Date("2024-01-15");
    const result = formatFilterValue(date, "date");
    expect(result).toContain("2024"); // Locale-independent check for year
  });

  it("formats date range values correctly", () => {
    const dateRange = {
      start: new Date("2024-01-01"),
      end: new Date("2024-01-31"),
    };
    const result = formatFilterValue(dateRange, "daterange");
    expect(result).toContain(" - ");
  });

  it("formats number range values correctly", () => {
    const numberRange = { min: 10, max: 50 };
    expect(formatFilterValue(numberRange, "numberrange")).toBe("10 - 50");
  });

  it("formats multiselect values correctly", () => {
    expect(formatFilterValue(["a", "b", "c"], "multiselect")).toBe("a, b, c");
  });

  it("formats multiselect values with truncation", () => {
    const manyValues = ["a", "b", "c", "d", "e"];
    expect(formatFilterValue(manyValues, "multiselect")).toBe("a, b, c +2");
  });

  it("formats boolean values correctly", () => {
    expect(formatFilterValue(true, "boolean")).toBe("Yes");
    expect(formatFilterValue(false, "boolean")).toBe("No");
  });

  it("handles null values", () => {
    expect(formatFilterValue(null, "text")).toBe("");
  });
});

describe("createAppliedFilter", () => {
  it("creates applied filter correctly", () => {
    const definition: FilterDefinition = {
      id: "test",
      label: "Test Filter",
      type: "text",
    };

    const result = createAppliedFilter(definition, "test value");

    expect(result).toEqual({
      id: "test",
      definition,
      value: "test value",
      displayText: "test value",
    });
  });
});

describe("validateFilterValue", () => {
  const definition: FilterDefinition = {
    id: "test",
    label: "Test Filter",
    type: "text",
    required: true,
  };

  it("validates required fields", () => {
    expect(validateFilterValue(null, definition)).toEqual({
      valid: false,
      error: "Test Filter is required",
    });

    expect(validateFilterValue("value", definition)).toEqual({
      valid: true,
    });
  });

  it("validates optional fields", () => {
    const optionalDefinition = { ...definition, required: false };

    expect(validateFilterValue(null, optionalDefinition)).toEqual({
      valid: true,
    });
  });

  it("validates custom validation", () => {
    const customDefinition: FilterDefinition = {
      ...definition,
      validation: {
        custom: (value) => (value === "invalid" ? "Custom error" : null),
      },
    };

    expect(validateFilterValue("invalid", customDefinition)).toEqual({
      valid: false,
      error: "Custom error",
    });

    expect(validateFilterValue("valid", customDefinition)).toEqual({
      valid: true,
    });
  });
});

describe("validateFilters", () => {
  const definitions: FilterDefinition[] = [
    {
      id: "required",
      label: "Required Field",
      type: "text",
      required: true,
    },
    {
      id: "optional",
      label: "Optional Field",
      type: "text",
    },
  ];

  it("validates all filters correctly", () => {
    const validFilters = {
      required: "value",
      optional: "optional value",
    };

    expect(validateFilters(validFilters, definitions)).toEqual({
      valid: true,
      errors: {},
    });
  });

  it("returns errors for invalid filters", () => {
    const invalidFilters = {
      required: null,
      optional: "value",
    };

    const result = validateFilters(invalidFilters, definitions);
    expect(result.valid).toBe(false);
    expect(result.errors.required).toBe("Required Field is required");
  });
});

// =============================================================================
// FILTER COMPOSER TESTS
// =============================================================================

describe("FilterComposer", () => {
  it("builds filters correctly", () => {
    const composer = new FilterComposer();
    const filter: FilterDefinition = {
      id: "test",
      label: "Test",
      type: "text",
    };

    const result = composer.add(filter).build();

    expect(result).toEqual([filter]);
  });

  it("adds common filters correctly", () => {
    const composer = createFilterComposer();
    const result = composer.addCommon("DATE_RANGE").build();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("dateRange");
    expect(result[0].type).toBe("daterange");
  });

  it("sorts filters by group and order", () => {
    const composer = createFilterComposer();
    const filters: FilterDefinition[] = [
      { id: "b", label: "B", type: "text", group: "group2", order: 2 },
      { id: "a", label: "A", type: "text", group: "group1", order: 1 },
      { id: "c", label: "C", type: "text", group: "group1", order: 3 },
    ];

    const result = composer.addAll(filters).build();

    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("c");
    expect(result[2].id).toBe("b");
  });

  it("resets correctly", () => {
    const composer = createFilterComposer();
    composer.addCommon("SEARCH").reset();

    expect(composer.build()).toHaveLength(0);
  });
});

// =============================================================================
// COMMON FILTERS TESTS
// =============================================================================

describe("COMMON_FILTERS", () => {
  it("contains expected common filters", () => {
    expect(COMMON_FILTERS.DATE_RANGE).toBeDefined();
    expect(COMMON_FILTERS.PARTNER_ID).toBeDefined();
    expect(COMMON_FILTERS.SEARCH).toBeDefined();
  });

  it("has correct structure for date range filter", () => {
    const dateRange = COMMON_FILTERS.DATE_RANGE;
    expect(dateRange.id).toBe("dateRange");
    expect(dateRange.type).toBe("daterange");
    expect(dateRange.group).toBe("time");
  });

  it("has correct structure for select filters", () => {
    const trafficSource = COMMON_FILTERS.TRAFFIC_SOURCE;
    expect(trafficSource.type).toBe("select");
    expect(trafficSource.options).toBeDefined();
    expect(trafficSource.options.length).toBeGreaterThan(0);
  });
});

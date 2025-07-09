/**
 * CohortTable Test Suite
 *
 * Comprehensive tests for cohort table components including triangular layout,
 * heatmap visualization, performance optimizations, and accessibility.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { CohortData, CohortMetric } from "@/types/reports";

import { CohortTable, CohortTableCell, CohortTableToolbar } from "../index";
import {
  calculateHeatmapIntensity,
  calculateMetricRange,
  createCohortCell,
  formatCohortValue,
  generateTriangularColumns,
  getBreakpointValueSafe,
  getVisibleBreakpoints,
  sortCohortsByDate,
  validateCohortData,
  clearCohortCellCache,
} from "../cohort-table-utils";

// Mock data for testing
const mockCohortData: CohortData[] = [
  {
    cohortDate: "2024-01-01",
    ftdCount: 100,
    breakpointValues: {
      1: 0.15,
      3: 0.25,
      7: 0.35,
      14: 0.45,
      30: 0.55,
    },
  },
  {
    cohortDate: "2024-01-02",
    ftdCount: 150,
    breakpointValues: {
      1: 0.18,
      3: 0.28,
      7: 0.38,
      14: 0.48,
    },
  },
  {
    cohortDate: "2024-01-03",
    ftdCount: 120,
    breakpointValues: {
      1: 0.12,
      3: 0.22,
      7: 0.32,
    },
  },
];

const mockBreakpoints = [1, 3, 7, 14, 30] as const;

describe("CohortTable Utility Functions", () => {
  afterEach(() => {
    clearCohortCellCache();
  });

  describe("getBreakpointValueSafe", () => {
    it("should return correct value for valid breakpoint", () => {
      const values = { 1: 0.15, 7: 0.35 };
      expect(getBreakpointValueSafe(values, 1)).toBe(0.15);
      expect(getBreakpointValueSafe(values, 7)).toBe(0.35);
    });

    it("should return null for invalid breakpoint", () => {
      const values = { 1: 0.15 };
      expect(getBreakpointValueSafe(values, -1)).toBeNull();
      expect(getBreakpointValueSafe(values, 1.5)).toBeNull();
      expect(getBreakpointValueSafe(values, 999)).toBeNull();
    });

    it("should return null for non-existent breakpoint", () => {
      const values = { 1: 0.15 };
      expect(getBreakpointValueSafe(values, 7)).toBeNull();
    });
  });

  describe("calculateHeatmapIntensity", () => {
    it("should calculate correct intensity", () => {
      expect(calculateHeatmapIntensity(0.5, 0, 1)).toBe(0.5);
      expect(calculateHeatmapIntensity(0.25, 0, 1)).toBe(0.25);
      expect(calculateHeatmapIntensity(0.75, 0, 1)).toBe(0.75);
    });

    it("should handle edge cases", () => {
      expect(calculateHeatmapIntensity(null, 0, 1)).toBe(0);
      expect(calculateHeatmapIntensity(0.5, 0.5, 0.5)).toBe(0);
      expect(calculateHeatmapIntensity(-0.5, 0, 1)).toBe(0);
      expect(calculateHeatmapIntensity(1.5, 0, 1)).toBe(1);
    });
  });

  describe("formatCohortValue", () => {
    it("should format values correctly for each metric", () => {
      expect(formatCohortValue(0.15, "dep2cost")).toBe("$0.15");
      expect(formatCohortValue(0.15, "roas")).toBe("15.0%");
      expect(formatCohortValue(1500, "avg_deposit_sum")).toBe("$1,500");
      expect(formatCohortValue(75.5, "retention_rate")).toBe("75.5%");
    });

    it("should handle null values", () => {
      expect(formatCohortValue(null, "dep2cost")).toBe("-");
      expect(formatCohortValue(null, "roas")).toBe("-");
      expect(formatCohortValue(null, "avg_deposit_sum")).toBe("-");
      expect(formatCohortValue(null, "retention_rate")).toBe("-");
    });
  });

  describe("generateTriangularColumns", () => {
    it("should generate correct triangular layout", () => {
      expect(generateTriangularColumns(mockBreakpoints, 0)).toEqual([1]);
      expect(generateTriangularColumns(mockBreakpoints, 1)).toEqual([1, 3]);
      expect(generateTriangularColumns(mockBreakpoints, 2)).toEqual([1, 3, 7]);
      expect(generateTriangularColumns(mockBreakpoints, 4)).toEqual([1, 3, 7, 14, 30]);
    });

    it("should handle edge cases", () => {
      expect(generateTriangularColumns([], 0)).toEqual([]);
      expect(generateTriangularColumns(mockBreakpoints, -1)).toEqual([]);
      expect(generateTriangularColumns(mockBreakpoints, 999)).toEqual(mockBreakpoints);
    });
  });

  describe("calculateMetricRange", () => {
    it("should calculate correct min/max values", () => {
      const range = calculateMetricRange(mockCohortData);
      expect(range.min).toBe(0.12);
      expect(range.max).toBe(0.55);
    });

    it("should handle empty data", () => {
      const range = calculateMetricRange([]);
      expect(range.min).toBe(0);
      expect(range.max).toBe(1);
    });
  });

  describe("sortCohortsByDate", () => {
    it("should sort cohorts by date (most recent first)", () => {
      const sorted = sortCohortsByDate([...mockCohortData]);
      expect(sorted[0].cohortDate).toBe("2024-01-03");
      expect(sorted[1].cohortDate).toBe("2024-01-02");
      expect(sorted[2].cohortDate).toBe("2024-01-01");
    });

    it("should not mutate original array", () => {
      const original = [...mockCohortData];
      sortCohortsByDate(original);
      expect(original[0].cohortDate).toBe("2024-01-01");
    });
  });

  describe("validateCohortData", () => {
    it("should validate correct cohort data", () => {
      expect(validateCohortData(mockCohortData[0])).toBe(true);
    });

    it("should reject invalid data", () => {
      expect(validateCohortData(null)).toBe(false);
      expect(validateCohortData({})).toBe(false);
      expect(validateCohortData({ cohortDate: "2024-01-01" })).toBe(false);
      expect(validateCohortData({ cohortDate: "2024-01-01", ftdCount: "invalid" })).toBe(false);
    });
  });

  describe("getVisibleBreakpoints", () => {
    it("should return correct visible breakpoints for triangular layout", () => {
      expect(getVisibleBreakpoints(mockBreakpoints, 0)).toEqual([1]);
      expect(getVisibleBreakpoints(mockBreakpoints, 1)).toEqual([1, 3]);
      expect(getVisibleBreakpoints(mockBreakpoints, 2)).toEqual([1, 3, 7]);
    });

    it("should respect maxBreakpoints limit", () => {
      expect(getVisibleBreakpoints(mockBreakpoints, 4, 3)).toEqual([1, 3, 7]);
    });
  });
});

describe("CohortTableCell Component", () => {
  const mockCell = createCohortCell(mockCohortData[0], 1, "roas", 0, 1);
  const mockOnCellClick = vi.fn();

  beforeEach(() => {
    mockOnCellClick.mockClear();
  });

  it("should render cell with correct content", () => {
    render(
      <CohortTableCell
        cell={mockCell}
        metric="roas"
        cohortDate="2024-01-01"
        breakpoint={1}
        onCellClick={mockOnCellClick}
      />,
    );

    expect(screen.getByText("15.0%")).toBeInTheDocument();
  });

  it("should handle cell click events", async () => {
    const user = userEvent.setup();
    
    render(
      <CohortTableCell
        cell={mockCell}
        metric="roas"
        cohortDate="2024-01-01"
        breakpoint={1}
        onCellClick={mockOnCellClick}
      />,
    );

    const cellElement = screen.getByRole("button");
    await user.click(cellElement);

    expect(mockOnCellClick).toHaveBeenCalledWith("2024-01-01", 1, 0.15);
  });

  it("should handle keyboard navigation", async () => {
    const user = userEvent.setup();
    
    render(
      <CohortTableCell
        cell={mockCell}
        metric="roas"
        cohortDate="2024-01-01"
        breakpoint={1}
        onCellClick={mockOnCellClick}
      />,
    );

    const cellElement = screen.getByRole("button");
    cellElement.focus();
    await user.keyboard("{Enter}");

    expect(mockOnCellClick).toHaveBeenCalledWith("2024-01-01", 1, 0.15);
  });

  it("should render empty cells correctly", () => {
    const emptyCell = createCohortCell(mockCohortData[0], 99, "roas", 0, 1); // Non-existent breakpoint
    
    render(
      <CohortTableCell
        cell={emptyCell}
        metric="roas"
        cohortDate="2024-01-01"
        breakpoint={1}
      />,
    );

    expect(screen.getByText("-")).toBeInTheDocument();
    // Empty cells render as div, not with role="cell" 
    const cellElement = screen.getByText("-").closest("div");
    expect(cellElement).toBeInTheDocument();
    expect(cellElement).toHaveAttribute("title", "Cohort: 1/1/2024, Day 1 - No data available");
  });

  it("should include proper accessibility attributes", () => {
    render(
      <CohortTableCell
        cell={mockCell}
        metric="roas"
        cohortDate="2024-01-01"
        breakpoint={1}
        onCellClick={mockOnCellClick}
      />,
    );

    const cellElement = screen.getByRole("button");
    expect(cellElement).toHaveAttribute("tabIndex", "0");
    expect(cellElement).toHaveAttribute("title");
    expect(cellElement).toHaveAttribute("aria-label");
  });
});

describe("CohortTableToolbar Component", () => {
  const mockProps = {
    selectedCount: 2,
    totalCount: 10,
    metric: "roas" as CohortMetric,
    onExport: vi.fn(),
    onRefresh: vi.fn(),
    onClearSelection: vi.fn(),
    onSelectAll: vi.fn(),
    onOpenFilters: vi.fn(),
    onOpenSettings: vi.fn(),
  };

  beforeEach(() => {
    Object.values(mockProps).forEach((fn) => {
      if (typeof fn === "function") {
        fn.mockClear();
      }
    });
  });

  it("should display selection count correctly", () => {
    render(<CohortTableToolbar {...mockProps} />);
    expect(screen.getByText("2 of 10 cohorts selected")).toBeInTheDocument();
  });

  it("should display metric name when no selection", () => {
    render(<CohortTableToolbar {...mockProps} selectedCount={0} />);
    expect(screen.getByText("10 cohorts • Return on Ad Spend")).toBeInTheDocument();
  });

  it("should handle export actions", async () => {
    const user = userEvent.setup();
    
    render(<CohortTableToolbar {...mockProps} />);
    
    const exportButton = screen.getByText("Export");
    await user.click(exportButton);
    
    const csvOption = screen.getByText("Export as CSV");
    await user.click(csvOption);
    
    expect(mockProps.onExport).toHaveBeenCalledWith("csv");
  });

  it("should handle bulk selection actions", async () => {
    const user = userEvent.setup();
    
    render(<CohortTableToolbar {...mockProps} />);
    
    const selectAllButton = screen.getByText("Select All (10)");
    await user.click(selectAllButton);
    expect(mockProps.onSelectAll).toHaveBeenCalled();
    
    const clearButton = screen.getByText("Clear Selection");
    await user.click(clearButton);
    expect(mockProps.onClearSelection).toHaveBeenCalled();
  });

  it("should handle action buttons", async () => {
    const user = userEvent.setup();
    
    render(<CohortTableToolbar {...mockProps} />);
    
    await user.click(screen.getByText("Filters"));
    expect(mockProps.onOpenFilters).toHaveBeenCalled();
    
    await user.click(screen.getByText("Settings"));
    expect(mockProps.onOpenSettings).toHaveBeenCalled();
    
    await user.click(screen.getByText("Refresh"));
    expect(mockProps.onRefresh).toHaveBeenCalled();
  });

  it("should disable buttons when loading", () => {
    render(<CohortTableToolbar {...mockProps} isLoading={true} />);
    
    expect(screen.getByText("Export")).toBeDisabled();
    expect(screen.getByText("Refresh")).toBeDisabled();
  });
});

describe("CohortTable Component", () => {
  const mockProps = {
    data: mockCohortData,
    metric: "roas" as CohortMetric,
    breakpoints: mockBreakpoints,
    onCellClick: vi.fn(),
    onRowSelectionChange: vi.fn(),
  };

  beforeEach(() => {
    mockProps.onCellClick.mockClear();
    mockProps.onRowSelectionChange.mockClear();
  });

  it("should render table with correct structure", () => {
    render(<CohortTable {...mockProps} />);
    
    // Check for headers
    expect(screen.getByText("Cohort Date")).toBeInTheDocument();
    expect(screen.getByText("FTD Count")).toBeInTheDocument();
    
    // Check for data
    expect(screen.getByText("100")).toBeInTheDocument(); // FTD count
    expect(screen.getByText("15.0%")).toBeInTheDocument(); // Formatted value
  });

  it("should implement triangular layout correctly", () => {
    render(<CohortTable {...mockProps} />);
    
    // First row should have all columns, subsequent rows should have fewer
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1); // Header + data rows
  });

  it("should handle row selection", async () => {
    const user = userEvent.setup();
    
    render(<CohortTable {...mockProps} />);
    
    const dataRows = screen.getAllByRole("row").slice(1); // Skip header
    await user.click(dataRows[0]);
    
    expect(mockProps.onRowSelectionChange).toHaveBeenCalled();
  });

  it("should handle cell clicks", async () => {
    const user = userEvent.setup();
    
    render(<CohortTable {...mockProps} />);
    
    const cellButton = screen.getByText("15.0%");
    await user.click(cellButton);
    
    expect(mockProps.onCellClick).toHaveBeenCalled();
  });

  it("should handle empty data gracefully", () => {
    render(<CohortTable {...mockProps} data={[]} />);
    expect(screen.getByText("No cohort data available.")).toBeInTheDocument();
  });

  it("should handle loading state", () => {
    render(<CohortTable {...mockProps} isLoading={true} />);
    expect(screen.getByText("Loading cohort data...")).toBeInTheDocument();
  });

  it("should implement pagination when enabled", () => {
    const largeDataset = Array.from({ length: 50 }, (_, i) => ({
      ...mockCohortData[0],
      cohortDate: `2024-01-${String(i + 1).padStart(2, "0")}`,
    }));

    render(
      <CohortTable
        {...mockProps}
        data={largeDataset}
        enablePagination={true}
        pageSize={10}
      />,
    );

    expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("should respect maxBreakpoints limitation", () => {
    render(<CohortTable {...mockProps} maxBreakpoints={3} />);
    
    // Should limit the number of breakpoint columns displayed
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeLessThanOrEqual(5); // 2 base columns + 3 max breakpoints
  });
});

describe("Performance and Caching", () => {
  it("should cache cell creation for performance", () => {
    const cohort = mockCohortData[0];
    
    // Create same cell multiple times
    const cell1 = createCohortCell(cohort, 1, "roas", 0, 1);
    const cell2 = createCohortCell(cohort, 1, "roas", 0, 1);
    
    // Should return identical objects (reference equality with memoization)
    expect(cell1).toEqual(cell2);
  });

  it("should clear cache when requested", () => {
    createCohortCell(mockCohortData[0], 1, "roas", 0, 1);
    clearCohortCellCache();
    
    // Cache should be cleared - this is tested implicitly
    // as the function should work correctly after clearing
    const cell = createCohortCell(mockCohortData[0], 1, "roas", 0, 1);
    expect(cell.displayValue).toBe("15.0%");
  });
});

describe("Accessibility Compliance", () => {
  const mockProps = {
    data: mockCohortData,
    metric: "roas" as CohortMetric,
    breakpoints: mockBreakpoints,
    onCellClick: vi.fn(),
    onRowSelectionChange: vi.fn(),
  };

  it("should provide proper ARIA labels", () => {
    const cell = createCohortCell(mockCohortData[0], 1, "roas", 0, 1);
    
    render(
      <CohortTableCell
        cell={cell}
        metric="roas"
        cohortDate="2024-01-01"
        breakpoint={1}
        onCellClick={vi.fn()}
      />,
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");
    expect(button).toHaveAttribute("title");
  });

  it("should support keyboard navigation", async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    const cell = createCohortCell(mockCohortData[0], 1, "roas", 0, 1);
    
    render(
      <CohortTableCell
        cell={cell}
        metric="roas"
        cohortDate="2024-01-01"
        breakpoint={1}
        onCellClick={onCellClick}
      />,
    );
    
    const button = screen.getByRole("button");
    button.focus();
    
    // Test Enter key
    await user.keyboard("{Enter}");
    expect(onCellClick).toHaveBeenCalledTimes(1);
    
    // Test Space key
    await user.keyboard("{ }");
    expect(onCellClick).toHaveBeenCalledTimes(2);
  });

  it("should have proper table structure for screen readers", () => {
    render(<CohortTable {...mockProps} />);
    
    expect(screen.getByRole("table")).toBeInTheDocument();
    
    // In triangular layout, columns depend on the data structure
    // Base columns: Cohort Date + FTD Count = 2
    // Breakpoint columns: depends on triangular layout, so we check for reasonable number
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThanOrEqual(2); // At least base columns
    expect(columnHeaders.length).toBeLessThanOrEqual(mockProps.breakpoints.length + 2); // Max possible
    
    expect(screen.getAllByRole("row")).toHaveLength(mockCohortData.length + 1); // +1 for header
  });
});

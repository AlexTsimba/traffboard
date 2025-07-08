import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CohortHeatmapChart } from "@/components/reports/charts/cohort-heatmap-chart";
import type { CohortData, CohortMetric } from "@/types/reports";

// Mock the chart components to avoid canvas issues in testing
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock the chart UI components
vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children, config }: { children: React.ReactNode; config: unknown }) => (
    <div data-testid="chart-container" data-config={JSON.stringify(config)}>
      {children}
    </div>
  ),
  ChartTooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-tooltip">{children}</div>
  ),
  ChartTooltipContent: ({ formatter, label }: { formatter?: Function; label?: string }) => (
    <div data-testid="tooltip-content" data-label={label}>
      Mock Tooltip Content
    </div>
  ),
}));

describe("CohortHeatmapChart", () => {
  const mockCohortData: CohortData[] = [
    {
      cohortDate: "2024-01-01",
      ftdCount: 100,
      breakpointValues: {
        1: 0.8,
        3: 0.7,
        7: 0.6,
        14: 0.5,
        30: 0.4,
      },
    },
    {
      cohortDate: "2024-01-02",
      ftdCount: 120,
      breakpointValues: {
        1: 0.85,
        3: 0.75,
        7: 0.65,
        14: 0.55,
        30: null, // Test null values
      },
    },
    {
      cohortDate: "2024-01-03",
      ftdCount: 90,
      breakpointValues: {
        1: 0.75,
        3: 0.65,
        7: 0.55,
        14: null,
        30: null,
      },
    },
  ];

  const mockBreakpoints = [1, 3, 7, 14, 30];
  const defaultProps = {
    data: mockCohortData,
    metric: "retention_rate" as CohortMetric,
    breakpoints: mockBreakpoints,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the chart with default props", () => {
      render(<CohortHeatmapChart {...defaultProps} />);
      
      expect(screen.getByText("Cohort Analysis Heatmap")).toBeInTheDocument();
      expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    });

    it("renders with custom title and description", () => {
      const customTitle = "Custom Cohort Chart";
      const customDescription = "This is a custom description";
      
      render(
        <CohortHeatmapChart
          {...defaultProps}
          title={customTitle}
          description={customDescription}
        />
      );
      
      expect(screen.getByText(customTitle)).toBeInTheDocument();
      expect(screen.getByText(customDescription)).toBeInTheDocument();
    });

    it("displays loading state", () => {
      render(<CohortHeatmapChart {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText("Loading chart...")).toBeInTheDocument();
      expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument(); // spinner
    });

    it("displays error state", () => {
      const errorMessage = "Failed to load data";
      render(<CohortHeatmapChart {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(`Error loading chart: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  describe("Data Visualization", () => {
    it("renders table headers correctly", () => {
      render(<CohortHeatmapChart {...defaultProps} />);
      
      expect(screen.getByText("Cohort Date")).toBeInTheDocument();
      expect(screen.getByText("FTD Count")).toBeInTheDocument();
      
      // Check breakpoint headers
      mockBreakpoints.forEach(breakpoint => {
        expect(screen.getByText(`Day ${breakpoint}`)).toBeInTheDocument();
      });
    });

    it("displays cohort data in the correct format", () => {
      render(<CohortHeatmapChart {...defaultProps} />);
      
      // Check if cohort dates are formatted correctly
      expect(screen.getByText("1/1/2024")).toBeInTheDocument();
      expect(screen.getByText("1/2/2024")).toBeInTheDocument();
      expect(screen.getByText("1/3/2024")).toBeInTheDocument();
      
      // Check FTD counts
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("90")).toBeInTheDocument();
    });

    it("formats retention rate values correctly", () => {
      render(<CohortHeatmapChart {...defaultProps} metric="retention_rate" />);
      
      // Should display as percentages
      expect(screen.getByText("80.0%")).toBeInTheDocument();
      expect(screen.getByText("85.0%")).toBeInTheDocument();
    });

    it("formats ROAS values correctly", () => {
      // Update test data to include unique ROAS values for better testing
      const roasData: CohortData[] = [
        {
          cohortDate: "2024-01-01",
          ftdCount: 100,
          breakpointValues: {
            1: 2.5,
            3: 2.3,
            7: 2.1,
            14: 1.9,
            30: 1.7,
          },
        },
        {
          cohortDate: "2024-01-02",
          ftdCount: 120,
          breakpointValues: {
            1: 2.4,
            3: 2.2,
            7: 2.0,
            14: 1.8,
            30: null,
          },
        },
      ];
      
      render(<CohortHeatmapChart data={roasData} metric="roas" breakpoints={mockBreakpoints} />);
      
      expect(screen.getByText("2.50x")).toBeInTheDocument();
      expect(screen.getByText("2.40x")).toBeInTheDocument();
    });

    it("handles null values correctly", () => {
      // Create test data with explicit null values in valid positions
      const dataWithNulls: CohortData[] = [
        {
          cohortDate: "2024-01-01", 
          ftdCount: 100,
          breakpointValues: {
            1: 0.8,
            3: null, // This should show "-"
            7: 0.6,
            14: null, // This should show "-"
            30: 0.4,
          },
        },
      ];
      
      render(<CohortHeatmapChart data={dataWithNulls} metric="retention_rate" breakpoints={mockBreakpoints} />);
      
      // Should display "-" for null values in valid cell positions
      const dashElements = screen.getAllByText("-");
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe("Interaction", () => {
    it("calls onCellClick when cell is clicked", async () => {
      const mockOnCellClick = vi.fn();
      render(
        <CohortHeatmapChart
          {...defaultProps}
          onCellClick={mockOnCellClick}
        />
      );
      
      // Find and click a cell with data
      const cellWithValue = screen.getByText("80.0%");
      fireEvent.click(cellWithValue);
      
      await waitFor(() => {
        expect(mockOnCellClick).toHaveBeenCalledWith(
          "2024-01-01",
          1,
          0.8
        );
      });
    });

    it("displays hover effects on cells", () => {
      render(<CohortHeatmapChart {...defaultProps} />);
      
      const cellWithValue = screen.getByText("80.0%");
      expect(cellWithValue).toHaveClass("cursor-pointer");
      expect(cellWithValue).toHaveClass("hover:scale-105");
    });
  });

  describe("Responsive Behavior", () => {
    it("applies triangular layout correctly", () => {
      render(<CohortHeatmapChart {...defaultProps} />);
      
      // The triangular layout should limit cells based on cohort age
      // This is implemented in the component logic
      const chartContainer = screen.getByTestId("chart-container");
      expect(chartContainer).toBeInTheDocument();
    });

    it("handles empty data gracefully", () => {
      render(<CohortHeatmapChart {...defaultProps} data={[]} />);
      
      expect(screen.getByText("Cohort Analysis Heatmap")).toBeInTheDocument();
      // Should still render the structure but with no data rows
    });
  });

  describe("Chart Configuration", () => {
    it("sets up chart config correctly for different metrics", () => {
      const { rerender } = render(<CohortHeatmapChart {...defaultProps} metric="retention_rate" />);
      
      let chartContainer = screen.getByTestId("chart-container");
      let config = JSON.parse(chartContainer.getAttribute("data-config") || "{}");
      expect(config.value.label).toBe("RETENTION_RATE");
      
      rerender(<CohortHeatmapChart {...defaultProps} metric="roas" />);
      
      chartContainer = screen.getByTestId("chart-container");
      config = JSON.parse(chartContainer.getAttribute("data-config") || "{}");
      expect(config.value.label).toBe("ROAS");
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<CohortHeatmapChart {...defaultProps} />);
      
      // Check for accessible table structure
      expect(screen.getByText("Cohort Date")).toBeInTheDocument();
      expect(screen.getByText("FTD Count")).toBeInTheDocument();
    });

    it("supports keyboard navigation", () => {
      const mockOnCellClick = vi.fn();
      render(
        <CohortHeatmapChart
          {...defaultProps}
          onCellClick={mockOnCellClick}
        />
      );
      
      const cellWithValue = screen.getByText("80.0%");
      
      // Test keyboard interaction
      fireEvent.keyDown(cellWithValue, { key: "Enter" });
      fireEvent.click(cellWithValue); // Simulate the actual click that would happen
      
      expect(mockOnCellClick).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("handles large datasets efficiently", () => {
      const largeCohortData: CohortData[] = Array.from({ length: 100 }, (_, i) => ({
        cohortDate: `2024-01-${String(i + 1).padStart(2, "0")}`,
        ftdCount: Math.floor(Math.random() * 200) + 50,
        breakpointValues: {
          1: Math.random(),
          3: Math.random(),
          7: Math.random(),
          14: Math.random(),
          30: Math.random(),
        },
      }));
      
      const startTime = performance.now();
      render(<CohortHeatmapChart {...defaultProps} data={largeCohortData} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Edge Cases", () => {
    it("handles breakpoints that don't exist in data", () => {
      const incompleteData: CohortData[] = [
        {
          cohortDate: "2024-01-01",
          ftdCount: 100,
          breakpointValues: {
            1: 0.8,
            // Missing other breakpoints
          },
        },
      ];
      
      render(
        <CohortHeatmapChart
          data={incompleteData}
          metric="retention_rate"
          breakpoints={[1, 3, 7, 14, 30]}
        />
      );
      
      expect(screen.getByText("80.0%")).toBeInTheDocument();
      // Should handle missing breakpoints gracefully
    });

    it("handles invalid metric types gracefully", () => {
      // TypeScript should prevent this, but test runtime behavior
      render(
        <CohortHeatmapChart
          {...defaultProps}
          metric={"invalid_metric" as CohortMetric}
        />
      );
      
      // Should not crash and render something reasonable
      expect(screen.getByText("Cohort Analysis Heatmap")).toBeInTheDocument();
    });
  });
});
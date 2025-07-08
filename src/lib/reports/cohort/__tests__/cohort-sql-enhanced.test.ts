/**
 * Enhanced Cohort SQL Tests
 *
 * Comprehensive testing of advanced window functions, retention analysis,
 * and breakpoint performance analysis for cohort SQL extraction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { CohortConfig, CohortMode, CohortMetric, AppliedFilter } from "@/types/reports";

// Mock server-only to avoid import issues in test environment
vi.mock("server-only", () => ({}));

// Mock PostgreSQL integration
vi.mock("../postgresql-integration", () => ({
  cohortPostgreSQL: {
    executeQuery: vi.fn(),
    executePipeline: vi.fn(),
  },
}));

import {
  getCohortDataWithWindowFunctions,
  getRetentionAnalysis,
  getBreakpointPerformanceAnalysis,
  validateEnhancedQueryConfig,
  estimateEnhancedQueryPerformance,
} from "../cohort-sql-enhanced";
import { cohortPostgreSQL } from "../postgresql-integration";

// =============================================================================
// TEST HELPERS AND FIXTURES
// =============================================================================

const createTestCohortConfig = (
  mode: CohortMode = "day",
  metric: CohortMetric = "dep2cost",
  startDate = new Date("2024-01-01"),
  endDate = new Date("2024-01-31"),
  breakpoints = [1, 3, 7, 14, 30],
): CohortConfig => ({
  mode,
  metric,
  breakpoints,
  dateRange: { start: startDate, end: endDate },
  filters: {},
});

const createTestFilters = (): AppliedFilter[] => [
  {
    id: "partner",
    value: "partner123",
    definition: { id: "partner", type: "select", label: "Partner", options: [] },
    displayText: "Partner: partner123",
  },
  {
    id: "country",
    value: "US",
    definition: { id: "country", type: "select", label: "Country", options: [] },
    displayText: "Country: US",
  },
];

const createEnhancedMockData = (cohortCount = 2) => {
  const mockData = [];
  for (let i = 0; i < cohortCount; i++) {
    const cohortDate = new Date("2024-01-01");
    cohortDate.setDate(cohortDate.getDate() + i * 7);

    mockData.push({
      cohortDate: cohortDate.toISOString().split("T")[0],
      cohortSize: 1000 + i * 100,
      avg_cohort_rank: 500 + i * 50,
      max_cohort_rank: 1000 + i * 100,
      // Day 1 metrics
      day1_active_players: 800 + i * 80,
      day1_deposit_sum: 50000 + i * 5000,
      day1_ngr_sum: 40000 + i * 4000,
      day1_cost_sum: 10000 + i * 1000,
      day1_cumulative_deposits: 50000 + i * 5000,
      day1_cumulative_ngr: 40000 + i * 4000,
      day1_retention_rate: 80 - i * 2,
      // Day 7 metrics
      day7_active_players: 600 + i * 60,
      day7_deposit_sum: 75000 + i * 7500,
      day7_ngr_sum: 60000 + i * 6000,
      day7_cost_sum: 10000 + i * 1000,
      day7_cumulative_deposits: 125000 + i * 12500,
      day7_cumulative_ngr: 100000 + i * 10000,
      day7_retention_rate: 60 - i * 3,
      day7_growth_rate: -25 + i * 2,
      // Day 14 metrics
      day14_active_players: 400 + i * 40,
      day14_deposit_sum: 100000 + i * 10000,
      day14_ngr_sum: 80000 + i * 8000,
      day14_cost_sum: 10000 + i * 1000,
      day14_cumulative_deposits: 225000 + i * 22500,
      day14_cumulative_ngr: 180000 + i * 18000,
      day14_retention_rate: 40 - i * 4,
      day14_growth_rate: -33 + i * 3,
      // Day 30 metrics
      day30_active_players: 200 + i * 20,
      day30_deposit_sum: 125000 + i * 12500,
      day30_ngr_sum: 100000 + i * 10000,
      day30_cost_sum: 10000 + i * 1000,
      day30_cumulative_deposits: 350000 + i * 35000,
      day30_cumulative_ngr: 280000 + i * 28000,
      day30_retention_rate: 20 - i * 2,
      day30_growth_rate: -50 + i * 4,
    });
  }
  return mockData;
};

const createRetentionMockData = (cohortCount = 2) => {
  const mockData = [];
  for (let i = 0; i < cohortCount; i++) {
    const cohortDate = new Date("2024-01-01");
    cohortDate.setDate(cohortDate.getDate() + i * 7);

    mockData.push({
      cohortDate: cohortDate.toISOString().split("T")[0],
      cohortSize: 1000 + i * 100,
      // Day 1 retention metrics
      day1_retained_players: 950 + i * 95,
      day1_avg_deposits: 500 + i * 50,
      day1_avg_ngr: 400 + i * 40,
      day1_median_deposits: 300 + i * 30,
      day1_p95_deposits: 2000 + i * 200,
      day1_retention_rate: 95 - i * 2,
      // Day 7 retention metrics
      day7_retained_players: 800 + i * 80,
      day7_avg_deposits: 750 + i * 75,
      day7_avg_ngr: 600 + i * 60,
      day7_median_deposits: 500 + i * 50,
      day7_p95_deposits: 3000 + i * 300,
      day7_retention_rate: 80 - i * 3,
      // Day 14 retention metrics
      day14_retained_players: 600 + i * 60,
      day14_avg_deposits: 1000 + i * 100,
      day14_avg_ngr: 800 + i * 80,
      day14_median_deposits: 700 + i * 70,
      day14_p95_deposits: 4000 + i * 400,
      day14_retention_rate: 60 - i * 4,
      // Day 30 retention metrics
      day30_retained_players: 400 + i * 40,
      day30_avg_deposits: 1250 + i * 125,
      day30_avg_ngr: 1000 + i * 100,
      day30_median_deposits: 900 + i * 90,
      day30_p95_deposits: 5000 + i * 500,
      day30_retention_rate: 40 - i * 5,
    });
  }
  return mockData;
};

// =============================================================================
// ENHANCED COHORT SQL TESTS
// =============================================================================

describe("Enhanced Cohort SQL with Window Functions", () => {
  let mockExecuteQuery: ReturnType<typeof vi.fn>;
  let mockExecutePipeline: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockExecuteQuery = vi.mocked(cohortPostgreSQL.executeQuery);
    mockExecutePipeline = vi.mocked(cohortPostgreSQL.executePipeline);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Enhanced Cohort Data with Window Functions", () => {
    it("should execute enhanced query with window functions", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createEnhancedMockData(2);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortDataWithWindowFunctions(config);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("ROW_NUMBER() OVER"),
        expect.arrayContaining([
          config.dateRange.start.toISOString(),
          config.dateRange.end.toISOString(),
        ]),
        expect.objectContaining({ timeout: 120_000 }),
      );

      expect(result).toEqual(mockData);
    });

    it("should include cumulative metrics in enhanced query", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createEnhancedMockData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortDataWithWindowFunctions(config);

      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      
      // Should contain cumulative calculations
      expect(sqlQuery).toMatch(/cumulative_deposits/);
      expect(sqlQuery).toMatch(/cumulative_ngr/);
      expect(sqlQuery).toMatch(/ROWS UNBOUNDED PRECEDING/);
      
      expect(result).toEqual(mockData);
    });

    it("should include retention and growth rates", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createEnhancedMockData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortDataWithWindowFunctions(config);

      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      
      // Should contain retention rate calculations
      expect(sqlQuery).toMatch(/retention_rate/);
      expect(sqlQuery).toMatch(/growth_rate/);
      expect(sqlQuery).toMatch(/cohort_performance/);
      
      expect(result).toEqual(mockData);
    });

    it("should handle week mode with enhanced functions", async () => {
      const config = createTestCohortConfig("week", "retention_rate");
      const mockData = createEnhancedMockData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortDataWithWindowFunctions(config);

      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      
      // Should contain week-specific logic
      expect(sqlQuery).toMatch(/DATE_TRUNC\('week'/);
      expect(sqlQuery).toMatch(/INTERVAL '1 day'/);
      
      expect(result).toEqual(mockData);
    });

    it("should handle enhanced query errors gracefully", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      mockExecuteQuery.mockRejectedValueOnce(new Error("Enhanced query failed"));

      await expect(getCohortDataWithWindowFunctions(config)).rejects.toThrow("Enhanced cohort query failed");
    });
  });

  describe("Retention Analysis", () => {
    it("should execute retention analysis query", async () => {
      const config = createTestCohortConfig("day", "retention_rate");
      const mockData = createRetentionMockData(2);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getRetentionAnalysis(config);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("player_lifecycle"),
        expect.arrayContaining([
          config.dateRange.start.toISOString(),
          config.dateRange.end.toISOString(),
        ]),
        expect.objectContaining({ timeout: 180_000 }),
      );

      expect(result).toEqual(mockData);
    });

    it("should include running totals and lifecycle metrics", async () => {
      const config = createTestCohortConfig("day", "retention_rate");
      const mockData = createRetentionMockData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getRetentionAnalysis(config);

      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      
      // Should contain running totals
      expect(sqlQuery).toMatch(/running_deposits/);
      expect(sqlQuery).toMatch(/running_ngr/);
      expect(sqlQuery).toMatch(/ROWS UNBOUNDED PRECEDING/);
      
      // Should contain lifecycle tracking
      expect(sqlQuery).toMatch(/prev_activity_date/);
      expect(sqlQuery).toMatch(/next_activity_date/);
      expect(sqlQuery).toMatch(/LAG\(/);
      expect(sqlQuery).toMatch(/LEAD\(/);
      
      expect(result).toEqual(mockData);
    });

    it("should include percentile calculations", async () => {
      const config = createTestCohortConfig("day", "retention_rate");
      const mockData = createRetentionMockData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getRetentionAnalysis(config);

      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      
      // Should contain percentile calculations
      expect(sqlQuery).toMatch(/PERCENTILE_CONT\(0\.5\)/);
      expect(sqlQuery).toMatch(/PERCENTILE_CONT\(0\.95\)/);
      expect(sqlQuery).toMatch(/median_deposits/);
      expect(sqlQuery).toMatch(/p95_deposits/);
      
      expect(result).toEqual(mockData);
    });

    it("should handle retention analysis errors gracefully", async () => {
      const config = createTestCohortConfig("day", "retention_rate");
      mockExecuteQuery.mockRejectedValueOnce(new Error("Retention analysis failed"));

      await expect(getRetentionAnalysis(config)).rejects.toThrow("Retention analysis query failed");
    });
  });

  describe("Breakpoint Performance Analysis", () => {
    it("should execute breakpoint performance analysis", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockBreakpointStats = [
        { breakpoint: 1, avg_cohort_size: 1000, avg_active_players: 800, avg_retention_rate: 80, retention_rate_stddev: 5 },
        { breakpoint: 7, avg_cohort_size: 1000, avg_active_players: 600, avg_retention_rate: 60, retention_rate_stddev: 8 },
        { breakpoint: 14, avg_cohort_size: 1000, avg_active_players: 400, avg_retention_rate: 40, retention_rate_stddev: 10 },
        { breakpoint: 30, avg_cohort_size: 1000, avg_active_players: 200, avg_retention_rate: 20, retention_rate_stddev: 12 },
      ];
      const mockPerformanceMetrics = [
        {
          total_cohorts: 5,
          avg_cohort_size: 1000,
          min_cohort_size: 800,
          max_cohort_size: 1200,
          median_cohort_size: 1000,
          p95_cohort_size: 1150,
        },
      ];

      mockExecutePipeline.mockResolvedValueOnce([mockBreakpointStats, mockPerformanceMetrics]);

      const result = await getBreakpointPerformanceAnalysis(config);

      expect(mockExecutePipeline).toHaveBeenCalledWith([
        expect.objectContaining({
          sql: expect.stringContaining("breakpoint_performance"),
          params: expect.arrayContaining([
            config.dateRange.start.toISOString(),
            config.dateRange.end.toISOString(),
          ]),
        }),
        expect.objectContaining({
          sql: expect.stringContaining("total_cohorts"),
          params: expect.arrayContaining([
            config.dateRange.start.toISOString(),
            config.dateRange.end.toISOString(),
          ]),
        }),
      ]);

      expect(result).toEqual({
        breakpointStats: mockBreakpointStats,
        performanceMetrics: mockPerformanceMetrics,
      });
    });

    it("should handle breakpoint analysis pipeline errors", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      mockExecutePipeline.mockResolvedValueOnce([
        new Error("Breakpoint query failed"),
        [],
      ]);

      await expect(getBreakpointPerformanceAnalysis(config)).rejects.toThrow("Breakpoint query failed");
    });

    it("should handle performance metrics pipeline errors", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      mockExecutePipeline.mockResolvedValueOnce([
        [],
        new Error("Performance metrics query failed"),
      ]);

      await expect(getBreakpointPerformanceAnalysis(config)).rejects.toThrow("Performance metrics query failed");
    });
  });

  describe("Configuration Validation", () => {
    it("should validate correct enhanced query configuration", () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const result = validateEnhancedQueryConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject configuration with empty breakpoints", () => {
      const config = createTestCohortConfig("day", "dep2cost");
      config.breakpoints = [];

      const result = validateEnhancedQueryConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("At least one breakpoint is required");
    });

    it("should reject configuration with invalid breakpoints", () => {
      const config = createTestCohortConfig("day", "dep2cost");
      config.breakpoints = [1, 0, -1, 7];

      const result = validateEnhancedQueryConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("All breakpoints must be positive numbers");
    });

    it("should reject configuration with invalid date range", () => {
      const config = createTestCohortConfig("day", "dep2cost", new Date("2024-01-31"), new Date("2024-01-01"));

      const result = validateEnhancedQueryConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Start date must be before end date");
    });

    it("should reject configuration with too many breakpoints", () => {
      const config = createTestCohortConfig("day", "dep2cost");
      config.breakpoints = Array.from({ length: 51 }, (_, i) => i + 1);

      const result = validateEnhancedQueryConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Maximum 50 breakpoints allowed for performance reasons");
    });
  });

  describe("Performance Estimation", () => {
    it("should estimate low complexity for simple queries", () => {
      const config = createTestCohortConfig("day", "dep2cost", new Date("2024-01-01"), new Date("2024-01-03"), [1, 3]);
      const filters: AppliedFilter[] = [];

      const result = estimateEnhancedQueryPerformance(config, filters);

      // Expected calculation: 500 + (3 * 20) + (2^1.5 * 150) + (0 * 400) + (2 * 600) = 500 + 60 + 424.3 + 0 + 1200 = 2184.3
      expect(result.complexity).toBe("low");
      expect(result.estimatedDuration).toBeLessThan(5000);
      expect(result.recommendations).toHaveLength(0);
    });

    it("should estimate medium complexity for moderate queries", () => {
      const config = createTestCohortConfig("day", "dep2cost", new Date("2024-01-01"), new Date("2024-01-31"));
      const filters = createTestFilters();

      const result = estimateEnhancedQueryPerformance(config, filters);

      expect(result.complexity).toBe("medium");
      expect(result.estimatedDuration).toBeGreaterThan(5000);
      expect(result.estimatedDuration).toBeLessThan(15000);
      expect(result.recommendations).toContain("Consider using materialized views for frequently accessed data");
    });

    it("should estimate high complexity for complex queries", () => {
      const config = createTestCohortConfig("day", "dep2cost", new Date("2024-01-01"), new Date("2024-12-31"), [1, 3, 7, 14, 30, 60, 90]);
      const filters = createTestFilters();

      const result = estimateEnhancedQueryPerformance(config, filters);

      expect(result.complexity).toBe("high");
      expect(result.estimatedDuration).toBeGreaterThan(15000);
      expect(result.recommendations).toContain("High-cost query - consider breaking into smaller time ranges");
    });

    it("should estimate extreme complexity for very complex queries", () => {
      const config = createTestCohortConfig("day", "dep2cost", new Date("2024-01-01"), new Date("2024-12-31"));
      config.breakpoints = Array.from({ length: 40 }, (_, i) => i + 1);
      const filters = createTestFilters();

      const result = estimateEnhancedQueryPerformance(config, filters);

      expect(result.complexity).toBe("extreme");
      expect(result.estimatedDuration).toBeGreaterThan(60000);
      expect(result.recommendations).toContain("Extreme complexity - consider preprocessing data");
    });

    it("should recommend pipeline mode for large date ranges", () => {
      const config = createTestCohortConfig("day", "dep2cost", new Date("2024-01-01"), new Date("2024-06-01"));
      const filters: AppliedFilter[] = [];

      const result = estimateEnhancedQueryPerformance(config, filters);

      expect(result.recommendations).toContain("Consider using pipeline mode for large date ranges");
    });

    it("should recommend reducing breakpoints for large breakpoint counts", () => {
      const config = createTestCohortConfig("day", "dep2cost");
      config.breakpoints = Array.from({ length: 25 }, (_, i) => i + 1);
      const filters: AppliedFilter[] = [];

      const result = estimateEnhancedQueryPerformance(config, filters);

      expect(result.recommendations).toContain("Consider reducing breakpoint count for better performance");
    });
  });

  describe("Filter Integration", () => {
    it("should apply filters to enhanced queries", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const filters = createTestFilters();
      const mockData = createEnhancedMockData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortDataWithWindowFunctions(config, filters);

      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      
      expect(sqlQuery).toMatch(/pd\."partnerId" = 'partner123'/);
      expect(sqlQuery).toMatch(/pd\."playerCountry" = 'US'/);
      
      expect(result).toEqual(mockData);
    });

    it("should apply filters to retention analysis", async () => {
      const config = createTestCohortConfig("day", "retention_rate");
      const filters = createTestFilters();
      const mockData = createRetentionMockData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getRetentionAnalysis(config, filters);

      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      
      expect(sqlQuery).toMatch(/pd\."partnerId" = 'partner123'/);
      expect(sqlQuery).toMatch(/pd\."playerCountry" = 'US'/);
      
      expect(result).toEqual(mockData);
    });
  });
});
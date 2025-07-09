/**
 * Cohort SQL Extraction Tests
 *
 * Comprehensive testing of window functions and breakpoint logic for cohort analysis.
 * Tests SQL query generation, breakpoint mapping, week/day mode logic, and performance optimization.
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
    healthCheck: vi.fn(),
  },
}));

import {
  getCohortBaseData,
  getCohortDataOptimized,
  validateCohortDateRange,
  estimateQueryComplexity,
} from "../cohort-sql";
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

const createMockCohortData = (cohortCount = 3) => {
  const mockData = [];
  for (let i = 0; i < cohortCount; i++) {
    const cohortDate = new Date("2024-01-01");
    cohortDate.setDate(cohortDate.getDate() + i * 7);

    mockData.push({
      cohortDate: cohortDate.toISOString().split("T")[0],
      cohortSize: 1000 + i * 100,
      day1_active_players: 800 + i * 80,
      day1_deposit_sum: 50000 + i * 5000,
      day1_ngr_sum: 40000 + i * 4000,
      day1_cost_sum: 10000 + i * 1000,
      day3_active_players: 600 + i * 60,
      day3_deposit_sum: 75000 + i * 7500,
      day3_ngr_sum: 60000 + i * 6000,
      day3_cost_sum: 10000 + i * 1000,
      day7_active_players: 400 + i * 40,
      day7_deposit_sum: 100000 + i * 10000,
      day7_ngr_sum: 80000 + i * 8000,
      day7_cost_sum: 10000 + i * 1000,
      day14_active_players: 200 + i * 20,
      day14_deposit_sum: 125000 + i * 12500,
      day14_ngr_sum: 100000 + i * 10000,
      day14_cost_sum: 10000 + i * 1000,
      day30_active_players: 100 + i * 10,
      day30_deposit_sum: 150000 + i * 15000,
      day30_ngr_sum: 120000 + i * 12000,
      day30_cost_sum: 10000 + i * 1000,
    });
  }
  return mockData;
};

// =============================================================================
// COHORT SQL EXTRACTION TESTS
// =============================================================================

describe("Cohort SQL Extraction with Window Functions", () => {
  let mockExecuteQuery: ReturnType<typeof vi.fn>;
  let mockExecutePipeline: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockExecuteQuery = vi.mocked(cohortPostgreSQL.executeQuery);
    mockExecutePipeline = vi.mocked(cohortPostgreSQL.executePipeline);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Query Generation", () => {
    it("should generate SQL with proper window functions for day mode", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createMockCohortData(2);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("DATE_TRUNC('day', pd.\"signUpDate\")"),
        expect.arrayContaining([config.dateRange.start.toISOString(), config.dateRange.end.toISOString()]),
        expect.objectContaining({ timeout: 90_000 }),
      );
      expect(result).toEqual(mockData);
    });

    it("should generate SQL with proper window functions for week mode", async () => {
      const config = createTestCohortConfig("week", "retention_rate");
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("DATE_TRUNC('week', pd.\"signUpDate\" + INTERVAL '1 day') - INTERVAL '1 day'"),
        expect.arrayContaining([config.dateRange.start.toISOString(), config.dateRange.end.toISOString()]),
        expect.objectContaining({ timeout: 90_000 }),
      );
      expect(result).toEqual(mockData);
    });

    it("should handle custom breakpoints in SQL generation", async () => {
      const customBreakpoints = [1, 5, 10, 20, 30];
      const config = createTestCohortConfig(
        "day",
        "dep2cost",
        new Date("2024-01-01"),
        new Date("2024-01-31"),
        customBreakpoints,
      );
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("day1_active_players"),
        expect.arrayContaining([config.dateRange.start.toISOString(), config.dateRange.end.toISOString()]),
        expect.objectContaining({ timeout: 90_000 }),
      );

      // Query should include all custom breakpoints
      const [sqlQuery] = mockExecuteQuery.mock.calls[0];
      expect(sqlQuery).toMatch(/day1_active_players/);
      expect(sqlQuery).toMatch(/day5_active_players/);
      expect(sqlQuery).toMatch(/day10_active_players/);
      expect(sqlQuery).toMatch(/day20_active_players/);
      expect(sqlQuery).toMatch(/day30_active_players/);
      expect(result).toEqual(mockData);
    });
  });

  describe("Breakpoint Logic and Window Functions", () => {
    it("should calculate breakpoints correctly for day mode", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createMockCohortData(2);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      // Verify SQL contains correct breakpoint calculations
      const [sqlQuery] = mockExecuteQuery.mock.calls[0];

      // Should include window function logic for day-based breakpoints
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) <= 1/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) <= 3/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) <= 7/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) <= 14/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) <= 30/);

      expect(result).toEqual(mockData);
    });

    it("should calculate breakpoints correctly for week mode", async () => {
      const config = createTestCohortConfig("week", "retention_rate");
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      // Verify SQL contains correct breakpoint calculations for week mode
      const [sqlQuery] = mockExecuteQuery.mock.calls[0];

      // Should include window function logic for week-based breakpoints
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) < 1/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) < 3/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) < 7/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) < 14/);
      expect(sqlQuery).toMatch(/EXTRACT\(days FROM activity\."date" - cohort_date\) < 30/);

      expect(result).toEqual(mockData);
    });

    it("should handle week mode with Monday start and Sunday view", async () => {
      const config = createTestCohortConfig("week", "retention_rate");
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      // Verify SQL contains Monday-start logic for week mode
      const [sqlQuery] = mockExecuteQuery.mock.calls[0];

      // Should include proper week truncation with Monday start
      expect(sqlQuery).toMatch(/DATE_TRUNC\('week', pd\."signUpDate" \+ INTERVAL '1 day'\) - INTERVAL '1 day'/);

      expect(result).toEqual(mockData);
    });

    it("should generate proper aggregation logic for all metrics", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      // Verify SQL contains correct aggregation for all required metrics
      const [sqlQuery] = mockExecuteQuery.mock.calls[0];

      // Should include proper CASE statements for metric calculations
      expect(sqlQuery).toMatch(
        /COUNT\(DISTINCT CASE WHEN.*THEN activity\."playerId" ELSE NULL END\) as day.*_active_players/,
      );
      expect(sqlQuery).toMatch(
        /SUM\(CASE WHEN.*THEN COALESCE\(activity\."depositsSum", 0\) ELSE 0 END\) as day.*_deposit_sum/,
      );
      expect(sqlQuery).toMatch(
        /SUM\(CASE WHEN.*THEN COALESCE\(activity\."casinoRealNgr", 0\) ELSE 0 END\) as day.*_ngr_sum/,
      );
      expect(sqlQuery).toMatch(
        /SUM\(CASE WHEN.*THEN COALESCE\(activity\."fixedPerPlayer", 0\) ELSE 0 END\) as day.*_cost_sum/,
      );

      expect(result).toEqual(mockData);
    });
  });

  describe("Filter Integration", () => {
    it("should apply filters correctly to SQL queries", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const filters = createTestFilters();
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config, filters);

      // Verify SQL contains filter conditions
      const [sqlQuery] = mockExecuteQuery.mock.calls[0];

      expect(sqlQuery).toMatch(/pd\."partnerId" = 'partner123'/);
      expect(sqlQuery).toMatch(/pd\."playerCountry" = 'US'/);

      expect(result).toEqual(mockData);
    });

    it("should handle empty filters gracefully", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config, []);

      // Should execute successfully without filters
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it("should handle complex filter combinations", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const complexFilters: AppliedFilter[] = [
        {
          id: "partner",
          value: "partner123",
          definition: { id: "partner", type: "select", label: "Partner", options: [] },
          displayText: "Partner: partner123",
        },
        {
          id: "source",
          value: "google",
          definition: { id: "source", type: "select", label: "Source", options: [] },
          displayText: "Source: google",
        },
        {
          id: "country",
          value: "US",
          definition: { id: "country", type: "select", label: "Country", options: [] },
          displayText: "Country: US",
        },
        {
          id: "minDeposit",
          value: 100,
          definition: { id: "minDeposit", type: "number", label: "Min Deposit" },
          displayText: "Min Deposit: 100",
        },
      ];

      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config, complexFilters);

      // Verify SQL contains all filter conditions
      const [sqlQuery] = mockExecuteQuery.mock.calls[0];

      expect(sqlQuery).toMatch(/pd\."partnerId" = 'partner123'/);
      expect(sqlQuery).toMatch(/pd\."tagSource" = 'google'/);
      expect(sqlQuery).toMatch(/pd\."playerCountry" = 'US'/);
      expect(sqlQuery).toMatch(/pd\."playerId" IN \(/);
      expect(sqlQuery).toMatch(/"depositsSum" >= 100/);

      expect(result).toEqual(mockData);
    });
  });

  describe("Performance Optimization", () => {
    it("should use optimized query execution for large datasets", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createMockCohortData(5);
      const mockCountResult = [{ total: 5 }];

      mockExecutePipeline.mockResolvedValueOnce([mockData, mockCountResult]);

      const result = await getCohortDataOptimized(config, [], { limit: 10, offset: 0 });

      expect(mockExecutePipeline).toHaveBeenCalledWith([
        expect.objectContaining({
          sql: expect.stringContaining("LIMIT 10 OFFSET 0"),
          params: expect.arrayContaining([config.dateRange.start.toISOString(), config.dateRange.end.toISOString()]),
        }),
        expect.objectContaining({
          sql: expect.stringContaining("SELECT COUNT(DISTINCT cohort_date) as total"),
          params: expect.arrayContaining([config.dateRange.start.toISOString(), config.dateRange.end.toISOString()]),
        }),
      ]);

      expect(result).toEqual({
        data: mockData,
        totalCount: 5,
        hasMore: false,
      });
    });

    it("should handle pagination correctly", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createMockCohortData(3);
      const mockCountResult = [{ total: 10 }];

      mockExecutePipeline.mockResolvedValueOnce([mockData, mockCountResult]);

      const result = await getCohortDataOptimized(config, [], { limit: 3, offset: 6 });

      expect(mockExecutePipeline).toHaveBeenCalledWith([
        expect.objectContaining({
          sql: expect.stringContaining("LIMIT 3 OFFSET 6"),
        }),
        expect.any(Object),
      ]);

      expect(result).toEqual({
        data: mockData,
        totalCount: 10,
        hasMore: true,
      });
    });

    it("should estimate query complexity correctly", () => {
      const simpleConfig = createTestCohortConfig("day", "dep2cost", new Date("2024-01-01"), new Date("2024-01-07"));
      const simpleFilters: AppliedFilter[] = [];

      const simpleResult = estimateQueryComplexity(simpleConfig, simpleFilters);

      expect(simpleResult.complexity).toBe("low");
      expect(simpleResult.estimatedTime).toBe(1000);

      const complexConfig = createTestCohortConfig("day", "dep2cost", new Date("2024-01-01"), new Date("2024-12-31"));
      const complexFilters = createTestFilters();

      const complexResult = estimateQueryComplexity(complexConfig, complexFilters);

      expect(complexResult.complexity).toBe("high");
      expect(complexResult.estimatedTime).toBe(8000);
    });
  });

  describe("Error Handling", () => {
    it("should handle PostgreSQL query errors gracefully", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      mockExecuteQuery.mockRejectedValueOnce(new Error("PostgreSQL connection failed"));

      await expect(getCohortBaseData(config)).rejects.toThrow("PostgreSQL cohort query failed");
    });

    it("should handle pipeline execution errors", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      mockExecutePipeline.mockRejectedValueOnce(new Error("Pipeline execution failed"));

      await expect(getCohortDataOptimized(config, [], { limit: 10 })).rejects.toThrow("Optimized cohort query failed");
    });

    it("should handle malformed pipeline results", async () => {
      const config = createTestCohortConfig("day", "dep2cost");

      // Mock pipeline returning errors
      mockExecutePipeline.mockResolvedValueOnce([new Error("Query 1 failed"), [{ total: 0 }]]);

      await expect(getCohortDataOptimized(config, [], { limit: 10 })).rejects.toThrow("Query 1 failed");
    });
  });

  describe("Date Range Validation", () => {
    it("should validate correct date ranges", () => {
      const validRange = { start: new Date("2024-01-01"), end: new Date("2024-01-31") };
      expect(validateCohortDateRange(validRange)).toBe(true);
    });

    it("should reject invalid date ranges", () => {
      const invalidRange = { start: new Date("2024-01-31"), end: new Date("2024-01-01") };
      expect(validateCohortDateRange(invalidRange)).toBe(false);
    });

    it("should reject date ranges that are too large", () => {
      const tooLargeRange = { start: new Date("2024-01-01"), end: new Date("2025-01-01") };
      expect(validateCohortDateRange(tooLargeRange)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty result sets", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      mockExecuteQuery.mockResolvedValueOnce([]);

      const result = await getCohortBaseData(config);

      expect(result).toEqual([]);
    });

    it("should handle single cohort results", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      expect(result).toEqual(mockData);
      expect(result).toHaveLength(1);
    });

    it("should handle large breakpoint arrays", async () => {
      const largeBreakpoints = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      ];
      const config = createTestCohortConfig(
        "day",
        "dep2cost",
        new Date("2024-01-01"),
        new Date("2024-01-31"),
        largeBreakpoints,
      );
      const mockData = createMockCohortData(1);
      mockExecuteQuery.mockResolvedValueOnce(mockData);

      const result = await getCohortBaseData(config);

      // Should handle large breakpoint arrays without issues
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });
  });
});

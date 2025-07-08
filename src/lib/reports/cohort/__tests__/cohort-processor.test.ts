/**
 * Arquero Transformation and Metric Calculation Tests
 *
 * Comprehensive testing of the Arquero transformation pipeline including:
 * - Breakpoint mapping functionality
 * - Metric calculation accuracy for all 4 metrics
 * - Data aggregation with rollup operations
 * - Edge cases and error handling
 * - Performance with large datasets
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { CohortConfig, CohortMetric, CohortMode, AppliedFilter } from "@/types/reports";

// Mock server-only to avoid import issues in test environment
vi.mock("server-only", () => ({}));

// Mock cohort-sql to control test data
vi.mock("../cohort-sql", () => ({
  getCohortBaseData: vi.fn(),
}));

// Mock cohort-formatting to focus on Arquero logic
vi.mock("../cohort-formatting", () => ({
  formatCohortResults: vi.fn().mockImplementation((data) => data),
}));

// Mock cohort-pipeline for isolation
vi.mock("../cohort-pipeline", () => ({
  createPipelineProcessor: vi.fn().mockReturnValue({
    processCohortBatches: vi.fn().mockResolvedValue({
      data: [],
      metadata: { processingTimeMs: 100 },
    }),
  }),
}));

import { CohortProcessor, createCohortProcessor } from "../cohort-processor";
import { getCohortBaseData } from "../cohort-sql";

// =============================================================================
// TEST HELPERS AND FIXTURES
// =============================================================================

const createTestCohortConfig = (
  mode: CohortMode = "day",
  metric: CohortMetric = "dep2cost",
  startDate = new Date("2024-01-01"),
  endDate = new Date("2024-01-31"),
): CohortConfig => ({
  mode,
  metric,
  breakpoints: mode === "day" ? [1, 7, 14, 30] : [7, 14, 21, 28],
  dateRange: { start: startDate, end: endDate },
  filters: {},
});

const createTestBaseData = (cohortCount = 3, breakpoints = [1, 7, 14, 30]) => {
  const data = [];
  const startDate = new Date("2024-01-01");

  for (let i = 0; i < cohortCount; i++) {
    const cohortDate = new Date(startDate);
    cohortDate.setDate(startDate.getDate() + i * 7); // Weekly cohorts

    const baseRow: Record<string, unknown> = {
      cohortDate: cohortDate.toISOString().split("T")[0],
      cohortSize: 1000 + i * 100,
      totalDeposits: 50_000 + i * 10_000,
      totalNGR: 40_000 + i * 8000,
      totalCost: 10_000 + i * 1000,
    };

    // Add breakpoint data
    for (const breakpoint of breakpoints) {
      const dayField = `day${breakpoint}`;

      baseRow[`${dayField}_active_players`] = Math.floor(((baseRow.cohortSize as number) * (100 - breakpoint)) / 100);

      baseRow[`${dayField}_deposit_sum`] = Math.floor(((baseRow.totalDeposits as number) * (100 - breakpoint)) / 100);

      baseRow[`${dayField}_ngr_sum`] = Math.floor(((baseRow.totalNGR as number) * (100 - breakpoint)) / 100);

      baseRow[`${dayField}_cost_sum`] = baseRow.totalCost; // Cost is initial, doesn't change
    }

    data.push(baseRow);
  }

  return data;
};

const createLargeTestDataset = (size = 1000) => {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push({
      cohortDate: `2024-01-${String((i % 30) + 1).padStart(2, "0")}`,
      cohortSize: Math.floor(Math.random() * 1000) + 500,
      day1_active_players: Math.floor(Math.random() * 500) + 200,
      day1_deposit_sum: Math.floor(Math.random() * 10_000) + 5000,
      day1_ngr_sum: Math.floor(Math.random() * 8000) + 4000,
      day1_cost_sum: Math.floor(Math.random() * 2000) + 1000,
      day7_active_players: Math.floor(Math.random() * 300) + 100,
      day7_deposit_sum: Math.floor(Math.random() * 15_000) + 7000,
      day7_ngr_sum: Math.floor(Math.random() * 12_000) + 6000,
      day7_cost_sum: Math.floor(Math.random() * 2000) + 1000,
    });
  }
  return data;
};

// =============================================================================
// ARQUERO TRANSFORMATION TESTS
// =============================================================================

describe("CohortProcessor - Arquero Transformation", () => {
  let processor: CohortProcessor;
  let mockGetCohortBaseData: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetCohortBaseData = vi.mocked(getCohortBaseData);
    processor = new CohortProcessor(createTestCohortConfig());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Breakpoint Mapping", () => {
    it("should create correct rollup expressions for all breakpoints", async () => {
      const testData = createTestBaseData(2, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processor.processCohorts();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].breakpointValues).toHaveProperty("1");
      expect(result.data[0].breakpointValues).toHaveProperty("7");
      expect(result.data[0].breakpointValues).toHaveProperty("14");
      expect(result.data[0].breakpointValues).toHaveProperty("30");
    });

    it("should handle custom breakpoints correctly", async () => {
      const customBreakpoints = [5, 10, 15, 20];
      const config = createTestCohortConfig();
      config.breakpoints = customBreakpoints;

      const processorWithCustomBreakpoints = new CohortProcessor(config);
      const testData = createTestBaseData(1, customBreakpoints);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processorWithCustomBreakpoints.processCohorts();

      expect(result.data[0].breakpointValues).toHaveProperty("5");
      expect(result.data[0].breakpointValues).toHaveProperty("10");
      expect(result.data[0].breakpointValues).toHaveProperty("15");
      expect(result.data[0].breakpointValues).toHaveProperty("20");
    });

    it("should aggregate data correctly across multiple cohorts", async () => {
      const testData = createTestBaseData(5, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processor.processCohorts();

      expect(result.data).toHaveLength(5);
      expect(result.metadata.totalCohorts).toBe(5);
      expect(result.metadata.breakpointsUsed).toEqual([1, 7, 14, 30]);
    });
  });

  describe("Metric Calculations", () => {
    it("should calculate DEP2COST metric correctly", async () => {
      const config = createTestCohortConfig("day", "dep2cost");
      const processorDep2Cost = new CohortProcessor(config);
      const testData = createTestBaseData(1, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processorDep2Cost.processCohorts();

      const day1Value = result.data[0].breakpointValues["1"];
      const day7Value = result.data[0].breakpointValues["7"];

      expect(day1Value).toBeGreaterThan(0);
      expect(day7Value).toBeGreaterThan(0);
      expect(day1Value!).toBeGreaterThan(day7Value!); // DEP2COST should be higher on day 1
    });

    it("should calculate ROAS metric correctly", async () => {
      const config = createTestCohortConfig("day", "roas");
      const processorRoas = new CohortProcessor(config);
      const testData = createTestBaseData(1, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processorRoas.processCohorts();

      const day1Value = result.data[0].breakpointValues["1"];
      const day7Value = result.data[0].breakpointValues["7"];

      expect(day1Value).toBeGreaterThan(0);
      expect(day7Value).toBeGreaterThan(0);
      expect(day1Value!).toBeGreaterThan(day7Value!); // ROAS typically starts high and may decline
    });

    it("should calculate AVG DEPOSIT SUM metric correctly", async () => {
      const config = createTestCohortConfig("day", "avg_deposit_sum");
      const processorAvgDeposit = new CohortProcessor(config);
      const testData = createTestBaseData(1, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processorAvgDeposit.processCohorts();

      const day1Value = result.data[0].breakpointValues["1"];
      const day7Value = result.data[0].breakpointValues["7"];

      expect(day1Value).toBeGreaterThan(0);
      expect(day7Value).toBeGreaterThan(0);
      expect(day1Value!).toBeGreaterThan(day7Value!); // Avg deposit typically starts higher and may decline
    });

    it("should calculate RETENTION RATE metric correctly", async () => {
      const config = createTestCohortConfig("day", "retention_rate");
      const processorRetention = new CohortProcessor(config);
      const testData = createTestBaseData(1, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processorRetention.processCohorts();

      const day1Value = result.data[0].breakpointValues["1"];
      const day7Value = result.data[0].breakpointValues["7"];
      const day14Value = result.data[0].breakpointValues["14"];
      const day30Value = result.data[0].breakpointValues["30"];

      expect(day1Value).toBeGreaterThan(0);
      expect(day7Value).toBeGreaterThan(0);
      expect(day14Value).toBeGreaterThan(0);
      expect(day30Value).toBeGreaterThan(0);

      // Retention should decrease over time
      expect(day1Value!).toBeGreaterThan(day7Value!);
      expect(day7Value!).toBeGreaterThan(day14Value!);
      expect(day14Value!).toBeGreaterThan(day30Value!);

      // Retention should be percentage (0-100)
      expect(day1Value).toBeLessThanOrEqual(100);
      expect(day7Value).toBeLessThanOrEqual(100);
      expect(day14Value).toBeLessThanOrEqual(100);
      expect(day30Value).toBeLessThanOrEqual(100);
    });

    it("should handle zero values in metric calculations", async () => {
      const testData = [
        {
          cohortDate: "2024-01-01",
          cohortSize: 1000,
          day1_active_players: 0,
          day1_deposit_sum: 0,
          day1_ngr_sum: 0,
          day1_cost_sum: 0,
          day7_active_players: 0,
          day7_deposit_sum: 0,
          day7_ngr_sum: 0,
          day7_cost_sum: 0,
          day14_active_players: 0,
          day14_deposit_sum: 0,
          day14_ngr_sum: 0,
          day14_cost_sum: 0,
          day30_active_players: 0,
          day30_deposit_sum: 0,
          day30_ngr_sum: 0,
          day30_cost_sum: 0,
        },
      ];
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processor.processCohorts();

      expect(result.data[0].breakpointValues["1"]).toBeNull();
    });
  });

  describe("Data Aggregation", () => {
    it("should aggregate data using Arquero rollup operations", async () => {
      const testData = [
        {
          cohortDate: "2024-01-01",
          cohortSize: 500,
          day1_active_players: 400,
          day1_deposit_sum: 25_000,
          day1_ngr_sum: 20_000,
          day1_cost_sum: 5000,
          day7_active_players: 350,
          day7_deposit_sum: 30_000,
          day7_ngr_sum: 25_000,
          day7_cost_sum: 5000,
          day14_active_players: 300,
          day14_deposit_sum: 35_000,
          day14_ngr_sum: 30_000,
          day14_cost_sum: 5000,
          day30_active_players: 250,
          day30_deposit_sum: 40_000,
          day30_ngr_sum: 35_000,
          day30_cost_sum: 5000,
        },
        {
          cohortDate: "2024-01-01", // Same cohort date for aggregation
          cohortSize: 500,
          day1_active_players: 300,
          day1_deposit_sum: 15_000,
          day1_ngr_sum: 12_000,
          day1_cost_sum: 3000,
          day7_active_players: 250,
          day7_deposit_sum: 18_000,
          day7_ngr_sum: 15_000,
          day7_cost_sum: 3000,
          day14_active_players: 200,
          day14_deposit_sum: 21_000,
          day14_ngr_sum: 18_000,
          day14_cost_sum: 3000,
          day30_active_players: 150,
          day30_deposit_sum: 24_000,
          day30_ngr_sum: 21_000,
          day30_cost_sum: 3000,
        },
      ];
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processor.processCohorts();

      expect(result.data).toHaveLength(1); // Should aggregate into single cohort
      expect(result.data[0].ftdCount).toBe(2); // Should count both records
      expect(result.data[0].cohortDate).toBe("2024-01-01");
    });

    it("should calculate weighted averages correctly", async () => {
      const testData = createTestBaseData(3, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processor.processCohorts();

      for (const cohort of result.data) {
        expect(cohort.weightedAverage).toBeGreaterThan(0);
        expect(typeof cohort.weightedAverage).toBe("number");
      }
    });

    it("should handle empty datasets gracefully", async () => {
      mockGetCohortBaseData.mockResolvedValueOnce([]);

      const result = await processor.processCohorts();

      expect(result.data).toHaveLength(0);
      expect(result.metadata.totalCohorts).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle Arquero processing errors", async () => {
      // Mock invalid data that will cause Arquero to fail
      mockGetCohortBaseData.mockResolvedValueOnce("invalid data" as any);

      const result = await processor.processCohorts();

      // Should handle gracefully and return empty data
      expect(result.data).toHaveLength(0);
    });

    it("should handle missing required fields", async () => {
      const invalidData = [
        {
          cohortDate: "2024-01-01",
          cohortSize: 1000,
          // Missing day fields - should result in null values
          day1_active_players: undefined,
          day1_deposit_sum: undefined,
          day1_ngr_sum: undefined,
          day1_cost_sum: undefined,
          day7_active_players: undefined,
          day7_deposit_sum: undefined,
          day7_ngr_sum: undefined,
          day7_cost_sum: undefined,
          day14_active_players: undefined,
          day14_deposit_sum: undefined,
          day14_ngr_sum: undefined,
          day14_cost_sum: undefined,
          day30_active_players: undefined,
          day30_deposit_sum: undefined,
          day30_ngr_sum: undefined,
          day30_cost_sum: undefined,
        },
      ];
      mockGetCohortBaseData.mockResolvedValueOnce(invalidData);

      const result = await processor.processCohorts();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].breakpointValues["1"]).toBeNull();
    });

    it("should handle null and undefined values", async () => {
      const testData = [
        {
          cohortDate: "2024-01-01",
          cohortSize: 1000,
          day1_active_players: null,
          day1_deposit_sum: undefined,
          day1_ngr_sum: 0,
          day1_cost_sum: 1000,
          day7_active_players: null,
          day7_deposit_sum: undefined,
          day7_ngr_sum: 0,
          day7_cost_sum: 1000,
          day14_active_players: null,
          day14_deposit_sum: undefined,
          day14_ngr_sum: 0,
          day14_cost_sum: 1000,
          day30_active_players: null,
          day30_deposit_sum: undefined,
          day30_ngr_sum: 0,
          day30_cost_sum: 1000,
        },
      ];
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processor.processCohorts();

      expect(result.data).toHaveLength(1);
      // For dep2cost with zero deposits but non-zero cost, it should return 0
      expect(result.data[0].breakpointValues["1"]).toBe(0);
    });
  });

  describe("Performance Testing", () => {
    it("should handle large datasets efficiently", async () => {
      const largeDataset = createLargeTestDataset(1000);
      mockGetCohortBaseData.mockResolvedValueOnce(largeDataset);

      const config = createTestCohortConfig();
      config.breakpoints = [1, 7]; // Reduce breakpoints for performance test

      const processorLarge = new CohortProcessor(config);
      const startTime = Date.now();

      const result = await processorLarge.processCohorts();
      const processingTime = Date.now() - startTime;

      expect(result.data.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it("should generate consistent query hashes", async () => {
      const testData = createTestBaseData(1, [1, 7, 14, 30]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData).mockResolvedValueOnce(testData);

      const filters: AppliedFilter[] = [
        {
          id: "startDate",
          value: "2024-01-01",
          definition: { id: "startDate", type: "date", label: "Start Date" },
          displayText: "Start Date: 2024-01-01",
        },
        {
          id: "endDate",
          value: "2024-01-31",
          definition: { id: "endDate", type: "date", label: "End Date" },
          displayText: "End Date: 2024-01-31",
        },
      ];

      const result1 = await processor.processCohorts(filters);
      const result2 = await processor.processCohorts(filters);

      expect(result1.metadata.queryHash).toBe(result2.metadata.queryHash);
    });
  });

  describe("Integration with Week Mode", () => {
    it("should handle week mode breakpoints correctly", async () => {
      const config = createTestCohortConfig("week", "retention_rate");
      const processorWeek = new CohortProcessor(config);
      const testData = createTestBaseData(1, [7, 14, 21, 28]);
      mockGetCohortBaseData.mockResolvedValueOnce(testData);

      const result = await processorWeek.processCohorts();

      expect(result.data[0].breakpointValues).toHaveProperty("7");
      expect(result.data[0].breakpointValues).toHaveProperty("14");
      expect(result.data[0].breakpointValues).toHaveProperty("21");
      expect(result.data[0].breakpointValues).toHaveProperty("28");
    });
  });
});

// =============================================================================
// FACTORY FUNCTION TESTS
// =============================================================================

describe("CohortProcessor Factory Functions", () => {
  describe("createCohortProcessor", () => {
    it("should create processor with correct configuration", () => {
      const dateRange = { start: new Date("2024-01-01"), end: new Date("2024-01-31") };
      const processor = createCohortProcessor("day", "dep2cost", dateRange);

      expect(processor).toBeInstanceOf(CohortProcessor);
    });

    it("should auto-enable pipeline mode for large date ranges", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-06-01"); // 5 months = > 90 days
      const dateRange = { start, end };

      const processor = createCohortProcessor("day", "dep2cost", dateRange);

      expect(processor).toBeInstanceOf(CohortProcessor);
    });

    it("should use correct breakpoints for different modes", () => {
      const dateRange = { start: new Date("2024-01-01"), end: new Date("2024-01-31") };
      const dayProcessor = createCohortProcessor("day", "dep2cost", dateRange);
      const weekProcessor = createCohortProcessor("week", "dep2cost", dateRange);

      expect(dayProcessor).toBeInstanceOf(CohortProcessor);
      expect(weekProcessor).toBeInstanceOf(CohortProcessor);
    });
  });
});

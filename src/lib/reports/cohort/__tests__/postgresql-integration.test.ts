/**
 * PostgreSQL Integration Tests
 *
 * Tests for the cohort PostgreSQL integration module,
 * verifying connection, query execution, and pipeline functionality.
 */

import { describe, expect, it, beforeEach } from "vitest";

import type { CohortConfig, AppliedFilter } from "@/types/reports";

import {
  cohortPostgreSQL,
  validateCohortQuery,
  estimateQueryCost,
  safeParameterize,
  getCohortQueryMetrics,
  resetCohortQueryMetrics,
} from "../postgresql-integration";

describe("PostgreSQL Integration", () => {
  beforeEach(() => {
    resetCohortQueryMetrics();
  });

  describe("Health Check", () => {
    it("should perform health check successfully", async () => {
      const health = await cohortPostgreSQL.healthCheck();

      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("latency");
      expect(health).toHaveProperty("lastCheck");
      expect(health).toHaveProperty("details");

      expect(typeof health.latency).toBe("number");
      expect(health.lastCheck).toBeInstanceOf(Date);
    });
  });

  describe("Connection Stats", () => {
    it("should return connection statistics", () => {
      const stats = cohortPostgreSQL.getConnectionStats();

      expect(stats).toHaveProperty("config");
      expect(stats).toHaveProperty("healthStatus");
      expect(stats).toHaveProperty("lastHealthCheck");
      expect(stats).toHaveProperty("uptime");

      expect(typeof stats.uptime).toBe("number");
      expect(stats.lastHealthCheck).toBeInstanceOf(Date);
    });
  });

  describe("Query Validation", () => {
    it("should validate safe cohort queries", () => {
      const safeQuery = `
        SELECT 
          DATE_TRUNC('day', "signUpDate") as cohort_date,
          COUNT(*) as cohort_size
        FROM "PlayerData"
        WHERE "signUpDate" >= $1
        GROUP BY cohort_date
      `;

      const result = validateCohortQuery(safeQuery);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject destructive queries", () => {
      const destructiveQuery = "DROP TABLE PlayerData";

      const result = validateCohortQuery(destructiveQuery);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Destructive operations not allowed");
    });

    it("should reject queries with SQL comments", () => {
      const commentQuery = "SELECT * FROM PlayerData -- malicious comment";

      const result = validateCohortQuery(commentQuery);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SQL comments not allowed for security");
    });
  });

  describe("Parameter Safety", () => {
    it("should safely handle string parameters", () => {
      expect(safeParameterize("test")).toBe("test");
      expect(safeParameterize("test'quote")).toBe("test''quote");
    });

    it("should safely handle numeric parameters", () => {
      expect(safeParameterize(123)).toBe(123);
      expect(safeParameterize(45.67)).toBe(45.67);
    });

    it("should safely handle boolean parameters", () => {
      expect(safeParameterize(true)).toBe(true);
      expect(safeParameterize(false)).toBe(false);
    });

    it("should safely handle null parameters", () => {
      expect(safeParameterize(null)).toBe(null);
      expect(safeParameterize()).toBe(null);
    });

    it("should safely handle date parameters", () => {
      const date = new Date("2024-01-01");
      expect(safeParameterize(date)).toBe(date.toISOString());
    });

    it("should handle unsupported types", () => {
      expect(safeParameterize({})).toBe(null);
      expect(safeParameterize([])).toBe(null);
    });
  });

  describe("Query Cost Estimation", () => {
    it("should estimate low complexity for simple queries", () => {
      const config: CohortConfig = {
        mode: "day",
        dateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-07"), // 7 days
        },
        breakpoints: [1, 3, 7], // 3 breakpoints
        metric: "dep2cost",
        filters: {},
      };

      const filters: AppliedFilter[] = [];
      const query = "SELECT * FROM PlayerData";

      const result = estimateQueryCost(query, config, filters);

      expect(result.complexity).toBe("low");
      expect(result.estimatedCost).toBeLessThan(5);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should estimate high complexity for large date ranges", () => {
      const config: CohortConfig = {
        mode: "day",
        dateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-12-31"), // 365 days
        },
        breakpoints: [1, 3, 5, 7, 14, 21, 30], // 7 breakpoints
        metric: "dep2cost",
        filters: {},
      };

      const filters: AppliedFilter[] = [
        {
          id: "partner",
          value: "test",
          definition: { id: "partner", type: "select", label: "Partner", options: [] },
          displayText: "Partner: test",
        },
        {
          id: "country",
          value: "US",
          definition: { id: "country", type: "select", label: "Country", options: [] },
          displayText: "Country: US",
        },
      ];
      const query = "SELECT * FROM PlayerData GROUP BY cohort_date ORDER BY cohort_date";

      const result = estimateQueryCost(query, config, filters);

      expect(result.complexity).toBe("high");
      expect(result.estimatedCost).toBeGreaterThan(15);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Query Metrics", () => {
    it("should track query metrics correctly", () => {
      // No metrics initially
      const metrics = getCohortQueryMetrics();
      expect(metrics.totalQueries).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.slowQueries).toBe(0);
    });

    it("should reset metrics correctly", () => {
      resetCohortQueryMetrics();
      const metrics = getCohortQueryMetrics();

      expect(metrics.totalQueries).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.slowQueries).toBe(0);
    });
  });

  describe("Configuration", () => {
    it("should have proper timeout settings", () => {
      const stats = cohortPostgreSQL.getConnectionStats();

      expect(stats.config.statementTimeout).toBe(45_000);
      expect(stats.config.queryTimeout).toBe(90_000);
      expect(stats.config.maxConnections).toBe(8);
      expect(stats.config.enablePipelineMode).toBe(true);
    });
  });
});

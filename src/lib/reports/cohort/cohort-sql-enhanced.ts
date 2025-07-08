/**
 * Enhanced Cohort SQL Queries with Advanced Window Functions
 *
 * Advanced PostgreSQL queries for cohort analysis using window functions,
 * optimized for breakpoint calculations and performance.
 */

/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/index-of-compare-to-positive-number */

import "server-only";

import type { CohortConfig, AppliedFilter } from "@/types/reports";

import { cohortPostgreSQL } from "./postgresql-integration";

// =============================================================================
// ENHANCED SQL QUERY BUILDERS
// =============================================================================

/**
 * Build enhanced cohort analysis SQL query with advanced window functions
 */
function buildEnhancedCohortQuery(config: CohortConfig, filters: AppliedFilter[]): string {
  const { mode, breakpoints } = config;

  // Week logic: Monday start, Sunday view
  const cohortDateFunc =
    mode === "week"
      ? "DATE_TRUNC('week', pd.\"signUpDate\" + INTERVAL '1 day') - INTERVAL '1 day'"
      : "DATE_TRUNC('day', pd.\"signUpDate\")";

  // Build advanced breakpoint calculations using window functions
  const breakpointWindowCases = breakpoints
    .map((bp) => {
      const dayCondition =
        mode === "week"
          ? `EXTRACT(days FROM activity."date" - cohort_date) < ${bp}`
          : `EXTRACT(days FROM activity."date" - cohort_date) <= ${bp}`;

      return `
      -- Day ${bp} metrics with window functions
      COUNT(DISTINCT CASE WHEN ${dayCondition} AND activity."depositsSum" > 0 THEN activity."playerId" ELSE NULL END) as day${bp}_active_players,
      SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."depositsSum", 0) ELSE 0 END) as day${bp}_deposit_sum,
      SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."casinoRealNgr", 0) ELSE 0 END) as day${bp}_ngr_sum,
      SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."fixedPerPlayer", 0) ELSE 0 END) as day${bp}_cost_sum,
      -- Cumulative metrics using window functions
      SUM(SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."depositsSum", 0) ELSE 0 END)) 
        OVER (PARTITION BY cohort_date ORDER BY ${bp} ROWS UNBOUNDED PRECEDING) as day${bp}_cumulative_deposits,
      SUM(SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."casinoRealNgr", 0) ELSE 0 END)) 
        OVER (PARTITION BY cohort_date ORDER BY ${bp} ROWS UNBOUNDED PRECEDING) as day${bp}_cumulative_ngr
    `;
    })
    .join(",\n      ");

  // Build filter conditions
  const filterConditions = buildFilterConditions(filters);
  const whereClause = filterConditions.length > 0 ? `AND ${filterConditions.join(" AND ")}` : "";

  return `
    WITH cohort_base AS (
      SELECT 
        ${cohortDateFunc} as cohort_date,
        pd."playerId",
        pd."signUpDate",
        -- Add player cohort ranking
        ROW_NUMBER() OVER (PARTITION BY ${cohortDateFunc} ORDER BY pd."signUpDate") as cohort_rank
      FROM "PlayerData" pd
      WHERE pd."signUpDate" >= $1::timestamp
        AND pd."signUpDate" <= $2::timestamp
        ${whereClause}
      GROUP BY ${cohortDateFunc}, pd."playerId", pd."signUpDate"
    ),
    cohort_activity AS (
      SELECT 
        cb.cohort_date,
        cb."playerId",
        cb."signUpDate",
        cb.cohort_rank,
        activity."date",
        activity."depositsSum",
        activity."casinoRealNgr",
        activity."fixedPerPlayer",
        -- Calculate days since signup for each activity
        EXTRACT(days FROM activity."date" - cb."signUpDate") as days_since_signup,
        -- Add activity ranking within cohort
        ROW_NUMBER() OVER (PARTITION BY cb.cohort_date, cb."playerId" ORDER BY activity."date") as activity_rank
      FROM cohort_base cb
      JOIN "PlayerData" activity ON cb."playerId" = activity."playerId"
      WHERE activity."date" >= cb."signUpDate"
        AND activity."date" <= $2::timestamp
    ),
    cohort_metrics AS (
      SELECT 
        TO_CHAR(cohort_date, 'YYYY-MM-DD') as "cohortDate",
        COUNT(DISTINCT "playerId") as "cohortSize",
        -- Add cohort quality metrics
        AVG(cohort_rank) as avg_cohort_rank,
        MAX(cohort_rank) as max_cohort_rank,
        ${breakpointWindowCases}
      FROM cohort_activity
      GROUP BY cohort_date
    ),
    cohort_performance AS (
      SELECT 
        *,
        -- Calculate retention rates using window functions
        ${breakpoints
          .map(
            (bp) => `
        CASE 
          WHEN "cohortSize" > 0 THEN 
            (day${bp}_active_players::float / "cohortSize" * 100) 
          ELSE 0 
        END as day${bp}_retention_rate`,
          )
          .join(",\n        ")},
        -- Calculate growth rates between breakpoints
        ${breakpoints
          .slice(1)
          .map(
            (bp, index) => `
        CASE 
          WHEN day${breakpoints[index]}_active_players > 0 THEN 
            ((day${bp}_active_players - day${breakpoints[index]}_active_players)::float / day${breakpoints[index]}_active_players * 100)
          ELSE 0 
        END as day${bp}_growth_rate`,
          )
          .join(",\n        ")}
      FROM cohort_metrics
    )
    SELECT 
      "cohortDate",
      "cohortSize",
      avg_cohort_rank,
      max_cohort_rank,
      ${breakpoints
        .map(
          (bp) => `
        "day${String(bp)}_active_players",
        "day${String(bp)}_deposit_sum", 
        "day${String(bp)}_ngr_sum",
        "day${String(bp)}_cost_sum",
        "day${String(bp)}_cumulative_deposits",
        "day${String(bp)}_cumulative_ngr",
        "day${String(bp)}_retention_rate",
        ${breakpoints.includes(bp) && breakpoints.indexOf(bp) > 0 ? `"day${String(bp)}_growth_rate",` : ""}
      `,
        )
        .join("\n      ")}
    FROM cohort_performance
    ORDER BY "cohortDate"
  `;
}

/**
 * Build retention analysis query with advanced window functions
 */
function buildRetentionAnalysisQuery(config: CohortConfig, filters: AppliedFilter[]): string {
  const { mode, breakpoints } = config;

  const cohortDateFunc =
    mode === "week"
      ? "DATE_TRUNC('week', pd.\"signUpDate\" + INTERVAL '1 day') - INTERVAL '1 day'"
      : "DATE_TRUNC('day', pd.\"signUpDate\")";

  const filterConditions = buildFilterConditions(filters);
  const whereClause = filterConditions.length > 0 ? `AND ${filterConditions.join(" AND ")}` : "";

  return `
    WITH cohort_base AS (
      SELECT 
        ${cohortDateFunc} as cohort_date,
        pd."playerId",
        pd."signUpDate",
        -- Calculate player value at signup
        FIRST_VALUE(pd."depositsSum") OVER (PARTITION BY pd."playerId" ORDER BY pd."signUpDate") as signup_value
      FROM "PlayerData" pd
      WHERE pd."signUpDate" >= $1::timestamp
        AND pd."signUpDate" <= $2::timestamp
        ${whereClause}
    ),
    player_lifecycle AS (
      SELECT 
        cb.cohort_date,
        cb."playerId",
        cb."signUpDate",
        cb.signup_value,
        activity."date",
        activity."depositsSum",
        activity."casinoRealNgr",
        EXTRACT(days FROM activity."date" - cb."signUpDate") as days_since_signup,
        -- Calculate running totals using window functions
        SUM(activity."depositsSum") OVER (
          PARTITION BY cb."playerId" 
          ORDER BY activity."date" 
          ROWS UNBOUNDED PRECEDING
        ) as running_deposits,
        SUM(activity."casinoRealNgr") OVER (
          PARTITION BY cb."playerId" 
          ORDER BY activity."date" 
          ROWS UNBOUNDED PRECEDING
        ) as running_ngr,
        -- Calculate days since last activity
        LAG(activity."date") OVER (
          PARTITION BY cb."playerId" 
          ORDER BY activity."date"
        ) as prev_activity_date,
        LEAD(activity."date") OVER (
          PARTITION BY cb."playerId" 
          ORDER BY activity."date"
        ) as next_activity_date
      FROM cohort_base cb
      JOIN "PlayerData" activity ON cb."playerId" = activity."playerId"
      WHERE activity."date" >= cb."signUpDate"
        AND activity."date" <= $2::timestamp
    ),
    retention_metrics AS (
      SELECT 
        TO_CHAR(cohort_date, 'YYYY-MM-DD') as "cohortDate",
        COUNT(DISTINCT "playerId") as "cohortSize",
        ${breakpoints
          .map(
            (bp) => `
        -- Day ${bp} retention with detailed metrics
        COUNT(DISTINCT CASE WHEN days_since_signup <= ${bp} THEN "playerId" END) as day${bp}_retained_players,
        AVG(CASE WHEN days_since_signup <= ${bp} THEN running_deposits END) as day${bp}_avg_deposits,
        AVG(CASE WHEN days_since_signup <= ${bp} THEN running_ngr END) as day${bp}_avg_ngr,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN days_since_signup <= ${bp} THEN running_deposits END) as day${bp}_median_deposits,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CASE WHEN days_since_signup <= ${bp} THEN running_deposits END) as day${bp}_p95_deposits
      `,
          )
          .join(",\n        ")}
      FROM player_lifecycle
      GROUP BY cohort_date
    )
    SELECT 
      "cohortDate",
      "cohortSize",
      ${breakpoints
        .map(
          (bp) => `
        "day${String(bp)}_retained_players",
        "day${String(bp)}_avg_deposits",
        "day${String(bp)}_avg_ngr",
        "day${String(bp)}_median_deposits",
        "day${String(bp)}_p95_deposits",
        -- Calculate retention rate
        CASE 
          WHEN "cohortSize" > 0 THEN 
            (day${bp}_retained_players::float / "cohortSize" * 100) 
          ELSE 0 
        END as day${bp}_retention_rate
      `,
        )
        .join(",\n      ")}
    FROM retention_metrics
    ORDER BY "cohortDate"
  `;
}

/**
 * Build filter condition for a single filter
 */
function buildSingleFilterCondition(filter: AppliedFilter): string | null {
  if (filter.id === "partner" && filter.value && typeof filter.value === "string") {
    return `pd."partnerId" = '${filter.value}'`;
  }

  if (filter.id === "source" && filter.value && typeof filter.value === "string") {
    return `pd."tagSource" = '${filter.value}'`;
  }

  if (filter.id === "country" && filter.value && typeof filter.value === "string") {
    return `pd."playerCountry" = '${filter.value}'`;
  }

  if (filter.id === "minDeposit" && typeof filter.value === "number") {
    return `pd."playerId" IN (
      SELECT DISTINCT "playerId" 
      FROM "PlayerData" 
      WHERE "depositsSum" >= ${filter.value}
    )`;
  }

  return null;
}

/**
 * Build filter conditions for the WHERE clause
 */
function buildFilterConditions(filters: AppliedFilter[]): string[] {
  const conditions: string[] = [];

  for (const filter of filters) {
    const condition = buildSingleFilterCondition(filter);
    if (condition) {
      conditions.push(condition);
    }
  }

  return conditions;
}

// =============================================================================
// ENHANCED PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Get cohort data with enhanced window functions
 */
export async function getCohortDataWithWindowFunctions(
  config: CohortConfig,
  filters: AppliedFilter[] = [],
): Promise<unknown[]> {
  try {
    const query = buildEnhancedCohortQuery(config, filters);
    const params = [config.dateRange.start.toISOString(), config.dateRange.end.toISOString()];

    const result = await cohortPostgreSQL.executeQuery(query, params, {
      timeout: 120_000, // 2 minutes for enhanced queries
    });

    return result;
  } catch (error) {
    throw new Error(`Enhanced cohort query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get detailed retention analysis with window functions
 */
export async function getRetentionAnalysis(config: CohortConfig, filters: AppliedFilter[] = []): Promise<unknown[]> {
  try {
    const query = buildRetentionAnalysisQuery(config, filters);
    const params = [config.dateRange.start.toISOString(), config.dateRange.end.toISOString()];

    const result = await cohortPostgreSQL.executeQuery(query, params, {
      timeout: 180_000, // 3 minutes for complex retention analysis
    });

    return result;
  } catch (error) {
    throw new Error(`Retention analysis query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get breakpoint performance analysis
 */
export async function getBreakpointPerformanceAnalysis(
  config: CohortConfig,
  filters: AppliedFilter[] = [],
): Promise<{
  breakpointStats: unknown[];
  performanceMetrics: unknown[];
}> {
  try {
    const breakpointStatsQuery = `
      WITH cohort_base AS (
        SELECT 
          ${
            config.mode === "week"
              ? "DATE_TRUNC('week', pd.\"signUpDate\" + INTERVAL '1 day') - INTERVAL '1 day'"
              : "DATE_TRUNC('day', pd.\"signUpDate\")"
          } as cohort_date,
          pd."playerId",
          pd."signUpDate"
        FROM "PlayerData" pd
        WHERE pd."signUpDate" >= $1::timestamp
          AND pd."signUpDate" <= $2::timestamp
          ${buildFilterConditions(filters).length > 0 ? `AND ${buildFilterConditions(filters).join(" AND ")}` : ""}
        GROUP BY cohort_date, pd."playerId", pd."signUpDate"
      ),
      breakpoint_performance AS (
        SELECT 
          ${config.breakpoints.map((bp) => `${bp} as breakpoint`).join(" UNION ALL SELECT ")},
          cb.cohort_date,
          COUNT(DISTINCT cb."playerId") as cohort_size,
          COUNT(DISTINCT CASE WHEN activity."date" <= cb."signUpDate" + INTERVAL '${config.breakpoints[0]} days' THEN activity."playerId" END) as active_players
        FROM cohort_base cb
        JOIN "PlayerData" activity ON cb."playerId" = activity."playerId"
        WHERE activity."date" >= cb."signUpDate"
        GROUP BY cb.cohort_date
      )
      SELECT 
        breakpoint,
        AVG(cohort_size) as avg_cohort_size,
        AVG(active_players) as avg_active_players,
        AVG(CASE WHEN cohort_size > 0 THEN active_players::float / cohort_size * 100 ELSE 0 END) as avg_retention_rate,
        STDDEV(CASE WHEN cohort_size > 0 THEN active_players::float / cohort_size * 100 ELSE 0 END) as retention_rate_stddev
      FROM breakpoint_performance
      GROUP BY breakpoint
      ORDER BY breakpoint
    `;

    const performanceMetricsQuery = `
      SELECT 
        COUNT(*) as total_cohorts,
        AVG(cohort_size) as avg_cohort_size,
        MIN(cohort_size) as min_cohort_size,
        MAX(cohort_size) as max_cohort_size,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cohort_size) as median_cohort_size,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY cohort_size) as p95_cohort_size
      FROM (
        SELECT 
          COUNT(DISTINCT pd."playerId") as cohort_size
        FROM "PlayerData" pd
        WHERE pd."signUpDate" >= $1::timestamp
          AND pd."signUpDate" <= $2::timestamp
          ${buildFilterConditions(filters).length > 0 ? `AND ${buildFilterConditions(filters).join(" AND ")}` : ""}
        GROUP BY ${
          config.mode === "week"
            ? "DATE_TRUNC('week', pd.\"signUpDate\" + INTERVAL '1 day') - INTERVAL '1 day'"
            : "DATE_TRUNC('day', pd.\"signUpDate\")"
        }
      ) cohort_sizes
    `;

    const params = [config.dateRange.start.toISOString(), config.dateRange.end.toISOString()];

    const results = await cohortPostgreSQL.executePipeline([
      { sql: breakpointStatsQuery, params },
      { sql: performanceMetricsQuery, params },
    ]);

    const [breakpointStats, performanceMetrics] = results;

    if (breakpointStats instanceof Error) {
      throw breakpointStats;
    }
    if (performanceMetrics instanceof Error) {
      throw performanceMetrics;
    }

    return {
      breakpointStats: Array.isArray(breakpointStats) ? breakpointStats : [],
      performanceMetrics: Array.isArray(performanceMetrics) ? performanceMetrics : [],
    };
  } catch (error) {
    throw new Error(`Breakpoint analysis query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate enhanced query configuration
 */
export function validateEnhancedQueryConfig(config: CohortConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate breakpoints
  if (!config.breakpoints || config.breakpoints.length === 0) {
    errors.push("At least one breakpoint is required");
  }

  if (config.breakpoints.some((bp) => bp <= 0)) {
    errors.push("All breakpoints must be positive numbers");
  }

  // Validate date range
  if (config.dateRange.start >= config.dateRange.end) {
    errors.push("Start date must be before end date");
  }

  // Validate breakpoint limits for performance
  if (config.breakpoints.length > 50) {
    errors.push("Maximum 50 breakpoints allowed for performance reasons");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate enhanced query performance
 */
export function estimateEnhancedQueryPerformance(
  config: CohortConfig,
  filters: AppliedFilter[],
): {
  estimatedDuration: number;
  complexity: "low" | "medium" | "high" | "extreme";
  recommendations: string[];
} {
  const dayRange = Math.ceil(
    (config.dateRange.end.getTime() - config.dateRange.start.getTime()) / (1000 * 60 * 60 * 24),
  );

  const breakpointCount = config.breakpoints.length;
  const filterCount = filters.length;

  const recommendations: string[] = [];
  let estimatedDuration = 500; // Base 500ms

  // Factor in date range
  estimatedDuration += dayRange * 20; // 20ms per day

  // Factor in breakpoints (exponential impact)
  estimatedDuration += Math.pow(breakpointCount, 1.5) * 150;

  // Factor in filters
  estimatedDuration += filterCount * 400;

  // Factor in window functions overhead
  estimatedDuration += breakpointCount * 600; // Window functions are more expensive

  let complexity: "low" | "medium" | "high" | "extreme";

  if (estimatedDuration < 5000) {
    complexity = "low";
  } else if (estimatedDuration < 15_000) {
    complexity = "medium";
    recommendations.push("Consider using materialized views for frequently accessed data");
  } else if (estimatedDuration < 60_000) {
    complexity = "high";
    recommendations.push(
      "High-cost query - consider breaking into smaller time ranges",
      "Use pagination for large result sets",
    );
  } else {
    complexity = "extreme";
    recommendations.push(
      "Extreme complexity - consider preprocessing data",
      "Use background jobs for such complex queries",
      "Consider using data warehouse for historical analysis",
    );
  }

  if (dayRange > 90) {
    recommendations.push("Consider using pipeline mode for large date ranges");
  }

  if (breakpointCount > 20) {
    recommendations.push("Consider reducing breakpoint count for better performance");
  }

  return {
    estimatedDuration,
    complexity,
    recommendations,
  };
}

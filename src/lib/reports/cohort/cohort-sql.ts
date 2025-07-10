/**
 * Cohort SQL Queries
 *
 * PostgreSQL queries for cohort analysis heavy lifting.
 * Extracts and aggregates data from PlayerData and Conversion tables,
 * reducing millions of rows to thousands for Arquero processing.
 */

import "server-only";

import type { CohortConfig, AppliedFilter } from "@/types/reports";

import { cohortPostgreSQL } from "./postgresql-integration";

// =============================================================================
// SQL QUERY BUILDERS
// =============================================================================

/**
 * Build the main cohort analysis SQL query
 */
function buildCohortQuery(config: CohortConfig, filters: AppliedFilter[]): string {
  const { mode, breakpoints } = config;

  // Week logic: Monday start, Sunday view
  const cohortDateFunc =
    mode === "week"
      ? "DATE_TRUNC('week', pd.\"signUpDate\" + INTERVAL '1 day') - INTERVAL '1 day'"
      : "DATE_TRUNC('day', pd.\"signUpDate\")";

  // Build breakpoint calculations based on player activity data
  const breakpointCases = breakpoints
    .map((bp) => {
      const dayCondition =
        mode === "week"
          ? `EXTRACT(days FROM activity."date" - cohort_date) < ${bp}`
          : `EXTRACT(days FROM activity."date" - cohort_date) <= ${bp}`;

      return `
      COUNT(DISTINCT CASE WHEN ${dayCondition} AND activity."depositsSum" > 0 THEN activity."playerId" ELSE NULL END) as day${bp}_active_players,
      SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."depositsSum", 0) ELSE 0 END) as day${bp}_deposit_sum,
      SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."casinoRealNgr", 0) ELSE 0 END) as day${bp}_ngr_sum,
      SUM(CASE WHEN ${dayCondition} THEN COALESCE(activity."fixedPerPlayer", 0) ELSE 0 END) as day${bp}_cost_sum
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
        pd."signUpDate"
      FROM player_data pd
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
        activity."date",
        activity."depositsSum",
        activity."casinoRealNgr",
        activity."fixedPerPlayer"
      FROM cohort_base cb
      JOIN player_data activity ON cb."playerId" = activity."playerId"
      WHERE activity."date" >= cb."signUpDate"
        AND activity."date" <= $2::timestamp
    ),
    cohort_metrics AS (
      SELECT 
        TO_CHAR(cohort_date, 'YYYY-MM-DD') as "cohortDate",
        COUNT(DISTINCT "playerId") as "cohortSize",
        ${breakpointCases}
      FROM cohort_activity
      GROUP BY cohort_date
    )
    SELECT 
      "cohortDate",
      "cohortSize",
      ${breakpoints
        .map(
          (bp) => `
        "day${String(bp)}_active_players",
        "day${String(bp)}_deposit_sum", 
        "day${String(bp)}_ngr_sum",
        "day${String(bp)}_cost_sum"
      `,
        )
        .join(",\n      ")}
    FROM cohort_metrics
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
      FROM player_data 
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
// PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Get cohort base data from PostgreSQL with heavy lifting optimizations
 */
export async function getCohortBaseData(config: CohortConfig, filters: AppliedFilter[] = []): Promise<unknown[]> {
  try {
    const query = buildCohortQuery(config, filters);
    const params = [config.dateRange.start.toISOString(), config.dateRange.end.toISOString()];

    // Execute query using optimized PostgreSQL client
    const result = await cohortPostgreSQL.executeQuery(query, params, {
      timeout: 90_000, // 90 seconds for complex cohort queries
    });

    return result;
  } catch (error) {
    throw new Error(`PostgreSQL cohort query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get cohort data with performance optimizations
 */
export async function getCohortDataOptimized(
  config: CohortConfig,
  filters: AppliedFilter[] = [],
  options: { limit?: number; offset?: number } = {},
): Promise<{
  data: unknown[];
  totalCount: number;
  hasMore: boolean;
}> {
  try {
    const baseQuery = buildCohortQuery(config, filters);

    // Add pagination if specified
    const paginatedQuery = options.limit
      ? `${baseQuery} LIMIT ${options.limit} OFFSET ${options.offset ?? 0}`
      : baseQuery;

    const params = [config.dateRange.start.toISOString(), config.dateRange.end.toISOString()];

    // Execute queries using pipeline mode for better performance
    const queries = [
      { sql: paginatedQuery, params },
      {
        sql: `SELECT COUNT(DISTINCT cohort_date) as total FROM (${baseQuery}) as cohort_data`,
        params,
      },
    ];

    const results = await cohortPostgreSQL.executePipeline(queries);

    // Handle pipeline results
    const data = results[0];
    const countResult = results[1];

    if (data instanceof Error) {
      throw data;
    }
    if (countResult instanceof Error) {
      throw countResult;
    }

    const dataArray = Array.isArray(data) ? data : [];
    const totalCount =
      Array.isArray(countResult) && countResult[0]
        ? Number((countResult[0] as { total: number }).total)
        : dataArray.length;

    return {
      data: dataArray,
      totalCount,
      hasMore: options.limit ? (options.offset ?? 0) + dataArray.length < totalCount : false,
    };
  } catch (error) {
    throw new Error(`Optimized cohort query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate cohort date range
 */
export function validateCohortDateRange(dateRange: { start: Date; end: Date }): boolean {
  const diffInDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

  // Limit to reasonable ranges for performance
  return diffInDays > 0 && diffInDays <= 365; // Max 1 year
}

/**
 * Estimate query complexity
 */
export function estimateQueryComplexity(
  config: CohortConfig,
  filters: AppliedFilter[],
): { complexity: "low" | "medium" | "high"; estimatedTime: number } {
  const dayRange = Math.ceil(
    (config.dateRange.end.getTime() - config.dateRange.start.getTime()) / (1000 * 60 * 60 * 24),
  );

  const breakpointCount = config.breakpoints.length;
  const filterCount = filters.length;

  const complexityScore = dayRange * breakpointCount + filterCount * 10;

  if (complexityScore < 100) {
    return { complexity: "low", estimatedTime: 1000 };
  } else if (complexityScore < 500) {
    return { complexity: "medium", estimatedTime: 3000 };
  } else {
    return { complexity: "high", estimatedTime: 8000 };
  }
}

// =============================================================================
// ATTRIBUTION SQL LOGIC
// =============================================================================

/**
 * Get the correct date field for attribution mode
 */
export function getAttributionDateField(attribution: "ftd" | "registration"): string {
  switch (attribution) {
    case "ftd": {
      return "firstDepositDate";
    }
    case "registration": {
      return "signUpDate";
    }
    default: {
      const _exhaustive: never = attribution;
      throw new Error(`Invalid attribution type: ${_exhaustive}`);
    }
  }
}

/**
 * Build attribution-aware WHERE clause for Prisma queries
 *
 * Business Rules:
 * - Registration Attribution: Include ALL players grouped by signUpDate
 * - FTD Attribution: Include only players with FTD grouped by firstDepositDate
 */
export function getAttributionWhereClause(
  attribution: "ftd" | "registration",
  additionalConditions: Record<string, unknown> = {},
): Record<string, unknown> {
  const dateField = getAttributionDateField(attribution);

  return {
    [dateField]: { not: null }, // Ensure the attribution date field exists
    ...additionalConditions,
  };
}

/**
 * Build GROUP BY fields with attribution support
 */
export function buildAttributionGroupBy(
  attribution: "ftd" | "registration",
  additionalFields: string[] = [],
): string[] {
  const dateField = getAttributionDateField(attribution);
  return [dateField, ...additionalFields];
}

/**
 * Safe attribution query execution with error handling
 */
export async function safeAttributionQuery<T>(
  attribution: "ftd" | "registration",
  queryFn: (dateField: string) => Promise<T[]>,
  fallbackFn?: () => Promise<T[]>,
): Promise<T[]> {
  try {
    const dateField = getAttributionDateField(attribution);
    const results = await queryFn(dateField);

    // If no results and fallback is available, try alternative attribution
    if (results.length === 0 && fallbackFn) {
      return await fallbackFn();
    }

    return results;
  } catch (error) {
    console.error(`Attribution query failed for ${attribution}:`, error);

    if (fallbackFn) {
      return await fallbackFn();
    }

    throw error;
  }
}

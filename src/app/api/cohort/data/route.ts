/**
 * Cohort Data API Endpoint
 *
 * Connects the filter UI system to the cohort analysis backend.
 * Accepts filter parameters and returns processed cohort data.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CohortProcessor } from "@/lib/reports/cohort/cohort-processor";
import { convertUIFiltersToSQL, validateUIFilters } from "@/lib/reports/cohort/ui-filter-conversion";
import type { AppliedFilter, CohortConfig, CohortMode, CohortMetric } from "@/types/reports";

// =============================================================================
// REQUEST/RESPONSE INTERFACES
// =============================================================================

interface CohortDataRequest {
  filters: AppliedFilter[];
  dateRange: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  breakpoints: number[];
  mode: CohortMode;
  metric: CohortMetric;
}

interface CohortDataResponse {
  success: boolean;
  data?: unknown[];
  metadata?: {
    totalCohorts: number;
    processingTime: number;
    breakpointsUsed: number[];
    queryHash: string;
  };
  error?: string;
}

// =============================================================================
// FILTER CONVERSION UTILITIES
// =============================================================================

/**
 * Enhanced filter conversion using the new UI filter system
 */
function processUIFilters(filters: AppliedFilter[], fallbackDateRange: { start: Date; end: Date }) {
  // Validate filters first
  const validation = validateUIFilters(filters);
  if (!validation.valid) {
    throw new Error(`Invalid filters: ${validation.errors.join(", ")}`);
  }

  // Convert UI filters to SQL conditions and extract date range
  const { conditions, dateRange } = convertUIFiltersToSQL(filters);

  return {
    sqlConditions: conditions,
    dateRange: dateRange || fallbackDateRange, // Use filter date range or fallback
    validatedFilters: filters.filter((f) => f.value !== null && f.value !== undefined),
  };
}

// =============================================================================
// API ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<CohortDataResponse>> {
  const startTime = Date.now();
  try {
    const body: CohortDataRequest = await request.json();

    console.log("🔍 API received request:", JSON.stringify(body, null, 2));

    // Get date range from request body or use default
    const defaultDateRange = {
      start: new Date("2024-01-01").toISOString(),
      end: new Date("2024-12-31").toISOString(),
    };

    const requestDateRange = body.dateRange || defaultDateRange;

    // Validate date range
    if (!requestDateRange.start || !requestDateRange.end) {
      console.log("❌ Missing date range");
      return NextResponse.json(
        {
          success: false,
          error: "Date range is required",
        },
        { status: 400 },
      );
    }

    // Convert date strings to Date objects
    const startDate = new Date(requestDateRange.start);
    const endDate = new Date(requestDateRange.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      console.log("❌ Invalid date format:", requestDateRange);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format",
        },
        { status: 400 },
      );
    }

    console.log("✅ Date range validated:", { startDate, endDate });

    // Process filters with enhanced conversion
    const { sqlConditions, dateRange, validatedFilters } = processUIFilters(body.filters || [], {
      start: startDate,
      end: endDate,
    });

    console.log("🔧 Processed filters:");
    console.log("  - sqlConditions:", sqlConditions);
    console.log("  - dateRange:", dateRange);
    console.log("  - validatedFilters:", validatedFilters);
    console.log("  - original filters:", body.filters);

    // Create cohort configuration with processed date range
    const cohortConfig: CohortConfig = {
      dateRange,
      breakpoints: body.breakpoints || [1, 3, 7, 14, 30], // Default breakpoints
      mode: body.mode || "day",
      metric: body.metric || "retention_rate",
      filters: {}, // Will be handled separately through AppliedFilter[]
    };

    console.log("⚙️ Cohort config:", cohortConfig);

    // Initialize cohort processor with optimized settings for API
    const _processor = new CohortProcessor(cohortConfig, {
      maxCohorts: 200,
      parallelProcessing: true,
      usePipelineMode: validatedFilters.length > 5, // Use pipeline for complex filters
      batchSize: 50,
    });

    console.log("🚀 Starting cohort processing...");

    // Enhanced query that applies filters properly
    try {
      // Build the base query with date range (using field names the frontend table expects)
      let query = `
        SELECT 
          DATE_TRUNC('day', pd."signUpDate") as cohort_date,
          COUNT(DISTINCT pd."playerId") as initial_players,
          COUNT(DISTINCT pd."playerId") as total_players,
          AVG(pd."depositsSum") as avg_deposit_sum,
          -- Mock retention data for now (will be calculated properly in Task 4)
          0.85 as day1_retention,
          0.72 as day4_retention,
          0.58 as day7_retention,
          0.51 as day10_retention,
          0.45 as day14_retention,
          0.39 as day17_retention,
          0.34 as day21_retention,
          0.29 as day24_retention,
          0.26 as day28_retention
        FROM "player_data" pd
        WHERE pd."signUpDate" >= $1::timestamp 
          AND pd."signUpDate" <= $2::timestamp
      `;

      const queryParams: unknown[] = [dateRange.start.toISOString(), dateRange.end.toISOString()];

      // Apply filter conditions if any exist
      if (sqlConditions.length > 0) {
        for (const condition of sqlConditions) {
          // Since our filter conditions already include the column references,
          // we can add them directly to the WHERE clause
          query += ` AND ${condition}`;
        }
      }

      // Complete the query
      query += `
        GROUP BY DATE_TRUNC('day', pd."signUpDate")
        ORDER BY cohort_date
        LIMIT 50
      `;

      console.log("🔍 Executing filtered query...");
      console.log("📝 Query:", query);
      console.log("📝 Params:", queryParams);

      // Use Prisma's raw query with proper filter conditions
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const filteredResult = await prisma.$queryRawUnsafe(query, ...queryParams);

      console.log("✅ Filtered query successful:", filteredResult);

      // Convert BigInt values to regular numbers for JSON serialization
      const serializedResult = Array.isArray(filteredResult)
        ? filteredResult.map((row) => {
            const serialized: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
              serialized[key] = typeof value === "bigint" ? Number(value) : value;
            }
            return serialized;
          })
        : filteredResult;

      return NextResponse.json({
        success: true,
        data: Array.isArray(serializedResult) ? serializedResult : [serializedResult],
        metadata: {
          totalCohorts: Array.isArray(serializedResult) ? serializedResult.length : 0,
          processingTime: Date.now() - startTime,
          breakpointsUsed: body.breakpoints || [1, 4, 7, 10, 14, 17, 21, 24, 28],
          queryHash: "filtered_cohort_query",
          appliedFilters: validatedFilters.length,
          sqlConditions: sqlConditions,
          dateRangeUsed: dateRange,
          note: "Enhanced query with proper filter application",
        },
      });
    } catch (queryError) {
      console.error("❌ Filtered query failed:", queryError);
      throw queryError;
    }

    // TODO: Uncomment when SQL issues are fixed
    // Process cohort analysis
    // const result = await processor.processCohorts(validatedFilters);
    // console.log("✅ Cohort processing complete:", result);
  } catch (error) {
    console.error("Cohort data API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

export function GET(): NextResponse {
  return NextResponse.json({
    status: "healthy",
    endpoint: "/api/cohort/data",
    methods: ["POST"],
    description: "Cohort data analysis API endpoint",
  });
}

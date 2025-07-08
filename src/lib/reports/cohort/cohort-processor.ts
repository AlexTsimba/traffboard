/**
 * Cohort Data Processor
 *
 * Implements the PostgreSQL-Arquero pipeline strategy for cohort analysis.
 * PostgreSQL handles heavy data lifting (millions → thousands of rows)
 * Arquero handles dynamic breakpoint mapping and business logic calculations.
 */

import "server-only";

import * as aq from "arquero";

import type { CohortConfig, CohortData, CohortMetric, CohortMode, AppliedFilter, FilterValue } from "@/types/reports";
import { COHORT_BREAKPOINTS } from "@/types/reports";

import { formatCohortResults } from "./cohort-formatting";
import { calculateCohortMetrics } from "./cohort-metrics";
import { createPipelineProcessor, type CohortPipelineProcessor } from "./cohort-pipeline";
import { getCohortBaseData } from "./cohort-sql";

// =============================================================================
// COHORT PROCESSING CONFIGURATION
// =============================================================================

interface CohortProcessingOptions {
  maxCohorts?: number;
  cacheTTL?: number;
  parallelProcessing?: boolean;
  usePipelineMode?: boolean;
  batchSize?: number;
  maxConcurrency?: number;
}

interface CohortProcessingResult {
  data: CohortData[];
  metadata: {
    totalCohorts: number;
    processingTime: number;
    breakpointsUsed: number[];
    queryHash: string;
    pipelineMetrics?: unknown; // Optional for pipeline mode
  };
}

// =============================================================================
// MAIN COHORT PROCESSOR CLASS
// =============================================================================

export class CohortProcessor {
  private readonly config: CohortConfig;
  private readonly options: CohortProcessingOptions;
  private readonly pipelineProcessor?: CohortPipelineProcessor;

  constructor(config: CohortConfig, options: CohortProcessingOptions = {}) {
    this.config = config;
    this.options = {
      maxCohorts: 100,
      cacheTTL: 300_000, // 5 minutes
      parallelProcessing: true,
      usePipelineMode: false,
      batchSize: 50,
      maxConcurrency: 4,
      ...options,
    };

    // Initialize pipeline processor if enabled
    if (this.options.usePipelineMode) {
      this.pipelineProcessor = createPipelineProcessor({
        batchSize: this.options.batchSize,
        maxConcurrency: this.options.maxConcurrency,
        enablePipelining: true,
      });
    }
  }

  /**
   * Process cohort analysis using PostgreSQL-Arquero pipeline
   */
  async processCohorts(filters: AppliedFilter[] = []): Promise<CohortProcessingResult> {
    const startTime = Date.now();

    try {
      // Check if pipeline mode is enabled for large datasets
      if (this.options.usePipelineMode && this.pipelineProcessor) {
        return await this.processCohortsPipelined(filters);
      }

      // Standard processing mode
      // Step 1: PostgreSQL - Heavy data lifting
      const baseData = await getCohortBaseData(this.config, filters);

      // Step 2: Arquero - Business logic and breakpoint mapping
      const processedData = this.processWithArquero(baseData);

      // Step 3: Format results for UI consumption
      const formattedData = formatCohortResults(processedData, this.config.metric, this.config.breakpoints);

      const processingTime = Date.now() - startTime;

      return {
        data: formattedData,
        metadata: {
          totalCohorts: formattedData.length,
          processingTime,
          breakpointsUsed: this.config.breakpoints,
          queryHash: this.generateQueryHash(filters),
        },
      };
    } catch (error) {
      throw new Error(`Cohort processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process cohorts using pipeline mode for large datasets
   */
  private async processCohortsPipelined(filters: AppliedFilter[]): Promise<CohortProcessingResult> {
    if (!this.pipelineProcessor) {
      throw new Error("Pipeline processor not initialized");
    }

    const pipelineResult = await this.pipelineProcessor.processCohortBatches(
      [this.config], // Single config for now, can be extended for batch processing
      filters,
      {
        pipeline: {
          batchSize: this.options.batchSize,
          maxConcurrency: this.options.maxConcurrency,
        },
      },
    );

    // Process pipeline results with Arquero
    const processedData = this.processWithArquero(pipelineResult.data);

    // Format results for UI consumption
    const formattedData = formatCohortResults(processedData, this.config.metric, this.config.breakpoints);

    return {
      data: formattedData,
      metadata: {
        totalCohorts: formattedData.length,
        processingTime: pipelineResult.metadata.processingTimeMs,
        breakpointsUsed: this.config.breakpoints,
        queryHash: this.generateQueryHash(filters),
        pipelineMetrics: pipelineResult.metadata,
      },
    };
  }

  /**
   * Process data using Arquero for business logic calculations
   */
  private processWithArquero(baseData: unknown[]): CohortData[] {
    if (!Array.isArray(baseData) || baseData.length === 0) {
      return [];
    }

    try {
      // Create Arquero table from PostgreSQL results
      const table = aq.from(baseData);

      // Group by cohort date and calculate metrics for each breakpoint
      const cohortTable = table
        .groupby("cohortDate")
        .rollup({
          ftdCount: aq.op.count(),
          totalCohortSize: aq.op.sum("cohortSize"),
          ...this.createBreakpointRollups(),
        })
        .orderby("cohortDate");

      // Calculate final metrics using our business logic
      const processedRows = cohortTable.objects() as {
        cohortDate: string;
        ftdCount: number;
        totalCohortSize: number;
        [key: string]: unknown;
      }[];

      return processedRows.map((row) => ({
        cohortDate: row.cohortDate,
        ftdCount: row.ftdCount,
        breakpointValues: this.calculateBreakpointValues(row),
        weightedAverage: this.calculateWeightedAverage(row),
      }));
    } catch (error) {
      throw new Error(`Arquero processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create rollup expressions for each breakpoint
   */
  private createBreakpointRollups(): Record<string, unknown> {
    const rollups: Record<string, unknown> = {};

    for (const breakpoint of this.config.breakpoints) {
      const dayField = `day${breakpoint}`;

      rollups[`${dayField}_active_players`] = aq.op.sum(`${dayField}_active_players`);
      rollups[`${dayField}_deposit_sum`] = aq.op.sum(`${dayField}_deposit_sum`);
      rollups[`${dayField}_ngr_sum`] = aq.op.sum(`${dayField}_ngr_sum`);
      rollups[`${dayField}_cost_sum`] = aq.op.sum(`${dayField}_cost_sum`);
    }

    return rollups;
  }

  /**
   * Calculate metric values for each breakpoint
   */
  private calculateBreakpointValues(row: Record<string, unknown>): Record<number, number | null> {
    const values: Record<number, number | null> = {};

    for (const breakpoint of this.config.breakpoints) {
      const dayField = `day${breakpoint}`;

      const activePlayers = Number(row[`${dayField}_active_players`] ?? 0);
      const depositSum = Number(row[`${dayField}_deposit_sum`] ?? 0);
      const ngrSum = Number(row[`${dayField}_ngr_sum`] ?? 0);
      const costSum = Number(row[`${dayField}_cost_sum`] ?? 0);
      const cohortSize = Number(row.totalCohortSize ?? 0);

      // eslint-disable-next-line security/detect-object-injection
      values[breakpoint] = calculateCohortMetrics({
        metric: this.config.metric,
        activePlayers,
        depositSum,
        ngrSum,
        costSum,
        cohortSize,
      });
    }

    return values;
  }

  /**
   * Calculate weighted average for the cohort row
   */
  private calculateWeightedAverage(row: Record<string, unknown>): number | undefined {
    const values = this.calculateBreakpointValues(row);
    const validValues = Object.values(values).filter((v): v is number => v !== null);

    if (validValues.length === 0) return undefined;

    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  /**
   * Generate a hash for the current query configuration
   */
  private generateQueryHash(filters: AppliedFilter[]): string {
    const hashInput = {
      config: this.config,
      filters: filters.map((f) => ({ id: f.id, value: f.value })),
      timestamp: Math.floor(Date.now() / (5 * 60 * 1000)), // 5-minute buckets
    };

    return Buffer.from(JSON.stringify(hashInput)).toString("base64");
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a cohort processor with default configuration
 */
export function createCohortProcessor(
  mode: CohortMode,
  metric: CohortMetric,
  dateRange: { start: Date; end: Date },
  filters: Record<string, FilterValue> = {},
  options: CohortProcessingOptions = {},
): CohortProcessor {
  const breakpoints = mode === "day" ? COHORT_BREAKPOINTS.DAY : COHORT_BREAKPOINTS.WEEK;

  const config: CohortConfig = {
    mode,
    metric,
    breakpoints: [...breakpoints],
    dateRange,
    filters,
  };

  // Auto-enable pipeline mode for large date ranges
  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const autoUsePipeline = daysDiff > 90; // Auto-enable for ranges > 90 days

  const processingOptions: CohortProcessingOptions = {
    usePipelineMode: autoUsePipeline,
    ...options,
  };

  return new CohortProcessor(config, processingOptions);
}

/**
 * Process cohorts with a simplified API
 */
export async function processCohortAnalysis(
  mode: CohortMode,
  metric: CohortMetric,
  dateRange: { start: Date; end: Date },
  filters: AppliedFilter[] = [],
): Promise<CohortProcessingResult> {
  const processor = createCohortProcessor(mode, metric, dateRange);
  return processor.processCohorts(filters);
}

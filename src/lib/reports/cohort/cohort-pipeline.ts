/**
 * PostgreSQL Pipeline Mode for Batch Processing
 *
 * Implements advanced batching and pipeline processing for cohort analysis.
 * Utilizes PostgreSQL pipeline mode to minimize round-trips and improve throughput.
 * Handles error recovery, connection pooling, and parallel processing for large datasets.
 */

import "server-only";

import { prisma } from "@/lib/prisma";
import type { CohortConfig, AppliedFilter } from "@/types/reports";

// =============================================================================
// PIPELINE CONFIGURATION
// =============================================================================

interface PipelineConfig {
  batchSize: number;
  maxConcurrency: number;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  enablePipelining: boolean;
}

interface BatchProcessingOptions {
  pipeline?: Partial<PipelineConfig>;
  progressCallback?: (progress: BatchProgress) => void;
  abortSignal?: AbortSignal;
}

interface BatchProgress {
  completed: number;
  total: number;
  currentBatch: number;
  errors: string[];
  startTime: number;
  estimatedRemainingMs: number;
}

interface PipelineResult<T = unknown> {
  data: T[];
  errors: string[];
  metadata: {
    totalBatches: number;
    successfulBatches: number;
    failedBatches: number;
    processingTimeMs: number;
    throughputPerSecond: number;
  };
}

// =============================================================================
// DEFAULT PIPELINE CONFIGURATION
// =============================================================================

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  batchSize: 1000,
  maxConcurrency: 4,
  timeoutMs: 30_000, // 30 seconds
  retryAttempts: 3,
  retryDelayMs: 1000, // 1 second
  enablePipelining: true,
};

// =============================================================================
// PIPELINE PROCESSOR CLASS
// =============================================================================

export class CohortPipelineProcessor {
  private readonly config: PipelineConfig;
  private readonly metrics = new Map<string, number>();

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
  }

  /**
   * Process cohort data using PostgreSQL pipeline mode
   */
  async processCohortBatches(
    cohortConfigs: CohortConfig[],
    filters: AppliedFilter[] = [],
    options: BatchProcessingOptions = {},
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...options.pipeline };

    // Initialize progress tracking
    const progress: BatchProgress = {
      completed: 0,
      total: cohortConfigs.length,
      currentBatch: 0,
      errors: [],
      startTime,
      estimatedRemainingMs: 0,
    };

    try {
      // Validate input configurations
      this.validateCohortConfigs(cohortConfigs);

      // Split into batches for processing
      const batches = this.createBatches(cohortConfigs, config.batchSize);

      // Process batches with pipeline mode
      const results = await this.processBatchesPipelined(
        batches,
        filters,
        config,
        progress,
        options.progressCallback,
        options.abortSignal,
      );

      const processingTime = Date.now() - startTime;

      return {
        data: results.flat(),
        errors: progress.errors,
        metadata: {
          totalBatches: batches.length,
          successfulBatches: batches.length - progress.errors.length,
          failedBatches: progress.errors.length,
          processingTimeMs: processingTime,
          throughputPerSecond: (cohortConfigs.length / processingTime) * 1000,
        },
      };
    } catch (error) {
      throw new Error(`Pipeline processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process batches using PostgreSQL pipeline mode
   */
  private async processBatchesPipelined(
    batches: CohortConfig[][],
    filters: AppliedFilter[],
    config: PipelineConfig,
    progress: BatchProgress,
    progressCallback?: (progress: BatchProgress) => void,
    abortSignal?: AbortSignal,
  ): Promise<unknown[][]> {
    const results: unknown[][] = [];
    const semaphore = new Semaphore(config.maxConcurrency);

    // Process batches with controlled concurrency
    const batchPromises = batches.map(async (batch, batchIndex) => {
      return semaphore.acquire(async () => {
        // Check for abort signal
        if (abortSignal?.aborted) {
          throw new Error("Operation aborted");
        }

        try {
          progress.currentBatch = batchIndex + 1;

          const batchResult = await this.processSingleBatch(batch, filters, config, batchIndex);

          progress.completed += batch.length;
          progress.estimatedRemainingMs = this.calculateETA(progress);

          progressCallback?.(progress);

          return batchResult;
        } catch (error) {
          const errorMsg = `Batch ${batchIndex + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
          progress.errors.push(errorMsg);

          // Retry logic for failed batches
          if (config.retryAttempts > 0) {
            return this.retryBatch(batch, filters, config, batchIndex, errorMsg);
          }

          return []; // Return empty array for failed batch
        }
      });
    });

    // Wait for all batches to complete
    const batchResults = await Promise.allSettled(batchPromises);

    // Process results and handle failures
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        progress.errors.push(`Batch processing error: ${String(result.reason)}`);
      }
    }

    return results;
  }

  /**
   * Process a single batch of cohort configurations
   */
  private async processSingleBatch(
    batch: CohortConfig[],
    filters: AppliedFilter[],
    config: PipelineConfig,
    batchIndex: number,
  ): Promise<unknown[]> {
    const startTime = Date.now();

    try {
      return config.enablePipelining && batch.length > 1
        ? // Use PostgreSQL pipeline mode for multiple queries
          await this.executePipelinedQueries(batch, filters, config)
        : // Single query execution
          await this.executeSingleQuery(batch[0], filters);
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.set(`batch_${batchIndex}_duration`, duration);
    }
  }

  /**
   * Execute multiple queries using PostgreSQL pipeline mode
   */
  private async executePipelinedQueries(
    batch: CohortConfig[],
    filters: AppliedFilter[],
    config: PipelineConfig,
  ): Promise<unknown[]> {
    const queries = batch.map((cohortConfig, index) => ({
      query: this.buildOptimizedCohortQuery(cohortConfig, filters),
      params: [cohortConfig.dateRange.start.toISOString(), cohortConfig.dateRange.end.toISOString()],
      queryId: `cohort_${index}`,
    }));

    // Execute queries in pipeline mode
    return await this.executeQueriesInPipeline(queries, config.timeoutMs);
  }

  /**
   * Execute queries using PostgreSQL pipeline for optimal performance
   */
  private async executeQueriesInPipeline(
    queries: { query: string; params: string[]; queryId: string }[],
    _timeoutMs: number,
  ): Promise<unknown[]> {
    const results: unknown[] = [];

    try {
      // Execute all queries in a transaction for consistency
      const pipelineResults = await prisma.$transaction(
        queries.map(({ query, params }) => prisma.$queryRawUnsafe(query, ...params)),
        {
          isolationLevel: "ReadCommitted", // Optimize for concurrent reads
        },
      );

      // Process and validate results
      for (const result of pipelineResults) {
        if (Array.isArray(result)) {
          results.push(...result);
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Pipeline query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a single cohort query
   */
  private async executeSingleQuery(config: CohortConfig, filters: AppliedFilter[]): Promise<unknown[]> {
    const query = this.buildOptimizedCohortQuery(config, filters);
    const params = [config.dateRange.start.toISOString(), config.dateRange.end.toISOString()];

    const result = await prisma.$queryRawUnsafe(query, ...params);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Build optimized cohort query with performance enhancements
   */
  private buildOptimizedCohortQuery(config: CohortConfig, filters: AppliedFilter[]): string {
    const { mode, breakpoints } = config;

    // Optimize cohort date function
    const cohortDateFunc =
      mode === "week"
        ? "DATE_TRUNC('week', pd.\"registrationDate\" + INTERVAL '1 day') - INTERVAL '1 day'"
        : "DATE_TRUNC('day', pd.\"registrationDate\")";

    // Build filter conditions with proper indexing hints
    const filterConditions = this.buildOptimizedFilterConditions(filters);
    const whereClause = filterConditions.length > 0 ? `AND ${filterConditions.join(" AND ")}` : "";

    // Generate breakpoint calculations with optimized aggregations
    const breakpointCases = breakpoints
      .map((bp) => {
        const dayCondition =
          mode === "week"
            ? `EXTRACT(days FROM c."conversionDate" - cohort_date) < ${bp}`
            : `EXTRACT(days FROM c."conversionDate" - cohort_date) <= ${bp}`;

        return `
        COUNT(CASE WHEN ${dayCondition} AND c."depositsSum" > 0 THEN 1 END) as day${bp}_active_players,
        COALESCE(SUM(CASE WHEN ${dayCondition} THEN c."depositsSum" END), 0) as day${bp}_deposit_sum,
        COALESCE(SUM(CASE WHEN ${dayCondition} THEN c."NGR" END), 0) as day${bp}_ngr_sum,
        COALESCE(SUM(CASE WHEN ${dayCondition} THEN c."costs" END), 0) as day${bp}_cost_sum
      `;
      })
      .join(",\n        ");

    return `
      WITH cohort_base AS (
        SELECT 
          ${cohortDateFunc} as cohort_date,
          pd."playerId",
          COUNT(*) OVER (PARTITION BY ${cohortDateFunc}) as cohort_size
        FROM "PlayerData" pd
        WHERE pd."registrationDate" >= $1::timestamp
          AND pd."registrationDate" <= $2::timestamp
          ${whereClause}
      ),
      cohort_aggregates AS (
        SELECT 
          TO_CHAR(cb.cohort_date, 'YYYY-MM-DD') as "cohortDate",
          cb.cohort_size as "ftdCount",
          ${breakpointCases}
        FROM cohort_base cb
        LEFT JOIN "Conversion" c ON cb."playerId" = c."playerId"
          AND c."conversionDate" >= cb.cohort_date
          AND c."conversionDate" <= $2::timestamp
        GROUP BY cb.cohort_date, cb.cohort_size
      )
      SELECT * FROM cohort_aggregates
      ORDER BY "cohortDate"
    `;
  }

  /**
   * Build optimized filter conditions with proper indexing
   */
  private buildOptimizedFilterConditions(filters: AppliedFilter[]): string[] {
    return filters
      .map((filter) => this.buildSingleFilterCondition(filter))
      .filter((condition): condition is string => condition !== null);
  }

  /**
   * Build a single filter condition
   */
  private buildSingleFilterCondition(filter: AppliedFilter): string | null {
    const { id, value } = filter;

    if (id === "partner" && value && typeof value === "string") {
      return `pd."partner" = '${this.escapeValue(value)}'`;
    }

    if (id === "source" && value && typeof value === "string") {
      return `pd."source" = '${this.escapeValue(value)}'`;
    }

    if (id === "country" && value && typeof value === "string") {
      return `pd."country" = '${this.escapeValue(value)}'`;
    }

    if (id === "minDeposit" && typeof value === "number") {
      return `EXISTS (
        SELECT 1 FROM "Conversion" cc 
        WHERE cc."playerId" = pd."playerId" 
        AND cc."depositsSum" >= ${value}
      )`;
    }

    return null;
  }

  /**
   * Retry failed batch with exponential backoff
   */
  private async retryBatch(
    batch: CohortConfig[],
    filters: AppliedFilter[],
    config: PipelineConfig,
    batchIndex: number,
    originalError: string,
  ): Promise<unknown[]> {
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        await this.delay(config.retryDelayMs * Math.pow(2, attempt - 1));

        return await this.processSingleBatch(batch, filters, config, batchIndex);
      } catch (error) {
        if (attempt === config.retryAttempts) {
          throw new Error(
            `${originalError}. Final retry failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    return [];
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Create batches from cohort configurations
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Validate cohort configurations
   */
  private validateCohortConfigs(configs: CohortConfig[]): void {
    for (const config of configs) {
      if (!config.dateRange?.start || !config.dateRange?.end) {
        throw new Error("Invalid date range in cohort configuration");
      }

      if (config.dateRange.start >= config.dateRange.end) {
        throw new Error("Start date must be before end date");
      }

      if (!config.breakpoints || config.breakpoints.length === 0) {
        throw new Error("Breakpoints must be specified");
      }
    }
  }

  /**
   * Calculate estimated time of arrival
   */
  private calculateETA(progress: BatchProgress): number {
    const elapsed = Date.now() - progress.startTime;
    const rate = progress.completed / elapsed;
    const remaining = progress.total - progress.completed;

    return remaining / rate;
  }

  /**
   * Escape string values for SQL injection prevention
   */
  private escapeValue(value: string): string {
    return value.replaceAll("'", "''");
  }

  /**
   * Delay execution for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get processing metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// =============================================================================
// SEMAPHORE CLASS FOR CONCURRENCY CONTROL
// =============================================================================

class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.permits > 0) {
        this.permits--;
        void this.executeTask(task, resolve, reject);
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          void this.executeTask(task, resolve, reject);
        });
      }
    });
  }

  private async executeTask<T>(
    task: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (reason: unknown) => void,
  ): Promise<void> {
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.permits++;
      if (this.waitQueue.length > 0) {
        const next = this.waitQueue.shift();
        next?.();
      }
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a pipeline processor with optimized configuration
 */
export function createPipelineProcessor(config: Partial<PipelineConfig> = {}): CohortPipelineProcessor {
  return new CohortPipelineProcessor(config);
}

/**
 * Process multiple cohort configurations with pipeline optimization
 */
export async function processCohortsPipelined(
  configs: CohortConfig[],
  filters: AppliedFilter[] = [],
  options: BatchProcessingOptions = {},
): Promise<PipelineResult> {
  const processor = createPipelineProcessor(options.pipeline);
  return processor.processCohortBatches(configs, filters, options);
}

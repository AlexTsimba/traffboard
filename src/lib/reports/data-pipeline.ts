/**
 * Data Pipeline Architecture
 *
 * Main orchestrator for the TraffBoard Report Factory data pipeline system.
 * This file coordinates data extraction, transformation, and caching using
 * modular components for maintainability.
 */

import "server-only";

import type { DataPipeline, ReportData, AppliedFilter } from "@/types/reports";

import { cacheManager } from "./pipeline/cache-manager";
import { extractData } from "./pipeline/data-extractors";
import { applyTransform } from "./pipeline/data-transformers";
import { validatePipeline, createConversionPipeline, createCohortPipeline } from "./pipeline/pipeline-factory";

// =============================================================================
// PIPELINE EXECUTION OPTIONS
// =============================================================================

interface PipelineExecutionOptions {
  skipCache?: boolean;
  timeout?: number;
  maxRows?: number;
}

// =============================================================================
// DATA PIPELINE MANAGER
// =============================================================================

class DataPipelineManager {
  private pipelines = new Map<string, DataPipeline>();

  /**
   * Register a data pipeline
   */
  registerPipeline(pipeline: DataPipeline): void {
    const validation = validatePipeline(pipeline);
    if (!validation.valid) {
      throw new Error(`Invalid pipeline: ${validation.errors.join(", ")}`);
    }
    this.pipelines.set(pipeline.id, pipeline);
  }

  /**
   * Execute a data pipeline
   */
  async executePipeline<T = unknown>(
    pipelineId: string,
    filters: AppliedFilter[] = [],
    options: PipelineExecutionOptions = {},
  ): Promise<ReportData<T>> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline "${pipelineId}" not found`);
    }

    const startTime = Date.now();

    // Check cache first
    const cacheKey = cacheManager.generateCacheKey(pipelineId, filters);
    const cached = cacheManager.getCachedData<T>(cacheKey, pipeline.cache);

    if (cached && !options.skipCache) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cacheStatus: "hit",
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Extract data from source
      const rawData = await extractData(pipeline.source, filters);

      // Apply transformations
      let transformedData = rawData;
      const sortedTransforms = pipeline.transforms.toSorted((a, b) => a.order - b.order);
      for (const transform of sortedTransforms) {
        transformedData = applyTransform(transformedData, transform, filters);
      }

      const executionTime = Date.now() - startTime;

      const result: ReportData<T> = {
        rows: transformedData as T[],
        totalCount: Array.isArray(transformedData) ? transformedData.length : 0,
        metadata: {
          executionTime,
          dataVersion: "1.0.0",
          cacheStatus: cached ? "partial" : "miss",
          lastRefresh: new Date(),
          queryHash: cacheKey,
          filters: filters.map((f) => f.value),
        },
      };

      // Cache the result
      if (pipeline.cache.enabled && !options.skipCache) {
        cacheManager.setCachedData(cacheKey, result, pipeline.cache);
      }

      return result;
    } catch (error) {
      throw new Error(`Pipeline execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get pipeline by ID
   */
  getPipeline(pipelineId: string): DataPipeline | undefined {
    return this.pipelines.get(pipelineId);
  }

  /**
   * List all registered pipelines
   */
  listPipelines(): DataPipeline[] {
    return [...this.pipelines.values()];
  }

  /**
   * Remove a pipeline
   */
  removePipeline(pipelineId: string): boolean {
    return this.pipelines.delete(pipelineId);
  }

  /**
   * Clear all cache entries
   */
  clearCache(pattern?: string): void {
    cacheManager.clearCache(pattern);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheManager.getCacheStats();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

// Global pipeline manager instance
const pipelineManager = new DataPipelineManager();

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Register default pipelines for common use cases
 */
export function registerDefaultPipelines(): void {
  const conversionPipeline = createConversionPipeline("conversion_default");
  const cohortPipeline = createCohortPipeline("cohort_default");

  pipelineManager.registerPipeline(conversionPipeline);
  pipelineManager.registerPipeline(cohortPipeline);
}

/**
 * Execute a pipeline with retry logic
 */
export async function executePipelineWithRetry<T = unknown>(
  pipelineId: string,
  filters: AppliedFilter[] = [],
  maxRetries = 3,
): Promise<ReportData<T>> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pipelineManager.executePipeline<T>(pipelineId, filters);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Pipeline execution failed after ${maxRetries} attempts: ${lastError?.message ?? "Unknown error"}`);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export the main pipeline manager instance
export { pipelineManager };

// Re-export the factory functions and utilities
export { createConversionPipeline, createCohortPipeline, validatePipeline } from "./pipeline/pipeline-factory";
export { createTransformBuilder } from "./pipeline/transform-builder";
export type { PipelineExecutionOptions };

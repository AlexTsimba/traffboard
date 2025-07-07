/**
 * Pipeline Factory
 *
 * Factory functions for creating and configuring specific pipeline types
 * with validation and default configurations.
 */

import type { DataPipeline, DataSourceConfig, CacheConfig, OutputConfig } from "@/types/reports";

import { createTransformBuilder } from "./transform-builder";

// =============================================================================
// PIPELINE FACTORIES
// =============================================================================

/**
 * Create a conversion data pipeline
 */
export function createConversionPipeline(id: string): DataPipeline {
  const source: DataSourceConfig = {
    id: `source_${id}`,
    type: "prisma",
    connectionString: "", // Not needed for Prisma
    timeout: 30_000,
  };

  const transforms = createTransformBuilder()
    .filter({
      // Default conversion filters can be added here
    })
    .build();

  const cache: CacheConfig = {
    enabled: true,
    ttl: 300, // 5 minutes
    strategy: "memory",
    invalidationRules: [],
  };

  const output: OutputConfig = {
    format: "json",
  };

  return {
    id,
    source,
    transforms,
    cache,
    output,
  };
}

/**
 * Create a cohort analysis pipeline
 */
export function createCohortPipeline(id: string): DataPipeline {
  const source: DataSourceConfig = {
    id: `source_${id}`,
    type: "prisma",
    connectionString: "",
    timeout: 60_000, // Longer timeout for cohort analysis
  };

  const transforms = createTransformBuilder()
    .cohort({
      timeframe: "monthly",
      metric: "retention",
      segments: ["source", "campaign"],
    })
    .aggregate(["cohort_month", "period"], {
      users: "count",
      retention_rate: "avg",
    })
    .build();

  const cache: CacheConfig = {
    enabled: true,
    ttl: 1800, // 30 minutes - cohort data changes less frequently
    strategy: "memory",
    invalidationRules: [],
  };

  const output: OutputConfig = {
    format: "json",
  };

  return {
    id,
    source,
    transforms,
    cache,
    output,
  };
}

// =============================================================================
// PIPELINE VALIDATION
// =============================================================================

/**
 * Validate basic pipeline fields
 */
function validateBasicFields(pipeline: DataPipeline): string[] {
  const errors: string[] = [];

  if (!pipeline.id || pipeline.id.trim() === "") {
    errors.push("Pipeline ID is required");
  }

  if (!pipeline.source) {
    errors.push("Pipeline source configuration is required");
  }

  return errors;
}

/**
 * Validate source configuration
 */
function validateSourceConfig(source: DataSourceConfig): string[] {
  const errors: string[] = [];

  if (!source.type) {
    errors.push("Source type is required");
  }

  if (source.type === "api" && !source.connectionString) {
    errors.push("Connection string is required for API sources");
  }

  if (source.timeout && source.timeout < 0) {
    errors.push("Source timeout must be positive");
  }

  return errors;
}

/**
 * Validate transform configuration
 */
function validateTransforms(transforms: DataPipeline["transforms"]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(transforms)) {
    errors.push("Transforms must be an array");
    return errors;
  }

  // Validate individual transforms
  for (const [index, transform] of transforms.entries()) {
    if (!transform.id) {
      errors.push(`Transform ${index}: ID is required`);
    }

    if (!transform.type) {
      errors.push(`Transform ${index}: Type is required`);
    }

    if (typeof transform.order !== "number") {
      errors.push(`Transform ${index}: Order must be a number`);
    }

    if (!transform.config || typeof transform.config !== "object") {
      errors.push(`Transform ${index}: Config must be an object`);
    }
  }

  // Check for duplicates
  const transformIds = transforms.map((t) => t.id);
  const uniqueIds = new Set(transformIds);
  if (transformIds.length !== uniqueIds.size) {
    errors.push("Transform IDs must be unique");
  }

  const orders = transforms.map((t) => t.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    errors.push("Transform orders must be unique");
  }

  return errors;
}

/**
 * Validate cache configuration
 */
function validateCacheConfig(cache: CacheConfig): string[] {
  const errors: string[] = [];

  if (typeof cache.enabled !== "boolean") {
    errors.push("Cache enabled must be a boolean");
  }

  if (cache.enabled && (!cache.ttl || cache.ttl <= 0)) {
    errors.push("Cache TTL must be positive when caching is enabled");
  }

  return errors;
}

/**
 * Validate pipeline configuration
 */
export function validatePipeline(pipeline: DataPipeline): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate basic fields
  errors.push(...validateBasicFields(pipeline));

  // Validate source configuration
  if (pipeline.source) {
    errors.push(...validateSourceConfig(pipeline.source));
  }

  // Validate transforms
  errors.push(...validateTransforms(pipeline.transforms));

  // Validate cache configuration
  if (pipeline.cache) {
    errors.push(...validateCacheConfig(pipeline.cache));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

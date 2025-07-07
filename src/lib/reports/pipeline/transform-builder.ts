/**
 * Transform Builder
 *
 * Builder pattern implementation for creating data transformation steps
 * with method chaining and validation.
 */

import type { DataTransformStep } from "@/types/reports";

// =============================================================================
// TRANSFORM BUILDER
// =============================================================================

export class TransformBuilder {
  private transforms: DataTransformStep[] = [];
  private currentOrder = 1;

  /**
   * Add filter transformation
   */
  filter(config: Record<string, unknown>): this {
    this.transforms.push({
      id: `filter_${this.currentOrder}`,
      type: "filter",
      order: this.currentOrder++,
      config,
    });
    return this;
  }

  /**
   * Add aggregate transformation
   */
  aggregate(groupBy: string[], aggregates: Record<string, string>): this {
    this.transforms.push({
      id: `aggregate_${this.currentOrder}`,
      type: "aggregate",
      order: this.currentOrder++,
      config: { groupBy, aggregates },
    });
    return this;
  }

  /**
   * Add cohort transformation
   */
  cohort(config: Record<string, unknown>): this {
    this.transforms.push({
      id: `cohort_${this.currentOrder}`,
      type: "cohort",
      order: this.currentOrder++,
      config,
    });
    return this;
  }

  /**
   * Add custom transformation
   */
  custom(id: string, config: Record<string, unknown>): this {
    this.transforms.push({
      id,
      type: "custom",
      order: this.currentOrder++,
      config,
    });
    return this;
  }

  /**
   * Build the transformation steps
   */
  build(): DataTransformStep[] {
    return [...this.transforms];
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.transforms = [];
    this.currentOrder = 1;
    return this;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new transform builder instance
 */
export function createTransformBuilder(): TransformBuilder {
  return new TransformBuilder();
}

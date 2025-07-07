/**
 * Data Transformers
 *
 * Handles all data transformation operations including filtering, aggregation,
 * joins, pivots, cohort analysis, and custom transformations.
 */

import type { DataTransformStep, AppliedFilter } from "@/types/reports";

// =============================================================================
// TRANSFORMATION ORCHESTRATOR
// =============================================================================

/**
 * Apply a transformation step to data
 */
export function applyTransform(data: unknown[], transform: DataTransformStep, filters: AppliedFilter[]): unknown[] {
  switch (transform.type) {
    case "filter": {
      return applyFilterTransform(data, transform.config);
    }

    case "aggregate": {
      return applyAggregateTransform(data, transform.config);
    }

    case "join": {
      return applyJoinTransform(data, transform.config);
    }

    case "pivot": {
      return applyPivotTransform(data, transform.config);
    }

    case "cohort": {
      return applyCohortTransform(data, transform.config, filters);
    }

    case "custom": {
      return applyCustomTransform(data, transform.config);
    }

    default: {
      console.warn(`Unknown transform type: ${String(transform.type)}`);
      return data;
    }
  }
}

// =============================================================================
// FILTER TRANSFORMATION
// =============================================================================

/**
 * Apply filter transformation
 */
function applyFilterTransform(data: unknown[], _config: Record<string, unknown>): unknown[] {
  // This would implement client-side filtering
  // For now, return data unchanged as filtering is typically done at the data source level
  console.warn("Client-side filtering not implemented, use data source filtering instead");
  return data;
}

// =============================================================================
// AGGREGATE TRANSFORMATION
// =============================================================================

/**
 * Apply aggregate transformation
 */
function applyAggregateTransform(data: unknown[], config: Record<string, unknown>): unknown[] {
  const groupBy = config.groupBy as string[];
  const aggregates = config.aggregates as Record<string, string>;

  if (!groupBy || !aggregates) {
    return data;
  }

  const groups = groupDataByKeys(data, groupBy);
  return processAggregatedGroups(groups, groupBy, aggregates);
}

/**
 * Group data by specified keys
 */
function groupDataByKeys(data: unknown[], groupBy: string[]): Map<string, unknown[]> {
  const groups = new Map<string, unknown[]>();

  for (const row of data) {
    if (typeof row !== "object" || row === null) continue;

    const groupKey = createGroupKey(row, groupBy);
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    const group = groups.get(groupKey);
    if (group) {
      group.push(row);
    }
  }

  return groups;
}

/**
 * Create a group key from row data
 */
function createGroupKey(row: unknown, groupBy: string[]): string {
  return groupBy
    .map((key) => {
      const rowObj = row as Record<string, unknown>;
      return Object.prototype.hasOwnProperty.call(rowObj, key) ? rowObj[key] : "";
    })
    .join("|");
}

/**
 * Process aggregated groups into result rows
 */
function processAggregatedGroups(
  groups: Map<string, unknown[]>,
  groupBy: string[],
  aggregates: Record<string, string>,
): unknown[] {
  const result: unknown[] = [];

  for (const [groupKey, groupData] of groups) {
    const aggregatedRow = createAggregatedRow(groupKey, groupBy, groupData, aggregates);
    result.push(aggregatedRow);
  }

  return result;
}

/**
 * Create an aggregated row from group data
 */
function createAggregatedRow(
  groupKey: string,
  groupBy: string[],
  groupData: unknown[],
  aggregates: Record<string, string>,
): Record<string, unknown> {
  const aggregatedRow: Record<string, unknown> = {};

  // Add group by fields
  addGroupByFields(aggregatedRow, groupKey, groupBy);

  // Apply aggregates
  applyAggregateFields(aggregatedRow, groupData, aggregates);

  return aggregatedRow;
}

/**
 * Add group by fields to the aggregated row
 */
function addGroupByFields(aggregatedRow: Record<string, unknown>, groupKey: string, groupBy: string[]): void {
  const keyParts = groupKey.split("|");
  for (const [index, field] of groupBy.entries()) {
    if (field && !Object.prototype.hasOwnProperty.call(aggregatedRow, "__proto__")) {
      aggregatedRow[field] = keyParts[index];
    }
  }
}

/**
 * Apply aggregate calculations to fields
 */
function applyAggregateFields(
  aggregatedRow: Record<string, unknown>,
  groupData: unknown[],
  aggregates: Record<string, string>,
): void {
  for (const [field, operation] of Object.entries(aggregates)) {
    const values = groupData
      .map((row) => {
        const rowObj = row as Record<string, unknown>;
        return Object.prototype.hasOwnProperty.call(rowObj, field) ? rowObj[field] : undefined;
      })
      .filter((val) => typeof val === "number");

    if (field && !Object.prototype.hasOwnProperty.call(aggregatedRow, "__proto__")) {
      aggregatedRow[field] = applyAggregateOperation(operation, values, groupData);
    }
  }
}

/**
 * Apply aggregate operation to values
 */
function applyAggregateOperation(operation: string, values: number[], groupData: unknown[]): number {
  switch (operation.toLowerCase()) {
    case "sum": {
      return values.reduce((sum, val) => sum + val, 0);
    }

    case "avg":
    case "average": {
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    case "count": {
      return groupData.length;
    }

    case "min": {
      return values.length > 0 ? Math.min(...values) : 0;
    }

    case "max": {
      return values.length > 0 ? Math.max(...values) : 0;
    }

    default: {
      console.warn(`Unknown aggregate operation: ${operation}`);
      return 0;
    }
  }
}

// =============================================================================
// OTHER TRANSFORMATIONS
// =============================================================================

/**
 * Apply join transformation
 */
function applyJoinTransform(data: unknown[], _config: Record<string, unknown>): unknown[] {
  // Join transformation would be implemented here
  // For now, return data unchanged
  console.warn("Join transformation not implemented");
  return data;
}

/**
 * Apply pivot transformation
 */
function applyPivotTransform(data: unknown[], _config: Record<string, unknown>): unknown[] {
  // Pivot transformation would be implemented here
  // For now, return data unchanged
  console.warn("Pivot transformation not implemented");
  return data;
}

/**
 * Apply cohort transformation
 */
function applyCohortTransform(data: unknown[], _config: Record<string, unknown>, _filters: AppliedFilter[]): unknown[] {
  // This is where cohort-specific logic would go
  // For now, return data unchanged - will be implemented in Task 2
  console.warn("Cohort transformation will be implemented in Task 2");
  return data;
}

/**
 * Apply custom transformation
 */
function applyCustomTransform(data: unknown[], _config: Record<string, unknown>): unknown[] {
  // Custom transformations would be registered and executed here
  console.warn("Custom transformation not implemented");
  return data;
}

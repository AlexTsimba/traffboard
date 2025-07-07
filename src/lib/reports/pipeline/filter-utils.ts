/**
 * Filter Utilities
 *
 * Helper functions for building Prisma where clauses and formatting filter values.
 */

import type { AppliedFilter } from "@/types/reports";

// =============================================================================
// FILTER BUILDING UTILITIES
// =============================================================================

/**
 * Build Prisma where clause from filter
 */
export function buildPrismaWhereClause(filter: AppliedFilter): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  switch (filter.definition.type) {
    case "text": {
      buildTextFilter(filter, where);
      break;
    }

    case "daterange": {
      buildDateRangeFilter(filter, where);
      break;
    }

    case "multiselect": {
      buildMultiselectFilter(filter, where);
      break;
    }

    case "date":
    case "number":
    case "boolean":
    case "numberrange":
    case "select": {
      buildDefaultFilter(filter, where);
      break;
    }

    default: {
      console.warn(`Unsupported filter type: ${String(filter.definition.type)}`);
    }
  }

  return where;
}

/**
 * Build text filter for search/contains operations
 */
function buildTextFilter(filter: AppliedFilter, where: Record<string, unknown>): void {
  if (typeof filter.value === "string" && filter.value.trim()) {
    where[filter.id] = {
      contains: filter.value.trim(),
      mode: "insensitive",
    };
  }
}

/**
 * Build date range filter
 */
function buildDateRangeFilter(filter: AppliedFilter, where: Record<string, unknown>): void {
  if (filter.value && typeof filter.value === "object" && "start" in filter.value && "end" in filter.value) {
    const dateRange = filter.value as { start: Date; end: Date };
    where[filter.id] = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }
}

/**
 * Build multiselect filter
 */
function buildMultiselectFilter(filter: AppliedFilter, where: Record<string, unknown>): void {
  if (Array.isArray(filter.value) && filter.value.length > 0) {
    where[filter.id] = {
      in: filter.value,
    };
  }
}

/**
 * Build default filter for simple equality
 */
function buildDefaultFilter(filter: AppliedFilter, where: Record<string, unknown>): void {
  if (filter.value != null) {
    where[filter.id] = filter.value;
  }
}

// =============================================================================
// VALUE FORMATTING UTILITIES
// =============================================================================

/**
 * Format filter value for display/API usage
 */
export function formatFilterValue(filter: AppliedFilter): string {
  if (filter.value == null) {
    return "";
  }

  if (Array.isArray(filter.value)) {
    return filter.value.join(",");
  }

  if (filter.value instanceof Date) {
    return filter.value.toISOString();
  }

  if (typeof filter.value === "object" && "start" in filter.value && "end" in filter.value) {
    const dateRange = filter.value as { start: Date; end: Date };
    return `${dateRange.start.toISOString()},${dateRange.end.toISOString()}`;
  }

  if (typeof filter.value === "object" && "min" in filter.value && "max" in filter.value) {
    const numberRange = filter.value as { min: number; max: number };
    return `${numberRange.min},${numberRange.max}`;
  }

  if (typeof filter.value === "string") {
    return filter.value;
  }

  if (typeof filter.value === "number" || typeof filter.value === "boolean") {
    return String(filter.value);
  }

  return String(filter.value);
}
